import { useStats } from "@/hooks/useStations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database, Radio, Layers, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statCards = [
  { key: "sources" as const, label: "Sources", icon: Database },
  { key: "networks" as const, label: "Networks", icon: Layers },
  { key: "stations" as const, label: "Stations", icon: Radio },
  { key: "channels" as const, label: "Channels", icon: Activity },
];

export function Dashboard() {
  const { data: stats, isLoading } = useStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of imported seismic station data
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.label}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.[card.key] ?? 0}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
