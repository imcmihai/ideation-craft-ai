
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface QuestionnaireProgressProps {
  currentSection: number;
  totalSections: number;
  sectionNames: string[];
}

export default function QuestionnaireProgress({ 
  currentSection, 
  totalSections,
  sectionNames
}: QuestionnaireProgressProps) {
  const progressPercentage = ((currentSection + 1) / totalSections) * 100;
  
  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">
          Step {currentSection + 1} of {totalSections}: {sectionNames[currentSection]}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progressPercentage)}% complete
        </span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      
      <div className="mt-4 space-y-1">
        <div className="grid grid-cols-7 gap-1">
          {sectionNames.map((name, index) => (
            <div 
              key={index} 
              className={`text-xs truncate text-center ${index <= currentSection ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              {name}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {sectionNames.map((_, index) => (
            <div 
              key={index} 
              className={`h-1 rounded-full ${index <= currentSection ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
