import { useNavigate } from "react-router";
import type { ExploreStation, ImportResponse } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: ExploreStation[];
  onConfirm: () => void;
  isPending: boolean;
  result?: ImportResponse | null;
}

export function ImportDialog({
  open,
  onOpenChange,
  selected,
  onConfirm,
  isPending,
  result,
}: Props) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Stations</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully imported {result.imported} channels from{" "}
                {selected.length} stations.
                {result.availability_count ? (
                  <> Loaded {result.availability_count} availability records.</>
                ) : null}
                {result.availability_status === "not_supported" && (
                  <> Availability data is not supported by this source.</>
                )}
                {result.availability_status === "no_data" && (
                  <> No availability data found.</>
                )}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Import the following stations with all available channels:
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <Badge key={`${s.Network}.${s.Station}`} variant="outline">
                  {s.Network}.{s.Station}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Done
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/stations");
                }}
              >
                View Imported Stations
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={onConfirm} disabled={isPending}>
                {isPending ? "Importing..." : `Import ${selected.length} Stations`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
