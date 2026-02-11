import type { Source } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SourcePickerProps {
  sources: Source[];
  sourceId: number;
  onSelect: (id: number) => void;
}

export function SourcePicker({ sources, sourceId, onSelect }: SourcePickerProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sources.map((s) => (
        <Card
          key={s.id}
          role="button"
          tabIndex={0}
          onClick={() => s.enabled && onSelect(s.id)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && s.enabled) {
              e.preventDefault();
              onSelect(s.id);
            }
          }}
          className={cn(
            "cursor-pointer transition-colors",
            s.id === sourceId && "ring-2 ring-primary",
            !s.enabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{s.name}</CardTitle>
              <Badge variant={s.enabled ? "default" : "secondary"}>
                {s.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            {s.description && <CardDescription>{s.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground truncate mb-3">{s.base_url}</p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-medium">{s.network_count ?? 0}</span>{" "}
                <span className="text-muted-foreground">networks</span>
              </div>
              <div>
                <span className="font-medium">{s.station_count ?? 0}</span>{" "}
                <span className="text-muted-foreground">stations</span>
              </div>
              <div>
                <span className="font-medium">{s.availability_count ?? 0}</span>{" "}
                <span className="text-muted-foreground">w/ availability</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
