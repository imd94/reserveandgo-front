import React, { useState, useEffect, use } from "react";
import { UseReservationState, UseReservationDispatch } from './ReservationContext';
//import { DayPicker } from "react-day-picker";
//import { format, isWithinInterval, differenceInDays, isPast, eachDayOfInterval, isSameDay } from "date-fns";
//import { srLatn } from 'date-fns/locale';
import { useImmer } from "use-immer";
import Select from 'react-select';
import useReCaptcha from './hooks/recaptchaV3';
//import "react-day-picker/dist/style.css";
import Axios from "axios";
import BookingCalendar from "./BookingCalendar";

/* const bookedDates = [
  eachDayOfInterval({
    start: new Date('2025-10-16 18:06:17'),
    end: new Date('2025-10-20 18:06:17'),
  }),
  eachDayOfInterval({
    start: new Date('2025-10-25 18:06:17'),
    end: new Date('2025-10-29 18:06:17'),
  })
].flat();

function isAlreadyBooked(range, datesArr) {
  return (
    range?.from &&
    range?.to &&
    datesArr.some((date) =>
      isWithinInterval(date, { start: range.from, end: range.to })
    )
  );
} */

function Reservation() {
  const { state } = UseReservationState();
  const { dispatch } = UseReservationDispatch();
  const { reCaptchaLoaded, generateReCaptchaToken } = useReCaptcha();
  //const [ datePickerMonths, setDatePickerMonths ] = useState(2);
  const [code, setCode] = useState();
  const [checkInTime, setCheckInTime] = useState();
  const [baseUnitSelect, setBaseUnitSelect] = useState(7.5);

  // Settings
  /* const minBookingLength = 0; 
  const maxBookingLength = 90;
  const regularPrice = 40;
  const discount = 15; */

  // Reservation info
  /* const displayRange = isAlreadyBooked(state.range, bookedDates) ? {} : state.range;
  const numNights = differenceInDays(displayRange?.to, displayRange?.from);
  const regularPriceWithDiscount = (regularPrice - (regularPrice * (discount / 100)));
  const totalPrice = numNights * (regularPrice - (regularPrice * (discount / 100))); */

  const [ localState, setLocalState ] = useImmer({
    email: {
      hasErrors: false,
      message: '',
      checkCount: 0,
      value: ''
    },
    fullName: '',
    phone: '',
    numGuests: '',
    additionalInfo: '',
    alreadyGuest: false
  });

  const numGuestOptions = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' }
  ];

  const transformedOptions = state.ownerAccommodations.map(accommodation => ({
    value: accommodation.id,
    label: accommodation.name
  }));
  const defaultOption = transformedOptions.find(
    option => option.value === state.ownerAccommodationsSelected
  );


  function handleReservationSubmit(e) {
    e.preventDefault();
    dispatch({ type: 'clearOperationalErrors' });

    if(!checkInTime) {
      dispatch({ type: 'submitReservation' });
    }
  }

  function handleReservationConfirm(e) {
    e.preventDefault();
    dispatch({ type: 'reservationConfirmedErrors', resetErrors: [] });
    dispatch({ type: 'confirmReservation' });
  }

  function handleResendCode(e) {
    e.preventDefault();
    dispatch({ type: 'reservationResendCodeErrors', resetErrors: [] });
    dispatch({ type: 'reservationResendCodeInfo', resetInfo: [] });
    dispatch({ type: 'resendCode' });
  }

  /* function rangeSelectHandler(range) {
    dispatch({ type: 'getRange', value: range });

    const filteredErrors = state.reservationErrors.filter(error => !error.hasOwnProperty('date'));
    dispatch({ type: 'reservationErrors', value: filteredErrors });
  } */

  function emailFieldHandler(e) {
    setLocalState(draft => { 
      draft.email.value = e.target.value;
      draft.email.hasErrors = false;
      draft.email.message = '';

      if(draft.email.value.trim() == '') {
        draft.alreadyGuest = false;
      }
    });

    const filteredErrors = state.reservationErrors.filter(error => !error.hasOwnProperty('email'));
    dispatch({ type: 'reservationErrors', value: filteredErrors });
  }

  function fullNameFieldHandler(e) {
    setLocalState(draft => { draft.fullName = e.target.value });

    const filteredErrors = state.reservationErrors.filter(error => !error.hasOwnProperty('fullName'));
    dispatch({ type: 'reservationErrors', value: filteredErrors });
  }

  function phoneFieldHandler(e) {
    setLocalState(draft => { draft.phone = e.target.value });

    const filteredErrors = state.reservationErrors.filter(error => !error.hasOwnProperty('phone'));
    dispatch({ type: 'reservationErrors', value: filteredErrors });
  }

  function numGuestsFieldHandler(option) {
    setLocalState(draft => { draft.numGuests = option.value });

    const filteredErrors = state.reservationErrors.filter(error => !error.hasOwnProperty('numGuests'));
    dispatch({ type: 'reservationErrors', value: filteredErrors });
  }

  function handleCodeInput(e) {
    setCode(e.target.value);

    dispatch({ type: 'reservationConfirmedErrors', resetErrors: [] });
  }

  /* function localizeDate(date) {
    if(date) {
      return format(date, 'EEEE, d. MMMM yyyy.', { locale: srLatn });
    }

    return null;
  } */

  useEffect(() => {
    if(state.ownerId) {
      const ourRequest = Axios.CancelToken.source()

      async function getAccommodationInfo() {
        try {
          const response = await Axios.get(`/accommodation-units/${state.ownerId}`, { cancelToken: ourRequest.token });
          console.log(response.data);
          dispatch({ type: 'getOwnerAccommodations', value: response.data.accommodations });
        } catch (e) {
          console.log("There was a problem.")
        }
      }
      getAccommodationInfo()
      return () => {
        ourRequest.cancel()
      }
    }
  }, []);

  useEffect(() => {
    if(state.submitCounter) {
      const ourRequest = Axios.CancelToken.source();
      dispatch({ type: 'loaderStart', value: 'submitReservation' });

      async function createReservation() {
        try {
          await generateReCaptchaToken('reservation');
          const response = await Axios.post(`/create-guest-reservation`, {
            startDate: state.displayRange?.from,
            endDate: state.displayRange?.to,
            numNights: state.numNights,
            accommodationPrice: state.regularPrice,
            accommodationPriceWithDiscount: state.regularPriceWithDiscount,
            totalPrice: state.totalPrice,
            discount: state.discount,
            accommodationId: state.ownerAccommodationsSelected,
            accommodationOwnerId: state.ownerId,
            email: localState.email.value,
            phone: localState.phone,
            fullName: localState.fullName,
            numGuests: localState.numGuests ? localState.numGuests * 1 : '',
            checkInTime: checkInTime,
            additionalInfo: localState.additionalInfo,
            recaptchaToken: localStorage.getItem('recaptcha_token') || ''
          }, { cancelToken: ourRequest.token })

          if(response.data && response.data.reservation) {
            dispatch({ type: 'reservationCreated', value: response.data.reservation });
          }

          if(response.data && response.data.reservationV === 'success') {
            dispatch({ type: 'reservationCreatedAndDispatched', value: response.data.message });
            setLocalState(draft => {
              draft.email.value = '';
              draft.fullName = '';
              draft.phone = '';
              draft.numGuests = '';
              draft.additionalInfo = '';
              draft.alreadyGuest = false;
            });
          }
        } catch(e) {
          if(e.response && e.response.data.errors && e.response.data.errors.length) {
            dispatch({ type: 'reservationErrors', value: e.response.data.errors });
          }

          if(e.response && e.response.data && e.response.data.error) {
            dispatch({ type: 'operationalErrors', message: e.response.data.message });
          }
          console.log(e);
          console.log("There was a problem.");
        } finally {
          dispatch({ type: 'loaderStop', value: 'submitReservation' });
        }
      }
      createReservation();
      return () => {
        ourRequest.cancel()
      }
    }
  }, [state.submitCounter]);

  useEffect(() => {
    if(state.confirmReservationCounter) {
      const ourRequest = Axios.CancelToken.source();
      dispatch({ type: 'loaderStart', value: 'submitReservationConfirm' });

      async function confirmReservation() {
        try {
          const response = await Axios.post(`/verify-guest-reservation`, {
            reservationId: state.reservationId,
            code: code
          }, { cancelToken: ourRequest.token })

          if(response.data && response.data.errors && response.data.errors.length) {
            dispatch({ type: 'reservationConfirmedErrors', value: response.data.errors });
          }

          if(response.data && response.data.status === 'success') {
            dispatch({ type: 'reservationConfirmed' });
            dispatch({ type: 'reservationConfirmedSuccessMessage', successMessage: response.data.message });
          }

          if(response.data && response.data.status === 'failed') {
            dispatch({ type: 'reservationConfirmedFailedMessage', failedMessage: response.data.message });
          }
        } catch (e) {
          if(e.response && e.response.data && e.response.data.error) {
            dispatch({ type: 'reservationConfirmedErrors', message: e.response.data.message });
          }
          console.log("There was a problem.");
        } finally {
          dispatch({ type: 'loaderStop', value: 'submitReservationConfirm' });
        }
      }
      confirmReservation()
      return () => {
        ourRequest.cancel()
      }
    }
  }, [state.confirmReservationCounter]);

  useEffect(() => {
    if(state.resendConfirmationCodeCounter) {
      const ourRequest = Axios.CancelToken.source();
      dispatch({ type: 'loaderStart', value: 'submitNewCode' });

      async function resendConfirmationCode() {
        try {
          const response = await Axios.post(`/reservations/resend-confirmation-code`, {
            reservationId: state.reservationId
          }, { cancelToken: ourRequest.token })

          if(response.data && response.data.status === 'success') {
            dispatch({ type: 'reservationResendCodeInfo', message: response.data.message });
          }
        } catch (e) {
          if(e && e.response && e.response.data && e.response.data.error) {
            dispatch({ type: 'reservationResendCodeErrors', message: e.response.data.message });
          }
          console.log("There was a problem resending code.")
        } finally {
          dispatch({ type: 'loaderStop', value: 'submitNewCode' });
        }
      }
      resendConfirmationCode()
      return () => {
        ourRequest.cancel()
      }
    }
  }, [state.resendConfirmationCodeCounter]);

  /* useEffect(() => {
    const mq = window.matchMedia("(max-width: 991.98px)");

    const updateMonths = () => {
      setDatePickerMonths(mq.matches ? 1 : 2);
    };

    updateMonths(); // run once on mount
    mq.addEventListener("change", updateMonths);

    return () => mq.removeEventListener("change", updateMonths);
  }, []); */

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1199.98px)");

    const updateBaseUnit = () => {
      setBaseUnitSelect(mq.matches ? 5 : 7.5);
    };

    updateBaseUnit(); // run once on mount
    mq.addEventListener("change", updateBaseUnit);

    return () => mq.removeEventListener("change", updateBaseUnit);
  }, []);

  useEffect(() => {
    if (localState.email.checkCount) {
      const ourRequest = Axios.CancelToken.source();
      dispatch({ type: 'loaderStart', value: 'emailCheck' });

      async function fetchEmail() {
        try {
          const response = await Axios.post("/doesEmailExist", { email: localState.email.value }, { cancelToken: ourRequest.token });
          console.log(response);
          if(response.data && response.data.status === 'success') {
            setLocalState(draft => { 
              draft.alreadyGuest = true;
              draft.fullName = response.data.user.fullName;
              draft.phone = response.data.user.phone;
            });
          }
        } catch (e) {
          console.log("There was a problem or the request was cancelled.")
        } finally {
          dispatch({ type: 'loaderStop', value: 'emailCheck' });
        }
      }
      fetchEmail();
      return () => ourRequest.cancel();
    }
  }, [localState.email.checkCount]);

  useEffect(() => {
    if (localState.email.value) {
      const delay = setTimeout(() => {
        setLocalState( draft => { 
          if (!/^\S+@\S+$/.test(draft.email.value)) {
            draft.email.hasErrors = true;
            draft.email.message = "Unesite validnu email adresu!";
          }
          if (!draft.email.hasErrors) {
            draft.email.checkCount++;
          }
        });
      }, 800);
      return () => clearTimeout(delay);
    }
  }, [localState.email.value]);

  console.log(state.ownerAccommodationsSelected);

  return (
    <section className="rag-reservation">
      <div className="rag-reservation__wrapper">
        { !state.isReservationCreated ? 
        <form onSubmit={ handleReservationSubmit } className="rag-reservation__form">
          {state.ownerAccommodations.length > 0 && (
            state.ownerAccommodations.map((accommodation, index) => {
              return (
                state.ownerAccommodationsSelected === accommodation.id && (
                  <BookingCalendar 
                    accommodation={accommodation} 
                    key={accommodation.id}
                  />
                )
              )
            })
          ) }
          
          {/* <div className="rag-calendar">
            <div className="date-label-wrapper">
              <span className="date-label d-block">Izaberite period boravka</span>
            </div>

            { (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('date'))) && (
              <div className="errors errors--date" style={{ top: 0 }}>
                { state.reservationErrors.filter(error => error.hasOwnProperty('date')).map((error, index) => {
                  return (
                    <span key={index} className="error-message d-block">{ error.date }</span>
                  )
                }) }
              </div>
            ) }

            <div className="calendar-wrapper">
              <DayPicker
                mode="range"
                locale={srLatn}
                onSelect={(range) => rangeSelectHandler(range)}
                selected={ displayRange }
                min={minBookingLength + 1}
                max={maxBookingLength}
                fromMonth={new Date()}
                fromDate={new Date()}
                toYear={new Date().getFullYear() + 5}
                captionLayout="dropdown"
                numberOfMonths={datePickerMonths}
                disabled={ (currentDate) => isPast(currentDate) || bookedDates.some((date) => isSameDay(date, currentDate) ) }
              />
            </div>

            <div className="rag-reservation__info">
              <p className="price-info mb-0">
                {discount > 0 ? (
                  <>
                    <span className="data-label">Cena noćenja:</span>
                    <span className="regular-price-with-discount">€{regularPriceWithDiscount}</span>
                    <span className="regular-price has-discount">€{regularPrice}</span>
                  </>
                ) : (
                  <>
                    <span className="data-label">Cena noćenja:</span>
                    <span className="regular-price">€{regularPrice}</span>
                  </>
                )}
              </p>

              { state.range?.from || state.range?.to ? (
                <div className="price-info-wrapper period">
                  { state.range?.from && (
                    <>
                      <span className="data-label from-label">Od: {' '}</span> 
                      <span className="date-from">{ localizeDate(state.range?.from) }</span>
                    </>
                  ) }
                  { state.range?.to && ( 
                    <>
                      <span className="do">&mdash;</span>
                      <span className="data-label to-label">Do: {' '}</span> 
                      <span className="date-to">{ localizeDate(state.range?.to) }</span> 
                    </>
                  ) }
                </div>
              ) : null }

              {numNights ? (
                <div className="price-info-wrapper">
                  <p className="price-info mb-0">
                    <span className="data-label">Broj noćenja:</span>
                    <span className="num-nights">{numNights}</span>
                  </p>

                  <p className="price-info total mb-0">
                    <span className="data-label">Ukupno:</span>{" "}
                    <span className="total-price">€{totalPrice}</span>
                  </p>
                </div>
              ) : null}

              {state.range?.from || state.range?.to ? (
                <button
                  className="btn btn-clear"
                  onClick={ () => dispatch({ type: 'resetRange' }) }
                >
                  Resetuj
                </button>
              ) : null}
            </div>
          </div> */}

          <div className="rag-reservation__form-fields">
            { state.verifiedReservationCreated && (
              <div className="info-flash">
                <span className="success-message d-block">{ state.verifiedReservationSuccessMessage }</span>
              </div>
            ) }

            { state.reservationConfirmedSuccessMessage && (
              <div className="info-flash">
                <span className="success-message d-block">{ state.reservationConfirmedSuccessMessage }</span>
              </div>
            ) }

            { state.reservationConfirmedFailedMessage && (
              <div className="errors">
                <span className="error-message d-block">{ state.reservationConfirmedFailedMessage }</span>
              </div>
            ) }

            { state.reservationOperationalErrors.length > 0 && (
              <div className="errors errors--operational">
                { state.reservationOperationalErrors.map((error, index) => {
                  return (
                    <span key={index} className="error-message d-block">{ error }</span>
                  )
                }) }
              </div>
            ) }

            { (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('checkInTime'))) && (
              <div className="errors errors--checkInTime">
                { state.reservationErrors.filter(error => error.hasOwnProperty('checkInTime')).map((error, index) => {
                  return (
                    <span key={index} className="error-message d-block">{ error.checkInTime }</span>
                  )
                }) }
              </div>
            ) }
            
            <div className="rag-reservation__field-group field-group--email">
              {/* <label htmlFor="email">E-mail Adresa</label> */}
              <input onChange={ emailFieldHandler } type="email" value={ localState.email.value } className={`input-field reservation-input ${ (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('email'))) && 'has-error' }`} name="email" id="email" placeholder="E-mail Adresa" />
            </div>
            { (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('email'))) && (
              <div className="errors errors--email">
                { state.reservationErrors.filter(error => error.hasOwnProperty('email')).map((error, index) => {
                  return (
                    <span key={index} className="error-message d-block">{ error.email }</span>
                  )
                }) }
              </div>
            ) }

            { localState.email.hasErrors && (
              <div className="errors errors--email">
                <span className="error-message d-block">{ localState.email.message }</span>
              </div>
            ) }

            <div className="rag-reservation__field-group--cols-2">
              <div className="rag-reservation__field-group">
                {/* <label htmlFor="full-name">Ime i Prezime</label> */}
                <input onChange={ fullNameFieldHandler } type="text" className={`input-field reservation-input ${ (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('fullName'))) && 'has-error' }`} name="full_name" id="full-name" {...(localState.alreadyGuest && { disabled: true })} value={ localState.fullName } placeholder="Ime i Prezime" />
              </div>

              <div className="rag-reservation__field-group">
                {/* <label htmlFor="phone">Telefon</label> */}
                <input onChange={ phoneFieldHandler } type="text" className={`input-field reservation-input ${ (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('phone'))) && 'has-error' }`} name="phone" id="phone" {...(localState.alreadyGuest && { disabled: true })} value={ localState.phone } placeholder="Mobilni Telefon" />
              </div>

              { (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('fullName'))) && (
                <div className="errors errors--fullname">
                  { state.reservationErrors.filter(error => error.hasOwnProperty('fullName')).map((error, index) => {
                    return (
                      <span key={index} className="error-message d-block">{ error.fullName }</span>
                    )
                  }) }
                </div>
              ) }

              { (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('phone'))) && (
                <div className="errors errors--phone">
                  { state.reservationErrors.filter(error => error.hasOwnProperty('phone')).map((error, index) => {
                    return (
                      <span key={index} className="error-message d-block">{ error.phone }</span>
                    )
                  }) }
                </div>
              ) }
            </div>

            <div className="rag-reservation__field-group">
              {/* <label htmlFor="guest-number">Koliko osoba?</label> */}
              <Select
                defaultValue={localState.numGuests}
                onChange={ numGuestsFieldHandler }
                options={numGuestOptions}
                name="label"
                placeholder="Koliko osoba?"
                className={`react-select-field ${(state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('accommodationId'))) && 'has-error' }`}
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderColor: state.isFocused ? 'var(--primary_focus)' : 'var(--gray_bccbda)',
                    boxShadow: 'none',  /* Remove blue box-shadow */
                    '&:hover': {
                      borderColor: state.isFocused ? 'var(--primary_focus)' : 'var(--gray_9fabb8)'
                    }
                  }),
                  singleValue: (baseStyles) => ({
                    ...baseStyles,
                    color: 'var(--text_464a53)',
                  }),
                  placeholder: (baseStyles, state) => ({
                    ...baseStyles,
                    color: 'var(--text_B1B1B1)'
                  }),
                }}
                theme={(theme) => ({
                  ...theme,
                  borderRadius: 5,
                  spacing: {
                    ...theme.spacing,
                    baseUnit: baseUnitSelect
                  },
                })}
              />
            </div>
            { (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('numGuests'))) && (
              <div className="errors errors--numGuests">
                { state.reservationErrors.filter(error => error.hasOwnProperty('numGuests')).map((error, index) => {
                  return (
                    <span key={index} className="error-message d-block">{ error.numGuests }</span>
                  )
                }) }
              </div>
            ) }

            { state.ownerAccommodations.length > 0 && (
              <div className="rag-reservation__field-group field-group--apartment" style={{ display: state.ownerAccommodations.length == 1 ? 'none' : 'block' }}>
                {/* <label htmlFor="apartment">Apartman</label> */}
                <Select
                  defaultValue={defaultOption}
                  onChange={ (option) => dispatch({ type: 'selectAccommodation', value: option.value }) }
                  options={transformedOptions}
                  name="name"
                  placeholder="Izaberite smeštaj"
                  className={`react-select-field ${(state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('accommodationId'))) && 'has-error' }`}
                  styles={{
                    control: (baseStyles, state) => ({
                      ...baseStyles,
                      borderColor: state.isFocused ? 'var(--primary_focus)' : 'var(--gray_bccbda)',
                      boxShadow: 'none',  /* Remove blue box-shadow */
                      '&:hover': {
                        borderColor: state.isFocused ? 'var(--primary_focus)' : 'var(--gray_9fabb8)'
                      }
                    }),
                    singleValue: (baseStyles) => ({
                      ...baseStyles,
                      color: 'var(--text_464a53)',
                    }),
                    placeholder: (baseStyles, state) => ({
                      ...baseStyles,
                      color: 'var(--text_B1B1B1)'
                    }),
                  }}
                  theme={(theme) => ({
                    ...theme,
                    borderRadius: 5,
                    spacing: {
                      ...theme.spacing,
                      baseUnit: baseUnitSelect
                    },
                  })}
                />
              </div>
            ) }

            { (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('accommodationId'))) && (
              <div className="errors errors--accommodationId">
                { state.reservationErrors.filter(error => error.hasOwnProperty('accommodationId')).map((error, index) => {
                  return (
                    <span key={index} className="error-message d-block">{ error.accommodationId }</span>
                  )
                }) }
              </div>
            ) }

            <div className="rag-reservation__field-group field-group--checkintime">
              <label htmlFor="checkintime">Vreme Dolaska</label>
              <input onChange={ (e) => setCheckInTime(e.target.value) } type="text" className={`input-field reservation-input`} name="checkintime" id="checkintime" tabIndex="-1" autoComplete="off" placeholder="primer: 15:00h" />
            </div>

            <div className="rag-reservation__field-group field-group--note">
              <label htmlFor="note">Dodatne informacije u vezi vašeg boravak?</label>
              <textarea onChange={ (e) => setLocalState(draft => { draft.additionalInfo = e.target.value }) } type="text" className={`input-field reservation-input ${ (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('additionalInfo'))) && 'has-error' }`} name="note" id="note" rows="3" maxLength="250"  placeholder="Dolazimo oko 17h, Dolazimo sa bebom, Dovodimo kućnog ljubimca..."></textarea>
            </div>

            { (state.reservationErrors.length > 0 && state.reservationErrors.some(error => error.hasOwnProperty('additionalInfo'))) && (
              <div className="errors errors--additionalInfo">
                { state.reservationErrors.filter(error => error.hasOwnProperty('additionalInfo')).map((error, index) => {
                  return (
                    <span key={index} className="error-message d-block">{ error.additionalInfo }</span>
                  )
                }) }
              </div>
            ) }

            <div className="rag-reservation__field-group field-group--submit">
              { reCaptchaLoaded && (
                <button type="submit" className="button reserve-button submit-button" {...(state.loader.submitReservation && { disabled: true })}>
                  Rezerviši

                  { state.loader.submitReservation && (
                    <span className="spinner-border" role="status" style={{ borderColor: 'var(--white)', borderRightColor: 'transparent' }}>
                      <span className="sr-only">Loading...</span>
                    </span>
                  ) }
                </button>  
              ) }
            </div>
          </div>
        </form> : 

        <form onSubmit={ handleReservationConfirm } className="reservation-confirm">
          <div className="reservation-confirm__header">
            <h3 className="reservation-confirm__heading">Potvrda Rezervacije</h3>
            <p className="reservation-confirm__text">Poštovani, na vašu email adresu smo poslali jednokratni kod za potvrdu rezervacije. Molimo vas da ga unesete u polje ispod kako bi vaša rezervacija bila potvrđena. Hvala unapred.</p>
            <p className="reservation-confirm__text">Ukoliko niste dobili kod na vašu email adresu, kliknite na link: {' '} 
              <a href="#" className={ `generate-new-code-link ${ (state.loader.submitNewCode || state.loader.submitReservationConfirm) && 'loader-active' }` } onClick={ handleResendCode }>
                Pošalji novi kod

                { state.loader.submitNewCode && (
                  <span className="spinner-border" role="status" style={{ borderColor: 'var(--text_3d4465)', borderRightColor: 'transparent' }}>
                    <span className="sr-only">Loading...</span>
                  </span>
                ) }
              </a>
            </p>
          </div>

          { (state.reservationResendCodeErrors.length > 0) && (
            <div className="errors errors--phone">
              { state.reservationResendCodeErrors.map((error, index) => {
                return (
                  <span key={index} className="error-message d-block">{ error }</span>
                )
              }) }
            </div>
          ) }

          <div className="rag-reservation__field-group">
            <label htmlFor="confirmation-code">Kod za potvrdu rezervacije</label>
            <input onChange={ handleCodeInput } type="text" className="input-field reservation-input reservation-confirm__code-input" name="confirmation_code" id="confirmation-code" />
          </div>

          { (state.reservationConfirmedErrors.length > 0) && (
            <div className="errors errors--phone">
              { state.reservationConfirmedErrors.map((error, index) => {
                return (
                  <span key={index} className="error-message d-block">{ error }</span>
                )
              }) }
            </div>
          ) }

          { (state.reservationResendCodeInfo.length > 0) && (
            <div className="info-flash">
              { state.reservationResendCodeInfo.map((info, index) => {
                return (
                  <span key={index} className="success-message d-block">{ info }</span>
                )
              }) }
            </div>
          ) }

          <div className="rag-reservation__field-group field-group--submit">
            <button type="submit" className="button code-confirm-button submit-button">
              Potvrdi Rezervaciju

              { state.loader.submitReservationConfirm && (
                <span className="spinner-border" role="status" style={{ borderColor: 'var(--white)', borderRightColor: 'transparent' }}>
                  <span className="sr-only">Loading...</span>
                </span>
              ) }
            </button>  
          </div>
        </form>
        }
      </div>

      <div className="footer-text">
        <p className="footer-credits">
          Powered by 
          <a href="#" target="_blank" className="logo-link d-block">
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
              viewBox="0 0 429 91.1" style={{enableBackground: 'new 0 0 429 91.1'}} width="150" height="31">
              <g id="SvgjsG3640" transform="matrix(0.7565884082809465,0,0,0.7565884082809465,9.141272163816515,4)">
                <g>
                  <g>
                    <path className="st0" fill="#0278AE" d="M114.8,8.4c0-0.3,0-0.6-0.1-0.9c-0.1-0.3-0.1-0.5-0.2-0.7c-0.1-0.3-0.1-0.5-0.2-0.8
                      c-0.1-0.3-0.3-0.6-0.4-0.8c-0.1-0.2-0.1-0.3-0.2-0.5c0-0.1-0.1-0.1-0.1-0.1c-0.2-0.3-0.4-0.5-0.6-0.7c-0.1-0.2-0.3-0.4-0.4-0.5
                      c-0.2-0.2-0.4-0.4-0.6-0.5c-0.2-0.2-0.4-0.3-0.6-0.5c-0.2-0.2-0.5-0.3-0.7-0.4c-0.2-0.1-0.4-0.2-0.6-0.3
                      c-0.3-0.1-0.5-0.2-0.8-0.3c-0.2-0.1-0.4-0.2-0.7-0.2c-0.3-0.1-0.5-0.1-0.8-0.1c-0.3,0-0.5-0.1-0.8-0.1c-0.1,0-0.1,0-0.2,0
                      c-0.2,0-0.4,0-0.6,0.1c-0.3,0-0.6,0-0.8,0.1c-0.3,0-0.5,0.1-0.8,0.2c-0.2,0.1-0.5,0.1-0.7,0.2c-0.3,0.1-0.6,0.3-0.9,0.4
                      c-0.1,0.1-0.3,0.1-0.4,0.2L58.9,28.5L15.4,2c-0.1-0.1-0.3-0.1-0.4-0.2c-0.3-0.2-0.6-0.3-0.9-0.4c-0.2-0.1-0.4-0.1-0.7-0.2
                      C13.2,1,12.9,1,12.6,0.9c-0.3,0-0.5-0.1-0.8-0.1c-0.2,0-0.4-0.1-0.6-0.1c-0.1,0-0.1,0-0.2,0c-0.3,0-0.6,0-0.8,0.1
                      C9.9,0.9,9.6,0.9,9.4,1C9.1,1,8.9,1.1,8.6,1.2C8.4,1.3,8.1,1.4,7.9,1.5C7.6,1.6,7.4,1.7,7.2,1.9C7,2,6.7,2.1,6.6,2.2
                      C6.3,2.4,6.1,2.6,5.9,2.8C5.7,2.9,5.5,3.1,5.3,3.2C5.2,3.4,5,3.6,4.9,3.8C4.7,4.1,4.5,4.3,4.3,4.5c0,0-0.1,0.1-0.1,0.1
                      C4.1,4.8,4.1,5,4,5.1C3.9,5.4,3.7,5.7,3.6,6C3.5,6.2,3.5,6.4,3.4,6.7C3.3,6.9,3.2,7.2,3.2,7.5c0,0.3-0.1,0.6-0.1,0.8
                      C3.1,8.5,3,8.7,3,8.9v69.2c0,0.1,0,0.1,0,0.1c0,0.1,0,0.2,0,0.4c0.2,3.2,2.2,5.8,5,7L30.2,99l24.5,15c0.1,0.1,0.3,0.1,0.5,0.2
                      c0.2,0.1,0.4,0.2,0.5,0.3c0.1,0,0.2,0.1,0.3,0.1c0.2,0.1,0.5,0.2,0.7,0.2c0.2,0.1,0.3,0.1,0.5,0.2c0.1,0,0.2,0,0.3,0.1
                      c0.2,0,0.5,0.1,0.7,0.1c0.2,0,0.4,0,0.6,0c0.1,0,0.1,0,0.1,0c0.1,0,0.1,0,0.1,0c0.2,0,0.4,0,0.6,0c0.2,0,0.5,0,0.7-0.1
                      c0.1,0,0.2,0,0.3-0.1c0.2,0,0.3-0.1,0.5-0.2c0.2-0.1,0.5-0.1,0.7-0.2c0.1,0,0.2-0.1,0.3-0.1c0.2-0.1,0.3-0.2,0.5-0.3
                      c0.2-0.1,0.3-0.1,0.5-0.2l24.5-15l22.1-13.4c2.8-1.1,4.7-3.8,5-6.9c0-0.2,0.1-0.3,0.1-0.5c0,0,0-0.1,0-0.1V8.9
                      C114.8,8.7,114.8,8.6,114.8,8.4z M50.8,78.3v14.2L17.5,72.3v-50l12.7,7.6l20.6,12.6L50.8,78.3L50.8,78.3z M77.5,23.2l9.4-5.8
                      v28.7c0,0.4-0.1,0.7-0.2,1.1l0,0l0,0c-0.1,0.5-0.3,0.9-0.6,1.3c0,0-0.1,0.1-0.1,0.1c-0.2,0.4-0.5,0.7-0.8,0.9
                      c-0.2,0.1-0.4,0.2-0.5,0.4c-0.2,0.2-0.5,0.3-0.8,0.4c-0.5,0.2-1.1,0.3-1.7,0.3c-0.6,0-1.1-0.1-1.7-0.3c-0.3-0.1-0.5-0.3-0.8-0.4
                      c-0.2-0.1-0.4-0.2-0.5-0.4c-0.3-0.3-0.6-0.6-0.8-0.9c0,0-0.1-0.1-0.1-0.1c-0.5-0.7-0.8-1.5-0.8-2.5V23.2L77.5,23.2z M100.4,48.2
                      v24L67.1,92.5v-50l6.7-4.1v7.7c0,4.6,3.8,8.4,8.4,8.4c4.6,0,8.4-3.8,8.4-8.4v-18l9.8-5.9L100.4,48.2L100.4,48.2z"/>
                  </g>
                </g>
              </g>
              <g id="SvgjsG3641" transform="matrix(2.6301099508013204,0,0,2.6301099508013204,97.52713795098028,4.114130980954139)">
                <path className="st0" fill="#0278AE" d="M9.2,23.1H6V11.4h3.2V13c0.8-1.1,1.9-1.8,3.4-1.8v3.2c-2.3,0-3.4,1.3-3.4,3.3C9.2,17.7,9.2,23.1,9.2,23.1z
                  M24.4,20.6c-1.1,1.7-3,2.8-5.6,2.8c-3.8,0-6.2-2.6-6.2-6.1c0-3.4,2.5-6.1,6.2-6.1c3.7,0,5.9,2.6,5.9,6c0,0.5,0,1.1,0,1.1h-9
                  c0.3,1.5,1.5,2.4,3.1,2.4c1.4,0,2.4-0.6,3.1-1.6L24.4,20.6z M18.9,13.7c-1.5,0-2.5,0.8-2.9,2.1h5.7C21.3,14.5,20.2,13.7,18.9,13.7z
                  M25.8,19.4H29c0,0.7,0.5,1.6,2.2,1.6c1.2,0,1.7-0.5,1.7-1.1c0-2.1-6.9,0-6.9-4.9c0-2.1,1.9-3.8,4.8-3.8s4.8,1.5,5,3.9h-3.2
                  c0-0.8-0.4-1.5-1.8-1.5c-0.9,0-1.7,0.3-1.7,1c0,2.1,7.1,0.3,7.1,4.7c0,2.8-2.3,4-5.3,4C27.8,23.3,25.8,21.7,25.8,19.4z M48.8,20.6
                  c-1.1,1.7-3,2.8-5.6,2.8c-3.8,0-6.2-2.6-6.2-6.1c0-3.4,2.5-6.1,6.2-6.1c3.7,0,5.9,2.6,5.9,6c0,0.5,0,1.1,0,1.1h-9
                  c0.3,1.5,1.5,2.4,3.1,2.4c1.4,0,2.4-0.6,3.1-1.6L48.8,20.6z M43.3,13.7c-1.5,0-2.5,0.8-2.9,2.1h5.7C45.7,14.5,44.6,13.7,43.3,13.7z
                  M53.6,23.1h-3.2V11.4h3.2V13c0.8-1.1,1.9-1.8,3.4-1.8v3.2c-2.3,0-3.4,1.3-3.4,3.3V23.1z M65.8,23.1h-4.3l-3.8-11.7h3.5l2.5,8.7
                  l2.5-8.7h3.4L65.8,23.1z M82,20.6c-1.1,1.7-3,2.8-5.6,2.8c-3.8,0-6.2-2.6-6.2-6.1c0-3.4,2.5-6.1,6.2-6.1c3.7,0,5.9,2.6,5.9,6
                  c0,0.5,0,1.1,0,1.1h-9c0.3,1.5,1.5,2.4,3.1,2.4c1.4,0,2.4-0.6,3.1-1.6L82,20.6z M76.4,13.7c-1.5,0-2.5,0.8-2.9,2.1h5.7
                  C78.8,14.5,77.7,13.7,76.4,13.7z M88.6,11.5c0,0.7,0.4,1.4,1,2c1.3-0.5,2.2-1.1,2.2-2.2c0-0.9-0.6-1.5-1.5-1.5
                  C89.4,9.8,88.6,10.4,88.6,11.5L88.6,11.5z M91.8,20l-3.3-3.4c-0.9,0.5-1.6,1.1-1.6,2c0,1.2,1.1,1.9,2.6,1.9
                  C90.4,20.6,91.2,20.4,91.8,20z M94.8,23.1L94,22.2c-1.2,0.7-2.7,1.2-4.5,1.2c-3.5,0-5.9-1.6-5.9-4.6c0-2.2,1.3-3.4,3.1-4.2
                  c-0.6-0.8-1.2-1.8-1.2-3c0-2.6,1.9-4.4,4.8-4.4c2.7,0,4.5,1.7,4.5,3.9c0,2.4-1.6,3.5-3.5,4.3L94,18c0.9-1.4,1.4-3.2,1.5-4.8h3.1
                  c-0.2,2.3-0.9,5-2.4,7l2.9,2.9L94.8,23.1L94.8,23.1z M106.1,14c-1.7,0-3,1.4-3,3.1c0,1.7,1.3,3.1,3,3.1c1.8,0,3.2-1.3,3.2-3.1
                  C109.3,15.4,107.9,14,106.1,14z M106.1,27.4c-2.6,0-4.5-1-5.7-2.7l2.3-1.6c0.7,1,1.8,1.6,3.3,1.6c2,0,3.2-0.8,3.2-2.5v-0.3
                  c-0.8,0.7-2,1.1-3.4,1.1c-3.1,0-5.8-2.5-5.8-5.9c0-3.3,2.7-5.9,5.8-5.9c1.6,0,2.7,0.5,3.4,1.1v-0.9h3.2V22
                  C112.4,25,110.1,27.4,106.1,27.4z M119.7,11.1c3.6,0,6.3,2.7,6.3,6.1c0,3.4-2.7,6.1-6.3,6.1s-6.3-2.7-6.3-6.1
                  C113.4,13.9,116.1,11.1,119.7,11.1z M119.7,14c-1.8,0-3.2,1.4-3.2,3.2s1.3,3.3,3.1,3.3s3.2-1.4,3.2-3.3S121.5,14,119.7,14L119.7,14
                  z"/>
              </g>
            </svg>
          </a>
        </p>

        <span className="recaptcha-notice d-block">
          This site is protected by reCAPTCHA and the Google {' '}
          <a href="https://policies.google.com/privacy" target="_blank">Privacy Policy</a> and {' '}
          <a href="https://policies.google.com/terms" target="_blank">Terms of Service</a> apply.
        </span>
      </div>
    </section>
  )
}

export default Reservation;