import { useMemo } from "react";
import type { Channel, ChannelAvailability } from "@/types";

interface Props {
  channels: Channel[];
  availability?: ChannelAvailability[];
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

export function ChannelTable({ channels, availability }: Props) {
  // Build lookup: "location_code.channel_code" → availability record
  const availMap = useMemo(() => {
    if (!availability?.length) return new Map<string, ChannelAvailability>();
    const m = new Map<string, ChannelAvailability>();
    for (const a of availability) {
      m.set(`${a.location_code}.${a.channel_code}`, a);
    }
    return m;
  }, [availability]);

  // Sort: channels with availability data first
  const sorted = useMemo(() => {
    if (!availMap.size) return channels;
    return [...channels].sort((a, b) => {
      const aHas = availMap.has(`${a.location_code}.${a.code}`) ? 0 : 1;
      const bHas = availMap.has(`${b.location_code}.${b.code}`) ? 0 : 1;
      return aHas - bHas;
    });
  }, [channels, availMap]);

  const hasAvail = availMap.size > 0;

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
            <th className="p-2 text-left">Location</th>
            <th className="p-2 text-left">Channel</th>
            <th className="p-2 text-right">Sample Rate</th>
            <th className="p-2 text-right">Azimuth</th>
            <th className="p-2 text-right">Dip</th>
            <th className="p-2 text-left">Sensor</th>
            <th className="p-2 text-right">Depth (m)</th>
            {hasAvail && (
              <>
                <th className="p-2 text-left">Data Available</th>
                <th className="p-2 text-left">Data Latest</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((ch) => {
            const avail = availMap.get(`${ch.location_code}.${ch.code}`);
            return (
              <tr key={ch.id} className="border-t">
                <td className="p-2 font-mono">{ch.location_code || "--"}</td>
                <td className="p-2 font-mono font-medium">{ch.code}</td>
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
