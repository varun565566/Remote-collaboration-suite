import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Video,
  PenTool,
  Kanban,
  MessageCircle,
  Users,
  Settings,
  ChevronLeft,
  Home,
  LogOut,
  Shield,
} from "lucide-react";

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const modules = [
  { id: "dashboard", label: "Dashboard", icon: Home, color: "workspace" },
  { id: "documents", label: "Documents", icon: FileText, color: "docs" },
  { id: "video", label: "Video Calls", icon: Video, color: "video" },
  { id: "whiteboard", label: "Whiteboard", icon: PenTool, color: "whiteboard" },
  { id: "tasks", label: "Task Boards", icon: Kanban, color: "tasks" },
  { id: "chat", label: "Team Chat", icon: MessageCircle, color: "chat" },
];

export const Sidebar = ({ activeModule, onModuleChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (user) {
      // Fetch profile
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
      
      // First check user_metadata for role (from sign-up)
      const metadataRole = user.user_metadata?.role;
      if (metadataRole) {
        setUserRole(metadataRole);
      }
      
      // Also fetch user role from user_roles table as backup
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.role && !metadataRole) {
            setUserRole(data.role);
          }
        });
    }
  }, [user]);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white border-r border-slate-700/50 transition-all duration-300 relative overflow-hidden",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 relative z-10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Collaboration Suite</h2>
                <p className="text-xs text-slate-400">Remote Team Hub</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 relative z-10">
        {modules.map((module) => {
          const isActive = activeModule === module.id;
          return (
            <Button
              key={module.id}
              variant={isActive ? "secondary" : "ghost"}
              onClick={() => onModuleChange(module.id)}
              className={cn(
                "w-full justify-start gap-3 h-11 transition-all hover:scale-105",
                isCollapsed && "justify-center px-2",
                isActive 
                  ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 shadow-lg" 
                  : "hover:bg-slate-700/50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                isActive ? "bg-gradient-to-br from-purple-600 to-blue-600" : "bg-slate-700/50"
              )}>
                <module.icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-white" : `text-${module.color}`
                  )}
                />
              </div>
              {!isCollapsed && (
                <span className="font-semibold">{module.label}</span>
              )}
            </Button>
          );
        })}

        {/* Admin Dashboard Link - Only show for admins */}
        {userRole === 'admin' && (
          <Button
            variant={activeModule === "admin" ? "secondary" : "ghost"}
            onClick={() => window.location.href = '/admin'}
            className={cn(
              "w-full justify-start gap-3 h-10",
              isCollapsed && "justify-center px-2",
              activeModule === "admin" && "bg-secondary shadow-custom-sm"
            )}
          >
            <Shield
              className={cn(
                "w-4 h-4",
                activeModule === "admin" && "text-red-500"
              )}
            />
            {!isCollapsed && (
              <span className="font-medium">Admin Dashboard</span>
            )}
          </Button>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-primary text-white text-xs">
              {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                <Badge variant="secondary" className="text-xs bg-video/10 text-video">
                  Online
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={userRole === 'instructor' ? 'default' : 'secondary'} 
                  className={`text-xs capitalize ${
                    userRole === 'instructor' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted'
                  }`}
                >
                  {userRole === 'instructor' ? '🎓 Instructor' : '👤 Member'}
                </Badge>
              </div>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={signOut}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};