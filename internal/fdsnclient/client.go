package fdsnclient

import (
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client talks to an external FDSN web-service endpoint.
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

// New creates an FDSN client for the given base URL.
func New(baseURL string) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// get performs a GET request and returns the response body.
// The caller is responsible for closing the returned ReadCloser.
func (c *Client) get(path string) (io.ReadCloser, error) {
	url := c.BaseURL + path
	resp, err := c.HTTPClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("GET %s: %w", url, err)
	}
	if resp.StatusCode == http.StatusNoContent {
		resp.Body.Close()
		return nil, nil // no data
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("GET %s: status %d: %s", url, resp.StatusCode, string(body))
	}
	return resp.Body, nil
}
