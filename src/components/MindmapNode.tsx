import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils"; // Utility for conditional classes
import { useProgressStore, NodeStatus } from "../hooks/use-progress-store"; // Using absolute path

export type MindmapNodeData = {
  title: string;
  details?: string;
  onClick?: (nodeId: string) => void;
  isDocumentNode?: boolean;
  documentType?: string | null;
  guidance?: string;
  cursorPrompt?: string | null;
  stepIndex?: number;
  progressIndex?: number; // Added for progress tracking
  status?: NodeStatus;    // Added for progress tracking
};

// Use NodeProps, and type data explicitly inside
const MindmapNode = ({ id, data, type }: NodeProps) => {
  // Explicitly type data
  const nodeData = data as MindmapNodeData;

  // Use the progress store
  const { getNodeStatus, setNodeStatus, isNextStep } = useProgressStore();
  // id should be correctly inferred now
  const currentStatus = getNodeStatus(id) || 'todo'; 
  // Use typed nodeData
  const isActionable = typeof nodeData.progressIndex === 'number' && nodeData.progressIndex > 0;
  // id should be correctly inferred now
  const isNextActionStep = isActionable && isNextStep(id);

  // Define base styling
  const baseStyle = "rounded-xl border shadow-lg bg-card text-card-foreground cursor-pointer hover:shadow-xl transition-shadow flex flex-col justify-center items-center relative overflow-hidden";

  // Define type-specific styling using Tailwind classes
  const getNodeStyle = () => {
    let baseTypeStyle = "";
    
    switch (type) {
      case 'core':
        baseTypeStyle = "w-52 h-36 p-4 border-2 border-teal-600 text-lg font-bold bg-gradient-to-br from-teal-50 via-teal-100 to-teal-200 text-teal-800";
        break;
      case 'development':
        baseTypeStyle = "w-44 h-32 p-3 border border-amber-600 text-base font-semibold bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 text-amber-800";
        break;
      case 'marketing':
      case 'promotion':
        baseTypeStyle = "w-40 h-28 p-2 border border-sky-500 text-sm font-medium bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200 text-sky-700";
        break;
      case 'research':
      case 'finance':
        baseTypeStyle = "w-40 h-28 p-2 border border-emerald-500 text-sm font-medium bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 text-emerald-700";
        break;
      case 'sub-category':
        baseTypeStyle = "w-36 h-24 p-2 border border-slate-400 text-xs bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-600 hover:border-slate-500";
        break;
      default:
        baseTypeStyle = "w-40 h-28 p-2 border border-gray-400 bg-white text-sm"; // Fallback
    }

    // Apply highlight styling for the next action step
    if (isNextActionStep) {
      return cn(baseTypeStyle, "border-blue-500 shadow-lg shadow-blue-500/50");
    }

    // Apply styling based on status for actionable nodes
    if (isActionable) {
      if (currentStatus === 'done') {
        return cn(baseTypeStyle, "border-green-500");
      } else if (currentStatus === 'inprogress') {
        return cn(baseTypeStyle, "border-yellow-500");
      }
    }

    return baseTypeStyle;
  };

  // Status cycle handler
  const handleStatusChange = () => {
    if (!isActionable) return;
    
    // Cycle through statuses: todo -> inprogress -> done -> todo
    let nextStatus: NodeStatus = 'todo';
    if (currentStatus === 'todo') {
      nextStatus = 'inprogress';
    } else if (currentStatus === 'inprogress') {
      nextStatus = 'done';
    } else {
      nextStatus = 'todo';
    }
    // id should be correctly inferred now
    setNodeStatus(id, nextStatus); 
  };

  return (
    <div className={cn(baseStyle, getNodeStyle())}>
      {/* Handles for edge connections - positioned based on type */}
      {/* Target handle (incoming connection point) */}
      {type !== 'core' && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-2 !h-2 !bg-slate-400" // Style the handle
        />
      )}
      
      {/* Node Content - Use typed nodeData */}
      <div className="text-center font-medium break-words px-1">
        {nodeData.title} 
      </div>

      {/* Status indicator - only for actionable nodes */}
      {isActionable && (
        <div 
          className={cn(
            "absolute top-1 right-1 w-5 h-5 rounded-full cursor-pointer flex items-center justify-center text-white text-xs",
            currentStatus === 'todo' ? "bg-gray-400" : 
            currentStatus === 'inprogress' ? "bg-yellow-500" : 
            "bg-green-500"
          )}
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the node click
            handleStatusChange();
          }}
          title={`Status: ${currentStatus} (click to change)`}
        >
          {currentStatus === 'done' ? "✓" : 
           currentStatus === 'inprogress' ? "●" : "○"}
        </div>
      )}

      {/* Progress index - Use typed nodeData */}
      {isActionable && nodeData.progressIndex && (
        <div className="absolute top-1 left-1 text-xs text-gray-500 opacity-60">
          {nodeData.progressIndex}
        </div>
      )}

      {/* Source handle (outgoing connection point) - Should only be hidden for 'step' nodes */}
      {type !== 'step' && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-2 !h-2 !bg-slate-400" // Style the handle
        />
      )}
    </div>
  );
};

export default memo(MindmapNode);
