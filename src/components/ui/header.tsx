import React from "react";
import { Link } from "react-router-dom";
import { Home, Info, MessageSquare, Mic } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNav?: boolean;
}

export function Header({ title, subtitle, showNav = true }: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Brand Section */}
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
        </div>

        {/* Navigation Links */}
        {showNav && (
          <div className="flex flex-wrap justify-start sm:justify-end gap-2">
            <Link
              to="/"
              className="flex items-center gap-1 px-4 py-2 bg-primary-foreground text-primary rounded-md hover:opacity-90 transition-opacity"
            >
              <Home className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              to="/about"
              className="flex items-center gap-1 px-4 py-2 bg-primary-foreground text-primary rounded-md hover:opacity-90 transition-opacity"
            >
              <Info className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">About</span>
            </Link>
            <Link
              to="/chat"
              className="flex items-center gap-1 px-4 py-2 bg-primary-foreground text-primary rounded-md hover:opacity-90 transition-opacity"
            >
              <MessageSquare className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">Chat</span>
            </Link>
            <Link
              to="/voice"
              className="flex items-center gap-1 px-4 py-2 bg-primary-foreground text-primary rounded-md hover:opacity-90 transition-opacity"
            >
              <Mic className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">Voice</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-1 px-4 py-2 bg-primary-foreground text-primary rounded-md hover:opacity-90 transition-opacity"
            >
              <img
                src="/placeholder.svg"
                alt="Profile"
                className="h-5 w-5 sm:hidden rounded-full"
              />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
