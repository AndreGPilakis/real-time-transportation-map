//
// SAGE2 application: skeletonWebviewApp
// by: Dylan Kobayashi <dylank@hawaii.edu>
//
// Copyright (c) 2018
//

/**
Usage:
  Pass back information to the SAGE2 application using setValue()
    It takes two parameters: nameOfValue and value
    Specify the name of the state variables with nameOfValue
      It needs to match a top level variable specified in the instructions.json file
    Then, value is what it will be assigned in the application
  
  Handle value updates by addiing callbacks to the addValueHandler()
    It takes two paramters: nameOfValue and callback
    When the app issues updates the callback will be activated through handleValue()
    All load varibles specified in instructions.json should be given a handler
    Currently only one handler is allowed per value.




    Some default values that are provided to help with tracking changes:
      status

*/
const SAGE2_AppState = {
  // Tracks Value Handlers. At the moment only supports one callback per value.
  valueHandlers: {},
  fullStateCallback: null,
  // Should be low overhead. For now will track the last value given by app.
  valueTracker: {},
  // Updates when the state is given
  state: null,

  /**
   * Adds a handler for the given nameOfValue.
   *
   * @method addValueHandler
   * @param {String} nameOfValue - name of value on server to set.
   * @param {Function} callback - function to call when receiving a value update from app.
   */
  addValueHandler: function (nameOfValue, callback) {
    this.valueHandlers[nameOfValue] = callback;
  },

  /**
   * Adds a handler for the given nameOfValue.
   *
   * @method addFullStateHandler
   * @param {String} nameOfValue - name of value on server to set.
   * @param {Function} callback - function to call when receiving a value update from app.
   */
  addFullStateHandler: function (callback) {
    this.fullStateCallback = callback;
  },

  /**
   * Sends value back to app to update the state variable.
   *
   * @method setValue
   * @param {String} nameOfValue - name of value on server to set
   * @param {Any} value - the value to store for this variable
   * @param {Boolean} propagateChanges - true will send values to all other app instances (usually remote sites), false will hold off.
   */
  setValue: function (nameOfValue, value, propagateChanges = true) {
    let setValueMessage = {
      s2: "state",
      nameOfValue,
      value,
      propagateChanges,
    };
    this.send(setValueMessage);
  },

  /**
   * Sends message to update title.
   *
   * @method titleUpdate
   * @param {String} title - new title for app to display.
   */
  titleUpdate: function (title) {
    this.callFunctionInContainer("changeWebviewTitle", title);
  },

  /**
   * Called by the application container to fully update the state in one pass.
   * It is up to the user to handle cases where the state is updated with the same values.
   *
   * @method fullStateHandler
   * @param {Object} state - Received state from the container
   */
  fullStateHandler: function (state) {
    this.state = state;
    if (this.fullStateCallback) {
      this.fullStateCallback(state);
    }
    const keys = Object.keys(state);
    for (let i = 0; i < keys.length; i++) {
      this.handleValue(keys[i], state[keys[i]]);
    }
  },

  /**
   * Usually called by fullStateHandler, but can also be called by application to update a single value.
   * The callbacks set by addValueHandler will be called here.
   * Passes the value to the function.
   *
   * @method handleValue
   * @param {String} nameOfValue - name of state property
   * @param {Any} value - the value given for that property
   */
  handleValue: function (nameOfValue, value) {
    this.valueTracker[nameOfValue] = value;
    if (this.valueHandlers[nameOfValue]) {
      this.valueHandlers[nameOfValue](value);
    }
    // else {
    //   let warnMissing = {
    //     s2: "status",
    //     value: "Given nameOfValue (" + nameOfValue +") doesn't have a handler",
    //   };
    //   this.send(warnMissing);
    // }
  },

  /**
   * Calls a function in the container, must exist. Takes an optional parameter
   *
   * @method callFunctionInContainer
   * @param {String} nameOfFunction - name of function on container
   * @param {Any} value - One param to pass, if want to pass more, send an object
   */
  callFunctionInContainer: function (nameOfFunction, value) {
    let message = {
      s2: "functionCall",
      nameOfFunction,
      value: value,
    };
    this.send(message);
  },

  /**
   * Prints the data to console to match
   *
   * @method send
   * @param {Object} message - message to send back to application using the console.
   */
  send: function (message) {
    console.log(JSON.stringify(message));
  },
};

// attach to window to connect with webview core
window.SAGE2_AppState = SAGE2_AppState;
export default SAGE2_AppState;
