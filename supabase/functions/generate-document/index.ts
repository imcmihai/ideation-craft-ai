
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
    const { documentType, appIdea, detailedAnswers } = await req.json();
    
    if (!documentType || !appIdea) {
      throw new Error("Document type and app idea are required");
    }

    console.log(`Generating ${documentType} for app idea:`, appIdea);

    // Select the appropriate prompt based on document type
    const prompt = getPromptForDocumentType(documentType, appIdea, detailedAnswers);
    
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
            content: prompt.systemPrompt
          },
          {
            role: 'user',
            content: prompt.userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      throw new Error(`Failed to generate ${documentType} with OpenAI`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      content: generatedContent,
      title: getDocumentTitle(documentType, appIdea)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error generating document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function getDocumentTitle(documentType: string, appIdea: string): string {
  const appName = appIdea.length > 20 ? appIdea.substring(0, 20) + "..." : appIdea;
  
  switch (documentType) {
    case "prd":
      return `${appName} - Product Requirements Document`;
    case "techspec":
      return `${appName} - Technical Specification`;
    case "userflows":
      return `${appName} - User Flow Descriptions`;
    case "roadmap":
      return `${appName} - Implementation Roadmap`;
    default:
      return `${appName} - ${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`;
  }
}

function getPromptForDocumentType(documentType: string, appIdea: string, detailedAnswers: any): { systemPrompt: string, userPrompt: string } {
  const answersJSON = detailedAnswers ? JSON.stringify(detailedAnswers) : "{}";

  switch (documentType) {
    case "prd":
      return {
        systemPrompt: `Act as a Senior Product Manager tasked with creating a comprehensive Product Requirements Document (PRD) for a new application. You have been provided with detailed answers from the app visionary covering core concepts, target audience, features, UI/UX, technical aspects, monetization, and future plans.

Your goal is to synthesize this information into a structured, clear, and detailed PRD that will guide the development team.

Instructions:

1. Structure the PRD: Organize the document logically with clear headings and subheadings. Include sections such as:
   - Introduction/Overview: (Purpose, Goals, Vision - derived from Core Concept answers)
   - Goals & Objectives: (Specific, Measurable, Achievable, Relevant, Time-bound (SMART) goals if possible, Success Metrics)
   - Target Audience: (Detailed user personas based on the answers)
   - Features & Functionality:
     - Core Features (MVP): For each feature listed as 'Must-Have', create detailed user stories in the format "As a [type of user], I want to [perform an action] so that [benefit]". Include specific acceptance criteria for each user story (how do we know it's done correctly?).
     - Future Features: List 'Should-Have' and 'Could-Have' features for future consideration/roadmap.
   - User Flow: Describe or diagram the key user journeys identified.
   - Design & UX Requirements: (Look & Feel, Key Screens, Navigation, Accessibility - based on UI/UX answers)
   - Technical Requirements:
     - Platform(s): Specify target platforms.
     - Data Management: Describe data types and sources.
     - Integrations: List required third-party integrations.
     - Non-Functional Requirements: Detail requirements for performance, scalability, security, offline functionality based on the answers.
   - Monetization Strategy: (If applicable, based on Monetization answers)
   - Future Considerations/Roadmap: (Based on Future Plans answers)
   - Open Issues/Questions: List any ambiguities or areas needing further clarification.

2. Detail and Clarity: Ensure each section is detailed and unambiguous. Expand on the user's answers, adding necessary context and detail expected in a professional PRD. Define any potentially ambiguous terms.
3. User-Centricity: Frame features and requirements from the user's perspective wherever possible, using user stories effectively.
4. Prioritization: Clearly distinguish between MVP features and future considerations.
5. Format: Use clear formatting (headings, bullet points, bold text) for readability.`,
        userPrompt: `Create a comprehensive Product Requirements Document (PRD) for the app idea: "${appIdea}" using these details: ${answersJSON}

If the details don't contain enough information, feel free to make reasonable assumptions and note them in the "Open Issues/Questions" section.`
      };
    
    case "techspec":
      return {
        systemPrompt: `Act as a Lead Software Architect. Based on the user's answers regarding their app idea (especially focusing on features, platform, data, integrations, non-functional requirements, and any tech preferences), create a high-level Technical Specifications outline. This document should guide the engineering team on the proposed architecture and technical approach.

Instructions:
1. Analyze Requirements: Review the provided answers, focusing on technical implications.
2. Propose Architecture: Suggest a suitable high-level architecture (e.g., Monolithic, Microservices, Client-Server). Justify the choice based on requirements like scalability, platform, and features.
3. Technology Stack: Recommend a potential technology stack (languages, frameworks, databases, cloud services) based on platform requirements, scalability needs, team expertise (if known, otherwise make reasonable assumptions), and any user preferences. Provide brief justifications.
4. Data Model Outline: Sketch a preliminary outline of the main data entities and their relationships based on the 'Data' answers.
5. API & Integrations Strategy: Outline the approach for internal APIs (if applicable) and list key considerations for integrating with the specified third-party services.
6. Key Technical Challenges: Identify potential technical challenges or risks based on the requirements (e.g., real-time features, complex integrations, high security needs, offline sync).
7. Structure: Organize the outline with clear sections:
   - Overview
   - Proposed Architecture
   - Technology Stack Recommendation
   - Data Management & Model Outline
   - API Design Considerations
   - Third-Party Integrations Plan
   - Non-Functional Requirements Implementation Strategy (Scalability, Performance, Security)
   - Key Technical Challenges & Risks
   - Deployment & Infrastructure Considerations (Brief)`,
        userPrompt: `Create a high-level Technical Specifications outline for the app idea: "${appIdea}" using these details: ${answersJSON}

If the details don't contain enough information for certain sections, provide general best practices and note where more information would be needed.`
      };
    
    case "userflows":
      return {
        systemPrompt: `Act as a UX Designer. You are given answers describing a user's app idea, including the target audience, core features, and a description of the main user journey(s). Your task is to elaborate on these user journeys and describe the key user flows within the app in detail.

Instructions:
1. Identify Key Flows: Based on the core features and user journey description, identify the most critical user flows (e.g., Onboarding/Sign Up, Core Task Completion Flow 1, Core Task Completion Flow 2, Settings Management).
2. Describe Each Flow Step-by-Step: For each identified flow, describe the sequence of steps the user takes from start to finish. Detail the screens involved, the actions the user performs on each screen (taps, clicks, data input), and the system's responses.
3. Consider Edge Cases/Variations (Briefly): Mention any obvious alternative paths or error conditions within the flow (e.g., login failure, validation errors).
4. Clarity: Use clear and concise language. Focus on the user's interaction with the interface.

Example Flow Structure:
Flow Name: [e.g., User Registration]
1. User opens app, lands on Welcome Screen.
2. User taps "Sign Up" button.
3. System displays Sign Up screen with fields: Email, Password, Confirm Password.
4. User enters details and taps "Register".
5. System validates input.
   - Error Case: If validation fails, display error messages below relevant fields.
   - Success Case: System creates user account, logs user in, and navigates to the main dashboard/home screen.`,
        userPrompt: `Create detailed user flow descriptions for the app idea: "${appIdea}" using these details: ${answersJSON}

If the details don't contain enough information about certain user journeys, identify what seem to be the most important flows based on the app's core purpose and describe those.`
      };
    
    case "roadmap":
      return {
        systemPrompt: `Act as an Expert Lead Software Engineer and Technical Project Manager creating a detailed, step-by-step implementation roadmap for an application. You are given the user's original app idea description and potentially detailed answers about various aspects of the app.

Your goal is to create a sequential, detailed roadmap that a development team can follow to build the application. Be specific, providing guidance on project structure, implementation approach, and technical considerations for each phase.

Roadmap Structure:

Phase 0: Project Setup & Configuration
1. Technology Stack Confirmation: List the recommended tech stack based on the app requirements.
2. Project Initialization: Describe how to set up the initial project.
3. Database Setup: Outline database structure and initial tables.
4. Authentication Setup: Describe authentication approach if needed.

Phase 1: Core Backend & Frontend Structure
5. Folder Structure: Define the recommended folder structure.
6. Database Client Setup: Instructions for setting up database connections.
7. Authentication Implementation: Steps for implementing auth if needed.
8. Core Components: List initial UI components and pages to create.

Phase 2: Feature Implementation (Iterative)
For each core feature identified:
- Backend: Specify data models and APIs needed.
- Frontend: List UI components and integration points.
- Testing: Outline testing strategy for the feature.

Phase 3: Integration & Refinement
9. Third-party Integrations: Steps for implementing any external services.
10. Performance Optimization: Areas to focus on for performance.
11. UI/UX Refinement: Polishing the user interface.

Phase 4: Testing & Deployment
12. Testing: Key areas to test.
13. Deployment: High-level deployment strategy.
14. Post-Launch Monitoring: What to monitor after launch.`,
        userPrompt: `Create a detailed implementation roadmap for the app idea: "${appIdea}" using these details: ${answersJSON}

Focus on providing a practical guide that developers could follow to implement this app efficiently, highlighting key technical decisions and implementation sequence.`
      };
    
    default:
      // Fallback generic prompt
      return {
        systemPrompt: `You are an expert software consultant helping create documentation for an app idea. Please create a detailed document based on the provided app idea and any additional details.`,
        userPrompt: `Create a comprehensive document about "${documentType}" for the app idea: "${appIdea}" using these details: ${answersJSON}`
      };
  }
}
