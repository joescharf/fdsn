import { useState } from "react";
import {
  useSources,
  useCreateSource,
  useDeleteSource,
} from "@/hooks/useSources";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function SourcesPage() {
  const { data: sources, isLoading } = useSources();
  const createSource = useCreateSource();
  const deleteSource = useDeleteSource();
  const [open, setOpen] = useState(false);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createSource.mutate(
      {
        name: fd.get("name") as string,
        base_url: fd.get("base_url") as string,
        description: fd.get("description") as string,
        enabled: true,
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Source created");
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete source "${name}"?`)) return;
    deleteSource.mutate(id, {
      onSuccess: () => toast.success("Source deleted"),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">FDSN Sources</h2>
          <p className="text-muted-foreground">
            Manage connections to external FDSN data centres
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add FDSN Source</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="e.g. IRIS" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_url">Base URL</Label>
                <Input
                  id="base_url"
                  name="base_url"
                  placeholder="https://service.iris.edu"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Optional description"
                />
              </div>
              <Button type="submit" disabled={createSource.isPending}>
                {createSource.isPending ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sources?.map((src) => (
            <Card key={src.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{src.name}</CardTitle>
                  {src.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {src.description}
                    </p>
                  )}
                </div>
                <Badge variant={src.enabled ? "default" : "secondary"}>
                  {src.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <a
                  href={src.base_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                >
                  {src.base_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(src.id, src.name)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {sources?.length === 0 && (
            <p className="text-muted-foreground col-span-2 text-center py-8">
              No sources configured. Add one to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
