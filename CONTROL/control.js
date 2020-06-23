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
let bot;
let client;


// MQTT messaging - specify the server you would like to use here
var mqtt    = require('mqtt');

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

//*************** WEBSOCKET MESSAGES FROM CONTROL INTERFACE ******************//
// This is the websocket event handler. WebSockets are used to communicate
// between this server and the webapp front end wizard interface.
// As long as someone is connected, listen for messages from the wizard
// interface.
io.on('connect', function(socket) {
    console.log('a user connected');

    // if you get a message to send, send to the MQTT broker
    socket.on('msg', function(msg) {
        console.log(`${bot.botId}/${bot.sayId}/say`, msg);
        //send it to the mqtt broker
        client.publish(`${bot.botId}/${bot.sayId}/say`, msg);
    });
    socket.on('start', (data)=> {
      setupMqtt(data)
      bot=data

      console.log(data)})

    socket.on('phoneTrigger', (cam, action) => {
      switch (action){ 
        case 'switchSay':
          bot.sayId=cam;
          break;
        case 'restartCamera':
          client.publish(`${bot.botId}/${cam}/restart-camera`, `restart-${cam}`);
          break;
        case 'flipCamera':
          client.publish(`${bot.botId}/${cam}/flip-camera`, `flip-${cam}`);
          break;
        case 'reconnectCamera':
          client.publish(`${bot.botId}/${cam}/start-data`, `start-data-${cam}`);
          client.publish(`${bot.botId}/${cam}/start-video`, `start-video-${cam}`);
          break;
      }


    })

    // if you get a note, send it to the server
    socket.on('sys-note', function(msg) {
      console.log(msg);
      // send if to the mqtt broker
      client.publish('sys-note', msg);
    });

    socket.on('mark', (msg) => {console.log(msg)})

    // if you get the 'disconnect' message, say the user disconnected
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });


});


function setupMqtt(botData) {
  const dataRe= new RegExp(`${botData.botId}/.*/data`)

    //********************** MQTT MESSAGES FROM BOT ******************************//
    client = mqtt.connect('mqtt://mqtt.needfindingmachine.com',
                               {port: 1883,
                                protocolId: 'MQIsdp',
                                protocolVersion: 3,
                                username: botData.username,
                                password: botData.pass });

    // Setup the MQTT connection and listen for messages
    client.on('connect', function () {

      //Subscribe to topics
      // Note: Make sure you are subscribed to the correct topics on the BOT side
      for (let i = 0; i < botData.cams; i++) {
        console.log(`${botData.botId}/cam${i}/data/`);
        client.subscribe(`${botData.botId}/cam${i}/say`);
        client.subscribe(`${botData.botId}/cam${i}/data/#`);
        client.subscribe(`${botData.botId}/cam${i}/start-data`)
        client.subscribe(`${botData.botId}/cam${i}/start-video`)
      
        client.publish(`${botData.botId}/cam${i}/start-data`, `start-data-cam${i}`);
        client.publish(`${botData.botId}/cam${i}/start-video`, `start-video-cam${i}`);
      }
      
      
      console.log("Waiting for messages...");
    });

    // process the MQTT messages
    client.on('message', function (topic, message) {
      // message is Buffer
      //console.log(topic, message.toString());
      if (dataRe.test(topic)){
        io.emit('data-msg', topic, message.toString())
      }

      // if (topic === 'status') {
      //   console.log(topic, message.toString());
      // }

      // if (topic === 'heartbeat') {
      //   //console.log(topic, message.toString());
      //   io.emit('server-msg', message.toString());
      // }

      if (topic === 'sys-note') {
        io.emit('server-note', message.toString());
      }

      // if (topic === 'gps') {
      //   var gps_data = JSON.parse(message);
      //   io.emit('gps', JSON.stringify(gps_data));
      //   console.log(topic, gps_data.lat, gps_data.long);
      // }
      //client.end();
    });
    //****************************************************************************//

}
//****************************************************************************//
