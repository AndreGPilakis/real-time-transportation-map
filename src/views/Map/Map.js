import React, { Component } from 'react';
import {Map as LeafletMap, LayerGroup, TileLayer, Marker, Popup, Tooltip, Polyline} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import Control from 'react-leaflet-control';

import './Map.css';

// Importing Submodules
import * as Departures from '../../modules/departures';

// Importing Components
import { trainSideDelayedIcon} from "../../components/leaflet-icons/train-icon/train-side-delayed-icon";
import { trainSideInvertedDelayedIcon} from "../../components/leaflet-icons/train-icon/train-side-inverted-delayed";
import { railIcon } from '../../components/leaflet-icons/rail-icon/rail-icon';
import { trainIcon } from '../../components/leaflet-icons/train-icon/train-icon';
import { trainSideIcon } from '../../components/leaflet-icons/train-icon/train-side-icon';
import { trainSideInvertedIcon } from '../../components/leaflet-icons/train-icon/train-side-inverted-icon';
import RotatedMarker from '../../components/leaflet-icons/RotatedMarker';

// Importing Packages
const axios = require('axios');
const moment = require('moment');

// Icon scaling constants
const ICON_SCALE_FACTOR = 3;
const MAX_VEHICLE_ICON_LEN = 50;
const MAX_STATION_ICON_LEN = 40;
const MIN_ICON_SIZE = 10;

// Update frequency
const DEF_API_REP_FREQ = 30;
const MIN_API_REP_FREQ = 15;
const MAX_API_REP_FREQ = 600;
const SECONDS_TO_MS = 1000;

function getRouteDescriptions() {
    return axios.get('/api/routes');
}

function getStationDepartures() {
    return axios.get('/api/stationDepartures');
}

function getRuns() {
    return axios.get('/api/runs');
}

function swapRouteType() {
    axios.post('/api/swapRouteType');
}

//Show disruption for the given station
function getDisruptions(){
  let myRes = axios.get('/disruptions', {
        params: {
          ID: 4
        }
      })
      .then(function (response) {
        let container = document.getElementById('disruptionsContainer');
        container.innerHTML = "";
        let delays = response.data['metro_train'];
        console.log(delays);
        for (var i = 0; i < delays.length; i++){
            container.innerHTML += delays[i].description + "<br>";
            console.log(delays[i].description);
        }
    })
}


function showScheduledRuns() {
    // Swap color of button based on current visibility
    if(!this.state.scheduledRunsVisible) {
        document.getElementById("toggleScheduledRuns").className = "control activeScheduledRuns";
    } else {
        document.getElementById("toggleScheduledRuns").className = "control";
    }

    // Update visibility
    this.setState({
        scheduledRunsVisible: !this.state.scheduledRunsVisible
    });
};

// Set refresh rate from API side if already previously set
function initialiseRefreshRate() {
    axios.get('/refresh')
        .then((response) => {
            this.refreshRate = response.data.refresh;
            setInitialRefreshRate(this.refreshRate);
        })
        .catch(error => {
            this.refreshRate = DEF_API_REP_FREQ;
            setInitialRefreshRate(this.refreshRate);
        });
}

function setInitialRefreshRate(refresh) {
    displayRefresh(refresh);
    document.getElementById("refreshSlider").value = refresh;
    this.refresh = setInterval(this.updateData, refresh * SECONDS_TO_MS);
}

// Update API rate according to slider value
function updateRefresh() {
    this.refreshRate = document.getElementById("refreshSlider").value;
    // Stop the current refresh cycle and restart with new refresh time
    if(this.refresh != null) {
        console.log("Setting new refresh rate to: " + this.refreshRate);
        clearInterval(this.refresh);
        this.refresh = setInterval(this.updateData, this.refreshRate * SECONDS_TO_MS);
    }

    axios.post('/refresh', {refreshRate: this.refreshRate});
}

// Update text above slider to reflect refresh value
function displayRefresh(refresh) {
    let text = refresh + " seconds";
    document.getElementById("refreshDisplay").value = text;
    document.getElementById("refreshDisplay").size = text.length;
}

