
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
    
    // If API call fails, fall back to the sample mindmap
    console.log("Falling back to sample mindmap");
    return createSampleMindmap(appIdea, onClickNode, !!detailedAnswers);
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

// Helper function to create a sample mindmap when API fails
function createSampleMindmap(
  appIdea: string, 
  onClickNode: (nodeId: string) => void,
  includeDocumentNodes: boolean = false
): MindmapData {
  // Core node at center
  const nodes: MindmapNode[] = [
    {
      id: "core-1",
      type: "core",
      position: { x: 0, y: 0 },
      data: {
        title: appIdea.length > 30 ? `${appIdea.substring(0, 30)}...` : appIdea,
        details: `Your app idea: ${appIdea}\n\nThis is the core concept of your application. The mindmap branches out to explore all aspects of developing, marketing, and launching this idea.`,
        onClick: onClickNode,
      },
    },
  ];

  // Main category nodes
  const categories = [
    { id: "marketing", title: "Marketing Strategy", y: -200 },
    { id: "development", title: "Development Roadmap", y: -100 },
    { id: "research", title: "Market Research", y: 0 },
    { id: "promotion", title: "Promotion & Growth", y: 100 },
    { id: "finance", title: "Financial Planning", y: 200 },
  ];

  // Add category nodes
  categories.forEach((category) => {
    nodes.push({
      id: category.id,
      type: category.id,
      position: { x: 250, y: category.y },
      data: {
        title: category.title,
        details: generateCategoryDetails(category.id, appIdea),
        onClick: onClickNode,
      },
    });
  });

  // Add sub-nodes for each category
  const subNodes = generateSubNodes(categories, onClickNode, includeDocumentNodes);
  nodes.push(...subNodes.nodes);

  // Create edges
  let edges: MindmapEdge[] = [
    ...categories.map((category) => ({
      id: `e-core-${category.id}`,
      source: "core-1",
      target: category.id,
    })),
    ...subNodes.edges,
  ];

  return { nodes, edges };
}

function generateSubNodes(
  categories: { id: string; title: string; y: number }[],
  onClickNode: (nodeId: string) => void,
  includeDocumentNodes: boolean = false
) {
  const nodes: MindmapNode[] = [];
  const edges: MindmapEdge[] = [];
  
  categories.forEach((category) => {
    const subCategories = getSubCategories(category.id, includeDocumentNodes);
    
    subCategories.forEach((subCat, index) => {
      const nodeId = `${category.id}-${index + 1}`;
      const yOffset = (index - (subCategories.length - 1) / 2) * 60;
      
      // Determine if this is a document node
      const isDocumentNode = subCat.isDocumentNode || false;
      const documentType = subCat.documentType || null;
      
      // Add sub-category node
      nodes.push({
        id: nodeId,
        type: "sub-category",
        position: { x: 500, y: category.y + yOffset },
        data: {
          title: subCat.title,
          details: subCat.details,
          onClick: onClickNode,
          isDocumentNode: isDocumentNode,
          documentType: documentType
        },
      });
      
      // Add edge from category to sub-category
      edges.push({
        id: `e-${category.id}-${nodeId}`,
        source: category.id,
        target: nodeId,
      });
    });
  });
  
  return { nodes, edges };
}

