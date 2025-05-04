
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import QuestionnaireForm from "@/components/QuestionnaireForm";
import QuestionnaireProgress from "@/components/QuestionnaireProgress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Questionnaire() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  const sections = [
    "Core Concept & Purpose",
    "Target Audience",
    "Core Features & Functionality",
    "UI/UX",
    "Technical Aspects",
    "Monetization",
    "Future Plans",
  ];

  const handleFormSubmit = (data: Record<string, string>) => {
    // Update the form data with the latest answers
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);

    // If we're on the last section, finalize the submission
    if (currentSection === sections.length - 1) {
      console.log("Form submission complete:", updatedFormData);
      toast({
        title: "Questionnaire Completed",
        description: "Your app details have been saved. You can now generate your mindmap.",
      });
      
      // Create a concise summary for the mindmap generation
      const appDescription = `App Name: ${updatedFormData.appName || "New App"}\n` +
        `Purpose: ${updatedFormData.appPurpose || "N/A"}\n` +
        `Target Audience: ${updatedFormData.targetAudience || "N/A"}\n` +
        `Core Features: ${updatedFormData.coreFeatures || "N/A"}\n`;
      
      // Navigate back to home with the data for mindmap generation
      navigate("/", { state: { appDescription } });
    } else {
      // Move to the next section
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      
      <Card className="border shadow-md">
        <CardHeader className="bg-card border-b">
          <CardTitle className="text-xl font-bold">App Architect AI Questionnaire</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <QuestionnaireProgress 
            currentSection={currentSection} 
            totalSections={sections.length} 
            sectionNames={sections}
          />
          <div className="p-6">
            <QuestionnaireForm 
              currentSection={currentSection} 
              formData={formData}
              onSubmit={handleFormSubmit}
              onPrevious={handlePrevious}
              isLastSection={currentSection === sections.length - 1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
