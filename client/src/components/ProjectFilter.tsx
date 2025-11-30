import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ProjectFilterProps {
  projects: string[];
  selectedProjects: string[];
  onToggleProject: (project: string) => void;
  onClearAll: () => void;
}

export default function ProjectFilter({
  projects,
  selectedProjects,
  onToggleProject,
  onClearAll
}: ProjectFilterProps) {
  if (projects.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">Projects</h4>
        {selectedProjects.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-auto p-1 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {projects.map(project => {
          const isSelected = selectedProjects.includes(project);
          return (
            <Badge
              key={project}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={() => onToggleProject(project)}
            >
              {project}
              {isSelected && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Badge>
          );
        })}
      </div>

      {selectedProjects.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Showing {selectedProjects.length} of {projects.length} projects
        </div>
      )}
    </div>
  );
}