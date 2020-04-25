This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Real-Time Transportation Map

A web app integrated with Leaflet to visualize real-time data of Metro train in Melbourne. It requires the [Real-Time Transportation API](https://github.com/JX-Siaw/real-time-transportation-api) to work.

[DEMO](https://xephiz.dev/map)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

```bash
1) Clone the project using the command
$ git clone https://github.com/JX-Siaw/real-time-transportation-map.git

2) Install the node modules
$ npm install
```

### Prerequisites

You need to set up the [API](https://github.com/JX-Siaw/real-time-transportation-api) and run it in conjuction with the web app to work

### Running

To run the app in development mode,

```bash
1) Runs the node js app in development mode
$ npm start

2) Open the map
Go to http://localhost:3000/map
```

## Deployment

To deploy the app to a server
```bash
1) ssh into the server

2) Clone the project in the server
$ git clone https://github.com/JX-Siaw/real-time-transportation-map.git

3) Build the app
$ npm run build

4) Copy the build files to where the static files are hosted
```
``
Make sure a reverse proxy is set up allowing the web app to call the API at the designated port
``

## Built With

* [React](https://reactjs.org/) - The web library used to create the web app
* [Leaflet](https://leafletjs.com/) - Open-source JavaScript map library

## Authors

* **Jeremy Siaw** - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Thanks to [Public Transport Victoria](https://www.ptv.vic.gov.au/footer/about-ptv/digital-tools-and-updates/) for providing access to their Timetable API's data 
* Thanks to RMIT VXLab for providing access to the lab for development work and testing with the tiled displays
* Thanks to RMIT University for providing me the opportunity to work on the project

=======
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# Real-Time Transportation Map

A web app integrated with Leaflet to visualize real-time data of Metro train in Melbourne. It requires the [Real-Time Transportation API](https://github.com/JX-Siaw/real-time-transportation-api) to work.

[DEMO](https://xephiz.dev/map)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

```bash
1) Clone the project using the command
$ git clone https://github.com/JX-Siaw/real-time-transportation-map.git

2) Install the node modules
$ npm install
```

### Prerequisites

You need to set up the [API](https://github.com/JX-Siaw/real-time-transportation-api) and run it in conjuction with the web app to work

### Running

To run the app in development mode,

```bash
1) Runs the node js app in development mode
$ npm start

2) Open the map
Go to http://localhost:3000/map
```

## Deployment

To deploy the app to a server
```bash
1) ssh into the server

2) Clone the project in the server
$ git clone https://github.com/JX-Siaw/real-time-transportation-map.git

3) Build the app
$ npm run build

4) Copy the build files to where the static files are hosted
```
``
Make sure a reverse proxy is set up allowing the web app to call the API at the designated port
``

## Built With

* [React](https://reactjs.org/) - The web library used to create the web app
* [Leaflet](https://leafletjs.com/) - Open-source JavaScript map library

## Authors

* **Jeremy Siaw** - *Initial work*
* **Ngoc Tran** - *Follow up work*
* **Sean Martin** - *Follow up work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Thanks to [Public Transport Victoria](https://www.ptv.vic.gov.au/footer/about-ptv/digital-tools-and-updates/) for providing access to their Timetable API's data 
* Thanks to RMIT VXLab for providing access to the lab for development work and testing with the tiled displays
* Thanks to RMIT University for providing me the opportunity to work on the project
