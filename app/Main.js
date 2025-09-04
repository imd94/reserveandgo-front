import React from 'react';
import ReactDOM from 'react-dom/client';
import Axios from 'axios';
import './assets/styles/styles.scss';

Axios.defaults.baseURL = process.env.REACT_APP_API_URL;

// Components


function App(props) {
  return (
    <>
      <header>
        <h1>Header</h1>
        <img src={ `${process.env.REACT_APP_FILE_PATH_DIST}assets/images/bg-desktop-dark.jpg` } alt="Hero Image" />
      </header>

      <main>
        Main
      </main>

      <footer>
        Footer
      </footer>
    </>
  );
}

const root = ReactDOM.createRoot(document.querySelector('#app'));
root.render(<App />);