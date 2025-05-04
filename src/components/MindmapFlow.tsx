
import { useCallback, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  NodeTypes as ReactFlowNodeTypes,
} from "@xyflow/react";

// Import the required CSS files
import "@xyflow/react/dist/style.css";
// Use relative path for CSS import
import "../index.css";

import MindmapNode from "./MindmapNode";
import { toast } from "@/components/ui/use-toast";

// Define custom node data interface
interface MindmapNodeData {
  title: string;
  details?: string;
  onClick: (nodeId: string) => void;
}

// Define node types with proper type casting to avoid type errors
const nodeTypes: ReactFlowNodeTypes = {
  core: MindmapNode as any,
  marketing: MindmapNode as any,
  development: MindmapNode as any,
  promotion: MindmapNode as any,
  research: MindmapNode as any,
  finance: MindmapNode as any,
  "sub-category": MindmapNode as any,
};

type MindmapFlowProps = {
  initialNodes: any[];
  initialEdges: any[];
  onNodeClick: (nodeId: string) => void;
};

export default function MindmapFlow({
  initialNodes,
  initialEdges,
  onNodeClick,
}: MindmapFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Handle connecting nodes
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, animated: true }, eds));
  }, [setEdges]);

  // When nodes or edges change, center the view
  useEffect(() => {
    if (isFirstRender && nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2 });
        setIsFirstRender(false);
      }, 100);
    }
  }, [nodes, edges, fitView, isFirstRender]);

  // Function to center the view on button click
  const handleFitView = () => {
    fitView({ padding: 0.2 });
    toast({
      title: "View Reset",
      description: "Mindmap view has been centered",
    });
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      className="mindmap-flow"
      minZoom={0.2}
      maxZoom={1.5}
      defaultEdgeOptions={{ type: "smoothstep" }}
      fitView
    >
      <Background color="#aaa" gap={16} />
      <Controls />
      <Panel position="top-right">
        <button
          className="px-3 py-2 rounded-md bg-white text-sm shadow-md hover:bg-gray-50 transition-colors"
          onClick={handleFitView}
        >
          Center View
        </button>
      </Panel>
    </ReactFlow>
  );
}
