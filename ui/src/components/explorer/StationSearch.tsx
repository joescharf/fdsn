import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface Props {
  onSearch: (params: { net: string; sta: string; cha: string }) => void;
}

export function StationSearch({ onSearch }: Props) {
  const [net, setNet] = useState("IU");
  const [sta, setSta] = useState("");
  const [cha, setCha] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ net, sta, cha });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="space-y-2">
        <Label>Network</Label>
        <Input
          value={net}
          onChange={(e) => setNet(e.target.value)}
          placeholder="IU"
          className="w-24"
        />
      </div>
      <div className="space-y-2">
        <Label>Station</Label>
        <Input
          value={sta}
          onChange={(e) => setSta(e.target.value)}
          placeholder="ANMO,HRV"
          className="w-32"
        />
      </div>
      <div className="space-y-2">
        <Label>Channel</Label>
        <Input
          value={cha}
          onChange={(e) => setCha(e.target.value)}
          placeholder="BH*"
          className="w-24"
        />
      </div>
      <Button type="submit">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  );
}
