import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import type { ExploreStation, Station } from "@/types";
import { useImportStations } from "@/hooks/useExplorer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, RefreshCw, Circle, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

interface Props {
  stations: ExploreStation[];
  selected: ExploreStation[];
  onSelectionChange: (selected: ExploreStation[]) => void;
  isLoading: boolean;
  onImport: () => void;
  importedStationMap: Map<string, Station>;
  sourceId: number;
}

export function StationResults({
  stations,
  selected,
  onSelectionChange,
  onImport,
  importedStationMap,
  sourceId,
}: Props) {
  const navigate = useNavigate();
  const importMutation = useImportStations();
  const qc = useQueryClient();

  // Sorting state for imported table
  const [importedSortCol, setImportedSortCol] = useState<SortColumn>("data");
  const [importedSortDir, setImportedSortDir] = useState<SortDirection>("desc");

  // Sorting state for available table
  const [availableSortCol, setAvailableSortCol] = useState<SortColumn>("network");
  const [availableSortDir, setAvailableSortDir] = useState<SortDirection>("asc");

  // Split stations into imported and available
  const importedStations: { explore: ExploreStation; local: Station }[] = [];
  const availableStations: ExploreStation[] = [];

  for (const s of stations) {
    const key = `${s.Network}.${s.Station}`;
    const local = importedStationMap.get(key);
    if (local) {
      importedStations.push({ explore: s, local });
    } else {
      availableStations.push(s);
    }
  }

  // Sort imported stations
  const sortedImported = useMemo(() => {
    return [...importedStations].sort((a, b) => {
      let cmp = 0;
      switch (importedSortCol) {
        case "network":
          cmp = a.explore.Network.localeCompare(b.explore.Network);
          break;
        case "station":
          cmp = a.explore.Station.localeCompare(b.explore.Station);
          break;
        case "site_name":
          cmp = (a.explore.SiteName ?? "").localeCompare(b.explore.SiteName ?? "");
          break;
        case "data":
          cmp = (a.local.has_availability ? 1 : 0) - (b.local.has_availability ? 1 : 0);
          break;
      }
      if (cmp === 0 && importedSortCol !== "network") {
        cmp = a.explore.Network.localeCompare(b.explore.Network);
      }
      if (cmp === 0 && importedSortCol !== "station") {
        cmp = a.explore.Station.localeCompare(b.explore.Station);
      }
      return importedSortDir === "asc" ? cmp : -cmp;
    });
  }, [importedStations.length, importedSortCol, importedSortDir]);

  // Sort available stations
  const sortedAvailable = useMemo(() => {
    return [...availableStations].sort((a, b) => {
      let cmp = 0;
      switch (availableSortCol) {
        case "network":
          cmp = a.Network.localeCompare(b.Network);
          break;
        case "station":
          cmp = a.Station.localeCompare(b.Station);
          break;
        case "site_name":
          cmp = (a.SiteName ?? "").localeCompare(b.SiteName ?? "");
          break;
        default:
          cmp = a.Network.localeCompare(b.Network);
          break;
      }
      if (cmp === 0 && availableSortCol !== "network") {
        cmp = a.Network.localeCompare(b.Network);
      }
      if (cmp === 0 && availableSortCol !== "station") {
        cmp = a.Station.localeCompare(b.Station);
      }
      return availableSortDir === "asc" ? cmp : -cmp;
    });
  }, [availableStations.length, availableSortCol, availableSortDir]);

  const handleImportedSort = (column: SortColumn) => {
    if (importedSortCol === column) {
      setImportedSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setImportedSortCol(column);
      setImportedSortDir(column === "data" ? "desc" : "asc");
    }
  };

  const handleAvailableSort = (column: SortColumn) => {
    if (availableSortCol === column) {
      setAvailableSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setAvailableSortCol(column);
      setAvailableSortDir("asc");
    }
  };

  const toggleSelect = (station: ExploreStation) => {
    const key = `${station.Network}.${station.Station}`;
    const exists = selected.some(
      (s) => `${s.Network}.${s.Station}` === key
    );
    if (exists) {
      onSelectionChange(
        selected.filter((s) => `${s.Network}.${s.Station}` !== key)
      );
    } else {
      onSelectionChange([...selected, station]);
    }
  };

  const toggleAll = () => {
    if (selected.length === availableStations.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...availableStations]);
    }
  };

  const handleRefreshStation = (s: ExploreStation) => {
    importMutation.mutate(
      {
        source_id: sourceId,
        network: s.Network,
        station: s.Station,
      },
      {
        onSuccess: (data) => {
          toast.success(`Refreshed ${s.Network}.${s.Station}: ${data.imported} channels`);
          qc.invalidateQueries({ queryKey: ["stations"] });
        },
        onError: (err) => {
          toast.error(`Refresh failed: ${err.message}`);
        },
      }
    );
  };

  const allImported = availableStations.length === 0 && importedStations.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{stations.length} stations found</Badge>
          {importedStations.length > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              {importedStations.length} imported
            </Badge>
          )}
          {selected.length > 0 && (
            <Badge>{selected.length} selected</Badge>
          )}
        </div>
        {selected.length > 0 && (
          <Button onClick={onImport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Import Selected
          </Button>
        )}
      </div>

      {allImported && (
        <p className="text-sm text-muted-foreground">
          All matching stations are already imported.
        </p>
      )}

      {/* Already Imported Section */}
      {importedStations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Already Imported ({importedStations.length})
          </h4>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <SortHeader label="Network" column="network" currentColumn={importedSortCol} currentDirection={importedSortDir} onSort={handleImportedSort} className="text-left" />
                  <SortHeader label="Station" column="station" currentColumn={importedSortCol} currentDirection={importedSortDir} onSort={handleImportedSort} className="text-left" />
                  <SortHeader label="Site Name" column="site_name" currentColumn={importedSortCol} currentDirection={importedSortDir} onSort={handleImportedSort} className="text-left" />
                  <th className="p-2 text-right">Latitude</th>
                  <th className="p-2 text-right">Longitude</th>
                  <SortHeader label="Data" column="data" currentColumn={importedSortCol} currentDirection={importedSortDir} onSort={handleImportedSort} className="text-center" />
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedImported.map(({ explore: s, local }) => (
                  <tr
                    key={`${s.Network}.${s.Station}`}
                    className="border-t bg-green-50/30 dark:bg-green-950/10"
                  >
                    <td className="p-2 font-mono">
                      {s.Network}
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-600 text-xs">
                        Imported
                      </Badge>
                    </td>
                    <td className="p-2 font-mono font-medium">{s.Station}</td>
                    <td className="p-2">{s.SiteName}</td>
                    <td className="p-2 text-right font-mono">{s.Latitude.toFixed(4)}</td>
                    <td className="p-2 text-right font-mono">{s.Longitude.toFixed(4)}</td>
                    <td className="p-2 text-center">
                      <Circle
                        className={`h-3 w-3 inline-block ${
                          local.has_availability
                            ? "fill-green-500 text-green-500"
                            : "fill-muted text-muted-foreground"
                        }`}
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/stations/${local.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRefreshStation(s)}
                          disabled={importMutation.isPending}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${importMutation.isPending ? "animate-spin" : ""}`} />
                          Refresh
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available to Import Section */}
      {availableStations.length > 0 && (
        <div className="space-y-2">
          {importedStations.length > 0 && (
            <h4 className="text-sm font-medium text-muted-foreground">
              Available to Import ({availableStations.length})
            </h4>
          )}
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === availableStations.length && availableStations.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <SortHeader label="Network" column="network" currentColumn={availableSortCol} currentDirection={availableSortDir} onSort={handleAvailableSort} className="text-left" />
                  <SortHeader label="Station" column="station" currentColumn={availableSortCol} currentDirection={availableSortDir} onSort={handleAvailableSort} className="text-left" />
                  <SortHeader label="Site Name" column="site_name" currentColumn={availableSortCol} currentDirection={availableSortDir} onSort={handleAvailableSort} className="text-left" />
                  <th className="p-2 text-right">Latitude</th>
                  <th className="p-2 text-right">Longitude</th>
                  <th className="p-2 text-right">Elevation</th>
                </tr>
              </thead>
              <tbody>
                {sortedAvailable.map((s) => {
                  const key = `${s.Network}.${s.Station}`;
                  const isSelected = selected.some(
                    (sel) => `${sel.Network}.${sel.Station}` === key
                  );
                  return (
                    <tr
                      key={key}
                      className={`border-t cursor-pointer hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}
                      onClick={() => toggleSelect(s)}
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(s)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-2 font-mono">{s.Network}</td>
                      <td className="p-2 font-mono font-medium">{s.Station}</td>
                      <td className="p-2">{s.SiteName}</td>
                      <td className="p-2 text-right font-mono">
                        {s.Latitude.toFixed(4)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {s.Longitude.toFixed(4)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {s.Elevation.toFixed(1)}m
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
