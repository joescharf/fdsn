import { useMemo } from "react";
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

/**
 * Min-max decimation: for each bin, emit both the min and max sample.
 * This preserves the visual envelope of the waveform at any zoom level.
 */
function decimateMinMax(
  data: { time: number; value: number }[],
  targetPoints: number,
): { time: number; value: number }[] {
  if (data.length <= targetPoints) return data;

  const binSize = data.length / (targetPoints / 2);
  const result: { time: number; value: number }[] = [];

  for (let i = 0; i < targetPoints / 2; i++) {
    const start = Math.floor(i * binSize);
    const end = Math.min(Math.floor((i + 1) * binSize), data.length);
    let minVal = Infinity;
    let maxVal = -Infinity;
    let minIdx = start;
    let maxIdx = start;

    for (let j = start; j < end; j++) {
      if (data[j].value < minVal) {
        minVal = data[j].value;
        minIdx = j;
      }
      if (data[j].value > maxVal) {
        maxVal = data[j].value;
        maxIdx = j;
      }
    }

    // Emit min and max in time order
    if (minIdx <= maxIdx) {
      result.push(data[minIdx], data[maxIdx]);
    } else {
      result.push(data[maxIdx], data[minIdx]);
    }
  }

  return result;
}

export function WaveformFallback({ data, label }: Props) {
  const processed = useMemo(() => {
    if (data.length === 0) return null;

    // Demean: subtract mean to remove DC offset
    const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const demeaned = data.map((d) => ({ time: d.time, value: d.value - mean }));

    // Min-max decimation preserves waveform envelope
    const sampled = decimateMinMax(demeaned, 2000);

    // Percentile-based Y-axis to handle outlier spikes
    const sortedVals = sampled.map((d) => d.value).sort((a, b) => a - b);
    const p01 = sortedVals[Math.floor(sortedVals.length * 0.01)] ?? 0;
    const p99 = sortedVals[Math.floor(sortedVals.length * 0.99)] ?? 0;
    const padding = (p99 - p01) * 0.1 || 1;

    return {
      sampled,
      yDomain: [p01 - padding, p99 + padding] as [number, number],
    };
  }, [data]);

  if (!processed) {
    return (
      <p className="text-muted-foreground text-sm">No data to display</p>
    );
  }

  return (
    <div className="w-full h-[300px]">
      {label && (
        <p className="text-sm font-medium mb-2 font-mono">{label}</p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processed.sampled}>
          <XAxis
            dataKey="time"
            tickFormatter={(v: number) =>
              new Date(v).toISOString().slice(11, 19)
            }
            tick={{ fontSize: 10 }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            domain={processed.yDomain}
            allowDataOverflow={true}
          />
          <Tooltip
            labelFormatter={(v: number) => new Date(v).toISOString()}
            formatter={(v: number) => [v.toFixed(2), "Amplitude"]}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="var(--primary)"
            dot={false}
            strokeWidth={1}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
