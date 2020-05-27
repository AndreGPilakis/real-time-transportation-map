import React, { useState, useEffect, useContext, useCallback } from "react";
import SAGE2_AppState from "./SAGE2_AppState";

const SAGE2AppStateContext = React.createContext({});

export function SAGE2App({ initialState = {}, children }) {
  let [appState, setAppState] = useState(initialState);

  useEffect(() => {
    //set initial if unitialized
    if (!SAGE2_AppState.state) {
      SAGE2_AppState.state = initialState;
    }

    SAGE2_AppState.addFullStateHandler((fullState) => setAppState(fullState));

    return () => {
      SAGE2_AppState.addFullStateHandler(null);
    };
  });

  return (
    <SAGE2AppStateContext.Provider value={appState}>
      {children}
    </SAGE2AppStateContext.Provider>
  );
}

export function useSAGE2AppState(valueName = null) {
  let state = useContext(SAGE2AppStateContext);

  if (valueName === null) {
    return state;
  } else {
    return state[valueName];
  }
}

export function useSAGE2AppStateValue(valueName) {
  let state = useContext(SAGE2AppStateContext);
  let stateSetter = useCallback(
    (newValue, propagateChanges) => {
      SAGE2_AppState.fullStateHandler({ ...state, [valueName]: newValue });

      SAGE2_AppState.setValue(valueName, newValue, propagateChanges);
    },
    [valueName]
  );

  if (valueName === undefined) {
    throw new Error("You must specify the name of a state value to read");
  } else if (state[valueName] === undefined) {
    throw new Error(
      `The state value [${valueName}] does not exist on this app`
    );
  } else {
    return [state[valueName], stateSetter];
  }
}
