import { useState, useCallback, useRef, useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Toaster } from "@/components/ui/toaster";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import InputSidebar from "@/components/InputSidebar";
import MindmapFlow from "@/components/MindmapFlow";
import NodeDetails from "@/components/NodeDetails";
import { generateMindmap, MindmapData, generateDocument } from "@/services/aiService";

// Define type for generated documents
type GeneratedDoc = {
  id: string; // e.g., 'prd', 'techspec'
  title: string;
  content: string | null; // Store content here
  status: 'pending' | 'generating' | 'completed' | 'error';
};

const DOCUMENT_TYPES = [
  { id: "prd", name: "PRD" },
  { id: "techspec", name: "Technical Spec" },
  { id: "userflows", name: "User Flows" },
  { id: "roadmap", name: "Implementation Roadmap" },
];

export default function Index() {
  const location = useLocation();
  const { toast } = useToast();
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isNodeDetailsOpen, setIsNodeDetailsOpen] = useState(false);
  const [appIdea, setAppIdea] = useState<string>("");
  const [detailedAnswers, setDetailedAnswers] = useState<Record<string, string> | null>(null);
  
  // State for generated documents
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDoc[]>([]);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);

  // Reference to store current mindmap data
  const mindmapRef = useRef<MindmapData | null>(null);

  // Handle processing app description from questionnaire when the page loads
  useEffect(() => {
    // Check if we have app description from the questionnaire
    if (location.state?.appDescription) {
      const appDescription = location.state.appDescription;
      const answers = location.state.detailedAnswers;
      
      // Store the app idea and detailed answers
      setAppIdea(appDescription);
      if (answers) {
        setDetailedAnswers(answers);
      }
      
      // Auto-generate mindmap from the questionnaire data
      handleGenerateMindmap(appDescription, answers);
      // Clear the state so it doesn't trigger again on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handler for generating mindmap
  const handleGenerateMindmap = async (currentAppIdea: string, answers?: Record<string, string>) => {
    setAppIdea(currentAppIdea);
    if (answers) {
      setDetailedAnswers(answers);
    }
    setIsGenerating(true);
    setIsGeneratingDocs(false);
    setGeneratedDocuments([]);
    setMindmapData(null);
    mindmapRef.current = null;

    try {
      // Callback to handle node clicks (for regular nodes)
      const onClickNode = (nodeId: string) => {
        const clickedNode = mindmapRef.current?.nodes.find(node => node.id === nodeId);
        if (clickedNode && !clickedNode.data.isDocumentNode) {
          setSelectedNode(clickedNode);
          setIsNodeDetailsOpen(true);
        }
      };

      // Generate Mindmap structure first (pass false for includeDocumentNodes)
      const data = await generateMindmap(currentAppIdea, onClickNode, answers || detailedAnswers); 
      setMindmapData(data);
      mindmapRef.current = data;
      setIsGenerating(false);

      // Now generate documents
      setIsGeneratingDocs(true); 
      toast({
        title: "Generating Supporting Documents",
        description: "AI is now creating detailed documents (PRD, Tech Spec, etc.)...",
      });

      const initialDocs: GeneratedDoc[] = DOCUMENT_TYPES.map(doc => ({
        id: doc.id,
        title: `Generating ${doc.name}...`,
        content: null,
        status: 'pending',
      }));
      setGeneratedDocuments(initialDocs);

      const generatedDocs: GeneratedDoc[] = [];
      for (const docType of DOCUMENT_TYPES) {
        setGeneratedDocuments(prev => prev.map(doc => 
          doc.id === docType.id ? { ...doc, status: 'generating' } : doc
        ));
        try {
          toast({
            title: `Generating ${docType.name}`,
            description: `AI is working on the ${docType.name}...`
          });
          const { content, title } = await generateDocument(docType.id, currentAppIdea, answers || detailedAnswers);
          generatedDocs.push({ id: docType.id, title, content, status: 'completed' });
          setGeneratedDocuments(prev => prev.map(doc => 
            doc.id === docType.id ? { id: docType.id, title, content, status: 'completed' } : doc
          ));
          toast({
            title: `${docType.name} Generated`,
            description: `Successfully generated ${docType.name}.`,
          });
        } catch (docError) {
          console.error(`Error generating ${docType.name}:`, docError);
          toast({
            title: `Failed to Generate ${docType.name}`,
            description: `An error occurred while generating the ${docType.name}.`,
            variant: "destructive",
          });
           generatedDocs.push({ id: docType.id, title: `${docType.name} Generation Failed`, content: null, status: 'error' });
          setGeneratedDocuments(prev => prev.map(doc => 
            doc.id === docType.id ? { ...doc, title: `${docType.name} Generation Failed`, status: 'error' } : doc
          ));
        }
      }
      
      toast({
        title: "Document Generation Complete",
        description: "All supporting documents have been processed.",
      });

    } catch (error) {
      console.error("Error generating mindmap:", error);
      toast({
        title: "Mindmap Generation Failed",
        description: "Could not generate the initial mindmap structure.",
        variant: "destructive",
      });
      setIsGenerating(false);
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  // Handle node click for viewing details
  const handleNodeClick = useCallback((nodeId: string) => {
    // Find the node by ID
    const node = mindmapData?.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setIsNodeDetailsOpen(true);
    }
  }, [mindmapData]);

  // Handle closing node details
  const handleCloseNodeDetails = () => {
    setIsNodeDetailsOpen(false);
  };

  // Handle clearing the mindmap
  const handleClearMindmap = () => {
    setMindmapData(null);
    mindmapRef.current = null;
    setGeneratedDocuments([]);
    setIsGeneratingDocs(false);
    setAppIdea("");
    setDetailedAnswers(null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card">
        <InputSidebar 
          onGenerateMindmap={handleGenerateMindmap} 
          isGenerating={isGenerating || isGeneratingDocs}
          onClear={handleClearMindmap}
          generatedDocuments={generatedDocuments}
          isGeneratingDocs={isGeneratingDocs}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 bg-gradient-radial from-background to-muted/30">
        <ReactFlowProvider>
          {mindmapData ? (
            <MindmapFlow 
              initialNodes={mindmapData.nodes} 
              initialEdges={mindmapData.edges} 
              onNodeClick={handleNodeClick}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="animate-pulse-soft text-primary font-medium">
                    Generating your mindmap...
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-2">AI App Ideation</h2>
                  <p className="text-muted-foreground max-w-md">
                    Describe your app idea in the sidebar, and I'll generate a comprehensive mindmap covering development, marketing, research, promotion, and finance aspects.
                  </p>
                </>
              )}
            </div>
          )}
        </ReactFlowProvider>
      </div>
      
      {/* Node Details Dialog */}
      <NodeDetails 
        isOpen={isNodeDetailsOpen} 
        onClose={handleCloseNodeDetails}
        node={selectedNode}
      />
      
      <Toaster />
    </div>
  );
}
