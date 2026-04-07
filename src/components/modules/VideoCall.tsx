import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  ScreenShare,
  Settings,
  Users,
  MessageSquare,
  MoreVertical,
  Camera,
  Plus,
  Copy,
  UserPlus,
} from "lucide-react";

export const VideoCall = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [currentMeeting, setCurrentMeeting] = useState<{ title: string; id: string } | null>(null);

  const participants = [
    { id: 1, name: "John Doe (You)", avatar: "", isMuted: false, isVideoOff: false, isHost: true },
  ];

  const handleCreateMeeting = () => {
    console.log('Creating meeting...', meetingTitle);
    
    if (!meetingTitle.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }
    
    const meetingId = Math.floor(100000000 + Math.random() * 900000000).toString();
    const formattedId = `${meetingId.slice(0, 3)}-${meetingId.slice(3, 6)}-${meetingId.slice(6, 9)}`;
    
    console.log('Meeting created:', { title: meetingTitle, id: formattedId });
    
    setCurrentMeeting({ title: meetingTitle, id: formattedId });
    toast.success(`Meeting "${meetingTitle}" created! Code: ${formattedId}`);
    setMeetingTitle("");
    setIsNewMeetingOpen(false);
    console.log('Dialog closed, meeting should be visible now');
  };

  const handleEndCall = () => {
    setCurrentMeeting(null);
    toast.info("Call ended");
  };

  const handleCopyCode = () => {
    if (currentMeeting) {
      navigator.clipboard.writeText(currentMeeting.id);
      toast.success("Meeting code copied to clipboard!");
    }
  };

  const handleJoinWithCode = () => {
    if (!joinCode.trim()) {
      toast.error("Please enter a meeting code");
      return;
    }
    toast.success(`Joining meeting with code: ${joinCode}`);
    setJoinCode("");
    setIsInviteOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-video/5 to-docs/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              {currentMeeting ? currentMeeting.title : "No Active Meeting"}
            </h2>
            {currentMeeting && (
              <p className="text-sm text-muted-foreground">
                Meeting ID: {currentMeeting.id}
              </p>
            )}
          </div>
          {currentMeeting && (
            <Badge className="bg-video text-white">
              <div className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
              Live
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isNewMeetingOpen} onOpenChange={setIsNewMeetingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-video hover:bg-video/90">
                <Plus className="w-4 h-4 mr-2" />
                New Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Meeting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="meeting-title">Meeting Title</Label>
                  <Input
                    id="meeting-title"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="Enter meeting title"
                  />
                </div>
                <Button onClick={handleCreateMeeting} className="w-full">
                  Create Meeting
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite to Meeting</DialogTitle>
                <DialogDescription>
                  Share the meeting code or join an existing meeting
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="share" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="share">Share Code</TabsTrigger>
                  <TabsTrigger value="join">Join Meeting</TabsTrigger>
                </TabsList>
                <TabsContent value="share" className="space-y-4">
                  {currentMeeting ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Meeting Code</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={currentMeeting.id}
                            readOnly
                            className="font-mono"
                          />
                          <Button onClick={handleCopyCode} size="icon">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share this code with others to let them join your meeting
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Create a meeting first to get a shareable code
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="join" className="space-y-4">
                  <div>
                    <Label htmlFor="join-code">Enter Meeting Code</Label>
                    <Input
                      id="join-code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="000-000-000"
                      className="font-mono mt-2"
                    />
                  </div>
                  <Button onClick={handleJoinWithCode} className="w-full">
                    Join Meeting
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Participants (1)
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Meeting Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Audio Input</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Default microphone
                  </p>
                </div>
                <div>
                  <Label>Video Input</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Default camera
                  </p>
                </div>
                <div>
                  <Label>Audio Output</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Default speakers
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6">
        {currentMeeting ? (
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 h-full">
          {participants.map((participant) => (
            <Card key={participant.id} className="relative overflow-hidden shadow-custom-lg bg-gradient-to-br from-card to-card/80">
              <CardContent className="p-0 h-full">
                {!participant.isVideoOff ? (
                  <div className="h-full bg-gradient-to-br from-video/20 to-docs/20 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                ) : (
                  <div className="h-full bg-muted/50 flex items-center justify-center">
                    <Avatar className="w-24 h-24">
                      <AvatarFallback className="text-2xl bg-gradient-primary text-white">
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                
                {/* Participant Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">
                        {participant.name}
                      </span>
                      {participant.isHost && (
                        <Badge variant="secondary" className="text-xs bg-video text-white">
                          Host
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {participant.isMuted && (
                        <div className="w-6 h-6 rounded-full bg-destructive/80 flex items-center justify-center">
                          <MicOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {participant.isVideoOff && (
                        <div className="w-6 h-6 rounded-full bg-muted/80 flex items-center justify-center">
                          <VideoOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No active meeting</p>
              <Button onClick={() => setIsNewMeetingOpen(true)} className="bg-video hover:bg-video/90">
                <Plus className="w-4 h-4 mr-2" />
                Create New Meeting
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      {currentMeeting && (
        <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            onClick={() => setIsMuted(!isMuted)}
            className="w-12 h-12 rounded-full p-0"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isVideoOff ? "destructive" : "outline"}
            size="lg"
            onClick={() => setIsVideoOff(!isVideoOff)}
            className="w-12 h-12 rounded-full p-0"
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="lg"
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className="w-12 h-12 rounded-full p-0"
          >
            <ScreenShare className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-12 h-12 rounded-full p-0"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="destructive" 
            size="lg" 
            className="w-12 h-12 rounded-full p-0"
            onClick={handleEndCall}
          >
            <Phone className="w-5 h-5" />
          </Button>
          </div>
        </div>
      )}
    </div>
  );
};