export type ServiceStatus =
  | "Pending"
  | "To be Started"
  | "Detail Required"
  | "In-Progress"
  | "Completed"
  | "Rejected"
  | "Total";

// Case-specific statuses
export type CaseStatus =
  | "Total"
  | "New-Case"
  | "In-Progress"
  | "Completed"
  | "Rejected";
type Tag = {
  _id: string;
  name: string;
  color: string;
};

export interface Service {
  id: string;
  name: string;
  status: string;
  remarks: string[];
  completionPercentage: number;
  tags?: string[];
  assignedUser?: string;
  _id?: string;
  serviceId?: string;
}

export type StatusType =
  | "Pending"
  | "To be Started"
  | "New-Case"
  | "In-Progress"
  | "Completed"
  | "Rejected"
  | "Detail Required"
  | "Total";

export type MessageStatus = "sending" | "sent" | "failed"; // More specific than just string

export interface ChatMessage {
  id: string;
  caseId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string; // ISO string
  status?: MessageStatus; // More specific type instead of string
  readBy?: string[]; // Optional array of user IDs who have read the message
}

export interface Case {
  readBy: never[];
  overallCompletionPercentage: number;
  name: string;
  updatedAt: string | number | Date;
  _id?: string;
  id?: string;
  srNo?: string;
  ownerName?: string;
  unitName?: string; // Project Name
  franchiseAddress?: string;
  stateHead?: string;
  authorizedPerson?: string;
  services?: Service[];
  overallStatus?: CaseStatus; // Can be derived or manually set
  assignedUsers?: (
    | string
    | {
        userId?: string | undefined;
        _id?: string | undefined;
        name?: string;
      }
  )[]; // User IDs for back office, local area head etc.
  viewLink?: string; // Optional link for external viewers
  lastUpdate: string; // Timestamp or formatted date string
  reasonForStatus?: string; // For PMEGP status or other specific reasons
  chatMessages?: ChatMessage[];
  status?: CaseStatus;
}

export type UserRole =
  | "Admin"
  | "Frontend"
  | "Backend"
  | "Manager"
  | "User"
  | "Authorized Person"
  | "State Head"
  | "Super Admin";

export interface User {
  _id?: string; // MongoDB ID
  id: string; // Make this required as primary identifier
  userId?: string; // Deprecated, kept for backward compatibility
  name: string;
  email: string;
  role?: UserRole;
  avatarUrl?: string;
  dataAIHint?: string;
  permissions?: {
    canCreateCase?: boolean;
    canEditCase?: boolean;
    canDeleteCase?: boolean;
    canManageUsers?: boolean;
    canManageSettings?: boolean;
    canViewAllCases?: boolean;
  };
  assignedCases?: string[];
  // Consider adding:
  lastActive?: string; // ISO timestamp
  socketId?: string; // For real-time features
}
export interface AppNotification {
  _id?: string; // ✅ Add this if you're using MongoDB
  timestamp: string;
  userId?: string; // User who performed action or is target of notification
  caseId?: string;
  message: string;
  type: "update" | "creation" | "deletion" | "assign"; // 'assign' can be for user to case, or new user creation
  read: boolean;
  id?: string; // Optional: depending on your fallback logic
  srNo: string;
  unitName: string;
  ownerName: string;
  franchiseAddress: string;
  stateHead?: string;
  authorizedPerson?: string;
  services: any[];
  assignedUsers: string[];
  reasonForStatus?: string;
  overallStatus: string;
  lastUpdate?: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  dataAIHint?: string;
  user?: string;
}

export interface CaseChatProps {
  caseId: string;
  currentUser: User;
  assignedUsers: User[];
  initialMessages?: ChatMessage[];
  // Consider adding:
  onNewMessage?: (message: ChatMessage) => void;
  isConnected?: boolean;
  loading?: boolean;
}

export interface SocketEvents {
  // Client emits these:
  register: (userId: string, username: string) => void;
  joinCase: (caseId: string) => void;
  sendMessage: (payload: { caseId: string; message: string }) => void;

  // Server emits these:
  registered: () => void;
  newMessage: (msg: ChatMessage) => void;
  messageStatus: (payload: {
    messageId: string;
    status: MessageStatus;
  }) => void;
  userTyping: (payload: { caseId: string; userId: string }) => void;
  error: (errMsg: string) => void;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatApiResponse
  extends ApiResponse<{
    messages: ChatMessage[];
    participants: User[];
  }> {}

// For "Advanced Section"
export interface StateItem {
  id: string;
  name: string;
}

export interface AreaItem {
  id: string;
  name: string;
  stateId: string; // Link to StateItem
}

export interface ServiceDefinition {
  // For managing available services
  id: string;
  name: string;
  defaultStatus: ServiceStatus;
}

// For dashboard filtering options, extending ServiceStatus for convenience
export type DashboardFilterStatus =
  | CaseStatus
  | "Total"
  | "Rejected"
  | "New-Case";
