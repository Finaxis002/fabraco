  import { Link as RouterLink } from "react-router-dom";
  import { useNavigate } from "react-router-dom";
  import type { RootState } from "../../store";
  import { useSelector } from "react-redux";
  import { useState, useEffect, useRef } from "react";
  import {
    PanelLeft,
    Search,
    Settings,
    UserCircle,
    LogOut,
    Bell,
    Building2,
    CheckCircle2,
    FilePlus,
    UserPlus,
    AlertCircle,
    Activity,
    MessageSquarePlus,
  } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import { Input } from "@/components/ui/input";
  import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
  import MainSidebarNavigation from "./main-sidebar-navigation";
  import { APP_NAME } from "@/lib/constants";
  import React from "react";
  import type { AppNotification } from "@/types/franchise";
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  import { useAuth } from "@/contenxt/AuthContext";
  import axiosInstance from "@/utils/axiosInstance";

  function getRelativeTimeShort(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  }

  const NOTIFICATION_ICONS_DROPDOWN: Record<
    AppNotification["type"],
    React.ElementType
  > = {
    update: CheckCircle2,
    creation: FilePlus,
    assign: UserPlus,
    deletion: AlertCircle,
  };

  export default function MainHeader() {
    const [recentNotifications, setRecentNotifications] = useState<
      AppNotification[]
    >([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [recentRemarks, setRecentRemarks] = useState<any[]>([]);
    const [unreadRemarkCount, setUnreadRemarkCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightRefs, setHighlightRefs] = useState<HTMLElement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // useEffect(() => {
    //   document.querySelectorAll("mark[data-highlight]").forEach((mark) => {
    //     const parent = mark.parentNode;
    //     if (!parent) return;
    //     parent.replaceChild(
    //       document.createTextNode(mark.textContent || ""),
    //       mark
    //     );
    //     parent.normalize();
    //   });

    //   if (!searchTerm) {
    //     setHighlightRefs([]);
    //     setCurrentIndex(0);
    //     return;
    //   }

    //   const escapedTerm = searchTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    //   const regex = new RegExp(`(${escapedTerm})`, "gi");

    //   const foundMarks: HTMLElement[] = [];

    //   const walk = (node: Node) => {
    //     if (
    //       node.nodeType === 3 &&
    //       node.parentNode &&
    //       node.parentNode.nodeName !== "SCRIPT" &&
    //       node.parentNode.nodeName !== "STYLE"
    //     ) {
    //       const text = node.nodeValue;
    //       if (text && regex.test(text)) {
    //         const span = document.createElement("span");
    //         span.innerHTML = text.replace(
    //           regex,
    //           `<mark data-highlight style="background: yellow;">$1</mark>`
    //         );
    //         const fragment = document.createDocumentFragment();
    //         while (span.firstChild) {
    //           const child = span.firstChild;
    //           if ((child as HTMLElement).tagName === "MARK")
    //             foundMarks.push(child as HTMLElement);
    //           fragment.appendChild(child);
    //         }
    //         node.parentNode.replaceChild(fragment, node);
    //       }
    //     } else if (node.nodeType === 1) {
    //       for (let i = 0; i < node.childNodes.length; i++) {
    //         walk(node.childNodes[i]);
    //       }
    //     }
    //   };

    //   walk(document.body);

    //   setHighlightRefs(foundMarks);
    //   setCurrentIndex(0);
    // }, [searchTerm]);

    useEffect(() => {
      // First, clear all previously highlighted text
      document.querySelectorAll("mark[data-highlight]").forEach((mark) => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(
            document.createTextNode(mark.textContent || ""),
            mark
          );
          parent.normalize();
        }
      });

      if (!searchTerm) {
        setHighlightRefs([]);
        setCurrentIndex(0);
        return;
      }

      const escapedTerm = searchTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`(${escapedTerm})`, "gi");

      const foundMarks: HTMLElement[] = [];

      // Common modal/dialog selectors to exclude (including dynamically added modals)
      const MODAL_SELECTORS = [
        ".modal.no-search", // for common modals
        ".dialog", // for dialog-based popups
        '[role="dialog"]', // for ARIA-defined dialog elements
        ".MuiModal-root", // Material UI modals
        ".ReactModal__Overlay", // React modal overlays
        ".chakra-modal", // Chakra UI modals
        ".ant-modal", // Ant Design modals
      ].join(",");

      const walk = (node: Node) => {
        // Skip if node is inside a modal/dialog
        if (
          node.nodeType === 1 &&
          (node as Element).closest(MODAL_SELECTORS) // Check if any ancestor is a modal/dialog
        ) {
          return;
        }

        // Skip hidden elements (those with `display: none`, `visibility: hidden`, `opacity: 0`)
        if (
          node.nodeType === 1 &&
          node instanceof HTMLElement && // Add this type check
          node.offsetParent === null
        ) {
          return;
        }

        // Only process text nodes that are not inside script/style tags and not already highlighted
        if (
          node.nodeType === 3 && // Text node
          node.parentNode &&
          node.parentNode.nodeName !== "SCRIPT" &&
          node.parentNode.nodeName !== "STYLE" &&
          node.parentNode.nodeName !== "MARK" // Skip already highlighted text
        ) {
          const text = node.nodeValue;
          if (text && regex.test(text)) {
            const span = document.createElement("span");
            span.innerHTML = text.replace(
              regex,
              `<mark data-highlight style="background: yellow;">$1</mark>`
            );
            const fragment = document.createDocumentFragment();
            while (span.firstChild) {
              const child = span.firstChild;
              if ((child as HTMLElement).tagName === "MARK") {
                foundMarks.push(child as HTMLElement);
              }
              fragment.appendChild(child);
            }
            node.parentNode.replaceChild(fragment, node);
          }
        } else if (node.nodeType === 1) {
          for (let i = 0; i < node.childNodes.length; i++) {
            walk(node.childNodes[i]);
          }
        }
      };

      // Start walking from the main content area (excluding modals)
      const mainContent = document.querySelector("main") || document.body;
      walk(mainContent);

      setHighlightRefs(foundMarks);
      setCurrentIndex(0);
    }, [searchTerm]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && highlightRefs.length > 0) {
          e.preventDefault();
          const el = highlightRefs[currentIndex];
          if (!el) return;

          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.style.background = "orange";

          highlightRefs.forEach((mark, idx) => {
            if (idx !== currentIndex) mark.style.background = "yellow";
          });

          setCurrentIndex((prev) => (prev + 1) % highlightRefs.length);
        } else if (e.key === "Escape") {
          setSearchTerm("");
          setHighlightRefs([]);
          setCurrentIndex(0);

          document.querySelectorAll("mark[data-highlight]").forEach((mark) => {
            const parent = mark.parentNode;
            if (!parent) return;
            parent.replaceChild(
              document.createTextNode(mark.textContent || ""),
              mark
            );
            parent.normalize();
          });
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [highlightRefs, currentIndex]);

    useEffect(() => {
      const handleShortcut = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key.toLowerCase() === "k") {
          e.preventDefault();
          const input = document.getElementById(
            "global-search-input"
          ) as HTMLInputElement | null;
          if (input) input.focus();
        }
      };

      window.addEventListener("keydown", handleShortcut);
      return () => window.removeEventListener("keydown", handleShortcut);
    }, []);

    // notification badge
    useEffect(() => {
      const fetchNotifications = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axiosInstance.get("/notifications");

          // Axios throws on error by default, so no need for res.ok check

          const data = res.data; // This is your response data

          setRecentNotifications(data);

          const unreadCount = data.filter((n: { read: any }) => !n.read).length;
          setUnreadNotificationCount(unreadCount);
        } catch (err) {
          console.error("Error loading notifications:", err);
        }
      };

      fetchNotifications();
    }, []);

    // remarks badge
    const userRole = localStorage.getItem("userRole");
    const isAdmin = userRole === "Admin" || userRole === "Super Admin";

    const fetchRecentRemarks = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const currentUserId =
          currentUser?._id || currentUser?.id || currentUser?.userId;

        const res = await axiosInstance("/remarks/recent");

        const data = res.data;

        setRecentRemarks(data);

        const unread = data.filter((r: any) => {
          return !(r.readBy ?? []).includes(currentUserId);
        }).length;
        setUnreadRemarkCount(unread);
      } catch (err) {
        console.error("Error loading recent remarksssss :", err);
      }
    };

    useEffect(() => {
      fetchRecentRemarks();
    }, []);

    const navigate = useNavigate();

    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("user");
      navigate("/login");
    };

    //   const handleLogout = async () => {
    //   try {
    //     // Fetch user data from localStorage, ensuring it's not null
    //     const userStr = localStorage.getItem("user");
    //     if (!userStr) {
    //       throw new Error("User not found in localStorage");
    //     }

    //     // Parse the user object and get the userId
    //     const userObj = JSON.parse(userStr);
    //     const userId = userObj._id;

    //     // Remove user data and token from localStorage
    //     localStorage.removeItem("token");
    //     localStorage.removeItem("userRole");
    //     localStorage.removeItem("user");

    //     // Make a request to remove the subscription from the backend
    //     await fetch("http://localhost:3000/api/pushnotifications/remove-subscription", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({ userId }),
    //     });

    //     // Navigate to login page
    //     navigate("/login");
    //   } catch (error) {
    //     console.error("Error during logout:", error);
    //   }
    // };

    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
      const handleUpdate = () => {
        fetchRecentRemarks();
      };

      window.addEventListener("remarks-updated", handleUpdate);
      return () => {
        window.removeEventListener("remarks-updated", handleUpdate);
      };
    }, []);

    return (
      <header className="sticky sm:relative top-0 z-30 flex h-14 items-center gap-2 sm:gap-4 border-b bg-background sm:border-b-transparent  sm:bg-transparent  px-2 sm:px-6 print:hidden">
        {/* Mobile sidebar trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="sm:max-w-xs bg-sidebar text-sidebar-foreground"
          >
            <nav className="grid gap-6 text-lg font-medium">
              <RouterLink
                to="/"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              >
                <Building2 className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">{APP_NAME}</span>
              </RouterLink>
              <MainSidebarNavigation isMobile={true} />
              {/* Add this for admin */}
              {isAdmin && (
                <RouterLink
                  to="/settings"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </RouterLink>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Spacer for left side */}
        <div className="flex-1" />

        {/* Search bar - responsive width and stacking */}
        <div className="relative flex-shrink-0 w-full max-w-[180px] xs:max-w-[220px] sm:max-w-[240px] md:max-w-[320px] ml-auto">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search in page..."
                className="w-full rounded-lg bg-muted pl-8 py-2 text-sm"
                aria-label="Search cases"
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                id="global-search-input"
              />
              <div className="absolute inset-y-0 right-10 flex items-center gap-2">
                {highlightRefs.length > 0 && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {currentIndex === 0 ? 1 : currentIndex}/{highlightRefs.length}
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Notification, Remarks, User - stack horizontally, shrink on mobile */}
        <div className="flex items-center gap-1 sm:gap-2 ml-1">
          {/* Notification */}

          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
                <span className="sr-only">Toggle notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 sm:w-96 max-w-[95vw]"
            >
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {unreadNotificationCount > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    {unreadNotificationCount} New
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentNotifications.length > 0 ? (
                recentNotifications
                  .slice(0, 3)
                  .map((notification: AppNotification, index: number) => {
                    const Icon =
                      NOTIFICATION_ICONS_DROPDOWN[notification.type] || Activity;

                    return (
                      <DropdownMenuItem
                        key={notification.id ?? index}
                        asChild
                        className="cursor-pointer !p-0"
                      >
                        <RouterLink
                          to={
                            notification.caseId
                              ? `/cases/${notification.caseId}`
                              : "/notifications"
                          }
                          className="flex items-start gap-2 p-2 w-full"
                        >
                          <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                            <AvatarFallback
                              className={
                                notification.read
                                  ? "bg-muted"
                                  : "bg-primary/10 text-primary"
                              }
                            >
                              <Icon className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <p
                              className={`text-xs leading-snug ${
                                !notification.read ? "font-medium" : ""
                              } truncate`}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTimeShort(notification.timestamp)}
                            </p>
                          </div>
                        </RouterLink>
                      </DropdownMenuItem>
                    );
                  })
              ) : (
                <DropdownMenuItem disabled>
                  <div className="text-xs text-muted-foreground text-center py-2 w-full">
                    No new notifications
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="!p-0">
                <RouterLink
                  to="/notifications"
                  className="flex items-center justify-center py-2 text-sm font-medium text-primary hover:bg-accent w-full"
                >
                  View all notifications
                </RouterLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Remarks */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <MessageSquarePlus className="h-5 w-5" />
                {unreadRemarkCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                  </span>
                )}
                <span className="sr-only">Toggle remarks</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 sm:w-96 max-w-[95vw]"
            >
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Recent Remarks</span>
                {unreadRemarkCount > 0 && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {unreadRemarkCount} New
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentRemarks.length > 0 ? (
                recentRemarks.slice(0, 3).map((remark) => (
                  <DropdownMenuItem
                    key={remark._id}
                    asChild
                    className="cursor-pointer !p-0"
                  >
                    <RouterLink
                      to={`/cases/${remark.caseId}?serviceId=${remark.serviceId}`}
                      className="flex items-start gap-2 p-2 w-full"
                    >
                      <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {remark.userName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-medium truncate">
                          {remark.remark.length > 50
                            ? remark.remark.slice(0, 47) + "..."
                            : remark.remark}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTimeShort(remark.createdAt)}
                        </p>
                      </div>
                    </RouterLink>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  <div className="text-xs text-muted-foreground text-center py-2 w-full">
                    No recent remarks
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="!p-0">
                <RouterLink
                  to="/remarks"
                  className="flex items-center justify-center py-2 text-sm font-medium text-primary hover:bg-accent w-full"
                >
                  View all remarks
                </RouterLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar className="h-full w-full">
                  {currentUser?.avatarUrl ? (
                    <AvatarImage
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      data-ai-hint={currentUser.dataAIHint || "user avatar"}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {currentUser?.name
                        ? currentUser.name.charAt(0).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <RouterLink to="/profile" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" /> Profile
                </RouterLink>
              </DropdownMenuItem>
              {isAdmin ? (
                <DropdownMenuItem asChild>
                  <RouterLink to="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </RouterLink>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    );
  }
