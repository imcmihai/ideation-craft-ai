
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Lightbulb, Rocket } from "lucide-react";

type InputSidebarProps = {
  onGenerateMindmap: (appIdea: string) => Promise<void>;
  isGenerating: boolean;
  onClear: () => void;
};

export default function InputSidebar({ 
  onGenerateMindmap, 
  isGenerating, 
  onClear 
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
    
    onGenerateMindmap(appIdea);
  };

  return (
    <div className="flex flex-col p-4 h-full border-r">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">IdeationCraft AI</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe your app idea and I'll create a comprehensive mindmap.
        </p>
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
              Generating...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Generate Mindmap
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
    </div>
  );
}
