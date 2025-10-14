import React, { useEffect, useState } from "react";
import { UseReservationState, UseReservationDispatch } from './ReservationContext';
import { DayPicker } from "react-day-picker";
import { format, isWithinInterval, differenceInDays, isPast, eachDayOfInterval, isSameDay } from "date-fns";
import { srLatn } from 'date-fns/locale';
import "react-day-picker/dist/style.css";

const bookedDates = [
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
}

function BookingCalendar({ setRegularPrice, setDiscount, setDisplayRange, setNumNights, setRegularPriceWithDiscount, setTotalPrice, accommodation }) {
  const { state } = UseReservationState();
  const { dispatch } = UseReservationDispatch();
  const [ datePickerMonths, setDatePickerMonths ] = useState(2);

  // Settings
  const minBookingLength = accommodation.minBookingLength; 
  const maxBookingLength = accommodation.maxBookingLength;
  const regularPrice = accommodation.regularPrice;
  const discount = accommodation.discount;

  // Reservation info
  const displayRange = isAlreadyBooked(state.range, bookedDates) ? {} : state.range;
  const numNights = differenceInDays(displayRange?.to, displayRange?.from);
  const regularPriceWithDiscount = (regularPrice - (regularPrice * (discount / 100)));
  const totalPrice = numNights * (regularPrice - (regularPrice * (discount / 100)));

  function rangeSelectHandler(range) {
    dispatch({ type: 'getRange', value: range });

    const filteredErrors = state.reservationErrors.filter(error => !error.hasOwnProperty('date'));
    dispatch({ type: 'reservationErrors', value: filteredErrors });
  }

  function localizeDate(date) {
    if(date) {
      return format(date, 'EEEE, d. MMMM yyyy.', { locale: srLatn });
    }

    return null;
  }

  useEffect(() => {
    dispatch({ type: 'setRegularPrice', value: regularPrice });
    dispatch({ type: 'setDiscount', value: discount });
    dispatch({ type: 'setDisplayRange', value: displayRange });
    dispatch({ type: 'setNumNights', value: numNights });
    dispatch({ type: 'setRegularPriceWithDiscount', value: regularPriceWithDiscount });
    dispatch({ type: 'setTotalPrice', value: totalPrice });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 991.98px)");

    const updateMonths = () => {
      setDatePickerMonths(mq.matches ? 1 : 2);
    };

    updateMonths(); // run once on mount
    mq.addEventListener("change", updateMonths);

    return () => mq.removeEventListener("change", updateMonths);
  }, []);

  return (
    <div className="rag-calendar">
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
    </div>
  )
}

export default BookingCalendar;