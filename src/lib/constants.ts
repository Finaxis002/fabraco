import type {
  Case,
  User,
  Service,
  ServiceStatus,
  UserRole,
  StateItem,
  AreaItem,
  ServiceDefinition,
  AppNotification,
  ChatMessage,
  StatusType
} from "@/types/franchise";
import {
  Home,
  Users,
  Settings,
  FolderKanban,
  Briefcase,
  MapPin,
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  Hourglass,
  Zap,
  UserPlus,
  MessageSquare,
  Users2,
  PieChart
} from "lucide-react"; // Added Users2


export const APP_NAME = "FranchiseFlow";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  role?: UserRole[]; // Optional: specify roles that can see this item
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Cases", href: "/cases", icon: FolderKanban },
  { label: "Users", href: "/users", icon: Users, role: ["Admin"] },
  // Settings might be moved inside user dropdown or kept for admin only
  // { label: "Settings", href: "/settings", icon: Settings, role: ["Admin"] },
];

// Using HSL values from globals.css for direct style binding

export const STATUS_CONFIG: Record<StatusType, { color: string; lightColor: string; Icon: React.ElementType }> = {
  Pending: {
    color: "hsl(0, 0%, 70%)",
    lightColor: "hsl(0, 0%, 90%)",
    Icon: Hourglass,
  },
  "To be Started": {
    color: "hsl(200, 80%, 60%)",
    lightColor: "hsl(200, 80%, 90%)",
    Icon: Hourglass,
  },
  "New-Case": {
   color: "hsl(200, 80%, 60%)",
    lightColor: "hsl(200, 80%, 90%)",
    Icon: Hourglass,
  },
  "In-Progress": {
    color: "hsl(210, 100%, 55%)",
    lightColor: "hsl(210, 100%, 85%)",
    Icon: Zap,
  },
  Completed: {
    color: "hsl(210, 100%, 40%)",
    lightColor: "hsl(210, 100%, 75%)",
    Icon: CheckCircle2,
  },
  Rejected: {
    color: "hsl(0, 75%, 55%)",
    lightColor: "hsl(0, 75%, 85%)",
    Icon: XCircle,
  },
  "Detail Required": {
    color: "", // put actual colors if needed
    lightColor: "",
    Icon: XCircle, // replace with actual icon component
  },
  Total: {
    color: "#3b82f6",
    lightColor: "#bfdbfe",
    Icon: PieChart,
  },
};


export type ValidStatus = keyof typeof STATUS_CONFIG;


export const USER_ROLES: UserRole[] = [
  "Admin",
  "User",
  "Authorized Person",
  "State Head",
];


export const MOCK_SERVICES_TEMPLATES: Omit<
  Service,
  "id" | "status" | "remarks" | "completionPercentage" | "assignedUser"
>[] = [
  {
    name: "GST Registration",
    tags: ["compliance"],
    _id: "gstreg123",
    serviceId: "service-001",
  },
  {
    name: "Company Incorporation",
    tags: ["startup"],
    _id: "incorp123",
    serviceId: "service-002",
  },
  // ...add more as needed
];


const generateAvatarUrl = (name: string) =>
  `https://picsum.photos/seed/${name.replace(/\s+/g, "-").toLowerCase()}/40/40`;

export const MOCK_USERS: User[] = [
  {
    id: "user1",
    name: "Admin User",
    email: "admin@franchiseflow.com",
    role: "Admin",
    avatarUrl: generateAvatarUrl("Admin User"),
    dataAIHint: "person avatar",
  },
 
];

export const MOCK_STATES: StateItem[] = [
  { id: "state1", name: "Madhya Pradesh" },
  { id: "state2", name: "Rajasthan" },
  { id: "state3", name: "Maharashtra" },
  { id: "state4", name: "Uttar Pradesh" },
];

export const MOCK_AREAS: AreaItem[] = [
  { id: "area1", name: "Gwalior", stateId: "state1" },
  { id: "area2", name: "Jaipur", stateId: "state2" },
  { id: "area3", name: "Pune", stateId: "state3" },
  { id: "area4", name: "Lucknow", stateId: "state4" },
  { id: "area5", name: "Indore", stateId: "state1" },
];

