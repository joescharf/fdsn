package api

import (
	"encoding/json"
	"net/http"

	"github.com/joescharf/fdsn/internal/fdsnclient"
	"github.com/joescharf/fdsn/internal/models"
	"github.com/joescharf/fdsn/internal/store"
	"github.com/rs/zerolog/log"
)

type importHandler struct {
	sourceStore  store.SourceStore
	stationStore store.StationStore
}

type importRequest struct {
	SourceID int64  `json:"source_id"`
	Network  string `json:"network"`
	Station  string `json:"station"`
	Channel  string `json:"channel"`
	Location string `json:"location"`
}

type importResponse struct {
	Imported int `json:"imported"`
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

	writeJSON(w, http.StatusOK, importResponse{Imported: len(channels)})
}
