import React, { useState, useEffect } from "react";
import { UseReservationState, UseReservationDispatch } from './ReservationContext'
import { DayPicker } from "react-day-picker";
import { isWithinInterval, differenceInDays, isPast, eachDayOfInterval, isSameDay } from "date-fns";
import "react-day-picker/dist/style.css";

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
    range.from &&
    range.to &&
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
  const displayRange = isAlreadyBooked(state.range, bookedDates) ? {} : state.range;
  const regularPrice = 40;
  const discount = 10;
  const numNights = differenceInDays(displayRange.to, displayRange.from);
  const accommodationmPrice = numNights * (regularPrice - (regularPrice * (discount / 100)));

  return (
    <main>
      <div className="">
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
                <span className="text-2xl">${regularPrice - discount}</span>
                <span className="line-through font-semibold text-primary-700">
                  ${regularPrice}
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
                <span className="">${accommodationmPrice}</span>
              </p>
            </>
          ) : null}
        </div>

        {state.range.from || state.range.to ? (
          <button
            className=""
            onClick={ () => dispatch({ type: 'resetRange' }) }
          >
            Clear
          </button>
        ) : null}
      </div>
    </main>
  )
}

export default Reservation;