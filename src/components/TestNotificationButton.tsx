import { useState, useEffect } from "react";

function TestNotificationButton() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // To track and display status
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [userId, setUserId] = useState<string | null>(null); // Dynamic userId state

  // Set the userId dynamically based on the logged-in user (localStorage or context)
  useEffect(() => {
    const storedUser = localStorage.getItem("user"); // Get the entire user object
    if (storedUser) {
      const user = JSON.parse(storedUser); // Parse the user object
      setUserId(user._id); // Set userId from the user object in localStorage
      console.log("userId : ", user._id);
    } else {
      setStatus("User not logged in.");
    }
  }, []);

  const sendTestNotification = async () => {
    if (!message.trim()) {
      setStatus("Please enter a message");
      return;
    }

    if (!userId) {
      setStatus("User ID is missing!");
      return;
    }

    setIsLoading(true);
    setStatus("Sending...");

    try {
      const response = await fetch(
        "https://tumbledrybe.sharda.co.in/api/pushnotifications/send-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId, // Use dynamic userId
            message: message, // Using the state variable
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send notification");
      }

      setStatus("Notification sent successfully!");
      console.log("Notification sent:", data);
    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
      console.error("Error sending notification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h3>Test Push Notification</h3>
      <input
        type="text"
        placeholder="Enter message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />
      <button
        onClick={sendTestNotification}
        className="border border-2 border-green-300 bg-green-800 text-white"
        disabled={isLoading || !message.trim() || !userId}
        style={{ padding: "8px 16px", marginBottom: "10px" }}
      >
        {isLoading ? "Sending..." : "Send Test Notification"}
      </button>
      {status && (
        <div
          style={{
            color: status.includes("Error") ? "red" : "green",
            marginTop: "10px",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}

export default TestNotificationButton;
