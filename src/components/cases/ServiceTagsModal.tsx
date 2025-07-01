import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Plus, X } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

interface Tag {
  _id: string;
  name: string;
  color: string;
}

interface ServiceTagsModalProps {
  open: boolean;
  caseId: string; // <-- add this
  onClose: () => void;
  serviceId: string;
  existingTags: Tag[];
  onTagsUpdated: (tags: Tag[]) => void;
  currentUser: any;
}

const ServiceTagsModal: React.FC<ServiceTagsModalProps> = ({
  open,
  onClose,
  caseId,
  serviceId,
  existingTags,
  onTagsUpdated,
  currentUser,
}) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(existingTags || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tags when modal opens
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          "/tags"
        ); // relative path if running via proxy
        setAllTags(res.data);
        setSelectedTags(existingTags || []);
      } catch (err) {
        setError("Failed to fetch tags");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, existingTags]);

  // Add new tag (with server)
  const handleAddTag = async () => {
    if (!input.trim()) return;
    setAddLoading(true);
    try {
      const { data } = await axiosInstance.post(
        "/tags",
        {
          name: input.trim(),
          createdBy: currentUser?.id,
        }
      );
      // Add to both lists if not present
      setAllTags((prev) =>
        prev.find((t) => t._id === data._id) ? prev : [...prev, data]
      );
      setSelectedTags((prev) =>
        prev.find((t) => t._id === data._id) ? prev : [...prev, data]
      );
      setInput("");
    } catch {
      setError("Tag already exists or failed to create");
    } finally {
      setAddLoading(false);
    }
  };

  // Select/deselect
  const handleSelectTag = (tag: Tag) => {
    setSelectedTags(
      (prev) =>
        prev.find((t) => t._id === tag._id)
          ? prev.filter((t) => t._id !== tag._id) // Remove if present
          : [...prev, tag] // Add if missing
    );
  };

  // Remove a selected tag (like remove remark)
  const handleRemoveTag = (tag: Tag) => {
    setSelectedTags((prev) => prev.filter((t) => t._id !== tag._id));
  };

  // Save/attach tags to service
  const handleSave = async () => {
    setLoading(true);
    try {
      await axiosInstance.patch(
        `/cases/${caseId}/services/${serviceId}/tags`,
        {
          tagIds: selectedTags.map((tag) => tag._id),
        }
      );
      onTagsUpdated(selectedTags);
      onClose();
    } catch {
      setError("Failed to save tags.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddTag();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center  z-50">
      <div className="bg-white rounded-xl p-6 min-w-[400px] relative shadow-lg">
        <button className="absolute top-2 right-2" onClick={onClose}>
          <X />
        </button>
        <h3 className="font-bold mb-3">Manage Tags</h3>
        {error && <div className="text-red-600 mb-2">{error}</div>}

        {/* Selected tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTags.length === 0 && (
            <span className="text-muted-foreground text-xs">
              No tags added yet. Select or create below.
            </span>
          )}
          {selectedTags.map((tag) => (
            <span
              key={tag._id}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: tag.color, color: "#fff" }}
            >
              {tag.name}
              <button
                className="ml-2"
                onClick={() => handleRemoveTag(tag)}
                title="Remove"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>

        {/* Add/search tag input */}
        <div className="flex gap-2 mb-3">
          <input
            className="border px-2 py-1 rounded w-full"
            placeholder="Type to search or add tag…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={addLoading}
          />
          <button
            onClick={handleAddTag}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded disabled:opacity-50"
            disabled={addLoading || !input.trim()}
            title="Add tag"
          >
            {addLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus size={18} />
            )}
          </button>
        </div>

        {/* Tag search results (can click to attach/detach) */}
        <div className="max-h-32 overflow-y-auto border p-2 rounded mb-4 bg-gray-50">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto my-4" />
          ) : (
            allTags
              .filter(
                (tag) =>
                  tag.name.toLowerCase().includes(input.toLowerCase()) &&
                  !selectedTags.some((t) => t._id === tag._id)
              )
              .map((tag) => (
                <div
                  key={tag._id}
                  className="cursor-pointer flex items-center gap-2 py-1 px-2 rounded hover:bg-blue-100"
                  onClick={() => handleSelectTag(tag)}
                >
                  <span
                    className="w-3 h-3 inline-block rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name}</span>
                </div>
              ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
            ) : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceTagsModal;
