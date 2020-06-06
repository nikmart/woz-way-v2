/*
control.js - CONTOL INTERFACE

Author: Nikolas Martelaro (nmartelaro@gmail.com)

Purpose: This is the server for the WoZ Way wizard station. The server acts as
the webserver for the control interface (which is an HTML page). The server also
manages MQTT messaging to and from your Bot. This is needed becasue there is not
a direct link from the web front-end to MQTT.

The server subscribes to MQTT messages from the car and publishes MQTT messages
that will the car will listen to.

Usage: node control.js

Notes: You will need to specify what MQTT server you would like to use.
Use the .env file to set your configureations.
*/

//****************************** SETUP ***************************************//
require('dotenv').config() // configurations and passwords
const DEPLOYMENT = process.env.DEPLOYMENT;
const BOT = process.env.BOT;
const DATA = process.env.DATA;

// Webserver for the control interface front end
var express = require('express'); // web server application
var http = require('http');				// http basics
var app = express();							// instantiate express server
var server = http.Server(app);		// connects http library to server
var io = require('socket.io')(server);	// connect websocket library to server
var serverPort = 3000;

// MQTT messaging - specify the server you would like to use here
var mqtt    = require('mqtt');
var client = mqtt.connect(process.env.MQTT_SERVER, {
                port: process.env.MQTT_PORT,
                protocolId: 'MQIsdp',
                protocolVersion: 3,
                username: process.env.MQTT_USER,
                password: process.env.MQTT_PASSWORD
});

//timesatamping
require('log-timestamp');

var current_loc = {
  lat: 40.4433,
  long: -79.9459
};
//****************************************************************************//

//****************************** WEB INTERFACE *******************************//
// use express to create the simple webapp
app.use(express.static('public'));		// find pages in public directory

// start the server and say what port it is on
server.listen(serverPort, function() {
    console.log('listening on *:%s', serverPort);
});
//****************************************************************************//

//********************** MQTT MESSAGES FROM BOT ******************************//
// Setup the MQTT connection and listen for messages
client.on('connect', function () {
  //Subscribe to topics
  // Note: Make sure you are subscribed to the correct topics on the BOT side
  // Use '+' as a single level wildcard: https://www.hivemq.com/blog/mqtt-essentials-part-5-mqtt-topics-best-practices/
  client.subscribe('say');
  client.subscribe('status');
  client.subscribe('heartbeat');
  client.subscribe('sys-note');
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/gps/latitude`);
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/gps/longitude`);
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/gps/bearing`);
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/gps/speed`);
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/Accelerometer/x`);
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/Accelerometer/y`);
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/Accelerometer/z`);
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/Gyroscope/x`);
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/Gyroscope/y`);
  client.subscribe(`${DEPLOYMENT}/${DATA}/data/Gyroscope/z`);
  console.log("Waiting for messages...");
});

// process the MQTT messages
client.on('message', function (topic, message) {
  // message is Buffer
  console.log(topic, message.toString('utf8'));

  if (topic === 'status') {
    console.log(topic, message.toString('utf8'));
  }

  if (topic === 'heartbeat') {
    //console.log(topic, message.toString());
    io.emit('server-msg', message.toString());
  }

  if (topic === 'sys-note') {
    io.emit('server-note', message.toString());
  }

  if (topic === `${DEPLOYMENT}/${DATA}/data/gps/latitude`) {
    current_loc.lat = message.toString('utf8');
    io.emit('gps', JSON.stringify(current_loc));
  }

  if (topic === `${DEPLOYMENT}/${DATA}/data/gps/longitude`) {
    current_loc.long = message.toString('utf8');
    io.emit('gps', JSON.stringify(current_loc));
  }
  //client.end();
});
//****************************************************************************//

//*************** WEBSOCKET MESSAGES FROM CONTROL INTERFACE ******************//
// This is the websocket event handler. WebSockets are used to communicate
// between this server and the webapp front end wizard interface.
// As long as someone is connected, listen for messages from the wizard
// interface.
io.on('connect', function(socket) {
    console.log('a user connected');

    // if you get a message to send, send to the MQTT broker
    socket.on('msg', function(msg) {
        //send it to the mqtt broker
        client.publish(`${DEPLOYMENT}/${BOT}/say`, msg);
        console.log(`${DEPLOYMENT}/${BOT}/say`, msg);
    });

    // if you get a note, send it to the server
    socket.on('sys-note', function(msg) {
      // send if to the mqtt broker
      client.publish(`${DEPLOYMENT}/${BOT}/sys-note`, msg);
      console.log(`${DEPLOYMENT}/sys-note`, `"${msg}"`);
    });

    // if you get the 'disconnect' message, say the user disconnected
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});
//****************************************************************************//
