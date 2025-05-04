import { supabase } from "@/integrations/supabase/client";
import { MindmapNodeData } from "@/components/MindmapNode";

export type MindmapNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: MindmapNodeData & {
    isDocumentNode?: boolean;
    documentType?: string;
  };
};

export type MindmapEdge = {
  id: string;
  source: string;
  target: string;
};

export type MindmapData = {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
};

export async function generateMindmap(
  appIdea: string,
  onClickNode: (nodeId: string) => void,
  detailedAnswers?: Record<string, string>
): Promise<MindmapData> {
  try {
    console.log("Generating mindmap for:", appIdea);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("generate-mindmap", {
      body: { 
        appIdea,
        detailedAnswers: detailedAnswers || null 
      },
    });

    if (error) {
      console.error("Error from edge function:", error);
      throw new Error(error.message || "Failed to generate mindmap");
    }

    if (!data || !data.nodes || !data.edges) {
      console.error("Invalid response from edge function:", data);
      throw new Error("Invalid mindmap data received");
    }

    // Process the response to add click handlers to all nodes
    const processedNodes = data.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onClick: onClickNode
      }
    }));

    return {
      nodes: processedNodes,
      edges: data.edges
    };
  } catch (error) {
    console.error("Error generating mindmap:", error);
    throw error;
  }
}

export async function generateDocument(
  documentType: string,
  appIdea: string,
  detailedAnswers?: Record<string, string>
): Promise<{ content: string, title: string }> {
  try {
    console.log(`Generating ${documentType} for:`, appIdea);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("generate-document", {
      body: { 
        documentType,
        appIdea,
        detailedAnswers: detailedAnswers || null 
      },
    });

    if (error) {
      console.error("Error from edge function:", error);
      throw new Error(error.message || `Failed to generate ${documentType}`);
    }

    if (!data || !data.content) {
      console.error("Invalid response from edge function:", data);
      throw new Error(`Invalid ${documentType} data received`);
    }

    return {
      content: data.content,
      title: data.title || `Generated ${documentType.toUpperCase()}`
    };
  } catch (error) {
    console.error(`Error generating ${documentType}:`, error);
    throw error;
  }
}
