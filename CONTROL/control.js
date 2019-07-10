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
*/

//****************************** SETUP ***************************************//
// Webserver for the cont rol interface front end
var express = require('express'); // web server application
var http = require('http');				// http basics
var app = express();							// instantiate express server
var server = http.Server(app);		// connects http library to server
var io = require('socket.io')(server);	// connect websocket library to server
var serverPort = 8080;

// MQTT messaging - specify the server you would like to use here
var mqtt    = require('mqtt');
var client = mqtt.connect('mqtt://34.212.144.83',
                           {port: 1883,
                            protocolId: 'MQIsdp',
                            protocolVersion: 3 });
//timesatamping
require('log-timestamp');
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
  client.subscribe('say');
  client.subscribe('status');
  client.subscribe('heartbeat');
  client.subscribe('sys-note');
  client.subscribe('gps');
  console.log("Waiting for messages...");
});

// process the MQTT messages
client.on('message', function (topic, message) {
  // message is Buffer
  //console.log(topic, message.toString());

  if (topic === 'status') {
    console.log(topic, message.toString());
  }

  if (topic === 'heartbeat') {
    //console.log(topic, message.toString());
    io.emit('server-msg', message.toString());
  }

  if (topic === 'sys-note') {
    io.emit('server-note', message.toString());
  }

  if (topic === 'gps') {
    var gps_data = JSON.parse(message);
    io.emit('gps', JSON.stringify(gps_data));
    console.log(topic, gps_data.lat, gps_data.long);
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
        console.log('say', msg);
        //send it to the mqtt broker
        client.publish('say', msg);
    });

    // if you get a note, send it to the server
    socket.on('sys-note', function(msg) {
      console.log(msg);
      // send if to the mqtt broker
      client.publish('sys-note', msg);
    });

    // if you get the 'disconnect' message, say the user disconnected
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});
//****************************************************************************//
