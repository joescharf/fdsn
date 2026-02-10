import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play } from "lucide-react";

interface Props {
  onExecute: (params: {
    service: string;
    params: Record<string, string>;
  }) => void;
  isLoading: boolean;
  url: string;
}

export function FdsnQueryBuilder({ onExecute, isLoading, url }: Props) {
  const [service, setService] = useState("station");
  const [net, setNet] = useState("IU");
  const [sta, setSta] = useState("");
  const [loc, setLoc] = useState("");
  const [cha, setCha] = useState("");
  const [level, setLevel] = useState("station");
  const [format, setFormat] = useState("text");
  const [starttime, setStarttime] = useState("");
  const [endtime, setEndtime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (net) params.net = net;
    if (sta) params.sta = sta;
    if (loc) params.loc = loc;
    if (cha) params.cha = cha;
    if (starttime) params.starttime = starttime;
    if (endtime) params.endtime = endtime;

    if (service === "station") {
      params.level = level;
      params.format = format;
    }

    onExecute({ service, params });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-2">
          <Label>Service</Label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="station">Station</SelectItem>
              <SelectItem value="dataselect">Dataselect</SelectItem>
              <SelectItem value="availability">Availability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Network</Label>
          <Input
            value={net}
            onChange={(e) => setNet(e.target.value)}
            className="w-20"
            placeholder="IU"
          />
        </div>

        <div className="space-y-2">
          <Label>Station</Label>
          <Input
            value={sta}
            onChange={(e) => setSta(e.target.value)}
            className="w-24"
            placeholder="ANMO"
          />
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            className="w-16"
            placeholder="00"
          />
        </div>

        <div className="space-y-2">
          <Label>Channel</Label>
          <Input
            value={cha}
            onChange={(e) => setCha(e.target.value)}
            className="w-20"
            placeholder="BH*"
          />
        </div>
      </div>

      {service === "station" && (
        <div className="flex gap-3 items-end">
          <div className="space-y-2">
            <Label>Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="station">Station</SelectItem>
                <SelectItem value="channel">Channel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {(service === "dataselect") && (
        <div className="flex gap-3 items-end">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="datetime-local"
              value={starttime}
              onChange={(e) => setStarttime(e.target.value)}
              className="w-[200px]"
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="datetime-local"
              value={endtime}
              onChange={(e) => setEndtime(e.target.value)}
              className="w-[200px]"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading}>
          <Play className="h-4 w-4 mr-2" />
          {isLoading ? "Executing..." : "Execute Query"}
        </Button>
        {url && (
          <code className="text-xs text-muted-foreground break-all bg-muted px-2 py-1 rounded">
            {url}
          </code>
        )}
      </div>
    </form>
  );
}
