import React from "react";
import logo from "../../assets/sharda-logo.png";

interface HeaderWithBrandingProps {
  currentUser: {
    name: string;
    role?: string;
    avatar?: string;
  };
}

function HeaderWithBranding({ currentUser }: HeaderWithBrandingProps) {
  const userRole = localStorage.getItem("userRole");
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#fcfcfc] to-[#e4e8f0] px-4 py-6 md:px-10 md:py-6 shadow-md border-b border-white/20">
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 w-40 h-40 md:w-52 md:h-52 rounded-full bg-white/30 pointer-events-none"></div>
      <div className="absolute -bottom-8 right-24 w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        {/* Branding Section */}
        <div className="flex items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl shadow-sm">
            <img
              src={logo}
              alt="Sharda Associates Logo"
              className="h-12 w-auto block"
            />
          </div>
          <div>
            <h1 className="m-0 text-2xl md:text-3xl font-bold text-[#1a365d] tracking-tight">
              Sharda Associates
            </h1>
            <p className="mt-1 flex items-center gap-2 text-base text-[#4a5568] font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
              FCA - Franchise Compliance Automation.
            </p>
          </div>
        </div>

        {/* User Welcome Section */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <h2 className="m-0 text-lg md:text-xl font-semibold text-[#2d3748]">
              Welcome back, {currentUser.name}!
            </h2>
            <p className="mt-1 text-base text-[#718096] font-medium">
              {currentUser.role || "Account Manager"}
            </p>
          </div>
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold text-white shadow-md border-2 border-white ${
              currentUser.avatar
                ? ""
                : "bg-blue-500"
            }`}
            style={
              currentUser.avatar
                ? {
                    background: `url(${currentUser.avatar}) center/cover`,
                  }
                : undefined
            }
          >
            {!currentUser.avatar && currentUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="px-3 py-1.5 bg-white/70 rounded-full text-base font-medium text-[#4a5568] backdrop-blur-sm shadow">
          Last updated: {new Date().toLocaleDateString()}
        </div>
        <div className="px-3 py-1.5 bg-white/70 rounded-full text-base font-medium text-[#4a5568] backdrop-blur-sm shadow">
          Role: <span className="text-green-600">{userRole}</span>
        </div>
      </div>
    </div>
  );
}

export default HeaderWithBranding;