function getSubCategories(categoryId: string, includeDocumentNodes: boolean = false) {
  // Special case for development category when document nodes are requested
  if (categoryId === "development" && includeDocumentNodes) {
    return [
      { 
        title: "Technical Stack Selection", 
        details: "Choose the appropriate technologies and frameworks for building your application.\n\n• Evaluate whether to build native, hybrid, or web app based on your needs\n• Select frontend and backend technologies based on team expertise\n• Consider scalability requirements from the start\n• Evaluate third-party services and APIs to accelerate development\n\nHack: Consider using a low-code platform like Flutter or React Native to build once for both iOS and Android if appropriate for your app." 
      },
      { 
        title: "MVP Feature Definition", 
        details: "Define the minimum viable product features that deliver core value with minimum development effort.\n\n• Identify the core problem your app solves\n• List all possible features, then ruthlessly prioritize\n• Focus on the 20% of features that deliver 80% of value\n• Create user stories and acceptance criteria\n\nHack: Use the MoSCoW method (Must have, Should have, Could have, Won't have) to prioritize features effectively." 
      },
      { 
        title: "Generate PRD", 
        details: "Create a detailed Product Requirements Document that outlines all aspects of your application including requirements, features, user stories, and acceptance criteria.\n\nClick this node to generate a comprehensive PRD based on your app idea information.",
        isDocumentNode: true,
        documentType: "prd"
      },
      { 
        title: "Generate Technical Spec", 
        details: "Generate a technical specification document outlining architecture, tech stack, data models, APIs, and implementation considerations.\n\nClick this node to generate a technical specification based on your app idea information.",
        isDocumentNode: true,
        documentType: "techspec"
      },
      { 
        title: "Generate User Flows", 
        details: "Create detailed user flow descriptions that map out the step-by-step journeys users will take through your application.\n\nClick this node to generate user flow documentation based on your app idea information.",
        isDocumentNode: true,
        documentType: "userflows"
      },
      { 
        title: "Generate Implementation Roadmap", 
        details: "Develop a comprehensive roadmap for implementing your app from project setup through development and deployment.\n\nClick this node to generate an implementation roadmap based on your app idea information.",
        isDocumentNode: true,
        documentType: "roadmap"
      },
    ];
  }
  
  switch (categoryId) {
    case "marketing":
      return [
        { 
          title: "Target Audience Definition", 
          details: "Define your primary and secondary target audiences with specific demographics, psychographics, and behavior patterns.\n\n• Create detailed user personas with age, income, education, pain points, and desires\n• Identify where your target users spend their time online\n• Research what messaging resonates with this audience\n• Determine what apps/solutions they currently use\n\nHack: Use Facebook Audience Insights and Google Analytics data from competitors to refine your audience profiles." 
        },
        { 
          title: "Competitor Analysis", 
          details: "Analyze direct and indirect competitors to identify gaps and opportunities in the market.\n\n• Identify 3-5 direct competitors and 2-3 indirect competitors\n• Evaluate their UX/UI, features, pricing models, and marketing messages\n• Read user reviews to identify pain points with existing solutions\n• Look for opportunities they're missing\n\nHack: Use SimilarWeb and AppAnnie to gather competitive intelligence without expensive market research." 
        },
        { 
          title: "Brand Identity Creation", 
          details: "Create a consistent brand identity that resonates with your target audience and communicates your core value proposition.\n\n• Develop a brand story and mission statement\n• Create a visual identity (logo, color palette, typography)\n• Define your brand voice and messaging guidelines\n• Ensure consistency across all platforms\n\nHack: Use tools like Canva and Looka for affordable branding if you're on a tight budget." 
        },
        { 
          title: "Content Marketing Strategy", 
          details: "Develop a content plan that attracts and engages your target users throughout their journey.\n\n• Create a content calendar for blog, social media, and email\n• Identify key SEO keywords to target in your content\n• Plan content that addresses user pain points and questions\n• Create tutorials and guides that showcase your app's value\n\nHack: Use tools like AnswerThePublic to find questions your users are asking to create relevant content." 
        },
      ];
    case "development":
      return [
        { 
          title: "Technical Stack Selection", 
          details: "Choose the appropriate technologies and frameworks for building your application.\n\n• Evaluate whether to build native, hybrid, or web app based on your needs\n• Select frontend and backend technologies based on team expertise\n• Consider scalability requirements from the start\n• Evaluate third-party services and APIs to accelerate development\n\nHack: Consider using a low-code platform like Flutter or React Native to build once for both iOS and Android if appropriate for your app." 
        },
        { 
          title: "MVP Feature Definition", 
          details: "Define the minimum viable product features that deliver core value with minimum development effort.\n\n• Identify the core problem your app solves\n• List all possible features, then ruthlessly prioritize\n• Focus on the 20% of features that deliver 80% of value\n• Create user stories and acceptance criteria\n\nHack: Use the MoSCoW method (Must have, Should have, Could have, Won't have) to prioritize features effectively." 
        },
        { 
          title: "UI/UX Design Process", 
          details: "Create a user experience that makes your app intuitive, engaging, and valuable.\n\n• Start with user flows and wireframes\n• Create a clickable prototype before full development\n• Test with real users early and often\n• Focus on accessibility from the beginning\n\nHack: Use tools like Figma or Adobe XD for collaborative design, and UsabilityHub for quick user testing." 
        },
        { 
          title: "Development Timeline", 
          details: "Create a realistic timeline for developing your application from concept to launch.\n\n• Break development into 2-week sprints\n• Include time for QA testing and bug fixing\n• Build in buffer time for unexpected issues\n• Plan for beta testing before full launch\n\nHack: Multiple your initial time estimates by 1.5 - most software projects take longer than expected." 
        },
        { 
          title: "Testing Strategy", 
          details: "Develop a comprehensive testing approach to ensure quality and reliability.\n\n• Implement unit testing from the beginning\n• Plan for integration and end-to-end testing\n• Include cross-device and cross-platform testing\n• Set up automated testing wherever possible\n\nHack: Consider using a platform like BrowserStack for easy cross-device testing without needing physical devices." 
        },
      ];
    case "research":
      return [
        { 
          title: "Market Size Analysis", 
          details: "Determine the potential size and value of your target market.\n\n• Research the Total Addressable Market (TAM)\n• Calculate Serviceable Available Market (SAM)\n• Estimate your Serviceable Obtainable Market (SOM)\n• Identify market growth trends\n\nHack: Use industry reports from sources like Statista or IBISWorld – many universities and public libraries offer free access." 
        },
        { 
          title: "User Surveys & Interviews", 
          details: "Gather direct feedback from potential users to validate assumptions.\n\n• Create surveys with both quantitative and qualitative questions\n• Conduct one-on-one interviews with ideal users\n• Use jobs-to-be-done framework to understand user motivations\n• Test willingness to pay for your solution\n\nHack: Use Google Forms for surveys and offer incentives like gift cards to increase participation rates." 
        },
        { 
          title: "Problem Validation", 
          details: "Verify that the problem you're solving is significant enough that users will pay for a solution.\n\n• Identify the frequency and intensity of the problem\n• Measure how much time/money users currently spend on workarounds\n• Determine if users are actively seeking solutions\n• Evaluate current solutions and their limitations\n\nHack: Run small digital ad campaigns to landing pages describing different problem statements to see which gets the most interest." 
        },
      ];
    case "promotion":
      return [
        { 
          title: "Launch Strategy", 
          details: "Plan a compelling launch that creates maximum visibility and initial user acquisition.\n\n• Create a pre-launch landing page with email signup\n• Plan a PR outreach strategy to relevant publications\n• Prepare launch announcements for all social channels\n• Consider launch platforms (Product Hunt, App Store feature request)\n\nHack: Create an exclusive beta access program to generate buzz and collect early feedback." 
        },
        { 
          title: "Digital Marketing Channels", 
          details: "Identify and prioritize the most effective channels for reaching your target audience.\n\n• Evaluate SEO, SEM, social media ads, content marketing\n• Start with 2-3 channels where your audience is most active\n• Set up proper attribution tracking from the beginning\n• Create channel-specific content and messaging\n\nHack: Start with Facebook/Instagram ads for B2C apps and LinkedIn/Google Ads for B2B apps to test messaging before expanding." 
        },
        { 
          title: "ASO Strategy", 
          details: "Optimize your app store presence to maximize organic discovery.\n\n• Research keywords for app title and description\n• Create compelling screenshots and preview videos\n• Write benefit-focused descriptions\n• Plan for gathering early positive reviews\n\nHack: Use tools like AppAnnie or SensorTower to research competitor keywords." 
        },
        { 
          title: "Partnership Opportunities", 
          details: "Identify strategic partners that can help accelerate user acquisition.\n\n• List complementary businesses with similar target audiences\n• Explore co-marketing opportunities\n• Consider integration partnerships\n• Look for influencers in your niche\n\nHack: Reach out to small-medium influencers with 10k-50k followers – they often have better engagement rates and more affordable rates than mega-influencers." 
        },
      ];
    case "finance":
      return [
        { 
          title: "Development Budget", 
          details: "Calculate the costs involved in building your application.\n\n• Estimate design costs\n• Calculate development costs (in-house or outsourced)\n• Include testing and QA expenses\n• Factor in costs for third-party services and APIs\n\nHack: Consider using offshore development for non-core features while keeping core functionality development in-house." 
        },
        { 
          title: "Revenue Model Selection", 
          details: "Choose the right monetization strategy for your application.\n\n• Evaluate options: freemium, subscription, one-time purchase, in-app purchases\n• Research what models work best in your category\n• Calculate potential revenue based on market size and conversion rates\n• Consider multiple revenue streams\n\nHack: Consider a freemium model with a generous free tier to drive adoption, then convert users to paid plans with high-value features." 
        },
        { 
          title: "Marketing Budget", 
          details: "Allocate appropriate funds for marketing and user acquisition.\n\n• Calculate customer acquisition cost targets\n• Budget for pre-launch and launch marketing\n• Plan ongoing marketing expenditures\n• Include content creation and ad spend\n\nHack: Set aside 15-20% of your total budget for marketing – many founders underestimate this critical expense." 
        },
        { 
          title: "Funding Strategy", 
          details: "Determine how to finance your app development and growth.\n\n• Evaluate bootstrapping vs seeking investment\n• Research relevant angel investors and VC firms\n• Prepare for pitching if seeking investment\n• Consider alternative funding like crowdfunding or grants\n\nHack: Look into startup accelerators specific to your industry – they often provide funding, mentorship, and valuable connections." 
        },
      ];
    default:
      return [
        { title: "Sample Sub-Category", details: "Sample details" }
      ];
  }
}

