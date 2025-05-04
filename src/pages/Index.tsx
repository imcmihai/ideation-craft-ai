
import { useState, useCallback, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Toaster } from "@/components/ui/toaster";

import InputSidebar from "@/components/InputSidebar";
import MindmapFlow from "@/components/MindmapFlow";
import NodeDetails from "@/components/NodeDetails";
import { generateMindmap, MindmapData } from "@/services/aiService";

export default function Index() {
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isNodeDetailsOpen, setIsNodeDetailsOpen] = useState(false);

  // Handler for generating mindmap
  const handleGenerateMindmap = async (appIdea: string) => {
    try {
      setIsGenerating(true);
      
      // Callback to handle node clicks
      const onClickNode = (nodeId: string) => {
        // Find the node by ID
        const clickedNode = mindmapRef.current?.nodes.find(node => node.id === nodeId);
        if (clickedNode) {
          setSelectedNode(clickedNode);
          setIsNodeDetailsOpen(true);
        }
      };
      
      const data = await generateMindmap(appIdea, onClickNode);
      setMindmapData(data);
      mindmapRef.current = data;
    } catch (error) {
      console.error("Error generating mindmap:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reference to store current mindmap data
  const mindmapRef = useRef<MindmapData | null>(null);

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
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card">
        <InputSidebar 
          onGenerateMindmap={handleGenerateMindmap} 
          isGenerating={isGenerating}
          onClear={handleClearMindmap}
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
