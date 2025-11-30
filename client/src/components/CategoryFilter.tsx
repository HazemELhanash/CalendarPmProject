import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Category {
  name: string;
  color: string;
  active: boolean;
}

interface CategoryFilterProps {
  categories: Category[];
  onToggle: (categoryName: string) => void;
}

export default function CategoryFilter({ categories, onToggle }: CategoryFilterProps) {
  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold mb-3">Categories</h3>
      <div className="space-y-2">
        {categories.map(category => (
          <button
            key={category.name}
            onClick={() => onToggle(category.name)}
            className={`
              w-full flex items-center justify-between p-2 rounded-md hover-elevate active-elevate-2 smooth-transition hover-scale
              ${category.active ? 'bg-accent' : ''}
            `}
            data-testid={`button-category-${category.name.toLowerCase()}`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm">{category.name}</span>
            </div>
            {category.active && (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
