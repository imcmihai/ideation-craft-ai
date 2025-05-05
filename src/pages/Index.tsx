import { useState, useCallback, useRef, useEffect } from "react";
import { ReactFlowProvider, Node } from "@xyflow/react";
import { Toaster } from "@/components/ui/toaster";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import InputSidebar from "@/components/InputSidebar";
import MindmapFlow from "@/components/MindmapFlow";
import NodeDetails from "@/components/NodeDetails";
import { generateMindmap, MindmapData, generateDocument } from "@/services/aiService";
import { MindmapNodeData } from "@/components/MindmapNode";

// Define localStorage keys
const LS_APP_IDEA_KEY = 'ideationcraft_appIdea';
const LS_DETAILED_ANSWERS_KEY = 'ideationcraft_detailedAnswers';
const LS_MINDMAP_DATA_KEY = 'ideationcraft_mindmapData';
const LS_GENERATED_DOCS_KEY = 'ideationcraft_generatedDocuments';

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
  
  // --- State Initialization with localStorage Fallback ---
  const [appIdea, setAppIdea] = useState<string>(() => {
    return localStorage.getItem(LS_APP_IDEA_KEY) || "";
  });

  const [detailedAnswers, setDetailedAnswers] = useState<Record<string, string> | null>(() => {
    const saved = localStorage.getItem(LS_DETAILED_ANSWERS_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse detailedAnswers from localStorage", e);
      localStorage.removeItem(LS_DETAILED_ANSWERS_KEY); // Clear invalid data
      return null;
    }
  });
  
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(() => {
    const saved = localStorage.getItem(LS_MINDMAP_DATA_KEY);
    try {
      // Note: onClick handlers are not persisted, but handleNodeClick finds the node in state
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse mindmapData from localStorage", e);
      localStorage.removeItem(LS_MINDMAP_DATA_KEY); // Clear invalid data
      return null;
    }
  });

  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDoc[]>(() => {
    const saved = localStorage.getItem(LS_GENERATED_DOCS_KEY);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse generatedDocuments from localStorage", e);
      localStorage.removeItem(LS_GENERATED_DOCS_KEY); // Clear invalid data
      return [];
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isNodeDetailsOpen, setIsNodeDetailsOpen] = useState(false);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);

  // --- End State Initialization ---

  // Reference to store current mindmap data (still useful for click handler)
  const mindmapRef = useRef<MindmapData | null>(mindmapData); // Initialize ref with loaded data

  // --- useEffect Hooks for Saving to localStorage ---
  useEffect(() => {
    localStorage.setItem(LS_APP_IDEA_KEY, appIdea);
  }, [appIdea]);

  useEffect(() => {
    if (detailedAnswers) {
      localStorage.setItem(LS_DETAILED_ANSWERS_KEY, JSON.stringify(detailedAnswers));
    } else {
      localStorage.removeItem(LS_DETAILED_ANSWERS_KEY);
    }
  }, [detailedAnswers]);

  useEffect(() => {
    if (mindmapData) {
      localStorage.setItem(LS_MINDMAP_DATA_KEY, JSON.stringify(mindmapData));
      mindmapRef.current = mindmapData; // Keep ref updated
    } else {
      localStorage.removeItem(LS_MINDMAP_DATA_KEY);
      mindmapRef.current = null;
    }
  }, [mindmapData]);

  useEffect(() => {
    if (generatedDocuments.length > 0) {
      localStorage.setItem(LS_GENERATED_DOCS_KEY, JSON.stringify(generatedDocuments));
    } else {
      localStorage.removeItem(LS_GENERATED_DOCS_KEY);
    }
  }, [generatedDocuments]);
  // --- End useEffect Hooks ---

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

  // Handler for generating mindmap ONLY
  const handleGenerateMindmap = async (currentAppIdea: string, answers?: Record<string, string>) => {
    setAppIdea(currentAppIdea);
    if (answers) {
      setDetailedAnswers(answers);
    }
    setIsGenerating(true); // Start mindmap generation loading
    setIsGeneratingDocs(false); // Ensure doc generation is reset
    setGeneratedDocuments([]); // Clear previous documents on new mindmap generation
    localStorage.removeItem(LS_GENERATED_DOCS_KEY); // Also clear from storage
    setMindmapData(null);
    mindmapRef.current = null;

    try {
      const onClickNode = (nodeId: string) => {
        const clickedNode = mindmapRef.current?.nodes.find(node => node.id === nodeId);
        if (clickedNode && !clickedNode.data.isDocumentNode) {
          setSelectedNode(clickedNode);
          setIsNodeDetailsOpen(true);
        }
      };

      // Generate Mindmap structure only
      const data = await generateMindmap(currentAppIdea, onClickNode, answers || detailedAnswers);
      setMindmapData(data);
      mindmapRef.current = data;
      // REMOVED: Automatic document generation loop
    } catch (error) {
      console.error("Error generating mindmap:", error);
      toast({
        title: "Mindmap Generation Failed",
        description: (error as Error).message || "Could not generate the initial mindmap structure.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false); // Stop mindmap generation loading
    }
  };

  // NEW Handler for generating all documents MANUALLY
  const handleGenerateAllDocuments = async () => {
    if (!appIdea) {
      toast({ title: "Error", description: "App idea is missing.", variant: "destructive" });
      return;
    }
    if (isGenerating || isGeneratingDocs) return; // Prevent concurrent runs
    
    setIsGeneratingDocs(true);
    setGeneratedDocuments([]); // Clear any previous docs before starting new generation
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

    const finalDocs: GeneratedDoc[] = []; // Use a final array to avoid partial saves if needed
    for (const docType of DOCUMENT_TYPES) {
      // Update status for the specific doc being generated
      setGeneratedDocuments(prev => prev.map(doc => 
        doc.id === docType.id ? { ...doc, status: 'generating', title: `Generating ${docType.name}...` } : doc
      ));
      try {
        toast({
          title: `Generating ${docType.name}`,
          description: `AI is working on the ${docType.name}...`
        });
        const { content, title } = await generateDocument(docType.id, appIdea, detailedAnswers);
        const completedDoc = { id: docType.id, title, content, status: 'completed' as const };
        finalDocs.push(completedDoc);
        // Update state immediately for this completed doc
        setGeneratedDocuments(prev => prev.map(doc => 
          doc.id === docType.id ? completedDoc : doc
        ));
        toast({
          title: `${docType.name} Generated`,
          description: `Successfully generated ${docType.name}.`,
        });
      } catch (docError) {
        console.error(`Error generating ${docType.name}:`, docError);
        const errorDoc = { 
          id: docType.id, 
          title: `${docType.name} - Generation Failed`, 
          content: null, 
          status: 'error' as const 
        };
        finalDocs.push(errorDoc);
        toast({
          title: `Failed to Generate ${docType.name}`,
          description: (docError as Error).message || `An error occurred while generating the ${docType.name}.`,
          variant: "destructive",
        });
        // Update state immediately for this failed doc
         setGeneratedDocuments(prev => prev.map(doc => 
           doc.id === docType.id ? errorDoc : doc
         ));
      }
    }
    // Optional: Final state update if needed, though inline updates are better for UI feedback
    // setGeneratedDocuments(finalDocs);
    
    toast({
      title: "Document Generation Complete",
      description: "All supporting documents have been processed.",
    });
    setIsGeneratingDocs(false); // Stop document generation loading
  };

  // Handle node click for viewing details
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node<MindmapNodeData>) => {
    // Check if the clicked node has details or guidance to show
    if (node && node.data && (node.data.details || node.data.guidance)) { 
      setSelectedNode(node); // Set the full node object
      setIsNodeDetailsOpen(true);
    }
    // Optionally add logic here for nodes that *shouldn't* open the dialog
    // else { console.log("Clicked node type has no details to show:", node.type); }
  }, []); // Removed mindmapData dependency as node is passed directly

  // Handle closing node details
  const handleCloseNodeDetails = () => {
    setIsNodeDetailsOpen(false);
  };

  // Handle clearing the mindmap and documents
  const handleClearMindmap = () => {
    // Clear state
    setAppIdea("");
    setDetailedAnswers(null);
    setMindmapData(null);
    setGeneratedDocuments([]);
    setIsGeneratingDocs(false);
    mindmapRef.current = null;
    
    // Clear localStorage
    localStorage.removeItem(LS_APP_IDEA_KEY);
    localStorage.removeItem(LS_DETAILED_ANSWERS_KEY);
    localStorage.removeItem(LS_MINDMAP_DATA_KEY);
    localStorage.removeItem(LS_GENERATED_DOCS_KEY);
    
    toast({ title: "Cleared", description: "Mindmap and documents cleared." });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col"> {/* Use flex-col */} 
        <InputSidebar 
          onGenerateMindmap={handleGenerateMindmap} 
          isGenerating={isGenerating || isGeneratingDocs} // isGenerating now covers both mindmap and doc generation phases
          onClear={handleClearMindmap}
          // Pass down needed state and the new handler
          appIdea={appIdea} // Pass appIdea to control button state
          generatedDocuments={generatedDocuments}
          isGeneratingDocs={isGeneratingDocs} 
          onGenerateDocuments={handleGenerateAllDocuments} // Pass the new handler
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
