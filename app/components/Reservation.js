import React, { useState, useEffect, use } from "react";
import { UseReservationState, UseReservationDispatch } from './ReservationContext'
import { DayPicker } from "react-day-picker";
import { isWithinInterval, differenceInDays, isPast, eachDayOfInterval, isSameDay } from "date-fns";
import { useImmer } from "use-immer"
import "react-day-picker/dist/style.css";
import Axios from "axios";

const bookedDates = [
  eachDayOfInterval({
    start: new Date('2025-09-16 18:06:17'),
    end: new Date('2025-09-20 18:06:17'),
  }),
  eachDayOfInterval({
    start: new Date('2025-09-25 18:06:17'),
    end: new Date('2025-09-29 18:06:17'),
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
}

function Reservation() {
  const { state } = UseReservationState();
  const { dispatch } = UseReservationDispatch();

  // Settings
  const minBookingLength = 0; 
  const maxBookingLength = 90;

  // Reservation info
  const regularPrice = 40;
  const discount = 15;
  const displayRange = isAlreadyBooked(state.range, bookedDates) ? {} : state.range;
  const numNights = differenceInDays(displayRange?.to, displayRange?.from);
  const regularPriceWithDiscount = (regularPrice - (regularPrice * (discount / 100)));
  const totalPrice = numNights * (regularPrice - (regularPrice * (discount / 100)));

  const [ localState, setLocalState ] = useImmer({
    email: '',
    fullName: '',
    phone: '',
    numGuests: '',
  });
  const [code, setCode] = useState();


  function handleReservationSubmit(e) {
    e.preventDefault();
    dispatch({ type: 'submitReservation' });
  }

  function handleReservationConfirm(e) {
    e.preventDefault();
    dispatch({ type: 'confirmReservation' });
  }

  function handleResendCode(e) {
    e.preventDefault();
    dispatch({ type: 'resendCode' });
  }

  useEffect(() => {
    const ourRequest = Axios.CancelToken.source()

    async function getAccommodationInfo() {
      try {
        const response = await Axios.get(`/accommodation-units/${state.ownerId}`, { cancelToken: ourRequest.token })
        dispatch({ type: 'getOwnerAccommodations', value: response.data.accommodation });
      } catch (e) {
        console.log("There was a problem.")
      }
    }
    getAccommodationInfo()
    return () => {
      ourRequest.cancel()
    }
  }, []);

  useEffect(() => {
    if(state.submitCounter) {
      const ourRequest = Axios.CancelToken.source()

      async function createReservation() {
        try {
          const response = await Axios.post(`/create-guest-reservation`, {
            startDate: displayRange?.from,
            endDate: displayRange?.to,
            numNights: numNights,
            accommodationPrice: regularPrice,
            accommodationPriceWithDiscount: regularPriceWithDiscount,
            totalPrice: totalPrice,
            discount: discount,
            accommodationId: state.ownerAccommodationsSelected,
            accommodationOwnerId: state.ownerId,
            ...localState,
          }, { cancelToken: ourRequest.token })

          if(response.data.reservation) {
            dispatch({ type: 'reservationCreated', value: response.data.reservation });
          }
        } catch (e) {
          console.log("There was a problem.")
        }
      }
      createReservation()
      return () => {
        ourRequest.cancel()
      }
    }
  }, [state.submitCounter]);

  useEffect(() => {
    if(state.confirmReservationCounter) {
      const ourRequest = Axios.CancelToken.source()

      async function createReservation() {
        try {
          const response = await Axios.post(`/verify-guest-reservation`, {
            reservationId: state.reservationId,
            code: code
          }, { cancelToken: ourRequest.token })

          if(response.data.status === 'success') {
            dispatch({ type: 'reservationConfirmed' });
          }
        } catch (e) {
          console.log("There was a problem.")
        }
      }
      createReservation()
      return () => {
        ourRequest.cancel()
      }
    }
  }, [state.confirmReservationCounter]);

  useEffect(() => {
    if(state.resendConfirmationCodeCounter) {
      const ourRequest = Axios.CancelToken.source()

      async function resendConfirmationCode() {
        try {
          const response = await Axios.post(`/reservations/resend-confirmation-code`, {
            reservationId: state.reservationId
          }, { cancelToken: ourRequest.token })

          console.log(response.data);
        } catch (e) {
          console.log("There was a problem resending code.")
        }
      }
      resendConfirmationCode()
      return () => {
        ourRequest.cancel()
      }
    }
  }, [state.resendConfirmationCodeCounter]);

  return (
    <section className="rag-reservation">
      <div className="rag-reservation__wrapper">
        { !state.isReservationCreated ? 
        <form onSubmit={ handleReservationSubmit } className="rag-reservation__form">
          <div className="rag-calendar">
            <DayPicker
              mode="range"
              onSelect={(range) => dispatch({ type: 'getRange', value: range })}
              selected={ displayRange }
              min={minBookingLength + 1}
              max={maxBookingLength}
              fromMonth={new Date()}
              fromDate={new Date()}
              toYear={new Date().getFullYear() + 5}
              captionLayout="dropdown"
              numberOfMonths={2}
              disabled={ (currentDate) => isPast(currentDate) || bookedDates.some((date) => isSameDay(date, currentDate) ) }
            />

            <div className="">
              <p className="">
                {discount > 0 ? (
                  <>
                    <span className="text-2xl">${regularPrice}</span>/
                    <span className="line-through font-semibold text-primary-700">
                      ${regularPriceWithDiscount}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl">${regularPrice}</span>
                )}
                <span className="">/night</span>
              </p>
              {numNights ? (
                <>
                  <p className="">
                    <span>&times;</span> <span>{numNights}</span>
                  </p>
                  <p>
                    <span className="">Total</span>{" "}
                    <span className="">${totalPrice}</span>
                  </p>
                </>
              ) : null}
            </div>

            {state.range?.from || state.range?.to ? (
              <button
                className=""
                onClick={ () => dispatch({ type: 'resetRange' }) }
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="rag-reservation__form-fields">
            <div className="rag-reservation__field-group">
              <label htmlFor="email">E-mail Adresa</label>
              <input onChange={ (e) => setLocalState(draft => { draft.email = e.target.value }) } type="email" className="input-field" name="email" id="email" />
            </div>

            <div className="rag-reservation__field-group">
              <label htmlFor="full-name">Ime i Prezime</label>
              <input onChange={ (e) => setLocalState(draft => { draft.fullName = e.target.value }) } type="text" className="input-field" name="full_name" id="full-name" />
            </div>

            <div className="rag-reservation__field-group">
              <label htmlFor="phone">Telefon</label>
              <input onChange={ (e) => setLocalState(draft => { draft.phone = e.target.value }) } type="text" className="input-field" name="phone" id="phone" />
            </div>

            <div className="rag-reservation__field-group">
              <label htmlFor="guest-number">Koliko osoba?</label>
              <select onChange={ (e) => setLocalState(draft => { draft.numGuests = e.target.value }) } className="input-field" name="guest-number" id="guest-number">
                <option value="1">1 osoba</option>
                <option value="2">2 osobe</option>
                <option value="3">3 osobe</option>
                <option value="4">4 osobe</option>
                <option value="5">5 osobe</option>
                <option value="6">6 osobe</option>
                <option value="7">7 osobe</option>
              </select>
            </div>

            { state.ownerAccommodations.length > 0 && (
              <div className="rag-reservation__field-group field-group--apartment">
                <label htmlFor="apartment">Apartman</label>
                <select onChange={ (e) => dispatch({ type: 'selectAccommodation', value: e.target.value }) } value={ state.ownerAccommodationsSelected } className="input-field" name="apartment" id="apartment">
                  { state.ownerAccommodations.map((accommodation, index) => {
                    return (
                      <option value={ accommodation.id } defaultValue={ index === 0 } key={ accommodation.id }>{ accommodation.name }</option>
                    )
                  }) }
                </select>
              </div>
            ) }

            <div className="rag-reservation__field-group field-group--note">
              <label htmlFor="note">Napomena</label>
              <textarea type="text" className="input-field" name="note" id="note"></textarea>
            </div>

            <div className="rag-reservation__field-group field-group--submit">
              <button type="submit" className="button">Rezerviši</button>  
            </div>
          </div>
        </form> : 

        <form onSubmit={ handleReservationConfirm } className="rag-reservation__confiramtion-form">
          <h3>Potvrda rezervacije</h3>
          <p>Poštovani, na vašu email adresu smo poslali jednokratni kod za potvrdu rezervacije. Molimo vas da ga unesete u polje ispod kako bi vaša rezervacija bila potvrđena. Hvala unapred.</p>
          <p>Ukoliko niste dobili kod na vašu email adresu, kliknite na link: <a href="#" onClick={ handleResendCode }>Pošalji novi kod</a></p>

          <div className="rag-reservation__field-group">
            <label htmlFor="confirmation-code">Kod za potvrdu rezervacije</label>
            <input onChange={ (e) => setCode(e.target.value) } type="text" className="input-field" name="confirmation_code" id="confirmation-code" />
          </div>

          <div className="rag-reservation__field-group field-group--submit">
            <button type="submit" className="button confirm-button">Potvrdi rezervaciju</button>  
          </div>
        </form>
        }
      </div>

      <p className="footer-text">Powered by 
        <a href="#" target="_blank" className="logo-link">
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
    </section>
  )
}

export default Reservation;