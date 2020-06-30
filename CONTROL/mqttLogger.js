var mqtt = require('mqtt');
const fs = require('fs');

var stream = fs.createWriteStream("mqttlog.txt", {flags:'a'});

const client = mqtt.connect('mqtt://farlab.infosci.cornell.edu',
                           {port: 1883,
                            protocolId: 'MQIsdp',
                            protocolVersion: 3,
                            username: 'testuser',
                            password: 'far1@FAR' });
client.on('connect', () => {
	client.subscribe(`#`);
});

client.on('message', (topic, message) => {
	// console.log(topic, message.toString());
	stream.write(`${Date.now()}|${topic}|${message}\n`);
});
