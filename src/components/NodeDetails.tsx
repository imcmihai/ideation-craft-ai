
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type NodeDetailsProps = {
  isOpen: boolean;
  onClose: () => void;
  node: {
    id: string;
    data: {
      title: string;
      details: string;
    };
    type: string;
  } | null;
};

export default function NodeDetails({ isOpen, onClose, node }: NodeDetailsProps) {
  if (!node) return null;

  const getTypeColor = () => {
    switch (node.type) {
      case 'core':
        return 'text-mindmap-primary';
      case 'marketing':
        return 'text-mindmap-marketing';
      case 'development':
        return 'text-mindmap-development';
      case 'promotion':
        return 'text-mindmap-promotion';
      case 'research':
        return 'text-mindmap-research';
      case 'finance':
        return 'text-mindmap-finance';
      default:
        return 'text-primary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`text-xl font-semibold ${getTypeColor()}`}>
            {node.data.title}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <div className="space-y-4">
          <DialogDescription className="text-foreground whitespace-pre-line">
            {node.data.details}
          </DialogDescription>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
