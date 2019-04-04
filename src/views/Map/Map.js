import React, { Component } from 'react'
import { Map as LeafletMap, TileLayer, Marker, Popup, Tooltip, Polyline } from 'react-leaflet';
// import worldGeoJSON from 'geojson-world-map';

import './Map.css';

import { railIcon } from '../../components/leaflet-icons/rail-icon/rail-icon';
import { trainIcon } from '../../components/leaflet-icons/train-icon/train-icon';
import { trainSideIcon } from '../../components/leaflet-icons/train-icon/train-side-icon';
import { deepStrictEqual } from 'assert';

const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');

export default class Map extends Component {
    mapRef = React.createRef();

    constructor(props) {
        super(props);
        this.state = {
            lat: -37.814,
            lng: 144.96332,
            zoom: 13,
            stops: [],
            departures: [],
            latlngs: []
        };
    }

    encryptSignature(key, url) {
        return crypto.createHmac('sha1', key).update(url).digest('hex');
    }

    PTVApiHealhCheck(baseURL, key, timestamp, devid) {
        const request = '/v2/healthcheck?timestamp=' + timestamp + '&devid=' + devid;
        const signature = this.encryptSignature(key, request);
        axios.get(baseURL + request + '&signature=' + signature)
            .then(response => {
                console.log(response);
            });
    }

    // To sort the array of stops according to the stop_sequence_id
    compareStops(a, b) {
        const aStopSequence = a.stop_sequence;
        const bStopSequence = b.stop_sequence;

        let comparison = 0;
        if (aStopSequence > bStopSequence) {
            comparison = 1;
        } else if (aStopSequence < bStopSequence) {
            comparison = -1;
        }

        return comparison;
    }

    async getStops(baseURL, key, devid, route_id) {
        const request = '/v3/stops/route/' + route_id + '/route_type/0?direction_id=1&devid=' + devid;
        const signature = this.encryptSignature(key, request);

        const stops = await axios.get(baseURL + request + '&signature=' + signature)
            .then(response => {
                const stops = response.data.stops.sort(this.compareStops);
                return stops;
            })
            .catch(error => {
                console.log(error);
            })

        this.setState({
            stops: stops
        });
        return stops
    }

    async getDepartures(baseURL, key, devid, route_id, stop_id) {
        const request = '/v3/departures/route_type/0/stop/' + stop_id + '/route/' + route_id + '?look_backwards=false&max_results=1&devid=' + devid;
        const signature = this.encryptSignature(key, request);

        const departures = await axios.get(baseURL + request + '&signature=' + signature)
            .then(response => {
                return response.data.departures
            })
        return departures;
    }

    async updateDepartures(baseURL, key, devid) {
        this.setState({
            departures: []
        });

        let departures = [];
        for (let i in this.state.stops) {
            const stop_id = this.state.stops[i].stop_id;
            const route_id = 3;

            departures.push(await this.getDepartures(baseURL, key, devid, route_id, stop_id)
                .then(response => {
                    // this.setState({
                    //     departures: [...this.state.departures, response]
                    // });
                    return response;
                })
            )
        }
        return departures;
    }

    calculateTrain() {
        const stops = this.state.stops;
        const departures = this.state.departures;

        for (let i in stops) {
            for (let j in departures) {
                for (let k in departures[j]) {
                    if (departures[j][k].stop_id === stops[i].stop_id) {
                        const estimatedTime = moment.utc(departures[j][k].estimated_departure_utc);
                        const difference = estimatedTime.diff(moment.utc(), 'minutes');
                        if (difference <= 2 && !departures[j][k].at_platform && departures[j][k].direction_id === 1) {
                            console.log("There is a train before: " + stops[i].stop_name + "," + stops[i].stop_sequence);
                        }
                    }

                }

            }
        }

        console.log(stops);
        console.log(departures);
    }

    getRuns() {
        const stops = this.state.stops;
        const departures = this.state.departures;
        const runs = [];

        for (let i in departures) {
            for (let j in departures[i]) {
                if (runs.indexOf(departures[i][j].run_id) === -1) {
                    runs.push(departures[i][j].run_id);
                }
            }
        }

        console.log(runs);
    }

    getTrainLocation() {
        const runs = this.state.runs;
    }

    componentDidMount() {
        // setTimeout(() => {
        //     if (this.mapRef.current) {
        //         console.log("Update");
        //         this.mapRef.current.leafletElement.invalidateSize();
        //     }
        // }, 10000);

        let now = moment.utc().format();
        const key = 'b4ba8648-d112-4cf5-891d-8533756cef97';
        const id = '3001097';
        const baseURL = 'https://timetableapi.ptv.vic.gov.au';

        // Health check
        this.PTVApiHealhCheck(baseURL, key, now, id);

        // Kensington Stop Id = 1108
        // Broadmeadows Route Id = 3    

        this.getStops(baseURL, key, id, 3)
            .then(result => {
                for (let i in result) {
                    this.getDepartures(baseURL, key, id, 3, result[i].stop_id)
                        .then(response => {
                            this.setState({
                                departures: [...this.state.departures, response]
                            });
                        })
                }
            });

        setInterval(() => {
            console.log("Updating Departures");
            this.updateDepartures(baseURL, key, id)
                .then(response => {
                    this.setState({
                        departures: response
                    });
                });
        }, 15000);
    }


