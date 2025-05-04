import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { appIdea } = await req.json();
    
    if (!appIdea) {
      throw new Error("App idea is required");
    }

    console.log("Generating mindmap for app idea:", appIdea);

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
            content: `You are an app development expert that helps create comprehensive mindmaps for app ideas.
            The mindmap should have a core node with the app idea, and branches for: 
            - Marketing Strategy
            - Development Roadmap
            - Market Research
            - Promotion & Growth
            - Financial Planning
            
            Each branch should have 3-5 sub-categories with detailed descriptions.
            Format your response as JSON with this structure:
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
                  "details": "Detailed explanation with bullet points"
                }
                // other sub-categories
              ]
            }
            `
          },
          {
            role: 'user',
            content: `Create a comprehensive mindmap for this app idea: "${appIdea}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      throw new Error("Failed to generate mindmap with OpenAI");
    }

    const data = await response.json();
    const mindmapData = JSON.parse(data.choices[0].message.content);

    // Process the nodes to create the final mindmap structure
    const processedData = processOpenAIMindmap(mindmapData, appIdea);

    return new Response(JSON.stringify(processedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error generating mindmap:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Function to process the OpenAI response into the format expected by the mindmap component
function processOpenAIMindmap(aiData, appIdea) {
  const nodes = [];
  const edges = [];
  
  // Add positioning for the core node
  const coreNode = aiData.nodes.find(node => node.type === "core");
  if (coreNode) {
    nodes.push({
      id: coreNode.id,
      type: "core",
      position: { x: 0, y: 0 },
      data: {
        title: coreNode.title || appIdea,
        details: coreNode.details,
        onClick: () => {} // This is placeholder, will be replaced by the frontend
      }
    });
  } else {
    // Create default core node if none exists
    nodes.push({
      id: "core-1",
      type: "core",
      position: { x: 0, y: 0 },
      data: {
        title: appIdea.length > 30 ? `${appIdea.substring(0, 30)}...` : appIdea,
        details: `Your app idea: ${appIdea}\n\nThis is the core concept of your application.`,
        onClick: () => {}
      }
    });
  }
  
  // Process main categories (direct children of core)
  const categories = ["marketing", "development", "research", "promotion", "finance"];
  const categoryNodes = aiData.nodes.filter(node => categories.includes(node.id || node.type));
  
  categoryNodes.forEach((category, index) => {
    const yPosition = (index - (categoryNodes.length - 1) / 2) * 100;
    
    nodes.push({
      id: category.id,
      type: category.id,
      position: { x: 250, y: yPosition },
      data: {
        title: category.title,
        details: category.details,
        onClick: () => {}
      }
    });
    
    // Add edge from core to category
    edges.push({
      id: `e-core-${category.id}`,
      source: "core-1",
      target: category.id,
    });
  });
  
  // Process sub-categories
  const subCategories = aiData.nodes.filter(node => node.type === "sub-category" || node.parentId);
  
  subCategories.forEach((subCategory, index) => {
    const parentId = subCategory.parentId;
    if (!parentId) return;
    
    // Find parent node to position the subcategory relative to it
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;
    
    // Get number of siblings with same parent
    const siblings = subCategories.filter(sc => sc.parentId === parentId);
    const siblingIndex = siblings.findIndex(s => s.id === subCategory.id);
    
    // Calculate position based on parent and sibling index
    const yOffset = (siblingIndex - (siblings.length - 1) / 2) * 60;
    
    nodes.push({
      id: subCategory.id,
      type: "sub-category",
      position: { 
        x: parentNode.position.x + 250, 
        y: parentNode.position.y + yOffset 
      },
      data: {
        title: subCategory.title,
        details: subCategory.details,
        onClick: () => {}
      }
    });
    
    // Add edge from parent to sub-category
    edges.push({
      id: `e-${parentId}-${subCategory.id}`,
      source: parentId,
      target: subCategory.id,
    });
  });
  
  return { nodes, edges };
}
