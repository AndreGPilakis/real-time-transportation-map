import React, { Component } from 'react';
import { Switch, Route } from "react-router-dom";
import { SAGE2App, useSAGE2AppStateValue } from "./useSAGE2AppState";


// import logo from './logo.svg';
import './App.css';

import Index from './views/Index/Index';
import Map from './views/Map/Map';
import Debug from './views/Debug/Debug';

class App extends Component {
  render() {
    return (
      <SAGE2App
        initialState={{
          mapZoom: 12,
          mapCenter: [[-37.80815648152641, 144.95541572570804]]
        }}
      >
        <ZoomUsingState />
      </SAGE2App>
    );
  }
}

function ZoomUsingState() {
  let [mapZoom, setCount] = useSAGE2AppStateValue("mapZoom");
  var position = [-37.80815648152641, 144.95541572570804]

  return (
    <div>
      <div id="control-block">
        <button onClick={() => { mapZoom < 17 ? setCount(mapZoom + 1): setCount(mapZoom) }}>+</button>
        <button onClick={() => { mapZoom > 0 ? setCount(mapZoom - 1): setCount(mapZoom) }}>-</button>
      </div>
      <Map zoom={mapZoom} center={position} ></Map>
    </div>
  );
}

export default App;