    render() {
        let rails = [];
        let stations = [];
        for (let h in this.state.stops) {
            const latitude = this.state.stops[h].stop_latitude;
            const longitude = this.state.stops[h].stop_longitude;
            let toCity = "";
            let toCragieburn = "";
            let atPlatform = false;
            let stationName = this.state.stops[h].stop_name;
            for (let i in this.state.departures) {
                if (this.state.departures[i][0].stop_id === this.state.stops[h].stop_id) {
                    for (let j in this.state.departures[i]) {
                        let estimatedTime;
                        estimatedTime = moment.utc(this.state.departures[i][j].estimated_departure_utc);
                        const now = moment.utc();
                        const difference = estimatedTime.diff(now, 'minutes');
                        if (this.state.departures[i][j].direction_id === 1) {
                            toCity = difference;
                        } else {
                            toCragieburn = difference;
                        }
                        if (this.state.departures[i][j].at_platform) {
                            atPlatform = true;
                        }
                    }

                }
            }
            let object;
            if (atPlatform) {
                object = { Icon: trainIcon, positions: [latitude, longitude], stationName: stationName, toCity: toCity, toCragieburn: toCragieburn };
                stations.push(object);
            } else {
                object = { Icon: railIcon, positions: [latitude, longitude], stationName: stationName, toCity: toCity, toCragieburn: toCragieburn };
                rails.push(object);
            }
        }
        const position = [this.state.lat, this.state.lng];
        return (
            <LeafletMap ref={this.mapRef} center={position} zoom={this.state.zoom}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    // url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                    url='https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2lhdzk2IiwiYSI6ImNqdHRra3FuNDFjeW00MHBjMnNveGdha2QifQ.HK8K4aseYwzjdqAStXAyxg'
                />
                {/* <TileLayer
                    attribution='<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
                    url='http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png'
                /> */}

                {/* Dynamically assign the Markers to the train stops */}
                {
                    stations.map((key, index) => {
                        return <Marker icon={stations[index].Icon} position={stations[index].positions}>
                            <Popup>
                                <h1>{stations[index].stationName}</h1>
                                <h2>To City: {stations[index].toCity}</h2>
                                <h2>To Cragieburn: {stations[index].toCragieburn}</h2>
                            </Popup>
                            <Tooltip>
                                {stations[index].stationName}
                            </Tooltip>
                        </Marker>
                    })
                    // this.state.stops.map((key, index) => {
                    //     const latitude = this.state.stops[index].stop_latitude;
                    //     const longitude = this.state.stops[index].stop_longitude;
                    //     let toCity = "";
                    //     let toCragieburn = "";
                    //     let AtPlatform = false;
                    //     for (let i in this.state.departures) {
                    //         if (this.state.departures[i][0].stop_id === this.state.stops[index].stop_id) {
                    //             for (let j in this.state.departures[i]) {
                    //                 let estimatedTime;
                    //                 estimatedTime = moment.utc(this.state.departures[i][j].estimated_departure_utc);
                    //                 const now = moment.utc();
                    //                 const difference = estimatedTime.diff(now, 'minutes');
                    //                 if (this.state.departures[i][j].direction_id === 1) {
                    //                     toCity = difference;
                    //                 } else {
                    //                     toCragieburn = difference;
                    //                 }
                    //                 if (this.state.departures[i][j].at_platform) {
                    //                     AtPlatform = true;
                    //                 }
                    //             }
                    //         }
                    //     }
                    //     if (AtPlatform) {
                    //         return <Marker icon={trainIcon} position={[latitude, longitude]}>
                    //             <Popup>
                    //                 <h1>{this.state.stops[index].stop_name}</h1>
                    //                 <h2>To City: {toCity}</h2>
                    //                 <h2>To Cragieburn: {toCragieburn}</h2>
                    //             </Popup>
                    //             <Tooltip>
                    //                 {this.state.stops[index].stop_name}
                    //             </Tooltip>
                    //         </Marker>
                    //     } else {
                    //         return <Marker icon={railIcon} position={[latitude, longitude]}>
                    //             <Popup>
                    //                 <h1>{this.state.stops[index].stop_name}</h1>
                    //                 <h2>To City: {toCity}</h2>
                    //                 <h2>To Cragieburn: {toCragieburn}</h2>
                    //             </Popup>
                    //             <Tooltip>
                    //                 {this.state.stops[index].stop_name}
                    //             </Tooltip>
                    //         </Marker>
                    //     }
                    // })
                }

                {
                    rails.map((key, index) => {
                        return <Marker icon={rails[index].Icon} position={rails[index].positions}>
                            <Popup>
                                <h1>{rails[index].stationName}</h1>
                                <h2>To City: {rails[index].toCity}</h2>
                                <h2>To Cragieburn: {rails[index].toCragieburn}</h2>
                            </Popup>
                            <Tooltip>
                                {rails[index].stationName}
                            </Tooltip>
                        </Marker>
                    })
                }

                {
                    this.state.stops.map((key, index) => {
                        if (index < this.state.stops.length - 1) {
                            let nextIndex = index + 1;
                            const positions = [[this.state.stops[index].stop_latitude, this.state.stops[index].stop_longitude], [this.state.stops[nextIndex].stop_latitude, this.state.stops[nextIndex].stop_longitude]];
                            return <Polyline positions={positions} />
                        }
                    })
                }

                (this.state.latlngs.length !== 0) ? <Polyline positions={this.state.latlngs.sort(this.compareStops)} /> : null

            </LeafletMap>
        );
    }
}
