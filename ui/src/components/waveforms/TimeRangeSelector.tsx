import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  starttime: string;
  endtime: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  availableRange?: { earliest: string; latest: string } | null;
}

function isoString(date: Date): string {
  return date.toISOString().slice(0, 19);
}

const presets = [
  { label: "Last Hour", hours: 1 },
  { label: "Last 6h", hours: 6 },
  { label: "Last Day", hours: 24 },
  { label: "Last Week", hours: 168 },
];

export function TimeRangeSelector({
  starttime,
  endtime,
  onStartChange,
  onEndChange,
  availableRange,
}: Props) {
  const applyPreset = (hours: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 3600 * 1000);
    onStartChange(isoString(start));
    onEndChange(isoString(end));
  };

  const applyFullRange = () => {
    if (!availableRange) return;
    onStartChange(availableRange.earliest.slice(0, 19));
    onEndChange(availableRange.latest.slice(0, 19));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input
            type="datetime-local"
            value={starttime.replace("Z", "").slice(0, 16)}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-[200px]"
          />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input
            type="datetime-local"
            value={endtime.replace("Z", "").slice(0, 16)}
            onChange={(e) => onEndChange(e.target.value)}
            className="w-[200px]"
          />
        </div>
        <div className="flex gap-1">
          {presets.map((p) => (
            <Button
              key={p.hours}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(p.hours)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
      {availableRange && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Data available: {availableRange.earliest.slice(0, 10)} &ndash;{" "}
            {availableRange.latest.slice(0, 10)}
          </span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={applyFullRange}
          >
            Use full range
          </Button>
        </div>
      )}
    </div>
  );
}
