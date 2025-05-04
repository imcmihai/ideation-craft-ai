
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

interface QuestionnaireFormProps {
  currentSection: number;
  formData: Record<string, string>;
  onSubmit: (data: Record<string, string>) => void;
  onPrevious: () => void;
  isLastSection: boolean;
}

export default function QuestionnaireForm({
  currentSection,
  formData,
  onSubmit,
  onPrevious,
  isLastSection
}: QuestionnaireFormProps) {
  const form = useForm<Record<string, string>>({
    defaultValues: formData
  });

  // Reset form with formData values when section changes
  useEffect(() => {
    form.reset(formData);
  }, [currentSection, formData, form]);

  const handleSubmit = (data: Record<string, string>) => {
    onSubmit(data);
  };

  const renderQuestionFields = () => {
    switch (currentSection) {
      case 0: // Core Concept & Purpose
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appName">1. What is the name of your app?</Label>
              <Input 
                id="appName" 
                {...form.register("appName")} 
                placeholder="Enter your app name" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appPurpose">2. What is the primary purpose of your app?</Label>
              <Textarea 
                id="appPurpose" 
                {...form.register("appPurpose")} 
                placeholder="Describe what problem your app solves or what value it provides" 
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="uniqueValue">3. What makes your app unique compared to similar solutions?</Label>
              <Textarea 
                id="uniqueValue" 
                {...form.register("uniqueValue")} 
                placeholder="Describe what sets your app apart from competitors" 
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appCategory">4. What category best describes your app?</Label>
              <Input 
                id="appCategory" 
                {...form.register("appCategory")} 
                placeholder="E.g., Productivity, Health & Fitness, Education, etc." 
              />
            </div>
          </div>
        );
        
      case 1: // Target Audience
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">5. Who is your primary target audience?</Label>
              <Textarea 
                id="targetAudience" 
                {...form.register("targetAudience")} 
                placeholder="Describe the demographics, behaviors, and needs of your ideal users" 
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userNeeds">6. What are the main pain points or needs of your users?</Label>
              <Textarea 
                id="userNeeds" 
                {...form.register("userNeeds")} 
                placeholder="List the problems your users face that your app will solve" 
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userBenefit">7. How will users benefit from using your app?</Label>
              <Textarea 
                id="userBenefit" 
                {...form.register("userBenefit")} 
                placeholder="Describe the value proposition and benefits for your users" 
                rows={3}
              />
            </div>
          </div>
        );
        
      case 2: // Core Features & Functionality
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="coreFeatures">8. What are the core features of your app?</Label>
              <Textarea 
                id="coreFeatures" 
                {...form.register("coreFeatures")} 
                placeholder="List the main features that define your app" 
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mvpFeatures">9. Which features must be included in the Minimum Viable Product (MVP)?</Label>
              <Textarea 
                id="mvpFeatures" 
                {...form.register("mvpFeatures")} 
                placeholder="List the essential features needed for the first release" 
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userJourney">10. Describe the typical user journey within the app</Label>
              <Textarea 
                id="userJourney" 
                {...form.register("userJourney")} 
                placeholder="Outline the steps a user would take from opening the app to achieving their goal" 
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>11. Will your app require user accounts?</Label>
              <RadioGroup 
                defaultValue={formData.requiresAccounts || "yes"}
                onValueChange={(value) => form.setValue("requiresAccounts", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="account-yes" />
                  <Label htmlFor="account-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="account-no" />
                  <Label htmlFor="account-no">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="optional" id="account-optional" />
                  <Label htmlFor="account-optional">Optional</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
        
      case 3: // UI/UX
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appStyle">12. What style or aesthetic are you aiming for?</Label>
              <Textarea 
                id="appStyle" 
                {...form.register("appStyle")} 
                placeholder="Describe the visual style, theme, or mood you want for your app" 
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appScreens">13. What are the main screens or pages in your app?</Label>
              <Textarea 
                id="appScreens" 
                {...form.register("appScreens")} 
                placeholder="List the key screens a user would navigate through" 
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="competitorUI">14. Are there any existing apps with a UI you like?</Label>
              <Textarea 
                id="competitorUI" 
                {...form.register("competitorUI")} 
                placeholder="Mention apps with interfaces you find appealing or would like to emulate" 
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accessibilityNeeds">15. Any specific accessibility considerations?</Label>
              <Textarea 
                id="accessibilityNeeds" 
                {...form.register("accessibilityNeeds")} 
                placeholder="List any particular accessibility requirements or considerations" 
                rows={2}
              />
            </div>
          </div>
        );
        
      case 4: // Technical Aspects
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>16. Which platforms will your app support?</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="platform-ios" 
                    checked={form.watch("platform_ios") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("platform_ios", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="platform-ios">iOS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="platform-android" 
                    checked={form.watch("platform_android") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("platform_android", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="platform-android">Android</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="platform-web" 
                    checked={form.watch("platform_web") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("platform_web", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="platform-web">Web App</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="platform-desktop" 
                    checked={form.watch("platform_desktop") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("platform_desktop", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="platform-desktop">Desktop</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataStorage">17. What type of data will your app store?</Label>
              <Textarea 
                id="dataStorage" 
                {...form.register("dataStorage")} 
                placeholder="Describe what user data needs to be stored and how" 
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>18. Will your app require an internet connection?</Label>
              <RadioGroup 
                defaultValue={formData.internetRequired || "always"}
                onValueChange={(value) => form.setValue("internetRequired", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="always" id="internet-always" />
                  <Label htmlFor="internet-always">Yes, always</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sometimes" id="internet-sometimes" />
                  <Label htmlFor="internet-sometimes">Sometimes (hybrid)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="internet-no" />
                  <Label htmlFor="internet-no">No (fully offline)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="thirdPartyServices">19. Will your app integrate with any third-party services?</Label>
              <Textarea 
                id="thirdPartyServices" 
                {...form.register("thirdPartyServices")} 
                placeholder="List any external APIs, services, or platforms your app will use" 
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>20. Do you require any specific technologies or frameworks?</Label>
              <Textarea 
                id="technologies" 
                {...form.register("technologies")} 
                placeholder="Specify any technologies you want to use (React, Flutter, etc.)" 
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>21. Any specific security requirements?</Label>
              <Textarea 
                id="security" 
                {...form.register("security")} 
                placeholder="Describe any security features or compliance requirements" 
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>22. Will your app need push notifications?</Label>
              <RadioGroup 
                defaultValue={formData.pushNotifications || "yes"}
                onValueChange={(value) => form.setValue("pushNotifications", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="push-yes" />
                  <Label htmlFor="push-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="push-no" />
                  <Label htmlFor="push-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
        
      case 5: // Monetization
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>23. How do you plan to monetize your app?</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="monetize-free" 
                    checked={form.watch("monetize_free") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("monetize_free", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="monetize-free">Free (no monetization)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="monetize-ads" 
                    checked={form.watch("monetize_ads") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("monetize_ads", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="monetize-ads">In-app advertising</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="monetize-purchase" 
                    checked={form.watch("monetize_purchase") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("monetize_purchase", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="monetize-purchase">One-time purchase</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="monetize-subscription" 
                    checked={form.watch("monetize_subscription") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("monetize_subscription", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="monetize-subscription">Subscription</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="monetize-freemium" 
                    checked={form.watch("monetize_freemium") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("monetize_freemium", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="monetize-freemium">Freemium model</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="monetize-iap" 
                    checked={form.watch("monetize_iap") === "true"}
                    onCheckedChange={(checked) => 
                      form.setValue("monetize_iap", checked ? "true" : "false")
                    }
                  />
                  <Label htmlFor="monetize-iap">In-app purchases</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pricingDetails">24. If applicable, describe your pricing strategy</Label>
              <Textarea 
                id="pricingDetails" 
                {...form.register("pricingDetails")} 
                placeholder="Provide details about your pricing tiers, subscription costs, etc." 
                rows={3}
              />
            </div>
          </div>
        );
        
      case 6: // Future Plans
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="futurePlans">25. What are your long-term plans or potential future features?</Label>
              <Textarea 
                id="futurePlans" 
                {...form.register("futurePlans")} 
                placeholder="Describe your vision for future versions of your app" 
                rows={5}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Anything else you'd like to add?</Label>
              <Textarea 
                id="additionalInfo" 
                {...form.register("additionalInfo")} 
                placeholder="Add any other information that might be relevant" 
                rows={4}
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-8">
        {renderQuestionFields()}
        
        <div className="flex justify-between pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onPrevious}
            disabled={currentSection === 0}
          >
            Previous
          </Button>
          
          <Button type="submit">
            {isLastSection ? "Complete" : "Next"}
          </Button>
        </div>
      </div>
    </form>
  );
}