export const MOCK_SERVICE_DEFINITIONS: ServiceDefinition[] =
  MOCK_SERVICES_TEMPLATES.map((s, i) => ({
    id: `servdef${i + 1}`,
    name: s.name,
    defaultStatus: "Pending", // Now valid because it's in ServiceStatus
  }));

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    caseId: "case1",
    message: "GST status updated to Approved.",
    type: "update",
    read: false,
    userId: "user2",
    srNo: "",
    unitName: "",
    ownerName: "",
    franchiseAddress: "",
    services: [],
    assignedUsers: [],
    overallStatus: "",
    name: "",
    email: "",
    role: "",
  },
  {
    id: "notif2",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    caseId: "case2",
    message: "New case created.",
    type: "creation",
    read: false,
    userId: "user1",
    srNo: "",
    unitName: "",
    ownerName: "",
    franchiseAddress: "",
    services: [],
    assignedUsers: [],
    overallStatus: "",
    name: "",
    email: "",
    role: "",
  },
  {
    id: "notif3",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    caseId: "case3",
    message: "Deepak Sharma assigned.",
    type: "assign",
    read: true,
    userId: "user1",
    srNo: "",
    unitName: "",
    ownerName: "",
    franchiseAddress: "",
    services: [],
    assignedUsers: [],
    overallStatus: "",
    name: "",
    email: "",
    role: "",
  },
  {
    id: "notif4",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    caseId: "case5",
    message: "Bank Loan Application moved to In-Progress.",
    type: "update",
    read: false,
    userId: "user2",
    srNo: "",
    unitName: "",
    ownerName: "",
    franchiseAddress: "",
    services: [],
    assignedUsers: [],
    overallStatus: "",
    name: "",
    email: "",
    role: "",
  },
  {
    id: "notif5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    message: "New user 'John Doe' added.",
    type: "assign",
    read: false,
    userId: "user1",
    srNo: "",
    unitName: "",
    ownerName: "",
    franchiseAddress: "",
    services: [],
    assignedUsers: [],
    overallStatus: "",
    name: "",
    email: "",
    role: "",
  }, // 'assign' type for user creation as well
  {
    id: "notif6",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    caseId: "case4",
    message: "UDYAM Registration status is Pending.",
    type: "update",
    read: true,
    userId: "user5",
    srNo: "",
    unitName: "",
    ownerName: "",
    franchiseAddress: "",
    services: [],
    assignedUsers: [],
    overallStatus: "",
    name: "",
    email: "",
    role: "",
  },
];

export const DEFAULT_USER_PERMISSIONS = {
  allCaseAccess: false,
  viewRights: false,
  createCaseRights: false,
  createUserRights: false,
  userRolesAndResponsibility: false,
  delete: false,
  edit: false,
  remarks: false, // ✅ separated from remarksAndChat
  chat: false,    // ✅ separated from remarksAndChat
};






// Simplified and more logical permission structure
export const ROLE_PERMISSIONS: Record<
  UserRole,
  typeof DEFAULT_USER_PERMISSIONS
> = {
  Admin: {
    allCaseAccess: false,
    viewRights: false,
    createCaseRights: false,
    createUserRights: false,
    userRolesAndResponsibility: false,
    delete: false,
    edit: false,
    remarks: false, // ✅ separated from remarksAndChat
    chat: false, // ✅ separated from remarksAndChat
  },
  "Authorized Person": {
    allCaseAccess: false,
    viewRights: false,
    createCaseRights: false,
    createUserRights: false,
    userRolesAndResponsibility: false,
    delete: false,
    edit: false,
    remarks: false, // ✅ separated from remarksAndChat
    chat: false, // ✅ separated from remarksAndChat
  },
  "State Head": {
    allCaseAccess: false,
    viewRights: false,
    createCaseRights: false,
    createUserRights: false,
    userRolesAndResponsibility: false,
    delete: false,
    edit: false,
    remarks: false, // ✅ separated from remarksAndChat
    chat: false, // ✅ separated from remarksAndChat
  },
  "User": {
    // Can only view their own case(s) - logic handled by filtering
    allCaseAccess: false,
    viewRights: false,
    createCaseRights: false,
    createUserRights: false,
    userRolesAndResponsibility: false,
    delete: false,
    edit: false,
    remarks: false, // ✅ separated from remarksAndChat
    chat: false, // ✅ separated from remarksAndChat
  },
  Frontend: {
    allCaseAccess: false,
    viewRights: false,
    createCaseRights: false,
    createUserRights: false,
    userRolesAndResponsibility: false,
    delete: false,
    edit: false,
    remarks: false,
    chat: false,
  },
  Backend: {
    allCaseAccess: false,
    viewRights: false,
    createCaseRights: false,
    createUserRights: false,
    userRolesAndResponsibility: false,
    delete: false,
    edit: false,
    remarks: false,
    chat: false,
  },
  Manager: {
    allCaseAccess: false,
    viewRights: false,
    createCaseRights: false,
    createUserRights: false,
    userRolesAndResponsibility: false,
    delete: false,
    edit: false,
    remarks: false,
    chat: false,
  },
  "Super Admin": {
    allCaseAccess: false,
    viewRights: false,
    createCaseRights: false,
    createUserRights: false,
    userRolesAndResponsibility: false,
    delete: false,
    edit: false,
    remarks: false,
    chat: false,
  }
};

export { generateAvatarUrl };
