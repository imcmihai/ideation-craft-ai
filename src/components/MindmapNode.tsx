
import { Handle, Position, NodeProps } from "@xyflow/react";
import { memo } from "react";

// Define the interface for our node data
export interface MindmapNodeData {
  title: string;
  details?: string;
  onClick: (nodeId: string) => void;
}

// Create a custom node component for the mindmap
const MindmapNode = ({ id, data, type }: NodeProps<MindmapNodeData>) => {
  // Make sure we handle data safely
  const handleClick = () => {
    if (data && typeof data.onClick === 'function') {
      data.onClick(id);
    }
  };

  return (
    <div 
      className="px-4 py-2 rounded-md min-h-[50px] flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      {type === 'core' && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0"
        />
      )}
      {type !== 'core' && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="opacity-0"
        />
      )}
      {type !== 'core' && type !== 'sub-category' && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0"
        />
      )}
      <div className="font-medium">{data?.title || 'Untitled'}</div>
    </div>
  );
}

// Use a type assertion to make TypeScript happy with the node types
const TypedMindmapNode = MindmapNode as unknown as React.ComponentType;

export default memo(TypedMindmapNode);
