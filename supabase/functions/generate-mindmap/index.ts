import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appIdea, detailedAnswers } = await req.json();
    
    console.log("Function invoked."); // Log start

    if (!appIdea) {
      throw new Error("App idea is required");
    }

    console.log("Generating mindmap for app idea:", appIdea);
    if (detailedAnswers) {
      console.log("Using detailed answers for enhanced mindmap");
    }

    // Prepare system prompt - enhance if detailed answers are provided
    let systemPrompt = `You are an expert app development consultant and strategist. Your task is to generate a comprehensive mindmap for a user's app idea, presented in a specific JSON format.
    The mindmap structure includes a central 'core' node for the app idea, branching out into main categories: 
    - Marketing Strategy
    - Development Roadmap
    - Market Research
    - Promotion & Growth
    - Financial Planning
    
    Each main category MUST have 3-5 relevant sub-category nodes. Crucially, the 'details' for EACH sub-category node MUST provide specific, actionable advice, considerations, potential challenges, or strategy points tailored DIRECTLY to the user's provided app idea. Do NOT provide generic definitions or descriptions of the sub-category title. The details should reflect insights based on the app idea itself. Use bullet points (•) within the details for clarity.
    
    If detailed answers from a questionnaire are provided by the user, incorporate those insights deeply into the generated details for relevant sub-categories to make the advice even more specific and personalized.`;
    
    // NOTE: Document generation nodes are no longer requested in the mindmap structure itself.
    
    systemPrompt += `
    
    Output ONLY the JSON object conforming to this structure, with no introductory text or explanations:
    {
      "nodes": [
        {
          "id": "core-1",
          "type": "core",
          "title": "App Idea Name",
          "details": "Description of the app idea"
        },
        {
          "id": "marketing",
          "type": "marketing",
          "title": "Marketing Strategy",
          "details": "Marketing strategy details"
        },
        // other main categories
        {
          "id": "marketing-1", 
          "type": "sub-category",
          "parentId": "marketing",
          "title": "Sub-category Title",
          "details": "Detailed, APP-IDEA-SPECIFIC explanation with bullet points (•) tailored to the user's concept. No generic definitions."
        }
        // other sub-categories
      ]
    }`;

    const userPromptContent = detailedAnswers 
      ? `App Idea: "${appIdea}"\nDetailed Answers: ${JSON.stringify(detailedAnswers)}\n\nGenerate the tailored mindmap JSON for this app idea, ensuring all sub-category details are specific and actionable based on the provided information.`
      : `App Idea: "${appIdea}"\n\nGenerate the tailored mindmap JSON for this app idea, ensuring all sub-category details are specific and actionable based on the app idea.`;

    console.log("Prepared prompts. Calling OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPromptContent
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1
      }),
    });

    console.log(`OpenAI response status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API error status:", response.status);
      console.error("OpenAI API error body:", errorBody);
      throw new Error("Failed to generate mindmap with OpenAI");
    }

    const data = await response.json();
    const mindmapJson = data?.choices?.[0]?.message?.content;
    
    console.log("Received content from OpenAI:", mindmapJson ? mindmapJson.substring(0, 200) + '...' : 'No content found'); // Log snippet
    
    let cleanedJson = mindmapJson?.trim() || '';

    // Remove potential markdown fences (```json ... ``` or ``` ... ```)
    if (cleanedJson.startsWith('```') && cleanedJson.endsWith('```')) {
      // Find the first newline after ```
      const startIndex = cleanedJson.indexOf('\n') + 1; 
      // Find the last ```
      const endIndex = cleanedJson.lastIndexOf('```');
      if (startIndex !== 0 && endIndex !== -1 && endIndex > startIndex) {
        cleanedJson = cleanedJson.substring(startIndex, endIndex).trim();
      } else { // Fallback if structure is unexpected, remove just the fences
        cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }
    }

    // Add a final check if it looks like JSON before parsing
    if (!cleanedJson.startsWith('{') || !cleanedJson.endsWith('}')) {
      console.error("Cleaned content does not appear to be valid JSON:", cleanedJson);
      throw new Error("AI returned content that does not appear to be valid JSON after cleaning.");
    }
    
    let mindmapData;
    try {
      mindmapData = JSON.parse(cleanedJson);
    } catch (parseError) {
       console.error("Failed to parse cleaned JSON:", parseError);
       console.error("Cleaned JSON content was:", cleanedJson);
       throw new Error("Failed to parse the JSON data received from the AI.");
    }

    console.log("Successfully parsed OpenAI JSON response.");

    // Process the nodes to create the final mindmap structure
    const processedData = processOpenAIMindmap(mindmapData, appIdea);

    console.log("Successfully processed AI data into mindmap format. Sending response.");
    return new Response(JSON.stringify(processedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error caught in generate-mindmap function:", error.message);
    console.error("Stack trace:", error.stack); // Log stack trace if available
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Function to process the OpenAI response into the format expected by the mindmap component
function processOpenAIMindmap(aiData, appIdea) {
  console.log("Processing OpenAI data...");
  // Define types for clarity and to fix TS errors
  type NodePosition = { x: number; y: number };
  type NodeData = { 
    title: string;
    details: string;
    onClick: () => void; // Placeholder
    isDocumentNode?: boolean;
    documentType?: string | null;
  };
  type Node = {
    id: string;
    type: string;
    position: NodePosition;
    data: NodeData;
  };
  type Edge = {
    id: string;
    source: string;
    target: string;
  };

  const nodes: Node[] = []; // Explicitly type the array
  const edges: Edge[] = []; // Explicitly type the array
  
  // --- Layout Configuration ---
  const R_CATEGORY = 400; // Increased Radius for main categories from core
  const R_SUBCATEGORY = 320; // Increased Radius for sub-categories from their parent category
  const CATEGORY_ANGLES: { [key: string]: number } = { // Angles in degrees (0 = right, 90 = down)
    marketing: -75, // Top-right
    development: 0,    // Right
    research: 75, // Bottom-right
    promotion: 180, // Left - Adjusted
    finance: 105, // Bottom-left - Adjusted
  };
  const SUBCATEGORY_ARC_DEGREES = 120; // Spread sub-categories over this arc
  // --- End Layout Configuration ---

  // Ensure aiData and aiData.nodes exist
  if (!aiData || !Array.isArray(aiData.nodes)) {
    console.error("Invalid AI data structure received (missing or non-array nodes):", JSON.stringify(aiData));
    // Return a minimal valid structure or throw an error
    // For now, let's return a minimal structure to avoid frontend crash
    return {
      nodes: [{
        id: "core-1",
        type: "core",
        position: { x: 0, y: 0 },
        data: {
          title: "Error",
          details: "Failed to parse AI response data.",
          onClick: () => {}
        }
      }],
      edges: []
    };
  }
  
  console.log(`Found ${aiData.nodes.length} nodes in AI response.`);
  // Add positioning for the core node
  const coreNodeData = aiData.nodes.find(node => node.type === "core");
  const coreNode: Node = {
    id: coreNodeData?.id || "core-1",
    type: "core",
    position: { x: 0, y: 0 },
    data: {
      title: coreNodeData?.title || (appIdea.length > 30 ? `${appIdea.substring(0, 30)}...` : appIdea),
      details: coreNodeData?.details || `Your app idea: ${appIdea}\n\nThis is the core concept of your application.`,
      onClick: () => {}
    }
  };
  nodes.push(coreNode);
  
  console.log("Processing categories...");
  // Process main categories
  const categories = ["marketing", "development", "research", "promotion", "finance"];
  const categoryNodesData = aiData.nodes.filter(node => node.id && categories.includes(node.id)); // Use ID for matching categories
  
  categoryNodesData.forEach((categoryData, index) => {
    const angleDegrees = CATEGORY_ANGLES[categoryData.id] ?? (index * (360 / categoryNodesData.length)); // Fallback to even distribution
    const angleRadians = angleDegrees * (Math.PI / 180);
    const position = {
      x: coreNode.position.x + R_CATEGORY * Math.cos(angleRadians),
      y: coreNode.position.y + R_CATEGORY * Math.sin(angleRadians),
    };
    
    const categoryNode: Node = {
      id: categoryData.id,
      type: categoryData.id, // Use category id as type (e.g., 'marketing')
      position: position,
      data: {
        title: categoryData.title,
        details: categoryData.details,
        onClick: () => {},
        isDocumentNode: false
      }
    };
    nodes.push(categoryNode);
    
    // Add edge from core to category
    edges.push({
      id: `e-${coreNode.id}-${categoryNode.id}`,
      source: coreNode.id,
      target: categoryNode.id,
    });
  });
  
  console.log("Processing sub-categories...");
  // Process sub-categories
  const subCategoriesData = aiData.nodes.filter(node => node.parentId && node.type === "sub-category");
  
  // Group subcategories by parent ID for easier processing
  const subCategoryGroups: { [key: string]: any[] } = {};
  subCategoriesData.forEach(subCat => {
    if (!subCategoryGroups[subCat.parentId]) {
      subCategoryGroups[subCat.parentId] = [];
    }
    subCategoryGroups[subCat.parentId].push(subCat);
  });

  Object.keys(subCategoryGroups).forEach(parentId => {
    const siblings = subCategoryGroups[parentId];
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return; // Skip if parent node wasn't found/added

    const numSiblings = siblings.length;
    const arcRadians = SUBCATEGORY_ARC_DEGREES * (Math.PI / 180);

    // Calculate the angle of the parent relative to the core, to center the arc
    const parentAngleRadians = Math.atan2(parentNode.position.y - coreNode.position.y, parentNode.position.x - coreNode.position.x);
    // Center the arc opposite the direction from the core node
    const centerAngleRadians = parentAngleRadians; // Offset slightly if needed
    const startAngleRadians = centerAngleRadians - arcRadians / 2;
    
    siblings.forEach((subCategoryData, index) => {
      // Calculate angle for this sibling
      let angleRadians = startAngleRadians;
      if (numSiblings > 1) {
        angleRadians += index * (arcRadians / (numSiblings - 1));
      } // If only 1 sibling, it uses startAngleRadians (which is centerAngleRadians - arc/2)
      
      // Calculate position
      const subPosition = {
         x: parentNode.position.x + R_SUBCATEGORY * Math.cos(angleRadians),
         y: parentNode.position.y + R_SUBCATEGORY * Math.sin(angleRadians),
      };
      
      // Document nodes are no longer generated here
      const isDocumentNode = false;
      const documentType = null;
      
      const subCategoryNode: Node = {
        id: subCategoryData.id,
        type: "sub-category",
        position: subPosition,
        data: {
          title: subCategoryData.title,
          details: subCategoryData.details,
          onClick: () => {},
          isDocumentNode: isDocumentNode,
          documentType: documentType
        }
      };
      nodes.push(subCategoryNode);
      
      // Add edge from parent to sub-category
      edges.push({
        id: `e-${parentId}-${subCategoryNode.id}`,
        source: parentId,
        target: subCategoryNode.id,
      });
    }); // End forEach sibling
  });
  
  console.log("Finished processing data.");
  return { nodes, edges };
}
