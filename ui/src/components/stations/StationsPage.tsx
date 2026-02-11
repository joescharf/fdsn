import { useState, useEffect, useRef, useMemo } from "react";
import { useStations, useNetworks } from "@/hooks/useStations";
import { useRefreshTargets, useRefreshAll } from "@/hooks/useExplorer";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StationMap } from "@/components/map/StationMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, List, RefreshCw, Circle, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import type { Station } from "@/types";

type SortColumn = "network" | "station" | "site_name" | "data";
type SortDirection = "asc" | "desc";

function SortHeader({
  label,
  column,
  currentColumn,
  currentDirection,
  onSort,
  className = "",
}: {
  label: string;
  column: SortColumn;
  currentColumn: SortColumn;
  currentDirection: SortDirection;
  onSort: (col: SortColumn) => void;
  className?: string;
}) {
  const isActive = currentColumn === column;
  return (
    <th
      className={`p-2 cursor-pointer select-none hover:bg-muted/70 ${className}`}
      onClick={() => onSort(column)}
    >
      <div className={`flex items-center gap-1 ${className.includes("text-center") ? "justify-center" : className.includes("text-right") ? "justify-end" : ""}`}>
        {label}
        {isActive ? (
          currentDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
        )}
      </div>
    </th>
  );
}

function sortStations(stations: Station[], column: SortColumn, direction: SortDirection): Station[] {
  return [...stations].sort((a, b) => {
    let cmp = 0;
    switch (column) {
      case "network":
        cmp = (a.network_code ?? "").localeCompare(b.network_code ?? "");
        break;
      case "station":
        cmp = a.code.localeCompare(b.code);
        break;
      case "site_name":
        cmp = (a.site_name ?? "").localeCompare(b.site_name ?? "");
        break;
      case "data":
        cmp = (a.has_availability ? 1 : 0) - (b.has_availability ? 1 : 0);
        break;
    }
    if (cmp === 0 && column !== "network") {
      cmp = (a.network_code ?? "").localeCompare(b.network_code ?? "");
    }
    if (cmp === 0 && column !== "station") {
      cmp = a.code.localeCompare(b.code);
    }
    return direction === "asc" ? cmp : -cmp;
  });
}

export function StationsPage() {
  const [networkFilter, setNetworkFilter] = useState("");
  const [stationInput, setStationInput] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("data");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce station filter input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setStationFilter(stationInput);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [stationInput]);

  const { data, isLoading } = useStations({
    network: networkFilter,
    station: stationFilter,
    limit: 500,
  });
  const { data: networks } = useNetworks();
  const { data: refreshTargets } = useRefreshTargets();
  const { progress, run: runRefreshAll } = useRefreshAll();
  const navigate = useNavigate();

  const stations = data?.stations ?? [];

  const sortedStations = useMemo(
    () => sortStations(stations, sortColumn, sortDirection),
    [stations, sortColumn, sortDirection]
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection(column === "data" ? "desc" : "asc");
    }
  };

  const handleRefreshAll = async () => {
    if (!refreshTargets || refreshTargets.length === 0) {
      toast.info("No imported networks to refresh");
      return;
    }
    toast.info(`Refreshing ${refreshTargets.length} networks...`);
    const results = await runRefreshAll(refreshTargets);
    if (results) {
      const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
      const totalAvail = results.reduce((sum, r) => sum + r.availability_count, 0);
      const parts = [`${totalImported} channels refreshed`];
      if (totalAvail > 0) parts.push(`${totalAvail} availability records`);
      toast.success(`Refresh complete: ${parts.join(", ")}`);
    }
  };

  // Unique network codes for dropdown
  const networkOptions = networks
    ? [...new Set(networks.map((n) => n.code))].sort()
    : [];

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stations</h2>
        <p className="text-muted-foreground">
          Browse and manage imported station metadata
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={networkFilter}
          onValueChange={(v) => setNetworkFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All networks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All networks</SelectItem>
            {networkOptions.map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filter by station..."
          value={stationInput}
          onChange={(e) => setStationInput(e.target.value)}
          className="w-40"
        />
        <Badge variant="secondary">{data?.total ?? 0} total</Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          disabled={progress.isRunning || !refreshTargets || refreshTargets.length === 0}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${progress.isRunning ? "animate-spin" : ""}`} />
          {progress.isRunning
            ? `Refreshing ${progress.completed + 1}/${progress.total}`
            : "Refresh All"}
        </Button>
      </div>

      {progress.isRunning && (
        <div className="flex items-center gap-3">
          <Progress value={(progress.completed / progress.total) * 100} className="flex-1" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {progress.currentNetwork}
          </span>
        </div>
      )}

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
                    <SortHeader label="Network" column="network" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-left" />
                    <SortHeader label="Station" column="station" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-left" />
                    <SortHeader label="Site Name" column="site_name" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-left" />
                    <th className="p-2 text-right">Lat</th>
                    <th className="p-2 text-right">Lon</th>
                    <th className="p-2 text-right">Elev (m)</th>
                    <SortHeader label="Data" column="data" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStations.map((s) => (
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
                      <td className="p-2 text-center">
                        <Circle
                          className={`h-3 w-3 inline-block ${
                            s.has_availability
                              ? "fill-green-500 text-green-500"
                              : "fill-muted text-muted-foreground"
                          }`}
                        />
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
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
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