function generateCategoryDetails(categoryId: string, appIdea: string): string {
  switch (categoryId) {
    case "marketing":
      return "Marketing Strategy\n\nA comprehensive marketing approach for your app includes defining your target audience, analyzing competitors, creating a brand identity, and developing a content marketing plan.\n\nEach sub-node in this category will guide you through specific marketing activities essential for successfully positioning your app in the market.";
    
    case "development":
      return "Development Roadmap\n\nThis section outlines the technical journey of building your app, from selecting the right tech stack to defining MVP features, designing the user experience, creating a development timeline, and establishing testing strategies.\n\nExplore each sub-node for detailed guidance on the development process.";
    
    case "research":
      return "Market Research\n\nBefore committing significant resources to development, thorough market research validates your app idea and identifies opportunities. This includes analyzing market size, conducting user interviews, and confirming that your solution addresses a significant problem.\n\nDive into each sub-node for methodologies and approaches to effective market research.";
    
    case "promotion":
      return "Promotion & Growth\n\nThis section covers strategies for launching your app and growing your user base, including creating a launch plan, selecting digital marketing channels, optimizing for app stores, and identifying potential partnerships.\n\nExplore each sub-node for detailed action plans on promoting your app effectively.";
    
    case "finance":
      return "Financial Planning\n\nSmart financial planning is crucial for app success. This section covers budgeting for development, selecting the right revenue model, allocating marketing funds, and determining your funding strategy.\n\nReview each sub-node for insights on financial aspects of app development and growth.";
    
    default:
      return "Detailed information about this category.";
  }
}
