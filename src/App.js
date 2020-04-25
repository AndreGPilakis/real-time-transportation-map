import React, { Component } from 'react';
import { Switch, Route } from "react-router-dom";

// import logo from './logo.svg';
import './App.css';

import Index from './views/Index/Index';
import Map from './views/Map/Map';
import Debug from './views/Debug/Debug';

class App extends Component {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={Map} />
        <Route path="/map" component={Map} />
        <Route path="/debug" component={Debug} />
      </Switch>
    );
  }
}

export default App;
