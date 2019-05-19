/*
bot.js - WoZ Way V2 Bot bot code

Author: Nikolas Martelaro (nmartelaro@gmail.com)

Purpose: This is the server for the in-environment Bot. It accepts messages from the
control interface for the bot to speak. It also controls the volume of the
system.

The server subscribes to MQTT messages from the control interfcae and publishes
MQTT messages that will the control interface will listen to.

Usage: node bot.js

Notes: You will need to specify what MQTT server you would like to use.
*/

//****************************** SETUP ***************************************//
// MQTT Setup
var mqtt   = require('mqtt');
var client = mqtt.connect('mqtt://157.131.72.62',
                           {port: 8134,
                            protocolId: 'MQIsdp',
                            protocolVersion: 3 });
// Text to speech setup
var say = require('say');

//timesatamping
require('log-timestamp');

//****************************************************************************//

//********************** MQTT MESSAGES WITH ACTIONS **************************//
// Setup the socket connection and listen for messages
client.on('connect', function () {
  client.subscribe('say'); // messages from the wizard interface to speak out
  client.subscribe('sys-vol'); // control system volume
  client.subscribe('sys-note'); // wizard notes
  client.subscribe('control-msg'); //genreal message from controller
  console.log("Waiting for messages...");

  // messages for testing
  client.publish('heartbeat', 'alive');
});

// Print out the messages and say messages that are topic: "say"
// NOTE: These voices only work on macOS
client.on('message', function (topic, message) {
  // message is Buffer
  console.log(topic, message.toString());

  // Say the message using our function that turns Spotify down
  if (topic === 'say') {
    say_message(message.toString());
  }

  //client.end();
});
//****************************************************************************//

// FUNCTIONS //
function say_message(msg) {
  //say.speak(msg);
  // Fire a callback once the text has completed being spoken
  say.speak(msg, null, null, (err) => {
    if (err) {
      return console.error(err)
    }
    console.log('status', 'Text has been spoken.')
    client.publish('status', 'text-spoken')
  });
}

// Create a heartbeat
function heartbeat() {
  client.publish('heartbeat', 'alive');
}


// Send a heartbeat to show that the bot is disconnected
setInterval(heartbeat, 5000);

// TESTS
//say_message("Hello, my name is D J bot! Let's listen to some music!")

// REFERENCES
// [1] https://stackoverflow.com/questions/13335873/how-can-i-check-whether-a-variable-is-defined-in-node-js
