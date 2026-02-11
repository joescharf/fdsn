package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/joescharf/fdsn/internal/fdsnclient"
	"github.com/joescharf/fdsn/internal/models"
	"github.com/joescharf/fdsn/internal/store"
	"github.com/rs/zerolog/log"
)

type importHandler struct {
	sourceStore       store.SourceStore
	stationStore      store.StationStore
	availabilityStore store.AvailabilityStore
}

type importRequest struct {
	SourceID int64  `json:"source_id"`
	Network  string `json:"network"`
	Station  string `json:"station"`
	Channel  string `json:"channel"`
	Location string `json:"location"`
}

type importResponse struct {
	Imported           int    `json:"imported"`
	AvailabilityCount  int    `json:"availability_count"`
	AvailabilityError  string `json:"availability_error,omitempty"`
	AvailabilityStatus string `json:"availability_status"`
}

func (h *importHandler) refreshTargets(w http.ResponseWriter, r *http.Request) {
	targets, err := h.stationStore.ListUniqueSourceNetworks()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, targets)
}

func (h *importHandler) importStations(w http.ResponseWriter, r *http.Request) {
	var req importRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.SourceID == 0 {
		writeError(w, http.StatusBadRequest, "source_id is required")
		return
	}

	src, err := h.sourceStore.Get(req.SourceID)
	if err != nil {
		writeError(w, http.StatusNotFound, "source not found")
		return
	}

	// Fetch channel-level data from the external source
	client := fdsnclient.New(src.BaseURL)
	q := fdsnclient.StationQuery{
		Network:  req.Network,
		Station:  req.Station,
		Channel:  req.Channel,
		Location: req.Location,
	}
	channels, err := client.QueryChannels(q)
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	if len(channels) == 0 {
		writeJSON(w, http.StatusOK, importResponse{Imported: 0})
		return
	}

	log.Info().Int("channels", len(channels)).Str("source", src.Name).Msg("importing stations")

	// Convert to import format
	importChannels := make([]models.ImportChannel, len(channels))
	for i, ch := range channels {
		importChannels[i] = models.ImportChannel{
			NetworkCode:       ch.Network,
			StationCode:       ch.Station,
			Latitude:          ch.Latitude,
			Longitude:         ch.Longitude,
			Elevation:         ch.Elevation,
			LocationCode:      ch.Location,
			ChannelCode:       ch.Channel,
			ChanLatitude:      ch.Latitude,
			ChanLongitude:     ch.Longitude,
			ChanElevation:     ch.Elevation,
			Depth:             ch.Depth,
			Azimuth:           ch.Azimuth,
			Dip:               ch.Dip,
			SensorDescription: ch.SensorDescription,
			Scale:             ch.Scale,
			ScaleFreq:         ch.ScaleFreq,
			ScaleUnits:        ch.ScaleUnits,
			SampleRate:        ch.SampleRate,
			ChanStartTime:     ch.StartTime,
			ChanEndTime:       ch.EndTime,
		}
	}

	if err := h.stationStore.ImportStations(src.ID, importChannels); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Fetch availability data for imported channels
	resp := importResponse{Imported: len(channels)}

	if h.availabilityStore != nil {
		availCount, availErr := h.fetchAvailability(client, src.ID, channels)
		resp.AvailabilityCount = availCount
		if availErr != "" {
			resp.AvailabilityError = availErr
			if strings.Contains(availErr, "not supported") {
				resp.AvailabilityStatus = "not_supported"
			} else {
				resp.AvailabilityStatus = "error"
			}
		} else if availCount > 0 {
			resp.AvailabilityStatus = "ok"
		} else {
			resp.AvailabilityStatus = "no_data"
		}
	} else {
		resp.AvailabilityStatus = "not_configured"
	}

	writeJSON(w, http.StatusOK, resp)
}

// netStaKey is a deduplicated network+station pair.
type netStaKey struct {
	Network string
	Station string
}

// fetchAvailability queries availability extents for all unique network+station
// pairs in the imported channels and upserts them into the availability store.
// It returns the count of availability records upserted and an error string (if any).
func (h *importHandler) fetchAvailability(client *fdsnclient.Client, sourceID int64, channels []fdsnclient.ChannelTextRow) (int, string) {
	// Build deduplicated set of network+station pairs
	seen := make(map[netStaKey]bool)
	var pairs []netStaKey
	for _, ch := range channels {
		key := netStaKey{Network: ch.Network, Station: ch.Station}
		if !seen[key] {
			seen[key] = true
			pairs = append(pairs, key)
		}
	}

	var allItems []store.AvailabilityItem
	var availErr string

	for _, pair := range pairs {
		// Query availability extent from external source
		extents, err := client.QueryAvailabilityExtent(fdsnclient.AvailabilityQuery{
			Network: pair.Network,
			Station: pair.Station,
		})
		if err != nil {
			if fdsnclient.IsNotSupported(err) {
				log.Info().
					Str("network", pair.Network).
					Str("station", pair.Station).
					Msg("availability not supported by source")
				availErr = "availability not supported by this source"
				continue
			}
			log.Warn().Err(err).
				Str("network", pair.Network).
				Str("station", pair.Station).
				Msg("failed to fetch availability extent")
			availErr = fmt.Sprintf("availability fetch error for %s.%s: %s", pair.Network, pair.Station, err.Error())
			continue
		}

		if len(extents) == 0 {
			continue
		}

		// Lookup channel IDs for this network+station
		chanIDMap, err := h.stationStore.LookupChannelIDs(sourceID, pair.Network, pair.Station)
		if err != nil {
			log.Warn().Err(err).
				Str("network", pair.Network).
				Str("station", pair.Station).
				Msg("failed to lookup channel IDs")
			availErr = fmt.Sprintf("channel lookup error for %s.%s: %s", pair.Network, pair.Station, err.Error())
			continue
		}

		// Match availability extents to channel IDs using location+channel key
		for _, ext := range extents {
			key := ext.Location + "." + ext.Channel
			chanID, ok := chanIDMap[key]
			if !ok {
				continue
			}
			if ext.Earliest == nil || ext.Latest == nil {
				continue
			}
			allItems = append(allItems, store.AvailabilityItem{
				ChannelID: chanID,
				Earliest:  fdsnclient.FormatTime(ext.Earliest),
				Latest:    fdsnclient.FormatTime(ext.Latest),
			})
		}
	}

	// Batch upsert all collected availability items
	if len(allItems) > 0 {
		if err := h.availabilityStore.UpsertBatch(allItems); err != nil {
			log.Warn().Err(err).Int("items", len(allItems)).Msg("failed to upsert availability batch")
			availErr = fmt.Sprintf("availability upsert error: %s", err.Error())
			return 0, availErr
		}
	}

	log.Info().Int("availability_records", len(allItems)).Msg("availability import complete")
	return len(allItems), availErr
}
