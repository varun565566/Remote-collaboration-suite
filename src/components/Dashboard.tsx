import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  FileText,
  Video,
  PenTool,
  Kanban,
  MessageCircle,
  Plus,
  Clock,
  Users,
  TrendingUp,
  Zap,
  X,
  LogIn,
  UserPlus,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface PresenceState {
  [key: string]: Array<{
    user_id: string;
    online_at: string;
  }>;
}

interface DashboardProps {
  onModuleChange: (module: string) => void;
}

const quickActions = [
  {
    id: "new-doc",
    label: "New Document",
    icon: FileText,
    color: "docs",
    module: "documents",
  },
  {
    id: "start-call",
    label: "Start Video Call",
    icon: Video,
    color: "video",
    module: "video",
  },
  {
    id: "new-board",
    label: "Create Whiteboard",
    icon: PenTool,
    color: "whiteboard",
    module: "whiteboard",
  },
  {
    id: "new-project",
    label: "New Project Board",
    icon: Kanban,
    color: "tasks",
    module: "tasks",
  },
];

const recentActivity: Array<{
  id: number;
  action: string;
  user: string;
  time: string;
  type: string;
}> = [];

const teamMembers = [
  { name: "Ritambh Shrivatava", role: "Developer" },
  { name: "Rohit Sahu", role: "Developer" },
  { name: "Yash Dubey", role: "Designer" },
  { name: "Yash Agre", role: "Developer" },
  { name: "Varun", role: "PM" },
];

export const Dashboard = ({ onModuleChange }: DashboardProps) => {
  const [showOnlinePopup, setShowOnlinePopup] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch workspace members with proper RLS protection
    const fetchTeamMembers = async () => {
      const currentWorkspaceId = localStorage.getItem('currentWorkspaceId');
      if (!currentWorkspaceId) return;

      const { data } = await supabase
        .from("workspace_members")
        .select(`
          user_id,
          joined_at,
          role,
          profiles!inner(id, full_name)
        `)
        .eq('workspace_id', currentWorkspaceId)
        .order("joined_at", { ascending: true })
        .limit(5);
      
      if (data) {
        // Transform data to match TeamMember interface
        const members = data.map((item: any) => ({
          id: item.profiles.id,
          full_name: item.profiles.full_name,
          role: item.role,
          created_at: item.joined_at
        }));
        setTeamMembers(members);
      }
    };

    fetchTeamMembers();

    // Set up presence channel
    const presenceChannel = supabase.channel("online-users");

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState() as PresenceState;
        const online = new Set<string>();
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            online.add(presence.user_id);
          });
        });
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    setChannel(presenceChannel);

    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, []);

  const onlineMembers = teamMembers.filter(p => onlineUsers.has(p.id));
  const totalTeamMembers = teamMembers.length;

  return (
    <div className="p-6 space-y-6 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
            </h1>
            {user?.user_metadata?.role && (
              <Badge 
                variant={user.user_metadata.role === 'instructor' ? 'default' : 'secondary'} 
                className={`text-sm capitalize ${
                  user.user_metadata.role === 'instructor' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted'
                }`}
              >
                {user.user_metadata.role === 'instructor' ? '🎓 Instructor' : '👤 Member'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Your team has been busy. Here's what's happening.
          </p>
        </div>
        <div className="flex gap-2">
          {!user ? (
            <>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button className="bg-gradient-primary hover:opacity-90" onClick={() => navigate("/auth")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </>
          ) : (
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Start Collaboration
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-0 shadow-custom-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Documents
                </p>
                <p className="text-2xl font-bold text-docs">0</p>
              </div>
              <FileText className="w-8 h-8 text-docs" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-custom-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Team Members
                </p>
                <p className="text-2xl font-bold text-video">{totalTeamMembers}</p>
              </div>
              <Users className="w-8 h-8 text-video" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-custom-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tasks Completed
                </p>
                <p className="text-2xl font-bold text-tasks">0</p>
              </div>
              <TrendingUp className="w-8 h-8 text-tasks" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-custom-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Meeting Hours
                </p>
                <p className="text-2xl font-bold text-whiteboard">0</p>
              </div>
              <Clock className="w-8 h-8 text-whiteboard" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm relative z-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Quick Actions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                onClick={() => onModuleChange(action.module)}
                className="h-24 flex-col gap-3 hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-purple-300 bg-white/80 backdrop-blur-sm group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-blue-200 transition-all">
                  <action.icon className={`w-6 h-6 text-${action.color} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="text-sm font-semibold">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Recent Activity */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Recent Activity
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Status */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Team Status
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {member.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <Badge
                  variant={onlineUsers.has(member.id) ? 'default' : 'secondary'}
                  className={`text-xs ${
                    onlineUsers.has(member.id) ? 'bg-video/10 text-video' : 'bg-muted'
                  }`}
                >
                  {onlineUsers.has(member.id) ? 'online' : 'offline'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Online Members Popup */}
      {showOnlinePopup && onlineMembers.length > 0 && (
        <Card className="fixed bottom-6 right-6 shadow-custom-lg border-primary/20 w-80 animate-in slide-in-from-bottom-5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-video animate-pulse" />
                Online Now ({onlineMembers.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowOnlinePopup(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {onlineMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {member.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-video" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};