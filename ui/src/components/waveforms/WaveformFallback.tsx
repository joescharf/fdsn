import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface Props {
  data: { time: number; value: number }[];
  label?: string;
}

export function WaveformFallback({ data, label }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No data to display</p>
    );
  }

  // Downsample for recharts performance
  const maxPoints = 2000;
  const step = Math.max(1, Math.floor(data.length / maxPoints));
  const sampled = data.filter((_, i) => i % step === 0);

  return (
    <div className="w-full h-[300px]">
      {label && (
        <p className="text-sm font-medium mb-2 font-mono">{label}</p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sampled}>
          <XAxis
            dataKey="time"
            tickFormatter={(v: number) =>
              new Date(v).toISOString().slice(11, 19)
            }
            tick={{ fontSize: 10 }}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            labelFormatter={(v: number) => new Date(v).toISOString()}
            formatter={(v: number) => [v.toFixed(2), "Amplitude"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            dot={false}
            strokeWidth={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
