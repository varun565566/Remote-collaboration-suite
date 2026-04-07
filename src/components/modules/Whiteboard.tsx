import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Pencil,
  Square,
  Circle,
  Type,
  Eraser,
  Hand,
  Undo,
  Redo,
  Download,
  Share,
  ZoomIn,
  ZoomOut,
  Users,
  Palette,
} from "lucide-react";

const tools = [
  { id: "select", icon: Hand, label: "Select" },
  { id: "pen", icon: Pencil, label: "Pen" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "text", icon: Type, label: "Text" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
];

const colors = [
  "#000000", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500",
  "#800080", "#FFC0CB", "#A52A2A", "#808080"
];

export const Whiteboard = () => {
  const [activeTool, setActiveTool] = useState("pen");
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const collaborators = [
    { name: "Alice Johnson", color: "#FF0000", initials: "AJ", active: true },
    { name: "Bob Smith", color: "#00FF00", initials: "BS", active: true },
    { name: "Carol Davis", color: "#0000FF", initials: "CD", active: false },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Fill with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    saveToHistory();
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    if (activeTool === "pen" || activeTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (activeTool === "pen") {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === "eraser") {
      ctx.strokeStyle = "white";
      ctx.lineWidth = brushSize * 3;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === "rectangle" || activeTool === "circle") {
      // Clear and redraw for live preview
      if (history[historyStep]) {
        ctx.putImageData(history[historyStep], 0, 0);
      }
      
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      
      if (activeTool === "rectangle") {
        const width = x - startPos.x;
        const height = y - startPos.y;
        ctx.strokeRect(startPos.x, startPos.y, width, height);
      } else if (activeTool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (activeTool === "text") {
      // Text tool handled on mouse up
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setMousePos({ x, y });
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = ctxRef.current;
      
      if (activeTool === "text" && startPos && ctx) {
        const text = prompt("Enter text:");
        if (text) {
          ctx.font = `${brushSize * 10}px Arial`;
          ctx.fillStyle = activeColor;
          ctx.fillText(text, startPos.x, startPos.y);
        }
      }
      
      setIsDrawing(false);
      setStartPos(null);
      saveToHistory();
    }
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const ctx = ctxRef.current;
      if (ctx && history[newStep]) {
        ctx.putImageData(history[newStep], 0, 0);
      }
      toast.success("Undo");
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      const ctx = ctxRef.current;
      if (ctx && history[newStep]) {
        ctx.putImageData(history[newStep], 0, 0);
      }
      toast.success("Redo");
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
    toast.success("Whiteboard exported!");
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-whiteboard/5 to-workspace/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Product Wireframes Brainstorm</h2>
            <p className="text-sm text-muted-foreground">
              Created by John Doe • Last edited 3 minutes ago
            </p>
          </div>
          <Badge className="bg-whiteboard text-white">
            <Users className="w-3 h-3 mr-1" />
            3 active
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-64 border-r border-border bg-card p-4 space-y-6">
          {/* Tools */}
          <div>
            <h3 className="font-medium mb-3">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTool(tool.id)}
                  className="flex flex-col gap-1 h-16"
                >
                  <tool.icon className="w-4 h-4" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Colors */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colors
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    activeColor === color ? "border-primary scale-110" : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Brush Size */}
          <div>
            <h3 className="font-medium mb-3">Brush Size</h3>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground text-center">
                {brushSize}px
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleUndo}
              disabled={historyStep <= 0}
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
            >
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
          </div>

          <Separator />

          {/* Collaborators */}
          <div>
            <h3 className="font-medium mb-3">Active Users</h3>
            <div className="space-y-2">
              {collaborators.map((user, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback 
                      className="text-xs text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium flex-1">{user.name}</span>
                  {user.active && (
                    <div className="w-2 h-2 rounded-full bg-video animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-auto">
          {/* Canvas Controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-sm">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-sm">
              100%
            </Button>
            <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-sm">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Canvas */}
          <div className="w-full h-full flex items-center justify-center p-8">
            <Card className="shadow-custom-lg border-2 border-whiteboard/30">
              <CardContent className="p-0">
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={800}
                  className="bg-white"
                  style={{ 
                    maxWidth: "100%", 
                    maxHeight: "100%",
                    cursor: activeTool === 'pen' ? 'crosshair' : 
                            activeTool === 'eraser' ? 'cell' : 
                            activeTool === 'text' ? 'text' : 'default'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={handleMouseMove}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                {/* Brush Size Indicator */}
                {mousePos && (activeTool === 'pen' || activeTool === 'eraser') && (
                  <div
                    className="absolute pointer-events-none border-2 border-gray-400 rounded-full"
                    style={{
                      left: `${(mousePos.x / 1200) * 100}%`,
                      top: `${(mousePos.y / 800) * 100}%`,
                      width: `${activeTool === 'eraser' ? brushSize * 3 : brushSize}px`,
                      height: `${activeTool === 'eraser' ? brushSize * 3 : brushSize}px`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: activeTool === 'eraser' ? 'rgba(255,255,255,0.3)' : 'transparent'
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Cursors (simulated) */}
          <div className="absolute top-32 left-32 pointer-events-none">
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rotate-45"
                style={{ backgroundColor: "#FF0000" }}
              />
              <Badge className="bg-black text-white text-xs">Alice</Badge>
            </div>
          </div>
          
          <div className="absolute top-48 left-64 pointer-events-none">
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rotate-45"
                style={{ backgroundColor: "#00FF00" }}
              />
              <Badge className="bg-black text-white text-xs">Bob</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};