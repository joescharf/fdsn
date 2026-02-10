import { useState } from "react";
import { useStations } from "@/hooks/useStations";
import { useImportStations } from "@/hooks/useExplorer";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StationMap } from "@/components/map/StationMap";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, List, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function StationsPage() {
  const [networkFilter, setNetworkFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const { data, isLoading } = useStations({
    network: networkFilter,
    station: stationFilter,
    limit: 500,
  });
  const navigate = useNavigate();
  const importMutation = useImportStations();
  const qc = useQueryClient();

  const stations = data?.stations ?? [];

  // Determine if we can refresh a whole network:
  // need a network filter and at least one station with a source_id
  const networkSourceId = networkFilter && stations.length > 0
    ? stations[0].source_id
    : undefined;

  const handleRefreshNetwork = () => {
    if (!networkSourceId || !networkFilter) return;
    importMutation.mutate(
      {
        source_id: networkSourceId,
        network: networkFilter,
        station: stationFilter || "",
      },
      {
        onSuccess: (data) => {
          const parts = [`${data.imported} channels imported`];
          if (data.availability_count > 0) {
            parts.push(`${data.availability_count} availability records`);
          }
          toast.success(`Refreshed: ${parts.join(", ")}`);
          qc.invalidateQueries({ queryKey: ["stations"] });
          qc.invalidateQueries({ queryKey: ["availability"] });
        },
        onError: (err) => {
          toast.error(`Refresh failed: ${err.message}`);
        },
      }
    );
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stations</h2>
        <p className="text-muted-foreground">
          Browse and manage imported station metadata
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter by network..."
          value={networkFilter}
          onChange={(e) => setNetworkFilter(e.target.value)}
          className="w-40"
        />
        <Input
          placeholder="Filter by station..."
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="w-40"
        />
        <Badge variant="secondary">{data?.total ?? 0} total</Badge>
        {networkSourceId ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshNetwork}
            disabled={importMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${importMutation.isPending ? "animate-spin" : ""}`} />
            {importMutation.isPending
              ? "Refreshing..."
              : stationFilter
                ? `Refresh ${networkFilter}.${stationFilter}`
                : `Refresh ${networkFilter}`}
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="table" className="flex-1 min-h-0 flex flex-col">
        <TabsList>
          <TabsTrigger value="table">
            <List className="h-4 w-4 mr-2" />
            Table
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="h-4 w-4 mr-2" />
            Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="flex-1">
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="border rounded-md overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-2 text-left">Network</th>
                    <th className="p-2 text-left">Station</th>
                    <th className="p-2 text-left">Site Name</th>
                    <th className="p-2 text-right">Lat</th>
                    <th className="p-2 text-right">Lon</th>
                    <th className="p-2 text-right">Elev (m)</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/stations/${s.id}`)}
                    >
                      <td className="p-2 font-mono">{s.network_code}</td>
                      <td className="p-2 font-mono font-medium">{s.code}</td>
                      <td className="p-2">{s.site_name}</td>
                      <td className="p-2 text-right font-mono">
                        {s.latitude.toFixed(4)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {s.longitude.toFixed(4)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {s.elevation.toFixed(1)}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/stations/${s.id}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {stations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No stations imported yet. Use the Explorer to search and import.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="map" className="flex-1 min-h-[400px]">
          <div className="h-full border rounded-md overflow-hidden">
            <StationMap stations={stations} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
