import React, { createContext, useContext } from "react";
import { useImmerReducer } from "use-immer"

const ReservationContextState = createContext();
const ReservationContextDispatch = createContext();

const initialState = {
  range: {
    from: undefined,
    to: undefined
  }
}

function ourReducer(draft, action) {
  switch (action.type) {
    case "getRange":
      draft.range = action.value
      return;
    case "resetRange":
      draft.range.from = undefined;
      draft.range.to = undefined;
      return;
  }
}

function ReservationProvider({ children }) {
  const [state, dispatch] = useImmerReducer(ourReducer, initialState);

  return (
    <ReservationContextState.Provider value={{ state }}>
      <ReservationContextDispatch.Provider value={{ dispatch }}>
        { children }
      </ReservationContextDispatch.Provider>
    </ReservationContextState.Provider>
  );
}

function UseReservationState() {
  const context = useContext(ReservationContextState);

  if(context === undefined) { throw new Error('Context was used outside provider.') }

  return context;
}

function UseReservationDispatch() {
  const context = useContext(ReservationContextDispatch);

  if(context === undefined) { throw new Error('Context was used outside provider.') }

  return context;
}

export { ReservationProvider, UseReservationState, UseReservationDispatch };