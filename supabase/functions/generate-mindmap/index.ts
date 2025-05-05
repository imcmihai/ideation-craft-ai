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

    console.log("Generating detailed mindmap for app idea:", appIdea);
    if (detailedAnswers) {
      console.log("Using detailed answers for enhanced mindmap");
    }

    // --- Refined System Prompt ---
    const systemPrompt = `You are an expert AI product architect and app development strategist. 
Your task is to generate a comprehensive, hierarchical mindmap for a user's app idea, presented in a specific JSON format.

**Context:**
- User's App Idea: Provided in the user prompt.
- Detailed Answers: Potentially provided in the user prompt to add more specific context.
- Document Placeholders: Assume the user has or will generate documents like PRD, Tech Specs, etc. Your generated prompts should use placeholders like {{DOCUMENT_RELEVANT_SECTION}} or {{PRD_AUTH_SECTION}} for the user to fill in later.

**Mindmap Structure Requirements:**
The mindmap MUST follow this hierarchy:
1.  **Core Node:** Represents the central app idea. (type: "core")
2.  **Major Categories:** Branching from the core. Use these specific categories: 
    - Marketing Strategy (id: "marketing")
    - Development Roadmap (id: "development")
    - Market Research (id: "research")
    - Promotion & Growth (id: "promotion")
    - Financial Planning (id: "finance") 
    (type: "category")
3.  **Sub-Categories:** Each Major Category MUST have 3-5 relevant sub-categories. (type: "sub-category")
4.  **Sub-Sub-Categories:** Each Sub-Category should be broken down further into logical sub-sub-categories where appropriate (e.g., Development -> Backend -> Authentication or UI -> User Flow). (type: "sub-sub-category")
5.  **Linear Steps:** Each Sub-Sub-Category MUST have a linear sequence of 3-7 actionable steps required to implement or address that specific part. (type: "step")

**Content Requirements for Each Node Type:**

- **Core, Category, Sub-Category, Sub-Sub-Category:** Must have 'id', 'type', 'parentId' (except core), 'title', and 'details'. The 'details' should provide a concise description or strategic overview relevant to that node and the user's app idea.*
- **Step Node:** Must have 'id', 'type' ("step"), 'parentId', 'stepIndex' (integer, 0-based, for ordering), 'title' (short, actionable step name), 'guidance' (detailed explanation for the user on how to approach this step, specific to the app idea), and 'cursorPrompt'.
    - **'cursorPrompt'**: 
        - This field is REQUIRED **ONLY** for steps under the 'Development Roadmap' category (i.e., where the ultimate ancestor category node has id 'development').
        - For non-development steps, 'cursorPrompt' MUST be \`null\`.
        - For development steps, 'cursorPrompt' MUST contain a detailed, technically specific, context-aware prompt template for Cursor AI to help implement that exact step. It MUST reference relevant document placeholders (e.g., {{PRD_SECTION_XYZ}}, {{TECH_SPEC_DATABASE}}, {{UI_FLOW_SIGNUP}}).

**Crucial Instructions:**
- **Specificity:** All 'details', 'guidance', and 'cursorPrompt' content MUST be tailored specifically to the user's provided app idea. Incorporate insights from 'detailedAnswers' if provided. Avoid generic definitions.
- **Actionable:** Steps and guidance should be concrete and actionable.
- **JSON Output:** Output ONLY the JSON object conforming EXACTLY to the structure described below. No introductory text, explanations, or markdown formatting around the JSON. Ensure the JSON is valid.

**Output JSON Format:**
{
  "nodes": [
    {
      "id": "core-1",
      "type": "core", // "core", "category", "sub-category", "sub-sub-category", "step"
      "parentId": null, // ID of the parent node, null for core
      "title": "...", 
      "details": "...", // Required for all except step nodes
      // --- Fields specific to 'step' type ---
      "stepIndex": 0, // Only for type: "step"
      "guidance": "...", // Only for type: "step"
      "cursorPrompt": "..." // Only for type: "step". String prompt for dev steps, null otherwise.
    }
    // ... other nodes following the hierarchy and types
  ]
}`;
    // --- End Refined System Prompt ---

    const userPromptContent = detailedAnswers 
      ? `App Idea: "${appIdea}"\nDetailed Answers: ${JSON.stringify(detailedAnswers)}\n\nGenerate the detailed, hierarchical mindmap JSON for this app idea, following all structure and content requirements precisely.`
      : `App Idea: "${appIdea}"\n\nGenerate the detailed, hierarchical mindmap JSON for this app idea, following all structure and content requirements precisely.`;

    console.log("Prepared prompts with detailed structure request. Calling OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Ensure you use a powerful model capable of complex JSON generation
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
        temperature: 0.6, // Slightly lower temp might help with structure adherence
        max_tokens: 4095, // Maximize token allocation for complex output
        top_p: 1
      }),
    });

    console.log(`OpenAI response status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API error status:", response.status);
      console.error("OpenAI API error body:", errorBody);
      // Try to parse potential JSON error from OpenAI
      let errorJson: any = {}; // Use type 'any' to allow access to potential properties
      try { errorJson = JSON.parse(errorBody); } catch (_) { /* Ignore parsing error */ }
      throw new Error(`Failed to generate mindmap with OpenAI. Status: ${response.status}. ${errorJson?.error?.message || ''}`.trim());
    }

    const data = await response.json();
    
    // Add more checks for response structure
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error("Invalid response structure from OpenAI:", JSON.stringify(data));
        throw new Error("Received invalid or incomplete structure from OpenAI API.");
    }
    
    const mindmapJson = data.choices[0].message.content;
    
    console.log("Received raw content snippet from OpenAI:", mindmapJson ? mindmapJson.substring(0, 300) + '...' : 'No content found'); // Log larger snippet
    
    let cleanedJson = mindmapJson?.trim() || '';

    // Improved cleaning: Handle potential markdown fences and surrounding text
    const jsonMatch = cleanedJson.match(/```(?:json)?([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      cleanedJson = jsonMatch[1].trim();
      console.log("Extracted JSON content from markdown fences.");
    } else {
       // If no markdown fences, assume the whole string *might* be JSON,
       // but only if it starts with { or [
       if (!(cleanedJson.startsWith('{') && cleanedJson.endsWith('}')) && !(cleanedJson.startsWith('[') && cleanedJson.endsWith(']'))) {
          console.warn("Content does not start/end with standard JSON delimiters and no markdown fences found. Attempting parse anyway.");
       }
    }

    // Final check for start/end characters
    if (!cleanedJson.startsWith('{') || !cleanedJson.endsWith('}')) {
       console.error("Cleaned content still does not appear to be a valid JSON object:", cleanedJson.substring(0, 500) + '...');
       throw new Error("AI returned content that does not appear to be a valid JSON object after cleaning.");
    }
    
    let mindmapData;
    try {
      // The AI should return an object like { "nodes": [...] }
      const parsedObject = JSON.parse(cleanedJson);
      if (!parsedObject || !Array.isArray(parsedObject.nodes)) {
          console.error("Parsed JSON does not contain a 'nodes' array:", parsedObject);
          throw new Error("Parsed JSON from AI is missing the expected 'nodes' array.");
      }
      mindmapData = parsedObject; // Use the whole parsed object containing the nodes array
      console.log(`Successfully parsed OpenAI JSON response. Found ${mindmapData.nodes.length} nodes.`);
      // Log the raw data structure received from AI
      console.log("Raw AI JSON:", JSON.stringify(mindmapData, null, 2));

    } catch (parseError) {
       console.error("Failed to parse cleaned JSON:", parseError);
       console.error("Cleaned JSON content that failed parsing:", cleanedJson); // Log the problematic JSON
       throw new Error(`Failed to parse the JSON data received from the AI: ${parseError.message}`);
    }


    // Process the nodes to create the final mindmap structure for React Flow
    const processedData = processOpenAIMindmap(mindmapData, appIdea); // Pass the object containing 'nodes'

    console.log("Successfully processed AI data into React Flow format. Sending response.");
    // Log the processed data being sent to the frontend
    const processedDataForResponse = { nodes: processedData.nodes, edges: processedData.edges };
    console.log("Processed Data for Frontend:", JSON.stringify(processedDataForResponse, null, 2));
    return new Response(JSON.stringify(processedDataForResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error caught in generate-mindmap function:", error); // Log the full error object
    // Ensure stack trace is logged if available
    if (error.stack) {
       console.error("Stack trace:", error.stack); 
    }
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// --- Updated processOpenAIMindmap Function ---
function processOpenAIMindmap(aiData, appIdea) {
  console.log("Processing AI data for React Flow...");

  // --- Type Definitions ---
  interface RawNode {
      id: string;
      type: string;
      parentId: string | null;
      title: string;
      details?: string; 
      stepIndex?: number;
      guidance?: string;
      cursorPrompt?: string | null;
      // Added for final output to frontend
      progressIndex?: number; 
      status?: 'todo' | 'inprogress' | 'done';
  }
  
  interface AIResponseData {
    nodes: RawNode[];
  }

  type NodePosition = { x: number; y: number };
  
  type BaseNodeData = {
    title: string;
    details?: string; 
    onClick?: () => void; 
  };

  type StepNodeData = BaseNodeData & {
     guidance: string;
     cursorPrompt: string | null;
     stepIndex: number;
     progressIndex?: number; // Include progressIndex here
     status?: 'todo' | 'inprogress' | 'done'; // Include status here
  };
  
  type NodeData = BaseNodeData | StepNodeData;

  type RFNode = {
    id: string;
    type: string; 
    data: NodeData;
    parentId?: string | null; 
  };

  type RFEdge = {
    id: string;
    source: string;
    target: string;
  };

  // Input validation
  if (!aiData || !Array.isArray(aiData.nodes)) {
    console.error("Invalid AI data structure received in processOpenAIMindmap (missing or non-array nodes):", JSON.stringify(aiData));
    return {
      nodes: [{
        id: "error-core", type: "core", data: {
          title: "Processing Error", details: "Failed to process AI response data structure."
        }, parentId: null
      }], edges: []
    };
  }

  const rawNodes: RawNode[] = aiData.nodes; 
  console.log(`Processing ${rawNodes.length} raw nodes from AI data.`);

  let nodes: RFNode[] = []; // Use 'let' to allow modification later
  const edges: RFEdge[] = [];
  
  const nodeMap = new Map<string, RawNode>(rawNodes.map(node => [node.id, node]));
  
  // --- Process Nodes and Edges (Initial Pass) ---
  rawNodes.forEach((rawNode: RawNode) => { 
      if (!rawNode || !rawNode.id || !rawNode.type) {
          console.warn("Skipping invalid raw node:", rawNode);
          return;
      }

      let nodeData: NodeData;
      if (rawNode.type === 'step') {
          if (typeof rawNode.guidance !== 'string' || typeof rawNode.stepIndex !== 'number') {
               console.warn(`Step node ${rawNode.id} is missing required fields (guidance, stepIndex). Skipping.`);
               return; 
          }
          // Initially, don't add progressIndex/status here, we'll do it in a separate step
          nodeData = {
              title: rawNode.title || "Untitled Step",
              guidance: rawNode.guidance,
              cursorPrompt: rawNode.cursorPrompt !== undefined ? rawNode.cursorPrompt : null, 
              stepIndex: rawNode.stepIndex,
              // progressIndex and status will be added later
          };
      } else {
           let title = rawNode.title;
           let details = rawNode.details;
           if (rawNode.type === 'core') {
              title = title || (appIdea.length > 30 ? `${appIdea.substring(0, 30)}...` : appIdea);
              details = details || `Core idea: ${appIdea}`;
           }
          nodeData = {
              title: title || `Untitled ${rawNode.type}`,
              details: details || "No details provided.",
          };
      }

       let rfNodeType = rawNode.type; 

      const rfNode: RFNode = {
          id: rawNode.id,
          type: rfNodeType, 
          data: nodeData,
          parentId: rawNode.parentId 
      };
      nodes.push(rfNode);

      // Create Edge if parent exists
      if (rawNode.parentId) {
          if (nodeMap.has(rawNode.parentId)) { // Check map directly
              edges.push({
                  id: `e-${rawNode.parentId}-${rawNode.id}`,
                  source: rawNode.parentId,
                  target: rawNode.id,
              });
          } else {
              console.warn(`Parent node ID '${rawNode.parentId}' not found in map for node ID '${rawNode.id}'. Skipping edge creation.`);
          }
      }
  });
  
  // --- >>> START: Add Progress Tracking Logic <<< ---
  console.log("Starting progress tracking assignment...");

  // 1. Identify Actionable Nodes (type: 'step')
  const actionableNodes = nodes.filter(node => node.type === 'step');

  // Helper to find the main category ancestor ('marketing', 'development', etc.)
  const getAncestorCategoryId = (startNodeId: string): string | null => {
      let currentNode = nodeMap.get(startNodeId);
      while (currentNode && currentNode.parentId) {
          const parentNode = nodeMap.get(currentNode.parentId);
          if (parentNode && parentNode.type === 'category') {
              return parentNode.id; // Found the main category
          }
          currentNode = parentNode; // Move up the hierarchy
          if (!currentNode) break; // Safety break if hierarchy is broken
      }
      return null; // Should not happen if structure is correct
  };

  // Define the logical order of categories
  const categoryOrder: Record<string, number> = {
      "research": 1,
      "marketing": 2,
      "development": 3,
      "finance": 4,
      "promotion": 5,
      // Add fallback order for any unexpected categories
  };
  const MAX_ORDER = 99; // Fallback order

  // 2. Determine Logical Sequence
  actionableNodes.sort((a, b) => {
      const categoryA = getAncestorCategoryId(a.id);
      const categoryB = getAncestorCategoryId(b.id);
      
      const orderA = categoryA ? (categoryOrder[categoryA] ?? MAX_ORDER) : MAX_ORDER;
      const orderB = categoryB ? (categoryOrder[categoryB] ?? MAX_ORDER) : MAX_ORDER;

      if (orderA !== orderB) {
          return orderA - orderB; // Sort by category order first
      }

      // If categories are the same, sort by the original stepIndex
      const stepIndexA = (a.data as StepNodeData).stepIndex ?? 0;
      const stepIndexB = (b.data as StepNodeData).stepIndex ?? 0;
      return stepIndexA - stepIndexB;
  });

  // Create a map for quick lookup of the sorted order { nodeId: progressIndex }
  const progressOrderMap = new Map<string, number>();
  actionableNodes.forEach((node, index) => {
      progressOrderMap.set(node.id, index + 1); // 1-based index
  });
  console.log(`Determined logical sequence for ${actionableNodes.length} actionable nodes.`);

  // 3. Assign Properties to the main 'nodes' array
  nodes = nodes.map(node => {
      if (progressOrderMap.has(node.id)) {
          const progressIndex = progressOrderMap.get(node.id);
          // Ensure data is treated as StepNodeData to add properties
          const stepData = node.data as StepNodeData;
          stepData.progressIndex = progressIndex;
          stepData.status = 'todo'; 
          console.log(`Assigned progressIndex: ${progressIndex}, status: 'todo' to node: ${node.id}`);
      }
      return node;
  });
  
  console.log("Finished progress tracking assignment.");
  // --- >>> END: Add Progress Tracking Logic <<< ---

  console.log(`Finished processing. Created ${nodes.length} nodes and ${edges.length} edges for React Flow.`); 
  
  const processedData = { nodes, edges };
  
  // Log the complete processed data structure just before returning
  try {
      console.log("Final Processed Data Object (with progress tracking):", JSON.stringify(processedData, null, 2));
  } catch (stringifyError) {
      console.error("Error stringifying final processed data:", stringifyError);
      console.log("Final Processed Nodes (partial log on error):", JSON.stringify(nodes.slice(0, 10), null, 2)); 
      console.log("Final Processed Edges Count (partial log on error):", edges.length);
  }

  return processedData; 
}
