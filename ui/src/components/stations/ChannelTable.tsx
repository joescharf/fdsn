import type { Channel } from "@/types";

interface Props {
  channels: Channel[];
}

export function ChannelTable({ channels }: Props) {
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
          </tr>
        </thead>
        <tbody>
          {channels.map((ch) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