// Driver to update slider value during drag
function displayRefreshSlider() {
    displayRefresh(document.getElementById("refreshSlider").value);
}

export default class Map extends Component {
    // Event handler when map is zoomed, adjusts icon sizes
    updateData() {
        console.log("Updating data...");
        axios.all([getRouteDescriptions(),
                   getStationDepartures(),
                   getRuns()])
        .then((response) => {
            this.setState({
                routes: response[0].data,
                stationDepartures: response[1].data,
                runs: response[2].data.runs
            });
        });
    }

    refreshPage() {
        this.setState({});
    }

    // Event handler when map is zoomed, adjusts icon sizes
    handleZoom() {
        // Determine how much to scale icons based on zoom level
        let currZoom = this.mapRef.current.viewport.zoom;
        let maxZoom = this.mapRef.current.props.maxZoom;
        let vehicleSize = MAX_VEHICLE_ICON_LEN * Math.pow((currZoom / maxZoom), ICON_SCALE_FACTOR);
        let stationSize = MAX_STATION_ICON_LEN * Math.pow((currZoom / maxZoom), ICON_SCALE_FACTOR);

        // Disable station icons if they become too small (zoom too far away)
        if(stationSize > MIN_ICON_SIZE) {
            railIcon.options.iconSize = [stationSize, stationSize];
        } else {
            railIcon.options.iconSize = [0, 0];
        }

        trainIcon.options.iconSize = [vehicleSize, vehicleSize];
        trainSideIcon.options.iconSize = [vehicleSize, vehicleSize];
        trainSideInvertedIcon.options.iconSize = [vehicleSize, vehicleSize];
        trainSideDelayedIcon.options.iconSize = [vehicleSize, vehicleSize];
        trainSideInvertedDelayedIcon.options.iconSize = [vehicleSize, vehicleSize];

        // Force update train icons
        let layers = this.trainRef.current.leafletElement.getLayers();
        for(let i in layers) {
            layers[i].refreshIconOptions();
        }

        // Force update station icons
        layers = this.stationRef.current.leafletElement.getLayers();
        for(let i in layers) {
            layers[i].refreshIconOptions();
        }
    };

    returnStopName(stop_id) {
        for (let i in this.state.stationDepartures) {
            let stop = this.state.stationDepartures[i];
            if(stop.stop_id === stop_id) {
                return stop.stop_name;
            }
        }
    }

    getRouteName(route_id) {
        for (let i in this.state.routes) {
            if(this.state.routes[i].route_id === route_id) {
                return this.state.routes[i].route_name;
            }
        }
    }

    getDirectionName(route_id, direction_id) {
        for(let i in this.state.routes) {
            if(this.state.routes[i].route_id === route_id) {
                for(let j in this.state.routes[i].directions) {
                    if(this.state.routes[i].directions[j].direction_id === direction_id) {
                        return this.state.routes[i].directions[j].direction_name;
                    }
                }
            }
        }
    }

    // Calculate the punctuality of all departures
    // TODO: Possibly move to backend and add API route
    calculatePunctuality() {
        let lateCount = 0, departureCount = 0;
        const stations = this.state.stationDepartures;

        for (let i in stations) {
            for (let j in stations[i].departures) {
                const estimatedTime = moment.utc(stations[i].departures[j].estimated_departure_utc);
                const scheduledTime = moment.utc(stations[i].departures[j].scheduled_departure_utc);
                if (!estimatedTime) continue; // Skip if estimated time not supplied

                departureCount++;
                // Count departures 5 minutes late or more
                if (Math.abs(estimatedTime.diff(scheduledTime, 'minutes')) >= 5) {
                    lateCount++;
                }
            }
        }
        return 100 - (lateCount * 100.00 / departureCount);
    }

    componentDidMount() {
        this.updateData();
        initialiseRefreshRate();
        setInterval(this.refreshPage, 10000);
    }

