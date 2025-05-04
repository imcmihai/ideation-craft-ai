
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, FileText } from "lucide-react";
import { generateDocument } from "@/services/aiService";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

type NodeDetailsProps = {
  isOpen: boolean;
  onClose: () => void;
  node: {
    id: string;
    data: {
      title: string;
      details: string;
      isDocumentNode?: boolean;
      documentType?: string;
    };
    type: string;
  } | null;
  appIdea?: string;
  detailedAnswers?: Record<string, string>;
};

export default function NodeDetails({ 
  isOpen, 
  onClose, 
  node, 
  appIdea,
  detailedAnswers 
}: NodeDetailsProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  
  if (!node) return null;

  const getTypeColor = () => {
    switch (node.type) {
      case 'core':
        return 'text-mindmap-primary';
      case 'marketing':
        return 'text-mindmap-marketing';
      case 'development':
        return 'text-mindmap-development';
      case 'promotion':
        return 'text-mindmap-promotion';
      case 'research':
        return 'text-mindmap-research';
      case 'finance':
        return 'text-mindmap-finance';
      default:
        return 'text-primary';
    }
  };
  
  const isDocumentNode = node.data.isDocumentNode || false;
  const documentType = node.data.documentType || null;
  
  const handleGenerateDocument = async () => {
    if (!documentType || !appIdea) return;
    
    try {
      setIsGenerating(true);
      setGeneratedContent(null);
      
      toast({
        title: "Generating document",
        description: `Creating ${documentType.toUpperCase()} for your app idea...`,
      });
      
      const { content, title } = await generateDocument(documentType, appIdea, detailedAnswers);
      
      setGeneratedContent(content);
      setDocumentTitle(title);
      
      toast({
        title: "Document generated",
        description: "Your document has been successfully generated.",
      });
    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownloadMarkdown = () => {
    if (!generatedContent) return;
    
    const fileName = documentTitle 
      ? `${documentTitle.replace(/\s+/g, '-').toLowerCase()}.md` 
      : `${node.data.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    
    const blob = new Blob([generatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: `Downloading ${fileName}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`text-xl font-semibold ${getTypeColor()}`}>
            {node.data.title}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-4">
          {isDocumentNode && !generatedContent ? (
            <div className="space-y-4">
              <DialogDescription className="text-foreground whitespace-pre-line">
                {node.data.details}
              </DialogDescription>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleGenerateDocument} 
                  disabled={isGenerating} 
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Document'}
                </Button>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
              <p className="mt-4 text-center">Generating document with AI...</p>
              <p className="text-sm text-muted-foreground text-center">This may take 15-30 seconds depending on document complexity.</p>
            </div>
          ) : generatedContent ? (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>
                  {generatedContent}
                </ReactMarkdown>
              </div>
              
              <div className="flex justify-end space-x-2 border-t pt-4">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button 
                  onClick={handleDownloadMarkdown} 
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Markdown
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <DialogDescription className="text-foreground whitespace-pre-line">
                {node.data.details}
              </DialogDescription>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
