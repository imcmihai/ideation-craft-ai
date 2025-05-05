import { create } from 'zustand';
import { Node } from '@xyflow/react';

// Define the possible statuses
export type NodeStatus = 'todo' | 'inprogress' | 'done';

// Define the structure for actionable nodes stored in the state
interface ActionableNode {
    progressIndex: number;
    title?: string;
}

// Define the state structure
interface ProgressState {
    actionableNodes: Record<string, ActionableNode>; // Map nodeId to ActionableNode details
    nodeStatuses: Record<string, NodeStatus>; // Map nodeId to its current status
    highestCompletedIndex: number;
    totalSteps: number;
    initializeProgress: (nodes: Node[]) => void;
    setNodeStatus: (nodeId: string, status: NodeStatus) => void;
    getNodeStatus: (nodeId: string) => NodeStatus | undefined; // Helper to get status
    isNextStep: (nodeId: string) => boolean; // Helper to check if a node is the next step
}

// Helper function to recalculate highest completed index
const calculateHighestCompletedIndex = (
    nodeStatuses: Record<string, NodeStatus>,
    actionableNodes: Record<string, ActionableNode>
): number => {
    let maxIndex = 0;
    for (const nodeId in nodeStatuses) {
        if (nodeStatuses[nodeId] === 'done') {
            const nodeInfo = actionableNodes[nodeId];
            if (nodeInfo && nodeInfo.progressIndex > maxIndex) {
                maxIndex = nodeInfo.progressIndex;
            }
        }
    }
    return maxIndex;
};

export const useProgressStore = create<ProgressState>((set, get) => ({
    actionableNodes: {},
    nodeStatuses: {},
    highestCompletedIndex: 0,
    totalSteps: 0,

    initializeProgress: (nodes) => {
        const actionableNodesMap: Record<string, ActionableNode> = {};
        const initialStatuses: Record<string, NodeStatus> = {};
        let maxProgressIndex = 0;

        nodes.forEach(node => {
            const nodeData = node.data as any;
            const progressIndex = nodeData?.progressIndex;
            const initialStatus = nodeData?.status;

            if (typeof progressIndex === 'number' && progressIndex > 0) {
                actionableNodesMap[node.id] = {
                    progressIndex,
                    title: nodeData?.title as string || 'Step ' + progressIndex
                };
                initialStatuses[node.id] = initialStatus === 'inprogress' || initialStatus === 'done' 
                    ? initialStatus as NodeStatus 
                    : 'todo';

                if (progressIndex > maxProgressIndex) {
                    maxProgressIndex = progressIndex;
                }
            }
        });

        const initialHighestCompleted = calculateHighestCompletedIndex(initialStatuses, actionableNodesMap);

        set({
            actionableNodes: actionableNodesMap,
            nodeStatuses: initialStatuses,
            totalSteps: maxProgressIndex,
            highestCompletedIndex: initialHighestCompleted,
        });
    },

    setNodeStatus: (nodeId, status) => {
        const currentActionableNodes = get().actionableNodes;
        if (currentActionableNodes[nodeId]) {
            const newStatuses = { ...get().nodeStatuses, [nodeId]: status };
            const newHighestCompleted = calculateHighestCompletedIndex(newStatuses, currentActionableNodes);

            set({
                nodeStatuses: newStatuses,
                highestCompletedIndex: newHighestCompleted,
            });
        }
    },

    getNodeStatus: (nodeId) => get().nodeStatuses[nodeId],

    isNextStep: (nodeId) => {
        const state = get();
        const nodeInfo = state.actionableNodes[nodeId];
        if (!nodeInfo) return false;
        return nodeInfo.progressIndex === state.highestCompletedIndex + 1;
    },
})); 