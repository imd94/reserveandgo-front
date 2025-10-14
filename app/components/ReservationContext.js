import React, { createContext, useContext, useEffect } from "react";
import { useImmerReducer } from "use-immer"

const ReservationContextState = createContext();
const ReservationContextDispatch = createContext();

const initialState = {
  range: {
    from: undefined,
    to: undefined
  },
  regularPrice: '',
  discount: '',
  displayRange: '',
  numNights: '',
  regularPriceWithDiscount: '',
  totalPrice: '',
  ownerId: 'c1abadd3-4cea-4fab-9359-aaa4a074c670', //f167dd2d-0add-4f7c-a3d1-0b6c86cde745
  ownerAccommodations: [],
  ownerAccommodationsSelected: '',
  ownerInfo: {},
  submitCounter: 0,
  confirmReservationCounter: 0,
  resendConfirmationCodeCounter: 0,
  verifiedReservationCreated: false,
  verifiedReservationSuccessMessage: '',
  isReservationCreated: Boolean(localStorage.getItem('reservationId')),
  reservationId: localStorage.getItem('reservationId'),
  reservationConfirmed: false,
  reservationConfirmedSuccessMessage: '',
  reservationConfirmedFailedMessage: '',
  reservationErrors: [],
  reservationConfirmedErrors: [],
  reservationResendCodeErrors: [],
  reservationResendCodeInfo: [],
  reservationOperationalErrors: [],
  loader: {
    submitReservation: false,
    submitReservationConfirm: false,
    submitNewCode: false,
    emailCheck: false
  }
}

function ourReducer(draft, action) {
  switch (action.type) {
    case "getRange":
      draft.range = action.value
      const newErrors = draft.reservationErrors.filter(error => !error.hasOwnProperty('fullName'));
      draft.reservationErrors = newErrors;
      return;
    case "resetRange":
      draft.range.from = undefined;
      draft.range.to = undefined;
      return;
    case "setRegularPrice":
      draft.regularPrice = action.value;
      return;
    case "setDiscount":
      draft.discount = action.value;
      return;
    case "setDisplayRange":
      draft.displayRange = action.value;
      return;
    case "setRegularPriceWithDiscount":
      draft.regularPriceWithDiscount = action.value;
      return;
    case "setNumNights":
      draft.numNights = action.value;
      return;
    case "setTotalPrice":
      draft.totalPrice = action.value;
      return;
    case "getOwnerAccommodations":
      draft.ownerAccommodations = action.value;
      if(draft.ownerAccommodations.length > 1) {
        draft.ownerAccommodationsSelected = '';
      } else {
        draft.ownerAccommodationsSelected = action.value[0].id;
      }
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
    case "reservationConfirmedSuccessMessage":
      draft.reservationConfirmedSuccessMessage = action.successMessage;
      return;
    case "reservationConfirmedFailedMessage":
      draft.reservationConfirmedFailedMessage = action.failedMessage;
      return;
    case "reservationCreated":
      draft.isReservationCreated = true;
      draft.reservationId = action.value;
      draft.range.from = undefined;
      draft.range.to = undefined;
      return;
    case "reservationCreatedAndDispatched":
      draft.verifiedReservationCreated = true;
      draft.verifiedReservationSuccessMessage = action.value;
      draft.range.from = undefined;
      draft.range.to = undefined;
      return;
    case "reservationErrors":
      draft.reservationErrors = action.value;
      return;
    case "reservationConfirmedErrors":
      if(action.value && action.value.length) {
        draft.reservationConfirmedErrors.push(...action.value);
      }

      if(action.message) {
        draft.reservationConfirmedErrors.push(action.message);
      }

      if(action.resetErrors) {
        draft.reservationConfirmedErrors = [];
      }
      return;
    case "reservationResendCodeErrors": 
      if(action.message) {
        draft.reservationResendCodeErrors.push(action.message);
      }

      if(action.resetErrors) {
        draft.reservationResendCodeErrors = [];
      }
      return;

    case "reservationResendCodeInfo": 
      if(action.message) {
        draft.reservationResendCodeInfo.push(action.message);
      }

      if(action.resetInfo) {
        draft.reservationResendCodeInfo = [];
      }
      return;
    case "resendCode":
      draft.resendConfirmationCodeCounter++;
      return;
    case "loaderStart":
      if(action.value === 'submitReservation') {
        draft.loader.submitReservation = true;
      }

      if(action.value === 'submitReservationConfirm') {
        draft.loader.submitReservationConfirm = true;
      }

      if(action.value === 'submitNewCode') {
        draft.loader.submitNewCode = true;
      }

      if(action.value === 'emailCheck') {
        draft.loader.emailCheck = true;
      }
      return;
    case "loaderStop":
      if(action.value === 'submitReservation') {
        draft.loader.submitReservation = false;
      }

      if(action.value === 'submitReservationConfirm') {
        draft.loader.submitReservationConfirm = false;
      }

      if(action.value === 'submitNewCode') {
        draft.loader.submitNewCode = false;
      }

      if(action.value === 'emailCheck') {
        draft.loader.emailCheck = false;
      }
      return;
    case "operationalErrors":
      draft.reservationOperationalErrors.push(action.message);
      return;
    case "clearOperationalErrors":
      draft.reservationOperationalErrors = [];
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