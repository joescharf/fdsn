package models

import "encoding/xml"

// FDSNStationXML is the root element for StationXML output.
type FDSNStationXML struct {
	XMLName   xml.Name     `xml:"FDSNStationXML"`
	XMLNS     string       `xml:"xmlns,attr"`
	SchemaVer string       `xml:"schemaVersion,attr"`
	Source    string       `xml:"Source"`
	Sender    string       `xml:"Sender"`
	Created   string       `xml:"Created"`
	Networks  []XMLNetwork `xml:"Network"`
}

type XMLNetwork struct {
	Code        string       `xml:"code,attr"`
	StartDate   string       `xml:"startDate,attr,omitempty"`
	EndDate     string       `xml:"endDate,attr,omitempty"`
	Description string       `xml:"Description,omitempty"`
	Stations    []XMLStation `xml:"Station,omitempty"`
}

type XMLStation struct {
	Code      string       `xml:"code,attr"`
	StartDate string       `xml:"startDate,attr,omitempty"`
	EndDate   string       `xml:"endDate,attr,omitempty"`
	Latitude  XMLValue     `xml:"Latitude"`
	Longitude XMLValue     `xml:"Longitude"`
	Elevation XMLValue     `xml:"Elevation"`
	Site      XMLSite      `xml:"Site"`
	Channels  []XMLChannel `xml:"Channel,omitempty"`
}

type XMLChannel struct {
	Code         string   `xml:"code,attr"`
	LocationCode string   `xml:"locationCode,attr"`
	StartDate    string   `xml:"startDate,attr,omitempty"`
	EndDate      string   `xml:"endDate,attr,omitempty"`
	Latitude     XMLValue `xml:"Latitude"`
	Longitude    XMLValue `xml:"Longitude"`
	Elevation    XMLValue `xml:"Elevation"`
	Depth        XMLValue `xml:"Depth"`
	Azimuth      XMLValue `xml:"Azimuth,omitempty"`
	Dip          XMLValue `xml:"Dip,omitempty"`
	SampleRate   float64  `xml:"SampleRate,omitempty"`
	Sensor       *XMLSensor `xml:"Sensor,omitempty"`
}

type XMLValue struct {
	Value float64 `xml:",chardata"`
}

type XMLSite struct {
	Name string `xml:"Name"`
}

type XMLSensor struct {
	Description string `xml:"Description,omitempty"`
}
