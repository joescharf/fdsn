import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Station } from "@/types";
import { useNavigate } from "react-router";

// Fix default marker icons in bundled builds
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  stations: Station[];
  height?: string;
}

export function StationMap({ stations, height = "100%" }: Props) {
  const navigate = useNavigate();

  // Calculate bounds or default to world view
  const center: [number, number] =
    stations.length > 0
      ? [
          stations.reduce((s, st) => s + st.latitude, 0) / stations.length,
          stations.reduce((s, st) => s + st.longitude, 0) / stations.length,
        ]
      : [20, 0];

  const zoom = stations.length > 0 ? 3 : 2;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((s) => (
        <Marker
          key={s.id}
          position={[s.latitude, s.longitude]}
          icon={defaultIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong className="font-mono">
                {s.network_code}.{s.code}
              </strong>
              <br />
              {s.site_name}
              <br />
              <span className="text-xs text-gray-500">
                {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
              </span>
              <br />
              <button
                className="text-blue-600 underline text-xs mt-1"
                onClick={() => navigate(`/stations/${s.id}`)}
              >
                View details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
