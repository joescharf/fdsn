import { useEffect, useState } from "react";
import { WaveformFallback } from "./WaveformFallback";

interface Props {
  data: ArrayBuffer | null;
  label: string;
}

interface ParsedTrace {
  times: number[];
  values: number[];
}

export function WaveformPlot({ data, label }: Props) {
  const [trace, setTrace] = useState<ParsedTrace | null>(null);

  useEffect(() => {
    if (!data || data.byteLength === 0) {
      setTrace(null);
      return;
    }

    // Dynamically import seisplotjs to parse miniSEED
    import("seisplotjs")
      .then((sp) => {
        try {
          const records = sp.miniseed.parseDataRecords(data);
          if (records.length === 0) {
            setTrace(null);
            return;
          }

          const seismograms = sp.miniseed.seismogramPerChannel(records);
          if (seismograms.length === 0) {
            setTrace(null);
            return;
          }

          const seis = seismograms[0];
          const times: number[] = [];
          const values: number[] = [];

          // Extract time-value pairs from each segment
          const sps = seis.sampleRate;
          for (const segment of seis.segments) {
            const segStartMs = segment.startTime.toJSDate().getTime();
            const y = segment.y;
            for (let i = 0; i < y.length; i++) {
              times.push(segStartMs + (i / sps) * 1000);
              values.push(y[i]);
            }
          }

          setTrace({ times, values });
        } catch (e) {
          console.error("Error parsing miniSEED:", e);
          setTrace(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load seisplotjs:", err);
        setTrace(null);
      });
  }, [data]);

  const chartData =
    trace?.times.map((t, i) => ({ time: t, value: trace.values[i] })) ?? [];

  if (!data || data.byteLength === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No waveform data loaded. Select a channel and time range, then fetch.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <WaveformFallback data={chartData} label={label} />
      <p className="text-xs text-muted-foreground">
        {data.byteLength.toLocaleString()} bytes |{" "}
        {chartData.length.toLocaleString()} samples
      </p>
    </div>
  );
}
