import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "@/components/routes/ProtectedRoute";
import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import CasesPage from "./pages/CasesPage";
import NewCasePage from "./pages/NewCasePage";
import CaseDetailPage from "./pages/CaseDetailPage";
// import CaseEditPage from './pages/CaseEditPage'; // Placeholder for edit page
import UsersPage from "./pages/UsersPage";
import UserPermissionsPage from "./pages/UserPermissionsPage";
import SettingsPage from "./pages/SettingsPage";
import OwnersPage from "./pages/OwnersPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage"; // Import the new ProfilePage
import { APP_NAME } from "@/lib/constants";
import EditCasePage from "./pages/EditCasePage";
import ClientCaseDetailWrapper from "./pages/ClientCaseDetailWrapper";
import AllRemarksPage from "./pages/AllRemarksPage";
import ServicesPage from "./pages/ServicesPage";
import { useAppName } from "@/contenxt/AppNameContext"; // <-- Import this
import { fetchPermissions } from "@/features/permissionsSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";

// Simplified PlaceholderPage for debugging

export default function App() {
  // const [currentUser, setCurrentUser] = useState<{
  //   _id?: string;
  //   name: string;
  //   role?: string;
  //   userId?: string;
  //   permissions?: {
  //     canCreate?: boolean;
  //     canEdit?: boolean;
  //     canDelete?: boolean;
  //     canViewReports?: boolean;
  //     canAssignTasks?: boolean;
  //     allCaseAccess?: boolean;
  //     viewRights?: boolean;
  //     createCaseRights?: boolean;
  //     createUserRights?: boolean;
  //     userRolesAndResponsibility?: boolean;
  //     remarksAndChat?: boolean;
  //     canShare?: boolean;
  //   };
  // } | null>(null);
  const location = useLocation();
  const { appName } = useAppName(); // <-- Use context value
  const dispatch = useDispatch<AppDispatch>();

  // if ("serviceWorker" in navigator) {
  //   navigator.serviceWorker
  //     .register("/service-worker.js", { scope: "/" })
  //     .then((registration) => {
  //       console.log(
  //         "Service Worker registered with scope:",
  //         registration.scope
  //       );
  //     })
  //     .catch((error) => {
  //       console.error("Service Worker registration failed:", error);
  //     });
  // }

 
  useEffect(() => {
    const path = location.pathname;

    if (path === "/login") {
      document.title = `Login | ${appName}`;
      return;
    }

    // if (location.pathname !== "/login") {
    //   subscribeToPushNotifications();
    // }

    let pageTitleSegment = "Dashboard"; // Default title segment

    if (path === "/") {
      pageTitleSegment = "Dashboard";
    } else if (path.startsWith("/cases/new")) {
      pageTitleSegment = "New Case";
    } else if (
      path.startsWith("/cases/") &&
      path.split("/").length > 2 &&
      !path.endsWith("/edit")
    ) {
      // This will be handled by CaseDetailPage's own useEffect
      return;
    } else if (path.startsWith("/cases")) {
      pageTitleSegment = "Cases";
    } else if (path.startsWith("/services")) {
      // <-- Add this block
      pageTitleSegment = "Services";
    } else if (path.startsWith("/owners")) {
      pageTitleSegment = "Owners";
    } else if (path.startsWith("/users/") && path.endsWith("/permissions")) {
      // UserPermissionsPage will set its own title
      return;
    } else if (path.startsWith("/users")) {
      pageTitleSegment = "Users";
    } else if (path.startsWith("/settings")) {
      pageTitleSegment = "Settings";
    } else if (path.startsWith("/profile")) {
      // ProfilePage will set its own title
      return;
    } else if (path.startsWith("/notifications")) {
      // NotificationsPage will set its own title
      return;
    }

    document.title = `${pageTitleSegment} | ${appName}`;
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/client/cases/:caseId"
        element={<ClientCaseDetailWrapper />}
      />
      {/* Protected Routes */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/cases" element={<CasesPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/cases/new" element={<NewCasePage />} />
                <Route path="/cases/:caseId" element={<CaseDetailPage />} />
                <Route path="/cases/:caseId/edit" element={<EditCasePage />} />
                <Route path="/owners" element={<OwnersPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route
                  path="/users/:userId/permissions"
                  element={<UserPermissionsPage />}
                />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/remarks" element={<AllRemarksPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
