import {
  Shield,
  PlusCircle,
  Edit,
  Trash,
  BarChart,
  ClipboardList,
  Lock,
  UserCircle,
    Bell,
    MessageCircle,
} from "lucide-react"; // Assuming icons are imported from lucide-react
import React from "react";

const AccessPermissions = ({ currentUser }: { currentUser: any }) => {
  const permissions = currentUser.permissions || {};

const permissionsList = [
  {
    label: "Create Case",
    allowed:
      currentUser.name === "Super Admin" ? true : permissions.createCaseRights,
    icon: <PlusCircle className="h-5 w-5" />,
  },
  {
    label: "Edit Case",
    allowed: currentUser.name === "Super Admin" ? true : permissions.edit,
    icon: <Edit className="h-5 w-5" />,
  },
  {
    label: "Delete Case",
    allowed: currentUser.name === "Super Admin" ? true : permissions.delete,
    icon: <Trash className="h-5 w-5" />,
  },
  {
    label: "View Reports",
    allowed: currentUser.name === "Super Admin" ? true : permissions.viewRights,
    icon: <BarChart className="h-5 w-5" />,
  },
  {
    label: "Assign Tasks",
    allowed:
      currentUser.name === "Super Admin" ? true : permissions.allCaseAccess,
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    label: "Manage Users",
    allowed:
      currentUser.name === "Super Admin"
        ? true
        : permissions.createUserRights,
    icon: <UserCircle className="h-5 w-5" />,
  },
  {
    label: "Manage Roles & Responsibilities",
    allowed:
      currentUser.name === "Super Admin"
        ? true
        : permissions.userRolesAndResponsibility,
    icon: <Shield className="h-5 w-5" />,
  },
  {
    label: "View Remarks",
    allowed: currentUser.name === "Super Admin" ? true : permissions.remarks,
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: "Access Chat",
    allowed: currentUser.name === "Super Admin" ? true : permissions.chat,
    icon: <MessageCircle className="h-5 w-5" />, // Changed to a valid icon from lucide-react
  },
  {
    label: "Admin Access",
    allowed: currentUser.name === "Super Admin",
    icon: <Lock className="h-5 w-5" />,
  },
];


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
        <h2 className="text-lg font-semibold flex items-center">
          <Shield className="mr-2 h-5 w-5 text-indigo-600" />
          Access Permissions
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissionsList.map(({ label, allowed, icon }) => (
            <div
              key={label}
              className={`p-4 rounded-lg border ${
                allowed
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-full ${
                    allowed ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  {React.cloneElement(icon, {
                    className: `h-5 w-5 ${allowed ? "text-green-600" : "text-gray-500"}`,
                  })}
                </div>
                <div>
                  <h3 className="font-medium">{label}</h3>
                  <p className={`text-sm ${allowed ? "text-green-600" : "text-gray-500"}`}>
                    {allowed ? "Access granted" : "Not available"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccessPermissions;
