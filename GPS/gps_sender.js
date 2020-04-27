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
var client = mqtt.connect('mqtt://mqtt.needfindingmachine.com', {
    port: 1883,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    username: 'nmartelaro',
    password: 'mqtt-data-20!'
});

//timesatamping
require('log-timestamp');

// Serial
var SerialPort = require('serialport'); // serial library
var Readline = SerialPort.parsers.Readline; // read serial data as lines

// nmea parsing
var nmea = require("nmea-simple");

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
parser.on('data', function (line) {
    // Filter for the GPRMC sentence and send it
    try {
        var packet = nmea.parseNmeaSentence(line);

        if (packet.sentenceId === "RMC" && packet.status === "valid") {
            console.log("Got location via RMC packet:", packet.latitude, packet.longitude);
            var gps_data = {
                    lat: packet.latitude,
                    long: packet.longitude,
                    speed: packet.speedKnots
                };
            client.publish('gps', JSON.stringify(gps_data));
        }

        if (packet.sentenceId === "GGA" && packet.fixType !== "none") {
            console.log("Got location via GGA packet:", packet.latitude, packet.longitude);
        }

        if (packet.sentenceId === "GSA") {
            console.log("There are " + packet.satellites.length + " satellites in view.");
        }
    } catch (error) {
        console.error("Got bad packet:", line, error);
    }
});
//----------------------------------------------------------------------------//

//********************** MQTT MESSAGES WITH ACTIONS **************************//
// Setup the socket connection and listen for messages
client.on('connect', function () {
  console.log("Waiting for messages...");
});
//****************************************************************************//