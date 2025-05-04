
import { Handle, Position, NodeProps } from "@xyflow/react";
import { memo } from "react";

// Define the interface for our node data
export interface MindmapNodeData extends Record<string, unknown> {
  title: string;
  details?: string;
  onClick: (nodeId: string) => void;
}

// Create a custom node component for the mindmap
function MindmapNode({ id, data, type }: NodeProps<MindmapNodeData>) {
  // Make sure we handle data safely with proper typing
  const handleClick = () => {
    // Use type assertion to safely access the onClick property
    const nodeData = data as MindmapNodeData;
    if (nodeData && typeof nodeData.onClick === 'function') {
      nodeData.onClick(id);
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
      <div className="font-medium">{(data as MindmapNodeData)?.title || 'Untitled'}</div>
    </div>
  );
}

// Use type casting to make TypeScript happy with the component types
export default memo(MindmapNode) as unknown as React.ComponentType;
