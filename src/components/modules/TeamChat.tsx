import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Search,
  Hash,
  Users,
  Bell,
  Settings,
  Plus,
} from "lucide-react";

interface Message {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  type: "text" | "file" | "system";
}

interface Channel {
  id: string;
  name: string;
  type: "channel" | "dm";
  unread: number;
  users?: number;
}

const channels: Channel[] = [
  { id: "general", name: "general", type: "channel", unread: 0, users: 8 },
  { id: "development", name: "development", type: "channel", unread: 3, users: 4 },
  { id: "design", name: "design", type: "channel", unread: 0, users: 3 },
  { id: "product", name: "product", type: "channel", unread: 1, users: 5 },
];

const directMessages: Channel[] = [
  { id: "alice", name: "Alice Johnson", type: "dm", unread: 2 },
  { id: "bob", name: "Bob Smith", type: "dm", unread: 0 },
  { id: "carol", name: "Carol Davis", type: "dm", unread: 1 },
];


export const TeamChat = () => {
  const [activeChannel, setActiveChannel] = useState("development");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        user: "John Doe (You)",
        avatar: "JD",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "text",
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-chat/5 to-workspace/5">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Team Chat</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-9" />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Channels
              </h3>
              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={activeChannel === channel.id ? "secondary" : "ghost"}
                  onClick={() => setActiveChannel(channel.id)}
                  className="w-full justify-start gap-2 h-8"
                >
                  <Hash className="w-4 h-4" />
                  <span className="flex-1 text-left">{channel.name}</span>
                  {channel.unread > 0 && (
                    <Badge className="bg-chat text-white text-xs min-w-[20px] h-5">
                      {channel.unread}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Direct Messages
              </h3>
              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {directMessages.map((dm) => (
                <Button
                  key={dm.id}
                  variant={activeChannel === dm.id ? "secondary" : "ghost"}
                  onClick={() => setActiveChannel(dm.id)}
                  className="w-full justify-start gap-2 h-8"
                >
                  <div className="w-2 h-2 rounded-full bg-video" />
                  <span className="flex-1 text-left">{dm.name}</span>
                  {dm.unread > 0 && (
                    <Badge className="bg-chat text-white text-xs min-w-[20px] h-5">
                      {dm.unread}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Online Users */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Online — 4
            </h3>
            <div className="space-y-2">
              {["John Doe (You)", "Alice Johnson", "Bob Smith", "Carol Davis"].map((user, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-gradient-primary text-white">
                      {user.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{activeChannel}</h3>
                <p className="text-sm text-muted-foreground">
                  4 members • General development discussions
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Members
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'system' ? 'justify-center' : ''}`}>
              {message.type === 'system' ? (
                <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                  {message.content}
                </div>
              ) : (
                <>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-primary text-white text-sm">
                      {message.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.user}</span>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder={`Message #${activeChannel}`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleSendMessage} className="bg-chat hover:bg-chat/90">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};