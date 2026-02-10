import { useState } from "react";
import { BASE } from "@/lib/api";

interface FdsnQueryParams {
  service: string; // "station", "dataselect", "availability"
  params: Record<string, string>;
}

export function useFdsnQuery() {
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  const execute = async ({ service, params }: FdsnQueryParams) => {
    const sp = new URLSearchParams(params);
    const queryUrl = `${BASE}/fdsnws/${service}/1/query?${sp}`;
    setUrl(queryUrl);
    setIsLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch(queryUrl);
      if (!res.ok) {
        const text = await res.text();
        setError(`${res.status}: ${text}`);
        return;
      }
      const contentType = res.headers.get("Content-Type") || "";
      if (
        contentType.includes("xml") ||
        contentType.includes("text")
      ) {
        const text = await res.text();
        setResult(text);
      } else {
        setResult(`[Binary data: ${contentType}, ${(await res.arrayBuffer()).byteLength} bytes]`);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, result, isLoading, error, url };
}
