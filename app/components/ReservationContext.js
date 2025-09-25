import React, { createContext, useContext, useEffect } from "react";
import { useImmerReducer } from "use-immer"

const ReservationContextState = createContext();
const ReservationContextDispatch = createContext();

const initialState = {
  range: {
    from: undefined,
    to: undefined
  },
  ownerId: '8bd8f46c-0f5d-4b61-a93a-a16a7848e6f0',
  ownerAccommodations: [],
  ownerAccommodationsSelected: '',
  ownerInfo: {},
  guest: {
    id: '',
    fullName: '',
    email: '',
    phone: ''
  },
  submitCounter: 0,
  confirmReservationCounter: 0,
  resendConfirmationCodeCounter: 0,
  isReservationCreated: Boolean(localStorage.getItem('reservationId')),
  reservationId: localStorage.getItem('reservationId'),
  reservationConfirmed: false,
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
    case "getOwnerAccommodations":
      draft.ownerAccommodations = action.value;
      draft.ownerAccommodationsSelected = action.value[0].id;
      return;
    case "selectAccommodation":
      draft.ownerAccommodationsSelected = action.value;
      return;
    case "submitReservation":
      draft.submitCounter++;
      return;
    case "confirmReservation":
      draft.confirmReservationCounter++;
      return;
    case "reservationConfirmed":
      draft.reservationConfirmed = true;
      draft.isReservationCreated = false;
      draft.reservationId = '';
      return;
    case "reservationCreated":
      draft.isReservationCreated = true;
      draft.reservationId = action.value;
      return;
    case "resendCode":
      draft.resendConfirmationCodeCounter++;
      return;
  }
}

function ReservationProvider({ children }) {
  const [state, dispatch] = useImmerReducer(ourReducer, initialState);

  useEffect(() => {
    if(state.isReservationCreated) {
      localStorage.setItem('reservationId', state.reservationId);
    } else {
      localStorage.removeItem('reservationId');
    }
  }, [state.isReservationCreated]);

  useEffect(() => {
    if(state.reservationConfirmed) {
      localStorage.removeItem('reservationId');
    }
  }, [state.reservationConfirmed]);

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