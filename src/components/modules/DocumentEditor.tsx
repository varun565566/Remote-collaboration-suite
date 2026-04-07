import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Save,
  Share,
  Users,
  MessageSquare,
  Plus,
  X,
  Trash2,
  Edit,
  FileText,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  content: string;
}

export const DocumentEditor = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");

  const activeDoc = documents.find(doc => doc.id === activeDocId);

  const handleCreateDocument = () => {
    if (!newDocTitle.trim()) {
      toast.error("Please enter a document title");
      return;
    }
    const newDoc: Document = {
      id: Date.now().toString(),
      title: newDocTitle,
      content: "",
    };
    setDocuments([...documents, newDoc]);
    setActiveDocId(newDoc.id);
    setNewDocTitle("");
    setIsNewDocOpen(false);
    toast.success("Document created!");
  };

  const handleUpdateContent = (content: string) => {
    if (!activeDocId) return;
    setDocuments(docs => docs.map(doc => 
      doc.id === activeDocId ? { ...doc, content } : doc
    ));
  };

  const handleCloseDoc = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocuments(docs => docs.filter(doc => doc.id !== docId));
    if (activeDocId === docId) {
      setActiveDocId(documents.length > 1 ? documents[0].id : null);
    }
    toast.success("Document deleted!");
  };

  const handleEditTitle = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    
    const newTitle = prompt("Enter new title:", doc.title);
    if (newTitle && newTitle.trim()) {
      setDocuments(docs => docs.map(d => 
        d.id === docId ? { ...d, title: newTitle } : d
      ));
      toast.success("Document title updated!");
    }
  };

  const handleSave = () => {
    toast.success("Document saved successfully!");
  };

  const handleShare = () => {
    toast.success("Share link copied to clipboard!");
  };

  return (
    <div className="flex h-full">
      {/* Document List Sidebar */}
      <div className="w-64 border-r border-border bg-card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </h3>
          <Dialog open={isNewDocOpen} onOpenChange={setIsNewDocOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0 bg-docs hover:bg-docs/90">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-title">Document Title</Label>
                  <Input
                    id="doc-title"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Enter document title"
                  />
                </div>
                <Button onClick={handleCreateDocument} className="w-full">
                  Create Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Separator className="mb-4" />
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents yet</p>
              <Button 
                variant="link" 
                className="text-xs mt-2" 
                onClick={() => setIsNewDocOpen(true)}
              >
                Create your first document
              </Button>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-3 rounded-lg cursor-pointer transition-all group ${
                  activeDocId === doc.id 
                    ? 'bg-docs/10 border border-docs/30' 
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
                onClick={() => setActiveDocId(doc.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.content.length > 0 ? `${doc.content.length} characters` : 'Empty document'}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleEditTitle(doc.id, e)}
                    >
                      <Edit className="w-3 h-3 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleCloseDoc(doc.id, e)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Documents</h2>
              <Dialog open={isNewDocOpen} onOpenChange={setIsNewDocOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-docs hover:bg-docs/90">
                    <Plus className="w-4 h-4 mr-2" />
                    New Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="doc-title">Document Title</Label>
                      <Input
                        id="doc-title"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        placeholder="Enter document title"
                      />
                    </div>
                    <Button onClick={handleCreateDocument} className="w-full">
                      Create Document
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {activeDoc && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comments
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button size="sm" className="bg-docs hover:bg-docs/90" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* Document Tabs */}
          {documents.length > 0 && (
            <Tabs value={activeDocId || ""} onValueChange={setActiveDocId} className="mb-4">
              <TabsList className="h-auto p-1 bg-muted/50">
                {documents.map((doc) => (
                  <TabsTrigger 
                    key={doc.id} 
                    value={doc.id}
                    className="relative pr-8 data-[state=active]:bg-background"
                  >
                    {doc.title}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 p-0 hover:bg-destructive/20"
                      onClick={(e) => handleCloseDoc(doc.id, e)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* Formatting Toolbar */}
          {activeDoc && (
            <div className="flex items-center gap-1">
            <div className="flex gap-1 mr-2">
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <Bold className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <Italic className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <Underline className="w-4 h-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6 mx-2" />
            
            <div className="flex gap-1 mr-2">
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6 mx-2" />
            
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <List className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <ListOrdered className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <Link className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <Image className="w-4 h-4" />
              </Button>
            </div>
            </div>
          )}
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-8 bg-background overflow-auto">
          {activeDoc ? (
            <Card className="max-w-4xl mx-auto shadow-custom-md">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">{activeDoc.title}</h2>
                <textarea
                  value={activeDoc.content}
                  onChange={(e) => handleUpdateContent(e.target.value)}
                  className="w-full h-96 resize-none border-none outline-none bg-transparent text-foreground leading-relaxed"
                  style={{ fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: '1.6' }}
                  placeholder="Start typing your document..."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No document selected</p>
                <Button onClick={() => setIsNewDocOpen(true)} className="bg-docs hover:bg-docs/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Document
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};