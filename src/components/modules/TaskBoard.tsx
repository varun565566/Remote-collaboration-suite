import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  Users,
  Calendar,
  MessageSquare,
  Paperclip,
  Flag,
  Edit,
  Trash2,
  Check,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  comments: number;
  attachments: number;
  labels: string[];
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

const initialColumns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    color: "muted",
    tasks: [
      {
        id: "1",
        title: "Welcome Task - Explore the Platform",
        description: "Click around to explore all features of the collaboration suite",
        assignee: "JD",
        priority: "low",
        dueDate: new Date().toISOString().split('T')[0],
        comments: 0,
        attachments: 0,
        labels: ["getting-started"]
      }
    ],
  },
  {
    id: "inprogress",
    title: "In Progress",
    color: "docs",
    tasks: [],
  },
  {
    id: "review",
    title: "Review",
    color: "warning",
    tasks: [],
  },
  {
    id: "done",
    title: "Done",
    color: "video",
    tasks: [],
  },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "destructive";
    case "medium": return "warning";
    case "low": return "video";
    default: return "secondary";
  }
};

export const TaskBoard = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    assignee: "JD",
    columnId: "todo"
  });

  const handleCreateTask = () => {
    console.log('Creating task...', newTask);
    
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (editingTask) {
      // Update existing task
      setColumns(columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task => 
          task.id === editingTask.id 
            ? { ...task, title: newTask.title, description: newTask.description, priority: newTask.priority }
            : task
        )
      })));
      toast.success("Task updated successfully!");
    } else {
      // Create new task
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        assignee: newTask.assignee,
        priority: newTask.priority,
        dueDate: new Date().toISOString().split('T')[0],
        comments: 0,
        attachments: 0,
        labels: []
      };

      console.log('New task:', task);
      console.log('Column ID:', newTask.columnId);

      setColumns(columns.map(col => 
        col.id === newTask.columnId 
          ? { ...col, tasks: [...col.tasks, task] }
          : col
      ));
      toast.success("Task created successfully!");
    }

    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      assignee: "JD",
      columnId: "todo"
    });
    setEditingTask(null);
    setIsDialogOpen(false);
    console.log('Dialog should be closed now');
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignee: task.assignee,
      columnId: columns.find(col => col.tasks.some(t => t.id === task.id))?.id || "todo"
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(task => task.id !== taskId)
    })));
    toast.success("Task deleted successfully!");
  };

  const handleMoveTaskToDone = (taskId: string) => {
    const task = columns.flatMap(col => col.tasks).find(t => t.id === taskId);
    if (!task) return;

    setColumns(columns.map(col => {
      // Remove from current column
      const filteredTasks = col.tasks.filter(t => t.id !== taskId);
      
      // Add to done column
      if (col.id === "done") {
        return { ...col, tasks: [...col.tasks, task] };
      }
      
      return { ...col, tasks: filteredTasks };
    }));
    toast.success("Task moved to Done!");
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-tasks/5 to-workspace/5">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Product Development Sprint</h2>
            <p className="text-muted-foreground">
              Sprint 3 • Jan 8 - Jan 22, 2024 • 12 tasks
            </p>
          </div>
          <Badge className="bg-tasks text-white">
            <Calendar className="w-3 h-3 mr-1" />
            14 days left
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Team (4)
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-tasks hover:bg-tasks/90">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Enter task description"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: "low" | "medium" | "high") => 
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="column">Column</Label>
                  <Select
                    value={newTask.columnId}
                    onValueChange={(value) => setNewTask({ ...newTask, columnId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateTask} className="w-full">
                  {editingTask ? "Update Task" : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="w-80 flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${column.color}`} />
                  <h3 className="font-semibold">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {column.tasks.length}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {column.tasks.map((task) => (
                  <Card key={task.id} className="shadow-custom-sm hover:shadow-custom-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight flex-1">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs bg-${getPriorityColor(task.priority)}/10 text-${getPriorityColor(task.priority)}`}
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              {task.priority}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMoveTaskToDone(task.id)}>
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark as Done
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Task Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {task.description}
                        </p>

                        {/* Labels */}
                        <div className="flex flex-wrap gap-1">
                          {task.labels.map((label) => (
                            <Badge key={label} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>

                        {/* Task Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments}
                            </div>
                            {task.attachments > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Paperclip className="w-3 h-3" />
                                {task.attachments}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {task.dueDate}
                            </div>
                          </div>
                          
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-gradient-primary text-white">
                              {task.assignee}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Add Task Button */}
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add new task
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};