import { useParams, useNavigate } from "react-router";
import { useStation, useDeleteStation } from "@/hooks/useStations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2 } from "lucide-react";
import { StationMap } from "@/components/map/StationMap";
import { ChannelTable } from "./ChannelTable";
import { toast } from "sonner";

export function StationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: station, isLoading } = useStation(Number(id));
  const deleteMutation = useDeleteStation();

  const handleDelete = () => {
    if (!station || !confirm(`Delete station ${station.network_code}.${station.code}?`)) return;
    deleteMutation.mutate(station.id, {
      onSuccess: () => {
        toast.success("Station deleted");
        navigate("/stations");
      },
    });
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!station) {
    return <p className="text-muted-foreground">Station not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/stations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-mono">
              {station.network_code}.{station.code}
            </h2>
            <p className="text-muted-foreground">{station.site_name}</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Station Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <Badge variant="outline" className="font-mono">{station.network_code}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Station</span>
              <span className="font-mono">{station.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latitude</span>
              <span className="font-mono">{station.latitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Longitude</span>
              <span className="font-mono">{station.longitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Elevation</span>
              <span className="font-mono">{station.elevation.toFixed(1)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Channels</span>
              <span>{station.channels?.length ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-md overflow-hidden h-64 md:h-auto">
          <StationMap
            stations={[station]}
            height="100%"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">
          Channels ({station.channels?.length ?? 0})
        </h3>
        <ChannelTable channels={station.channels ?? []} />
      </div>
    </div>
  );
}
