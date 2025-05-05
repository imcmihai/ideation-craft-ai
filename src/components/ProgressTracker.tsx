import React from 'react';
import { useProgressStore } from '../hooks/use-progress-store';
import { useReactFlow } from '@xyflow/react';
import { Tooltip } from './Tooltip';

// Simple className utility function if utils.ts doesn't exist
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const ProgressTracker: React.FC = () => {
  const { highestCompletedIndex, totalSteps, actionableNodes } = useProgressStore();
  const { getNode, setCenter } = useReactFlow();

  // Calculate the progress percentage
  const progressPercentage = totalSteps > 0 
    ? Math.round((highestCompletedIndex / totalSteps) * 100)
    : 0;

  // Find node by progress index
  const findNodeIdByProgressIndex = (index: number): string | null => {
    for (const [nodeId, nodeInfo] of Object.entries(actionableNodes)) {
      if (nodeInfo && typeof nodeInfo === 'object' && 'progressIndex' in nodeInfo && nodeInfo.progressIndex === index) {
        return nodeId;
      }
    }
    return null;
  };

  // Handler for checkpoint click
  const handleCheckpointClick = (index: number) => {
    const nodeId = findNodeIdByProgressIndex(index);
    if (nodeId) {
      const node = getNode(nodeId);
      if (node) {
        // Zoom to the node position
        setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 800 });
      }
    }
  };

  // If there are no steps, don't render
  if (totalSteps === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[300px] max-w-[80%]">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">{progressPercentage}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Checkpoints */}
        <div className="relative h-8 mt-1">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((index) => {
            const isCompleted = index <= highestCompletedIndex;
            const isNext = index === highestCompletedIndex + 1;
            const nodeId = findNodeIdByProgressIndex(index);
            const title = nodeId && actionableNodes[nodeId] && 'title' in actionableNodes[nodeId] 
              ? (actionableNodes[nodeId] as any).title || `Step ${index}` 
              : `Step ${index}`;
            
            return (
              <Tooltip key={index} content={title}>
                <button
                  className={cn(
                    "absolute top-0 h-4 w-4 rounded-full transform -translate-x-1/2 cursor-pointer transition-all duration-200",
                    isCompleted 
                      ? "bg-blue-500 scale-100" 
                      : isNext 
                        ? "bg-yellow-400 scale-110 animate-pulse" 
                        : "bg-gray-300 dark:bg-gray-600 scale-90"
                  )}
                  style={{ left: `${(index / totalSteps) * 100}%` }}
                  onClick={() => handleCheckpointClick(index)}
                  aria-label={`Go to ${title}`}
                />
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 