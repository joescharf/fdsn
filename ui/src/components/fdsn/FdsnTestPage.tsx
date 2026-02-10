import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FdsnQueryBuilder } from "./FdsnQueryBuilder";
import { useFdsnQuery } from "@/hooks/useFdsnQuery";
import { ScrollArea } from "@/components/ui/scroll-area";

export function FdsnTestPage() {
  const { execute, result, isLoading, error, url } = useFdsnQuery();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">FDSN Query Tester</h2>
        <p className="text-muted-foreground">
          Test the FDSN-compliant endpoints served by this portal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Query Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <FdsnQueryBuilder
            onExecute={execute}
            isLoading={isLoading}
            url={url}
          />
        </CardContent>
      </Card>

      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">Response</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          {error && (
            <p className="text-destructive text-sm mb-2">{error}</p>
          )}
          <ScrollArea className="h-full max-h-[500px]">
            <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-3 rounded-md">
              {result || "Execute a query to see results here."}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
