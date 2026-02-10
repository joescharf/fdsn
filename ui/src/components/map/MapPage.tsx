import { useStations } from "@/hooks/useStations";
import { StationMap } from "./StationMap";
import { Skeleton } from "@/components/ui/skeleton";

export function MapPage() {
  const { data, isLoading } = useStations({ limit: 1000 });

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Station Map</h2>
        <p className="text-muted-foreground">
          Geographic view of imported stations
        </p>
      </div>
      <div className="flex-1 min-h-0 rounded-md border overflow-hidden">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <StationMap stations={data?.stations ?? []} />
        )}
      </div>
    </div>
  );
}
