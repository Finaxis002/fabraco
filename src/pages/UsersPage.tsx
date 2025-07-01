import UserList from "@/components/user-management/user-list";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAllUsers } from "@/features/userSlice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import UserCardView from "@/components/user-management/UserCardView";
import { fetchPermissions } from "@/features/permissionsSlice";

export default function UsersPage() {
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const dispatch = useDispatch<AppDispatch>();

  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
  const userRole = localStorage.getItem("userRole");

  const permission = useSelector((state: RootState)=> state.permissions.permissions);
  const loading = useSelector((state: RootState) => state.permissions.loading)

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchPermissions(user._id));
    }
    dispatch(getAllUsers());
  }, [dispatch, location.pathname]);

  useEffect(() => {
    if (location.pathname === "/users") {
      setRefreshKey((prev) => prev + 1);
    }
  }, [location.pathname]);

  const isAdmin = userRole === "Admin" || userRole === "Super Admin";
  const canView =
    
    (isAdmin || permission?.userRolesAndResponsibility || permission?.createUserRights);


  const pageActions = (
    <div className="flex flex-wrap items-center gap-2">
      <TooltipProvider>
        {/* Hide table/card toggle on mobile, show only on desktop */}
        <div className="hidden sm:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "table" ? "secondary" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
                aria-label="Table View"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Table View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "card" ? "secondary" : "outline"}
                size="icon"
                onClick={() => setViewMode("card")}
                aria-label="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Card View</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );

   if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!canView) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        You do not have permission to view this page.
      </div>
    );
  }


  return (
    <>
     <div className="flex items-center justify-between mb-4">
      <div>
         <h1 className="text-2xl font-bold mb-1 px-2 sm:px-0">User Management</h1>
      <p className="text-muted-foreground mb-4 px-2 sm:px-0">
        View, add, or edit user accounts and their roles.
      </p>
      </div>
      <div className="px-2 sm:px-0">{pageActions}</div>
      </div>
      {/* On mobile, always show card view. On desktop, allow toggle */}
      <div className="px-1 sm:px-0">
        <div className="block sm:hidden">
          <UserCardView refreshKey={refreshKey} />
        </div>
        <div className="hidden sm:block">
          {viewMode === "table" ? (
            <UserList refreshKey={refreshKey} />
          ) : (
            <UserCardView refreshKey={refreshKey} />
          )}
        </div>
      </div>
    </>
  );
}