import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import type { Channel, ChannelAvailability } from "@/types";
import { ArrowUp, ArrowDown, ArrowUpDown, Activity } from "lucide-react";

type SortColumn = "location" | "channel" | "sample_rate" | "azimuth" | "dip" | "sensor" | "depth" | "earliest" | "latest";
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
  channels: Channel[];
  availability?: ChannelAvailability[];
  sourceId?: number;
  networkCode?: string;
  stationCode?: string;
  stationId?: number;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

function compareNullable(a: number | null | undefined, b: number | null | undefined): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function compareStrings(a: string | null | undefined, b: string | null | undefined): number {
  return (a ?? "").localeCompare(b ?? "");
}

export function ChannelTable({ channels, availability, sourceId, networkCode, stationCode, stationId }: Props) {
  const navigate = useNavigate();
  const canNavigate = !!(sourceId && networkCode && stationCode && stationId);
  const [sortColumn, setSortColumn] = useState<SortColumn>("channel");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Build lookup: "location_code.channel_code" → availability record
  const availMap = useMemo(() => {
    if (!availability?.length) return new Map<string, ChannelAvailability>();
    const m = new Map<string, ChannelAvailability>();
    for (const a of availability) {
      m.set(`${a.location_code}.${a.channel_code}`, a);
    }
    return m;
  }, [availability]);

  const hasAvail = availMap.size > 0;

  const sorted = useMemo(() => {
    return [...channels].sort((a, b) => {
      let cmp = 0;
      const aAvail = availMap.get(`${a.location_code}.${a.code}`);
      const bAvail = availMap.get(`${b.location_code}.${b.code}`);

      switch (sortColumn) {
        case "location":
          cmp = (a.location_code || "").localeCompare(b.location_code || "");
          break;
        case "channel":
          cmp = a.code.localeCompare(b.code);
          break;
        case "sample_rate":
          cmp = compareNullable(a.sample_rate, b.sample_rate);
          break;
        case "azimuth":
          cmp = compareNullable(a.azimuth, b.azimuth);
          break;
        case "dip":
          cmp = compareNullable(a.dip, b.dip);
          break;
        case "sensor":
          cmp = compareStrings(a.sensor_description, b.sensor_description);
          break;
        case "depth":
          cmp = compareNullable(a.depth, b.depth);
          break;
        case "earliest":
          cmp = compareStrings(aAvail?.earliest, bAvail?.earliest);
          break;
        case "latest":
          cmp = compareStrings(aAvail?.latest, bAvail?.latest);
          break;
      }
      // Secondary sort by location then channel
      if (cmp === 0 && sortColumn !== "location") {
        cmp = (a.location_code || "").localeCompare(b.location_code || "");
      }
      if (cmp === 0 && sortColumn !== "channel") {
        cmp = a.code.localeCompare(b.code);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [channels, availMap, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      // Default desc for date/availability columns, asc for everything else
      setSortDirection(column === "earliest" || column === "latest" ? "desc" : "asc");
    }
  };

  if (channels.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No channels available</p>
    );
  }

  return (
    <div className="border rounded-md overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <SortHeader label="Location" column="location" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-left" />
            <SortHeader label="Channel" column="channel" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-left" />
            <SortHeader label="Sample Rate" column="sample_rate" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
            <SortHeader label="Azimuth" column="azimuth" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
            <SortHeader label="Dip" column="dip" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
            <SortHeader label="Sensor" column="sensor" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-left" />
            <SortHeader label="Depth (m)" column="depth" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
            {hasAvail && (
              <>
                <SortHeader label="Data Available" column="earliest" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-left" />
                <SortHeader label="Data Latest" column="latest" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-left" />
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((ch) => {
            const avail = availMap.get(`${ch.location_code}.${ch.code}`);
            const channelKey = `${ch.location_code || "--"}.${ch.code}`;
            const handleRowClick = canNavigate
              ? () => {
                  const params = new URLSearchParams({
                    source_id: String(sourceId),
                    network: networkCode!,
                    station_id: String(stationId),
                    station: stationCode!,
                    channel: channelKey,
                  });
                  navigate(`/waveforms?${params.toString()}`);
                }
              : undefined;
            return (
              <tr
                key={ch.id}
                className={`border-t ${canNavigate ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}`}
                onClick={handleRowClick}
                title={canNavigate ? "View waveform" : undefined}
              >
                <td className="p-2 font-mono">{ch.location_code || "--"}</td>
                <td className="p-2 font-mono font-medium">
                  <span className="flex items-center gap-1.5">
                    {ch.code}
                    {canNavigate && <Activity className="h-3 w-3 text-muted-foreground" />}
                  </span>
                </td>
                <td className="p-2 text-right font-mono">
                  {ch.sample_rate?.toFixed(1) ?? "-"}
                </td>
                <td className="p-2 text-right font-mono">
                  {ch.azimuth?.toFixed(1) ?? "-"}
                </td>
                <td className="p-2 text-right font-mono">
                  {ch.dip?.toFixed(1) ?? "-"}
                </td>
                <td className="p-2 text-xs max-w-[200px] truncate">
                  {ch.sensor_description || "-"}
                </td>
                <td className="p-2 text-right font-mono">
                  {ch.depth?.toFixed(1) ?? "-"}
                </td>
                {hasAvail && (
                  <>
                    <td className="p-2 font-mono text-xs">
                      {avail?.earliest ? (
                        <span className="text-green-600 dark:text-green-400">
                          {formatDate(avail.earliest)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {avail?.latest ? (
                        <span className="text-green-600 dark:text-green-400">
                          {formatDate(avail.latest)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
