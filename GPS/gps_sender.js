/*
gps_sender.js - USB GPS Sender

Author: Nikolas Martelaro (nmartelaro@gmail.com)

Purpose: This script gets data from a USB GPS and then shuttles that data over
         MQTT for a remote control station to view.

Usage: node gps_sender.js

Notes: You will need to specify what MQTT server and what serial port you would like to use.
*/

//****************************** SETUP ***************************************//
// MQTT Setup
var mqtt   = require('mqtt');
var client = mqtt.connect('mqtt://34.212.144.83',
                           {port: 1883,
                            protocolId: 'MQIsdp',
                            protocolVersion: 3 });

//timesatamping
require('log-timestamp');

// Serial
var SerialPort = require('serialport'); // serial library
var Readline = SerialPort.parsers.Readline; // read serial data as lines

//****************************************************************************//

//---------------------- SERIAL COMMUNICATION --------------------------------//
// check to make sure that the user provides the serial port for the arduino
// when running the server
if (!process.argv[2]) {
    console.error('Usage: node ' + process.argv[1] + ' SERIAL_PORT');
    process.exit(1);
}

// start the serial port connection and read on newlines
const serial = new SerialPort(process.argv[2], {});
const parser = new Readline({
    delimiter: '\r\n'
});

// Read data that is available on the serial port and send it to the websocket
serial.pipe(parser);
parser.on('data', function (data) {
    // Filter for the GPRMC sentence and send it
    if (data.includes("GNRMC")) {
        client.publish('gps', data);
        console.log(data);
        console.log("GNRMC Sent!");
    }
});
//----------------------------------------------------------------------------//

//********************** MQTT MESSAGES WITH ACTIONS **************************//
// Setup the socket connection and listen for messages
client.on('connect', function () {
  console.log("Waiting for messages...");
});
//****************************************************************************//