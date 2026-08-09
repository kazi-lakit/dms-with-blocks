import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  id: string;
  name: string;
}

export function Breadcrumbs({
  trail,
  onNavigate,
  rootLabel = "My files",
}: {
  trail: Crumb[];
  onNavigate: (index: number) => void;
  rootLabel?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1 text-sm text-steel">
      <button
        onClick={() => onNavigate(-1)}
        className="flex items-center gap-1.5 rounded-sm px-2 py-1 hover:bg-surface hover:text-ink"
      >
        <Home size={14} />
        <span className={trail.length === 0 ? "font-medium text-ink" : undefined}>{rootLabel}</span>
      </button>
      {trail.map((crumb, index) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-muted" />
          <button
            onClick={() => onNavigate(index)}
            className={
              "truncate rounded-sm px-2 py-1 hover:bg-surface hover:text-ink " +
              (index === trail.length - 1 ? "font-medium text-ink" : "")
            }
          >
            {crumb.name}
          </button>
        </span>
      ))}
    </div>
  );
}
