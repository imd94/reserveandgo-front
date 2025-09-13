import React from 'react';
import ReactDOM from 'react-dom/client';
//import { BrowserRouter, Routes, Route } from "react-router-dom";
import Axios from 'axios';

// Styles
import './assets/styles/styles.scss';

Axios.defaults.baseURL = process.env.REACT_APP_API_URL;

// Components
import { ReservationProvider } from './components/ReservationContext'
import Reservation from './components/Reservation';

function App(props) {
  return (
    <ReservationProvider>
      <Reservation />
    </ReservationProvider>
  );
}

const root = ReactDOM.createRoot(document.querySelector('#app'));
root.render(<App />);