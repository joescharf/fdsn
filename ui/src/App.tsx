import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { SourcesPage } from "@/components/sources/SourcesPage";
import { ExplorerPage } from "@/components/explorer/ExplorerPage";
import { StationsPage } from "@/components/stations/StationsPage";
import { StationDetail } from "@/components/stations/StationDetail";
import { MapPage } from "@/components/map/MapPage";
import { WaveformsPage } from "@/components/waveforms/WaveformsPage";
import { FdsnTestPage } from "@/components/fdsn/FdsnTestPage";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="explorer" element={<ExplorerPage />} />
            <Route path="stations" element={<StationsPage />} />
            <Route path="stations/:id" element={<StationDetail />} />
            <Route path="map" element={<MapPage />} />
            <Route path="waveforms" element={<WaveformsPage />} />
            <Route path="fdsn" element={<FdsnTestPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
