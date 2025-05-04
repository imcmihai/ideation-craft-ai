import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils"; // Utility for conditional classes

export type MindmapNodeData = {
  title: string;
  details?: string;
  onClick?: (nodeId: string) => void;
  isDocumentNode?: boolean;
  documentType?: string | null;
};

// Use NodeProps<MindmapNodeData> for better typing
const MindmapNode = ({ id, data, type }: NodeProps<MindmapNodeData>) => {
  const handleNodeClick = () => {
    if (data.onClick) {
      data.onClick(id);
    }
  };

  // Define base styling
  const baseStyle = "rounded-xl border shadow-lg bg-card text-card-foreground cursor-pointer hover:shadow-xl transition-shadow flex flex-col justify-center items-center relative overflow-hidden";

  // Define type-specific styling using Tailwind classes
  const getNodeStyle = () => {
    switch (type) {
      case 'core':
        return "w-52 h-36 p-4 border-2 border-teal-600 text-lg font-bold bg-gradient-to-br from-teal-50 via-teal-100 to-teal-200 text-teal-800";
      case 'development':
        return "w-44 h-32 p-3 border border-amber-600 text-base font-semibold bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 text-amber-800";
      case 'marketing':
      case 'promotion':
        return "w-40 h-28 p-2 border border-sky-500 text-sm font-medium bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200 text-sky-700";
      case 'research':
      case 'finance':
        return "w-40 h-28 p-2 border border-emerald-500 text-sm font-medium bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 text-emerald-700";
      case 'sub-category':
        return "w-36 h-24 p-2 border border-slate-400 text-xs bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-600 hover:border-slate-500";
      default:
        return "w-40 h-28 p-2 border border-gray-400 bg-white text-sm"; // Fallback
    }
  };

  return (
    <div className={cn(baseStyle, getNodeStyle())} onClick={handleNodeClick}>
      {/* Handles for edge connections - positioned based on type */}
      {/* Target handle (incoming connection point) */}
      {type !== 'core' && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-2 !h-2 !bg-slate-400" // Style the handle
          // isConnectable={false} // Optionally make handles non-interactive for dragging new edges
        />
      )}
      
      {/* Node Content */}
      <div className="text-center font-medium break-words px-1">
        {data.title}
      </div>

      {/* Source handle (outgoing connection point) */}
      {type !== 'sub-category' && (
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
