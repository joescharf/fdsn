export interface Source {
  id: number;
  name: string;
  base_url: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Network {
  id: number;
  source_id: number;
  code: string;
  description: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface Station {
  id: number;
  network_id: number;
  code: string;
  latitude: number;
  longitude: number;
  elevation: number;
  site_name: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  network_code?: string;
  source_name?: string;
  source_id?: number;
}

export interface Channel {
  id: number;
  station_id: number;
  location_code: string;
  code: string;
  latitude: number | null;
  longitude: number | null;
  elevation: number | null;
  depth: number | null;
  azimuth: number | null;
  dip: number | null;
  sensor_description: string;
  scale: number | null;
  scale_freq: number | null;
  scale_units: string;
  sample_rate: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface ChannelAvailability {
  channel_id: number;
  location_code: string;
  channel_code: string;
  sample_rate: number | null;
  earliest: string | null;
  latest: string | null;
}

export interface StationDetail extends Station {
  channels: Channel[];
  availability?: ChannelAvailability[];
}

export interface Stats {
  sources: number;
  networks: number;
  stations: number;
  channels: number;
}

export interface ExploreStation {
  Network: string;
  Station: string;
  Latitude: number;
  Longitude: number;
  Elevation: number;
  SiteName: string;
  StartTime: string | null;
  EndTime: string | null;
}

export interface StationListResponse {
  stations: Station[];
  total: number;
}
