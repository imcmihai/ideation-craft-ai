import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Rocket, Sparkles, ClipboardList, Download, FileText, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

// Define type for generated documents (matching Index.tsx)
type GeneratedDoc = {
  id: string;
  title: string;
  content: string | null;
  status: 'pending' | 'generating' | 'completed' | 'error';
};

type InputSidebarProps = {
  onGenerateMindmap: (appIdea: string) => Promise<void>;
  isGenerating: boolean;
  onClear: () => void;
  generatedDocuments: GeneratedDoc[];
  isGeneratingDocs: boolean;
};

export default function InputSidebar({ 
  onGenerateMindmap, 
  isGenerating, 
  onClear,
  generatedDocuments,
  isGeneratingDocs
}: InputSidebarProps) {
  const [appIdea, setAppIdea] = useState("");
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!appIdea.trim()) {
      toast({
        title: "Empty Input",
        description: "Please describe your app idea first.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Generating Mindmap",
      description: "Using AI to create a comprehensive mindmap for your app idea...",
    });
    
    onGenerateMindmap(appIdea);
  };

  // Function to handle download
  const handleDownloadMarkdown = (doc: GeneratedDoc) => {
    if (!doc.content || doc.status !== 'completed') return;
    
    const fileName = `${doc.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    const blob = new Blob([doc.content], { type: 'text/markdown' });
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
    <div className="flex flex-col p-4 h-full border-r">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">IdeationCraft AI</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe your app idea and AI will create a comprehensive mindmap.
        </p>
      </div>
      
      <div className="mb-6">
        <Link to="/questionnaire">
          <Button variant="outline" className="w-full">
            <ClipboardList className="mr-2 h-4 w-4" />
            Use Guided Questionnaire
          </Button>
        </Link>
        <div className="relative my-4">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-card px-2 text-xs text-muted-foreground">OR</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 mb-4">
        <Textarea
          placeholder="Describe your app idea in detail. For example: A mobile app that helps people track their daily water intake and reminds them to stay hydrated throughout the day."
          className="min-h-[200px] text-base"
          value={appIdea}
          onChange={(e) => setAppIdea(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Button 
          onClick={handleGenerate} 
          className="w-full" 
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              Generating AI Mindmap...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Mindmap
            </>
          )}
        </Button>
        
        <Button 
          onClick={onClear} 
          variant="outline" 
          className="w-full" 
          disabled={isGenerating}
        >
          Clear
        </Button>
      </div>

      {/* Section for Generated Documents */}
      {(generatedDocuments.length > 0 || isGeneratingDocs) && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            Generated Documents
          </h3>
          <div className="space-y-2">
            {generatedDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {doc.status === 'generating' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {doc.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                  {doc.status === 'completed' && <FileText className="h-4 w-4 text-green-600" />}
                  {doc.status === 'pending' && <FileText className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm truncate" title={doc.title}>{doc.title}</span>
                </div>
                {doc.status === 'completed' && doc.content && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDownloadMarkdown(doc)}
                    title={`Download ${doc.title}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                 {(doc.status === 'generating' || doc.status === 'pending') && (
                   <span className="text-xs text-muted-foreground italic mr-2">Generating...</span>
                 )}
                 {doc.status === 'error' && (
                   <span className="text-xs text-destructive italic mr-2">Failed</span>
                 )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
