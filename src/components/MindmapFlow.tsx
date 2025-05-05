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
  Edge,
  Position,
  NodeTypes,
} from "@xyflow/react";
import dagre from 'dagre';

// Import the required CSS files
import "@xyflow/react/dist/style.css";
// Use relative path for CSS import
import "../index.css";

import MindmapNode, { MindmapNodeData } from "./MindmapNode";
import { toast } from "@/components/ui/use-toast";
import { useProgressStore } from "@/hooks/use-progress-store";
import { ProgressTracker } from "./ProgressTracker";

// Define node types (should match backend types + node components)
const nodeTypes: NodeTypes = {
  core: MindmapNode as any,
  category: MindmapNode as any,
  marketing: MindmapNode as any,
  development: MindmapNode as any,
  promotion: MindmapNode as any,
  research: MindmapNode as any,
  finance: MindmapNode as any,
  "sub-category": MindmapNode as any,
  "sub-sub-category": MindmapNode as any,
  step: MindmapNode as any,
};

// --- Dagre Layout Function for Subgraphs ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Function to calculate layout for a SUBGRAPH using Dagre
const getSubtreeLayout = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  if (!nodes || nodes.length === 0) return { nodes, edges };

  const subGraph = new dagre.graphlib.Graph();
  subGraph.setDefaultEdgeLabel(() => ({}));
  subGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70 }); // Smaller spacing for subtrees

  nodes.forEach((node) => {
    // Use estimated dimensions (same as before, maybe smaller?)
    let nodeWidth = 150;
    let nodeHeight = 80;
     if (node.type === 'sub-category') { nodeWidth=144; nodeHeight=96; }
     else if (node.type === 'sub-sub-category') { nodeWidth=128; nodeHeight=80; }
     else if (node.type === 'step') { nodeWidth=112; nodeHeight=64; }
    subGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    // Ensure both source and target nodes exist in this subgraph's node list
    if (nodes.find(n => n.id === edge.source) && nodes.find(n => n.id === edge.target)) {
        subGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(subGraph);

  const isHorizontal = direction === 'LR' || direction === 'RL';
  nodes.forEach((node) => {
    const nodeWithPosition = subGraph.node(node.id);
    if (nodeWithPosition) { // Check if node was found and layouted
      node.targetPosition = isHorizontal ? Position.Left : Position.Top;
      node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
      // Position relative to the subgraph's layout
      node.position = {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      };
    } else {
        // Fallback position if something went wrong
        console.warn(`Node ${node.id} not found in Dagre layout result.`);
        node.position = { x: Math.random() * 100, y: Math.random() * 100 };
    }
  });

  return { nodes, edges };
};
// --- End Dagre Subgraph Layout Function ---

type MindmapFlowProps = {
  initialNodes: Node<MindmapNodeData>[];
  initialEdges: Edge[];
  onNodeClick: (event: React.MouseEvent, node: Node<MindmapNodeData>) => void;
};

// --- Main Component ---
export default function MindmapFlow({
  initialNodes,
  initialEdges,
  onNodeClick,
}: MindmapFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const initializeProgress = useProgressStore(state => state.initializeProgress);

  // --- Custom Layout Effect ---
  useEffect(() => {
    if (!initialNodes || initialNodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
    };

    // Deep copy to avoid mutating props
    const nodesToLayout = JSON.parse(JSON.stringify(initialNodes)) as Node[];
    const edgesToLayout = JSON.parse(JSON.stringify(initialEdges)) as Edge[];

    const finalNodes: Node[] = [];
    const finalEdges: Edge[] = edgesToLayout; // Edges remain the same structure

    const coreNode = nodesToLayout.find(n => n.type === 'core');
    if (!coreNode) return; // Cannot layout without core

    // 1. Position Core Node
    coreNode.position = { x: 0, y: 0 };
    finalNodes.push(coreNode);

    // 2. Position Category Nodes (Circularly)
    const categoryNodes = nodesToLayout.filter(n => n.parentId === coreNode.id);
    const numCategories = categoryNodes.length;
    const radius = 350; // Adjust radius as needed
    const angleStep = (2 * Math.PI) / numCategories;

    categoryNodes.forEach((categoryNode, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top (-PI/2)
      categoryNode.position = {
        x: coreNode.position.x + radius * Math.cos(angle),
        y: coreNode.position.y + radius * Math.sin(angle),
      };
      // Set handle positions based on angle for better edge appearance
      // Very simplified: Top/Bottom half targets Top/Bottom, Left/Right half targets Left/Right
      const targetPos = Math.abs(Math.cos(angle)) < 0.5 ? (Math.sin(angle) > 0 ? Position.Top : Position.Bottom) : (Math.cos(angle) > 0 ? Position.Left : Position.Right);
      categoryNode.targetPosition = targetPos; // Connect to appropriate side of category node
      // Source position could also be adjusted, but Right/Left might be fine for outward expansion
      categoryNode.sourcePosition = Position.Right; // Default, might adjust later

      finalNodes.push(categoryNode);

      // 3. Layout Subtrees with Dagre
      const subtreeNodes: Node[] = [];
      const subtreeNodeIds = new Set<string>();
      const queue = [categoryNode.id];
      subtreeNodeIds.add(categoryNode.id); // Add category itself to ID set temporarily

      // Find all descendants using BFS
      while(queue.length > 0) {
          const currentId = queue.shift()!;
          const children = nodesToLayout.filter(n => n.parentId === currentId);
          children.forEach(child => {
              if (!subtreeNodeIds.has(child.id)) {
                 subtreeNodes.push(child);
                 subtreeNodeIds.add(child.id);
                 queue.push(child.id);
              }
          });
      }
      subtreeNodeIds.delete(categoryNode.id); // Remove category from ID set

      // Get edges relevant to this subtree (within descendants)
      const subtreeEdges = edgesToLayout.filter(e => subtreeNodeIds.has(e.source) && subtreeNodeIds.has(e.target));

      if (subtreeNodes.length > 0) {
        // Determine layout direction based on angle (simple example)
        // This could be more sophisticated (e.g., LR/RL for sides, TB/BT for top/bottom)
        const layoutDirection = 'LR'; // Keep it simple for now

        const { nodes: layoutedSubtreeNodes } = getSubtreeLayout(
          [categoryNode, ...subtreeNodes], // Include category temporarily for root relative layout
          [...edgesToLayout.filter(e => e.source === categoryNode.id && subtreeNodeIds.has(e.target)), ...subtreeEdges], // Edges from category + internal edges
          layoutDirection
        );

        // Offset the layouted positions relative to the category node's final position
        const categoryLayoutInfo = layoutedSubtreeNodes.find(n => n.id === categoryNode.id);
        const offsetX = categoryNode.position.x - (categoryLayoutInfo?.position?.x || 0);
        const offsetY = categoryNode.position.y - (categoryLayoutInfo?.position?.y || 0);

        layoutedSubtreeNodes.forEach(node => {
            if (node.id !== categoryNode.id) { // Don't re-add the category node
               node.position.x += offsetX;
               node.position.y += offsetY;
               finalNodes.push(node);
            }
        });
      }
    }); // End forEach categoryNode

    setNodes(finalNodes);
    setEdges(finalEdges);
    
    // Initialize progress tracking with the nodes
    initializeProgress(finalNodes);
    
    // Fit view after the nodes are positioned
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [initialNodes, initialEdges, fitView, initializeProgress]);

  // Handle connecting nodes (manual connection, if enabled)
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: false, style: { strokeWidth: 2, stroke: '#94a3b8' } }, eds));
  }, [setEdges]);

  // Function to re-run layout and fit view
   const handleLayout = useCallback(() => {
     // Re-running the effect logic is the easiest way if initialNodes/Edges haven't changed
     // Or manually trigger a state update that causes the effect to re-run
     // For simplicity, just re-apply fitView or add a dummy state update
     fitView({ padding: 0.1, duration: 300 });
     toast({
       title: "View Centered",
       description: "Mindmap view has been centered.",
     });
     // Note: A true 'recalculate' would involve re-running the complex effect logic above
   }, [fitView]); // Dependencies might need adjustment if full recalc is needed

  // Define the handler for React Flow's onNodeClick
  const handleNodeClickInternal = useCallback((event: React.MouseEvent, node: Node<MindmapNodeData>) => {
    // Call the handler passed down from Index.tsx
    if (onNodeClick) {
      onNodeClick(event, node);
    }
  }, [onNodeClick]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClickInternal} // Use React Flow's prop
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: "smoothstep", // Or 'bezier' might look good with circular layout
          animated: false,
          style: {
            strokeWidth: 2,
            stroke: '#94a3b8',
          },
        }}
        connectionLineStyle={{ stroke: '#1e293b', strokeWidth: 2 }}
        className="mindmap-flow"
        minZoom={0.1}
        maxZoom={1.5}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background color="#f0f0f0" gap={12} size={1} />
        <Controls />
        <ProgressTracker />
        <Panel position="top-right">
          <button
            className="px-3 py-2 rounded-md bg-white text-sm shadow-md hover:bg-gray-50 transition-colors"
            onClick={handleLayout} // Button now just recenters
          >
            Center View
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
