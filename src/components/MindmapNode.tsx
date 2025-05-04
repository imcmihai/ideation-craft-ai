
import { Handle, Position, NodeProps } from "@xyflow/react";
import { memo } from "react";

// Define a properly typed interface for node data that can be used with React Flow
interface NodeData {
  title: string;
  details?: string;
  onClick: (nodeId: string) => void;
}

function MindmapNode({ id, data, type }: NodeProps<NodeData>) {
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

export default memo(MindmapNode);
