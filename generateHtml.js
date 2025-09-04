const currentTask = process.env.npm_lifecycle_event;
import React from 'react';
import { config } from 'dotenv'
import ReactDOMServer from "react-dom/server";
import fs from "fs";
import { StaticRouter as Router } from "react-router";
import StaticPreloadContent from './app/components/StaticPreloadContent';

if(currentTask == 'generateHtml') {
  config({ path: './.env.prod' });
} else {
  config({ path: './.env.dev' });
}

function Shell() {
  return (
    <Router>
      <StaticPreloadContent />
    </Router>      
  )
}

const startOfHTML = `
  <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>App title</title>

        <link rel="icon" type="image/png" sizes="32x32" href="./assets/images/favicon-32x32.png">
    </head>

    <body>

        <div id="app">`

const endOfHTML = `</div>
    </body>
  </html>`

const fileName = "./app/index-template.html"
const writeStream = fs.createWriteStream(fileName)

writeStream.write(startOfHTML)

const myStream = ReactDOMServer.renderToPipeableStream(<Shell />, {
  onAllReady() {
    myStream.pipe(writeStream)
    writeStream.end(endOfHTML)
  }
})