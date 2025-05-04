
import { Handle, Position, NodeProps } from "@xyflow/react";
import { memo } from "react";

type NodeData = {
  title: string;
  details?: string;
  onClick: (nodeId: string) => void;
};

function MindmapNode({ id, data, type }: NodeProps<NodeData>) {
  return (
    <div 
      className="px-4 py-2 rounded-md min-h-[50px] flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => data.onClick(id)}
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
      <div className="font-medium">{data.title}</div>
    </div>
  );
}

export default memo(MindmapNode);