    constructor(props) {
        super(props);

        // Create references to be used when updating icons
        this.mapRef = React.createRef();
        this.trainRef = React.createRef();
        this.stationRef = React.createRef();

        this.state = {
            scheduledRunsVisible: false,
            lat: -37.814,
            lng: 144.96332,
            zoom: 13,
            routes: [],
            stationDepartures: [],
            runs: []
        };

        this.handleZoom = this.handleZoom.bind(this);
        this.updateData = this.updateData.bind(this);
        this.refreshPage = this.refreshPage.bind(this);

        showScheduledRuns = showScheduledRuns.bind(this);
        updateRefresh = updateRefresh.bind(this);
        displayRefresh = displayRefresh.bind(this);
        setInitialRefreshRate = setInitialRefreshRate.bind(this);
        initialiseRefreshRate = initialiseRefreshRate.bind(this);
    }

    render() {
        const position = [this.state.lat, this.state.lng];
        const stations = this.state.stationDepartures;
        const runs = this.state.runs;
        const punctuality = this.calculatePunctuality();

        return (
            <div id='transport'>
                <LeafletMap id="map" ref={this.mapRef} center={position} zoom={this.state.zoom} maxZoom={17} onZoomEnd={this.handleZoom}>
                    <Control position="topright">
                        {/* Render punctuality when there is data */}
                        { !isNaN(punctuality) && <span id="punctualityLabel"><small>Punctuality: </small><span id="bold">{punctuality.toFixed(2)}</span> %</span> }
                        
                    </Control>
                    <Control position="bottomleft">
                        <div id="disruptionsContainer">
                            Disruptions container
                        </div>
                        <div id="controlPanel">
                        <button onClick={ getDisruptions } className="control">Show Disruptions</button><br/>
                        <button onClick={ swapRouteType } className="control">Switch Transport Type &#8693;</button><br/>
                        <button onClick={ showScheduledRuns } className="control" id="toggleScheduledRuns">Scheduled Runs</button>
                        <div className="control" id="refreshBox">
                            Refresh Rate: <input type="text" defaultValue={DEF_API_REP_FREQ + " seconds"} size="10" id="refreshDisplay" disabled/><br/>
                            <input type="range" min={MIN_API_REP_FREQ} max={MAX_API_REP_FREQ} defaultValue={DEF_API_REP_FREQ} id="refreshSlider" onMouseUp={updateRefresh} onChange={displayRefreshSlider}/>
                        </div>
                        </div>
                    </Control>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        // url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        url='https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2lhdzk2IiwiYSI6ImNqdHRra3FuNDFjeW00MHBjMnNveGdha2QifQ.HK8K4aseYwzjdqAStXAyxg'
                    />

                    <MarkerClusterGroup maxClusterRadius={10} ref={this.trainRef}>
                        {
                            runs.map((key, index) => {
                                if(this.state.scheduledRunsVisible || runs[index].departure[runs[index].currentDeparture].estimated_departure_utc) {
                                    let timeStamp;
                                    let icon;
                                    let angle;
                                    let tooltip;
                                    let arrivalTime;
                                    let atPlatform = runs[index].departure[runs[index].currentDeparture].at_platform;
                                    let runStarted = runs[index].currentDeparture > 0;


                                    // Determine timestamp (arrival time to next stop)
                                    if (runs[index].departure[runs[index].currentDeparture].estimated_departure_utc) {
                                        arrivalTime = moment.utc(runs[index].departure[runs[index].currentDeparture].estimated_departure_utc);
                                    } else {
                                        arrivalTime = moment.utc(runs[index].departure[runs[index].currentDeparture].scheduled_departure_utc);
                                    }
                                    timeStamp = arrivalTime.diff(moment.utc(), 'minutes');

                                    const previousStopCoordinates = runs[index].coordinates.previousStopCoordinates;
                                    const nextStopCoordinates = runs[index].coordinates.nextStopCoordinates;

                                    // Set appropriate icons for trains and their properties
                                    if (atPlatform || !runStarted) {
                                        runs[index].currentCoordinates = runs[index].coordinates.nextStopCoordinates;
                                        angle = 0;
                                        icon = trainIcon;
                                    } else {
                                        // Trains currently travelling between stations
                                        let scalar;
                                        let timeStampSeconds = arrivalTime.diff(moment.utc(), 'seconds');

                                        // Calculation for determining current position of vehicle between two stops
                                        let prevDeparture = runs[index].departure[runs[index].currentDeparture - 1];
                                        let nextDeparture = runs[index].departure[runs[index].currentDeparture];
                                        const time1 = moment.utc(prevDeparture.estimated_departure_utc ? prevDeparture.estimated_departure_utc : prevDeparture.scheduled_departure_utc);
                                        const time2 = moment.utc(nextDeparture.estimated_departure_utc ? nextDeparture.estimated_departure_utc : nextDeparture.scheduled_departure_utc);
                                        const travelTime = Math.abs(time2.diff(time1, 'seconds'));
                                        if(timeStamp >= 0) {
                                            scalar = timeStampSeconds / travelTime;
                                        } else {
                                            // Do not allow vehilces to go past next stop
                                            // if expected arrival time has passed
                                            scalar = 0;
                                        }

                                        // Check if on time
                                        const estimatedTime = moment.utc(nextDeparture.estimated_departure_utc);
                                        const scheduledTime = moment.utc(nextDeparture.scheduled_departure_utc);

                                        let late = estimatedTime.diff(scheduledTime, 'minutes') >= 5;
                                        runs[index].currentCoordinates = Departures.determineRunCoordinates(scalar, previousStopCoordinates, nextStopCoordinates);
                                        angle = Departures.calculateAngle(previousStopCoordinates, nextStopCoordinates);
                                        if (nextStopCoordinates[0] < previousStopCoordinates[0]) {
                                            angle += 90;
                                            icon = late && estimatedTime ? trainSideDelayedIcon : trainSideIcon; // Don't render trains without an estimated time (real-time) as late
                                        } else {
                                            angle += 90;
                                            icon = late && estimatedTime ? trainSideInvertedDelayedIcon : trainSideInvertedIcon;
                                        }
                                    }

                                    // Determine future stop time arrivals (timetable on mouseover / click)
                                    let filteredDepartures = runs[index].departure;
                                    let filteredDetails = [];

                                    for (let i in filteredDepartures) {
                                        let departureTime;
                                        if(filteredDepartures[i].estimated_departure_utc) {
                                            departureTime = moment.utc(filteredDepartures[i].estimated_departure_utc);
                                        } else {
                                            departureTime = moment.utc(filteredDepartures[i].scheduled_departure_utc);
                                        }
                                        const differenceInTime = departureTime.diff(moment.utc(), 'minutes');
                                        const stopName = this.returnStopName(filteredDepartures[i].stop_id);
                                        if(differenceInTime >= 0 || i == runs[index].currentDeparture) {
                                            filteredDetails.push({
                                                stopName: stopName,
                                                differenceInTime: differenceInTime
                                            });
                                        }
                                    }

                                    // Get previous station name
                                    let prevStation;
                                    if(runStarted) {
                                        prevStation = this.returnStopName(runs[index].departure[runs[index].currentDeparture - 1].stop_id);
                                    } else {
                                        prevStation = "None";
                                    }

                                    // Rendering flags
                                    let beginningRun = atPlatform && !runStarted;
                                    let stoppedAtStation = atPlatform && runStarted;

                                    tooltip = <Tooltip>
                                        <div><strong> {this.getRouteName(runs[index].departure[runs[index].currentDeparture].route_id)} </strong></div>
                                        <div><strong>(to {this.getDirectionName(runs[index].departure[runs[index].currentDeparture].route_id,
                                            runs[index].coordinates.direction_id)})</strong></div>
                                        <div><strong>Run ID:</strong> {runs[index].departure[runs[index].currentDeparture].run_id}</div>
                                        {beginningRun &&
                                            <div><strong>Next Stop:</strong> {this.returnStopName(runs[index].departure[runs[index].currentDeparture].stop_id)}<br/>
                                            <strong>Departure Time:</strong> {timeStamp} min</div>
                                        }
                                        {stoppedAtStation &&
                                            <div><strong>At {this.returnStopName(runs[index].departure[runs[index].currentDeparture].stop_id)}</strong><br/></div>
                                        }
                                        {runStarted &&
                                            <div><strong>Previous Stop:</strong> {prevStation}<br/>
                                            <strong>Next Stop:</strong> {this.returnStopName(runs[index].departure[runs[index].currentDeparture].stop_id)}<br/>
                                            <strong>Arrival Time:</strong> {timeStamp} min</div>
                                        }
                                    </Tooltip>;

                                    // Condition ignores trains that have not arrived at their first scheduled stop
                                    if (atPlatform || runStarted) {
                                        return <RotatedMarker icon={icon} position={runs[index].currentCoordinates} rotationAngle={angle} rotationOrigin={'center'}>
                                            <Popup>
                                                {
                                                    filteredDetails.map((key, index3) => {
                                                        return <div>
                                                            <strong>{filteredDetails[index3].differenceInTime}</strong> minutes -> <strong>{filteredDetails[index3].stopName}</strong>
                                                            <br />
                                                        </div>
                                                    })
                                                }
                                            </Popup>
                                            {tooltip}
                                        </RotatedMarker>
                                    }
                                }
                            })
                        }
                    </MarkerClusterGroup>

                    <LayerGroup ref={this.stationRef}>
                        {
                            stations.map((key, index) => {
                                // Render each station with name and departures
                                const coordinates = [stations[index].stop_latitude, stations[index].stop_longitude];

                                return <Marker icon={railIcon} position={coordinates}>
                                    <Tooltip>
                                        <strong>{stations[index].stop_name} (Stop ID: {stations[index].stop_id})</strong><br/>
                                        {
                                            stations[index].departures.map((key, index2) => {
                                                let time;
                                                // Calculated time arrival and render on tooltip
                                                if(stations[index].departures[index2].estimated_departure_utc) {
                                                    time = moment.utc(stations[index].departures[index2].estimated_departure_utc);
                                                    let timeStamp = time.diff(moment.utc(), 'minutes');

                                                    if(timeStamp >= 0) {
                                                        // Calculate difference in estimated and scheduled time
                                                        let schedule = "";
                                                        const estimatedTime = moment.utc(stations[index].departures[index2].estimated_departure_utc);
                                                        const scheduledTime = moment.utc(stations[index].departures[index2].scheduled_departure_utc);
                                                        let diff = estimatedTime.diff(scheduledTime, 'minutes');
                                                        if (stations[index].departures[index2].estimated_departure_utc && diff > 0) {
                                                            let highlight = diff >= 10 ? "very-late-highlight" : diff >= 5 ? "late-highlight" : "behind-highlight";
                                                            schedule = <mark id={highlight}>{'(' + diff + ' min late)'}</mark>;
                                                        }

                                                        return <div>
                                                            <strong>(Estimated)</strong> {this.getRouteName(stations[index].departures[index2].route_id) + " "}
                                                                (to {this.getDirectionName(stations[index].departures[index2].route_id,
                                                                stations[index].departures[index2].direction_id)}) -> {timeStamp} mins {schedule}<br/>
                                                        </div>
                                                    }
                                                } else if(this.state.scheduledRunsVisible) {
                                                    time = moment.utc(stations[index].departures[index2].scheduled_departure_utc);
                                                    let timeStamp = time.diff(moment.utc(), 'minutes');

                                                    if(timeStamp >= 0) {
                                                    return <div>
                                                    (Scheduled) {this.getRouteName(stations[index].departures[index2].route_id) + " "}
                                                            (to {this.getDirectionName(stations[index].departures[index2].route_id,
                                                            stations[index].departures[index2].direction_id)}) -> {timeStamp} mins<br/>
                                                        </div>
                                                    }
                                                }
                                            })
                                        }
                                    </Tooltip>
                                </Marker>
                            })
                        }
                    </LayerGroup>
                </LeafletMap>
            </div>
        );
    }
}