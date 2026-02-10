package fdsnserver

import (
	"fmt"
	"net/http"
)

func stationWADL(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/xml")
	fmt.Fprint(w, `<?xml version="1.0"?>
<application xmlns="http://wadl.dev.java.net/2009/02"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <resources base="/fdsnws/station/1/">
    <resource path="query">
      <method name="GET">
        <request>
          <param name="net" style="query" type="xsd:string"/>
          <param name="sta" style="query" type="xsd:string"/>
          <param name="loc" style="query" type="xsd:string"/>
          <param name="cha" style="query" type="xsd:string"/>
          <param name="starttime" style="query" type="xsd:dateTime"/>
          <param name="endtime" style="query" type="xsd:dateTime"/>
          <param name="level" style="query" type="xsd:string" default="station"/>
          <param name="format" style="query" type="xsd:string" default="xml"/>
          <param name="minlat" style="query" type="xsd:float"/>
          <param name="maxlat" style="query" type="xsd:float"/>
          <param name="minlon" style="query" type="xsd:float"/>
          <param name="maxlon" style="query" type="xsd:float"/>
        </request>
        <response>
          <representation mediaType="application/xml"/>
          <representation mediaType="text/plain"/>
        </response>
      </method>
    </resource>
    <resource path="version">
      <method name="GET"/>
    </resource>
  </resources>
</application>`)
}

func dataselectWADL(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/xml")
	fmt.Fprint(w, `<?xml version="1.0"?>
<application xmlns="http://wadl.dev.java.net/2009/02"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <resources base="/fdsnws/dataselect/1/">
    <resource path="query">
      <method name="GET">
        <request>
          <param name="net" style="query" type="xsd:string" required="true"/>
          <param name="sta" style="query" type="xsd:string" required="true"/>
          <param name="loc" style="query" type="xsd:string"/>
          <param name="cha" style="query" type="xsd:string" required="true"/>
          <param name="starttime" style="query" type="xsd:dateTime" required="true"/>
          <param name="endtime" style="query" type="xsd:dateTime" required="true"/>
        </request>
        <response>
          <representation mediaType="application/vnd.fdsn.mseed"/>
        </response>
      </method>
    </resource>
    <resource path="version">
      <method name="GET"/>
    </resource>
  </resources>
</application>`)
}

func availabilityWADL(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/xml")
	fmt.Fprint(w, `<?xml version="1.0"?>
<application xmlns="http://wadl.dev.java.net/2009/02"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <resources base="/fdsnws/availability/1/">
    <resource path="query">
      <method name="GET">
        <request>
          <param name="net" style="query" type="xsd:string"/>
          <param name="sta" style="query" type="xsd:string"/>
          <param name="loc" style="query" type="xsd:string"/>
          <param name="cha" style="query" type="xsd:string"/>
        </request>
        <response>
          <representation mediaType="text/plain"/>
        </response>
      </method>
    </resource>
    <resource path="extent">
      <method name="GET">
        <request>
          <param name="net" style="query" type="xsd:string"/>
          <param name="sta" style="query" type="xsd:string"/>
          <param name="loc" style="query" type="xsd:string"/>
          <param name="cha" style="query" type="xsd:string"/>
        </request>
        <response>
          <representation mediaType="text/plain"/>
        </response>
      </method>
    </resource>
    <resource path="version">
      <method name="GET"/>
    </resource>
  </resources>
</application>`)
}
