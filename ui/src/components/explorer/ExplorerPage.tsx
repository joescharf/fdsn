import { useState } from "react";
import { useSources } from "@/hooks/useSources";
import { useExploreStations, useImportStations } from "@/hooks/useExplorer";
import type { ExploreStation, Source } from "@/types";
import { StationSearch } from "./StationSearch";
import { StationResults } from "./StationResults";
import { ImportDialog } from "./ImportDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SearchParams {
  net: string;
  sta: string;
  cha: string;
}

export function ExplorerPage() {
  const { data: sources } = useSources();
  const [sourceId, setSourceId] = useState<number>(0);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [selected, setSelected] = useState<ExploreStation[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  const exploreQuery = useExploreStations(
    searchParams && sourceId > 0
      ? { sourceId, net: searchParams.net, sta: searchParams.sta, cha: searchParams.cha }
      : null
  );
  const importMutation = useImportStations();

  const selectedSource = sources?.find((s: Source) => s.id === sourceId);

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    setSelected([]);
  };

  const handleImport = () => {
    if (!selectedSource || selected.length === 0) return;

    // Build a station filter from selected rows
    const staCodes = [...new Set(selected.map((s) => s.Station))].join(",");
    const netCodes = [...new Set(selected.map((s) => s.Network))].join(",");

    importMutation.mutate(
      {
        source_id: selectedSource.id,
        network: netCodes,
        station: staCodes,
      },
      {
        onSuccess: (data) => {
          setImportOpen(false);
          setSelected([]);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Station Explorer</h2>
        <p className="text-muted-foreground">
          Search external FDSN sources and import station metadata
        </p>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label>Source</Label>
          <Select
            value={sourceId > 0 ? String(sourceId) : ""}
            onValueChange={(v) => {
              setSourceId(Number(v));
              setSearchParams(null);
              setSelected([]);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a source" />
            </SelectTrigger>
            <SelectContent>
              {sources?.map((s: Source) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {sourceId > 0 && <StationSearch onSearch={handleSearch} />}
      </div>

      {exploreQuery.data && (
        <StationResults
          stations={exploreQuery.data}
          selected={selected}
          onSelectionChange={setSelected}
          isLoading={exploreQuery.isLoading}
          onImport={() => setImportOpen(true)}
        />
      )}

      {exploreQuery.isLoading && (
        <p className="text-muted-foreground">Searching...</p>
      )}
      {exploreQuery.isError && (
        <p className="text-destructive">
          Error: {(exploreQuery.error as Error).message}
        </p>
      )}

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        selected={selected}
        onConfirm={handleImport}
        isPending={importMutation.isPending}
        result={importMutation.data}
      />
    </div>
  );
}
