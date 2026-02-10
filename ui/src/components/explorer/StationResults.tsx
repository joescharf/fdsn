import type { ExploreStation } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

interface Props {
  stations: ExploreStation[];
  selected: ExploreStation[];
  onSelectionChange: (selected: ExploreStation[]) => void;
  isLoading: boolean;
  onImport: () => void;
}

export function StationResults({
  stations,
  selected,
  onSelectionChange,
  onImport,
}: Props) {
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
    if (selected.length === stations.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...stations]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{stations.length} stations found</Badge>
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

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 text-left w-10">
                <input
                  type="checkbox"
                  checked={selected.length === stations.length && stations.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="p-2 text-left">Network</th>
              <th className="p-2 text-left">Station</th>
              <th className="p-2 text-left">Site Name</th>
              <th className="p-2 text-right">Latitude</th>
              <th className="p-2 text-right">Longitude</th>
              <th className="p-2 text-right">Elevation</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => {
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
  );
}
