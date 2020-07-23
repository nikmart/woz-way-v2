/*
control.js - CONTROL INTERFACE

Author: Nikolas Martelaro (nmartelaro@gmail.com)

Purpose: This is the server for the WoZ Way wizard station. The server acts as
the webserver for the control interface (which is an HTML page). The server also
manages MQTT messaging to and from your Bot. This is needed becasue there is not
a direct link from the web front-end to MQTT.

The server subscribes to MQTT messages from the car and publishes MQTT messages
that will the car will listen to.

Usage: node control.js

Notes: You will need to specify what MQTT server you would like to use.
*/

//* ***************************** SETUP ***************************************//
// Webserver for the cont rol interface front end
const express = require('express'); // web server application
const https = require('https'); // http basics
const http = require('http');
const compression = require('compression');

const app = express();(compression());
const fs = require('fs'); // instantiate express server
const dotenv = require('dotenv');
const mqtt = require('mqtt');
require('log-timestamp');

let server;
let bot;
let client;

// get env variables
dotenv.config();

if (process.env.build === 'development') {
  // don't use https for localhost
  server = http.createServer(app);
  server.listen(process.env.port, () => {
    console.log('listening on *:%s', process.env.port);
  });
} else if (process.env.build === 'production') {
  // on server use key and cert for ssl
  server = https.createServer(
    {
      key: fs.readFileSync(process.env.key, 'utf-8'),
      cert: fs.readFileSync(process.env.cert, 'utf-8'),
    }, app,
  ); // connects https library to server
  // create an HTTP server on port 80 and redirect to HTTPS
  http.createServer((req, res) => {
    // 301 redirect (reclassifies google listings)
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
  }).listen(80, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Node.js Express HTTPS Server Listening on Port 80');
    }
  });
  server.listen(process.env.port, () => {
  console.log('listening on *:%s', process.env.port);
});
}
const io = require('socket.io')(server); // connect websocket library to server

//* ***************************************************************************//

//* ***************************** WEB INTERFACE *******************************//
// use express to create the simple webapp
app.use(express.static('public')); // find pages in public directory

// start the server and say what port it is on
// server.listen(process.env.port, () => {
//   console.log('listening on *:%s', process.env.port);
// });
//* ***************************************************************************//

function setupMqtt(botData) {
  const dataRe = new RegExp(`${botData.botId}/.*/data`);

  //* ********************* MQTT MESSAGES FROM BOT ******************************//
  try {
    client = mqtt.connect('mqtt://farlab.infosci.cornell.edu',
      {
        port: 1883,
        protocolId: 'MQIsdp',
        protocolVersion: 3,
        username: botData.username,
        password: botData.pass,
      });
  } catch (err) {
    console.log(err);
    return;
  }

  // Setup the MQTT connection and listen for messages
  client.on('connect', () => {
    console.log(`start session ${botData.botId}`);
    client.publish(`${botData.botId}/session`, `start session ${botData.botId}`);

    // Subscribe to topics
    // Note: Make sure you are subscribed to the correct topics on the BOT side
    for (let i = 0; i < botData.phones; i++) {
      console.log(`${botData.botId}/phone${i}/data/`);
      client.subscribe(`${botData.botId}/phone${i}/say`);
      client.subscribe(`${botData.botId}/phone${i}/data/#`);
      client.subscribe(`${botData.botId}/phone${i}/sensornode`);
      client.subscribe(`${botData.botId}/phone${i}/zoom`);

      client.publish(`${botData.botId}/phone${i}/sensornode`, 'start-data');
      // client.publish(`${botData.botId}/phone${i}/zoom`, `https://cornell.zoom.us/my/imandel?pwd=bzJ6VjZnaStkc0lKcVkwTm5wWTdpUT09`);
    }

    console.log('Waiting for messages...');
  });

  // process the MQTT messages
  client.on('message', (topic, message) => {
    if (dataRe.test(topic)) {
      io.emit('data-msg', topic, message.toString());
    }

    if (topic === 'sys-note') {
      io.emit('server-note', message.toString());
    }

    if (new RegExp(`${botData.botId}/.*/sensornode`).test(topic) && message.toString() === 'data-streaming') {
      const phone = topic.split('/')[1];
      console.log(`starting zoom ${topic}`);
      client.publish(`${botData.botId}/${phone}/zoom`, botData.zoomlink);
    }
  });
  //* ***************************************************************************//
}

//* ************** WEBSOCKET MESSAGES FROM CONTROL INTERFACE ******************//
// This is the websocket event handler. WebSockets are used to communicate
// between this server and the webapp front end wizard interface.
// As long as someone is connected, listen for messages from the wizard
// interface.
io.on('connect', (socket) => {
  console.log('a user connected');

  // if you get a message to send, send to the MQTT broker
  socket.on('msg', (msg) => {
    console.log(`${bot.botId}/${bot.sayId}/say`, msg);
    // send it to the mqtt broker
    client.publish(`${bot.botId}/${bot.sayId}/say`, msg);
  });
  socket.on('start', (data) => {
    if (bot && bot.botId == data.botId) {
      console.log(`bot ${bot.botId} running`);
    } else {
      console.log(`adding bot ${data.botId}`);
      setupMqtt(data);
      bot = data;
      console.log(data);
    }
  });

  socket.on('phoneTrigger', (phone, action) => {
    console.log('trigger', phone, action);
    switch (action) {
      case 'switchSay':
        bot.sayId = phone;
        break;
      case 'restart-phone':
        console.log(`restarting ${phone}`);
        client.publish(`${bot.botId}/${phone}/system`, 'restart');
        break;
      case 'flip-camera':
        console.log(`flipping ${phone}`);
        client.publish(`${bot.botId}/${phone}/zoom`, 'flip-camera');
        break;
      case 'mute':
        console.log(`muting ${phone}`);
        client.publish(`${bot.botId}/${phone}/zoom`, 'mute');
        break;
      case 'unmute':
        console.log(`unmuting ${phone}`);
        client.publish(`${bot.botId}/${phone}/zoom`, 'unmute');
        break;
      case 'join-audio':
        console.log(`joining audio ${phone}`);
        client.publish(`${bot.botId}/${phone}/zoom`, 'join-audio');
        break;
      case 'reconnect-phone':
        console.log(`reconnecting ${phone}`);
        client.publish(`${bot.botId}/${phone}/sensornode`, 'start-data');
        // client.publish(`${bot.botId}/${phone}/zoom`, `https://cornell.zoom.us/my/imandel?pwd=bzJ6VjZnaStkc0lKcVkwTm5wWTdpUT09`);
        break;
      default:
        console.log(phone, action);
    }
  });

  // if you get a note, send it to the server
  socket.on('sys-note', (msg) => {
    console.log(msg);
    // send if to the mqtt broker
    client.publish('sys-note', msg);
  });

  socket.on('mark', (msg) => {
    console.log(msg);
    client.publish('sys-note', msg);
  });

  // if you get the 'disconnect' message, say the user disconnected
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('disconnectBot', (msg) => {
    console.log(`end session ${msg}`);
    client.publish(`${msg}/session`, `end session ${msg}`);
    client.end();
    bot = undefined;
  });
});

//* ***************************************************************************//
