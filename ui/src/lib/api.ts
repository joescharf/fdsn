const DEV_API_BASE = "http://localhost:8080";

function getBaseURL(): string {
  // In dev mode (Bun dev server on a different port), proxy to Go backend
  if (
    import.meta.env?.MODE === "development" ||
    window.location.port === "3000" ||
    window.location.port === "3001"
  ) {
    return DEV_API_BASE;
  }
  // In production, the Go binary serves both UI and API on the same origin
  return "";
}

const BASE = getBaseURL();

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export async function apiFetchRaw(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${BASE}${path}`;
  return fetch(url, init);
}

export { BASE };
