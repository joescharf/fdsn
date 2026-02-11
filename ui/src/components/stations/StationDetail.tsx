import { useParams, useNavigate } from "react-router";
import { useStation, useDeleteStation } from "@/hooks/useStations";
import { useImportStations } from "@/hooks/useExplorer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, RefreshCw, Info } from "lucide-react";
import { StationMap } from "@/components/map/StationMap";
import { ChannelTable } from "./ChannelTable";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function StationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: station, isLoading } = useStation(Number(id));
  const deleteMutation = useDeleteStation();
  const importMutation = useImportStations();
  const qc = useQueryClient();

  const handleDelete = () => {
    if (!station) return;
    deleteMutation.mutate(station.id, {
      onSuccess: () => {
        toast.success("Station deleted");
        navigate("/stations");
      },
    });
  };

  const handleRefresh = () => {
    if (!station?.source_id || !station.network_code) return;
    importMutation.mutate(
      {
        source_id: station.source_id,
        network: station.network_code,
        station: station.code,
      },
      {
        onSuccess: (data) => {
          const parts = [`${data.imported} channels imported`];
          if (data.availability_count > 0) {
            parts.push(`${data.availability_count} availability records`);
          }
          // Add availability status info
          if (data.availability_status === "not_supported") {
            parts.push("Availability: not supported by this source");
          } else if (data.availability_status === "no_data") {
            parts.push("Availability: no data found");
          } else if (data.availability_status === "error") {
            parts.push(`Availability: ${data.availability_error || "fetch error"}`);
          }
          toast.success(`Refreshed: ${parts.join(". ")}`);
          qc.invalidateQueries({ queryKey: ["stations", Number(id)] });
          qc.invalidateQueries({ queryKey: ["availability"] });
        },
        onError: (err) => {
          toast.error(`Refresh failed: ${err.message}`);
        },
      }
    );
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!station) {
    return <p className="text-muted-foreground">Station not found</p>;
  }

  const hasAvailability = station.availability && station.availability.length > 0;

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
        <div className="flex items-center gap-2">
          {station.source_id ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={importMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${importMutation.isPending ? "animate-spin" : ""}`} />
              {importMutation.isPending ? "Refreshing..." : "Refresh Data"}
            </Button>
          ) : null}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Station</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <span className="font-mono font-medium">
                    {station.network_code}.{station.code}
                  </span>
                  ? This will remove the station, all its channels, and associated
                  availability data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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
        {!hasAvailability && (station.channels?.length ?? 0) > 0 && (
          <Alert className="mb-3">
            <Info className="h-4 w-4" />
            <AlertDescription>
              No availability data loaded. This source may not support the FDSN availability service.
              Try refreshing to check.
            </AlertDescription>
          </Alert>
        )}
        <ChannelTable
          channels={station.channels ?? []}
          availability={station.availability}
          sourceId={station.source_id}
          networkCode={station.network_code}
          stationCode={station.code}
          stationId={station.id}
        />
      </div>
    </div>
  );
}
