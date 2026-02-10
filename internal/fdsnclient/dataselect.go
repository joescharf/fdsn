package fdsnclient

import (
	"fmt"
	"io"
	"net/url"
)

// FetchMiniSEED fetches raw miniSEED data from the external FDSN dataselect endpoint.
// Returns the response body which the caller must close.
func (c *Client) FetchMiniSEED(network, station, location, channel, starttime, endtime string) (io.ReadCloser, error) {
	params := url.Values{}
	params.Set("net", network)
	params.Set("sta", station)
	if location != "" {
		params.Set("loc", location)
	}
	params.Set("cha", channel)
	params.Set("starttime", starttime)
	params.Set("endtime", endtime)

	path := "/fdsnws/dataselect/1/query?" + params.Encode()
	body, err := c.get(path)
	if err != nil {
		return nil, fmt.Errorf("fetch miniSEED: %w", err)
	}
	return body, nil
}
