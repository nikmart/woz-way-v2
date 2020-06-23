// JavaScript Document
var socket = io();
var restore = false;
var queueCount = 0;
var botStatus = '';
var heartbeatTimer;
var wizardName = '';
var map;
var mark;
var current = {lat: 42.992, lng: -78.578};
var lineCoords=[];
let connected = false;
const dataPaths={}

function connectToBot(botId) {
    socket.emit('connect', botId)
}

// send out sound message over socket
function play(id) {
    socket.emit('play', id);
}

function sendOnEnter() {
    // send on enter key
    if (event.keyCode == 13) {
        sendMsg();
    }
}

function queueOnEnter() {
    // send on enter key
    if (event.keyCode == 13) {
        queueMsg();
    }
}

function setName() {
  if (event.keyCode == 13) {
    wizardName = document.getElementById('name').value;
    document.getElementById('name').readOnly = true;
    document.getElementById('name').style.border = "none";
  }
}

function sendMsg() {
    // get and send the messge to the remote interface
    var msg = document.getElementById("message").value;
    console.log(msg);
    socket.emit('msg', msg); //send the message to ther server

    // add the question to the list
    addQuestion(msg);

    // reset the message window
    resetMsg();
}

function queueMsg() {
    // get and send the messge to the remote interface
    var msg = document.getElementById("queue_message").value;
    console.log(msg);
    //socket.emit('msg', msg); //send the message to ther server

    // add the question to the list
    queueQuestion(msg);

    // reset the message window
    resetQueue();
}

function sendNote() {
  // only send the note if it is an ENTER key
  if (event.keyCode == 13) {
    // get and send the messge to the remote interface
    if(event.preventDefault) event.preventDefault();
    var msg = document.getElementById("note").value;
    console.log(wizardName + ': ' + msg);
    socket.emit('sys-note', wizardName + ': ' + msg); //send the message to ther server
    addNote(wizardName + ': ' + msg);
    document.getElementById("note").value = ''; //reset note window
  }
}

function resetMsg() {
    document.getElementById("message").value = '';
}

function resetQueue() {
    document.getElementById("queue_message").value = '';
}

function addQuestion(msg) {
    // create a new line with the questions at the top of the list
    var para = document.createElement("p");
    var node = document.createTextNode(msg);
    para.appendChild(node);

    var btn = document.createElement("BUTTON");
    btn.className = "play";
    var btnReplay = document.createTextNode("\u25B6"); // Create a text node
    btn.onclick = function() {
        replayMsg(msg);
    };
    btn.appendChild(btnReplay);

    para.prepend(btn);
    para.className = "previous-question";
    var element = document.getElementById("questions");
    element.prepend(para);
}

function queueQuestion(msg) {
    // create a new line with the questions at the top of the list
    var para = document.createElement("p");
    var node = document.createTextNode(msg);
    para.appendChild(node);
    para.id = "queue" + queueCount;
    msgID = para.id;
    queueCount++;

    var btn = document.createElement("BUTTON");
    btn.className = "play";
    var btnReplay = document.createTextNode("\u25B6"); // Create a text node
    btn.onclick = function() {
      replayMsg(msg);
      addQuestion(msg);
      clearQuestion(this.parentNode.id); //[https://stackoverflow.com/questions/27842138/get-id-of-parent-element-on-click]
    };
    btn.appendChild(btnReplay);

    para.prepend(btn);
    para.className = "previous-question";
    var element = document.getElementById("queued_questions");
    element.prepend(para);
}

function addNote(msg) {
    // create a new line with the questions at the top of the list
    var para = document.createElement("p");
    var node = document.createTextNode(msg);
    para.appendChild(node);

    para.className = "previous-note";
    var element = document.getElementById("notes");
    element.prepend(para);
}

function replayMsg(msg) {
    console.log(msg);
    socket.emit('msg', msg); //send the message to ther server
}

function playMsg(msgID) {
    var msg = document.getElementById(msgID).innerHTML;
    console.log(msg);
    socket.emit('msg', msg); //send the message to ther server
    addQuestion(msg);
}

//Clear a message from the queue
//[https://www.w3schools.com/js/js_htmldom_nodes.asp]
function clearQuestion(msgID) {
  var parent = document.getElementById('queued_questions');
  var queue_message = document.getElementById(msgID);
  parent.removeChild(queue_message);
}

//display location with google maps JS API
// function initMap(){
//     // var farm ={lat: 42.992, lng: -78.578};
//     map = new google.maps.Map(document.getElementById('map'), {zoom: 14, center: current});
//     mark= new google.maps.Marker({position:current,
//         icon: {path:google.maps.SymbolPath.CIRCLE, scale: 3}, map: map})
//     }

// function redraw(lat, lng){
//     map.setCenter({lat:lat, lng:lng, alt:0});
//     mark.setPosition({lat:lat, lng:lng, alt:0});

//     lineCoords.push(new google.maps.LatLng(lat, lng));
//     var lineCoordinatesPath = new google.maps.Polyline({
//         path: lineCoords,
//         geodesic: true,
//         strokeColor: '#2E10FF'
//   });
//   lineCoordinatesPath.setMap(map);
// }

function toggleDiv(div){
        div.classList.toggle("active");
    var content = div.parentElement.nextElementSibling;
    if (content.style.display === "block") {
        content.style.display = "none";
    } else {
        content.style.display = "block";
    }
}

const coll = document.getElementsByClassName("collapsible")[0];
coll.onclick = () => {
    toggleDiv(coll)
}

const momentButton = document.getElementById('mark_moment');
const moment={start: undefined, end: undefined}
momentButton.onmousedown = () => {moment.start = Date.now()}
momentButton.onmouseup = () => {
    moment.end = Date.now();
    socket.emit('mark', moment);
    moment.start = undefined;
    moment.end = undefined;

    }



var path;

function initMap(){
    map = L.map('map').setView([current.lat, current.lng], 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.satellite',
    accessToken: 'pk.eyJ1IjoiaW1hbmRlbCIsImEiOiJjankxdjU4ODMwYTViM21teGFpenpsbmd1In0.IN9K9rp8-I5pTbYTmwRJ4Q'}).addTo(map);
    
    mark=L.circleMarker([current.lat, current.lng],{
    color: 'red',
    radius: 4}).addTo(map)
    path= L.polyline(lineCoords, {color: 'blue'}).addTo(map)
}

function redraw(lat, lng){
    map.panTo([lat, lng])
    mark.setLatLng([lat, lng])
    path.addLatLng([lat, lng])
}

// setInterval(function(){
//     current.lat= current.lat+(Math.random()-.5)*.005
//     current.lng= current.lng+(Math.random()-.5)*.005
//     redraw(current.lat, current.lng)
// }, 1000);

// read the data from the message that the server sent and change the
// background of the webpage based on the data in the message

// socket.on('server-msg', function(msg) {
//     console.log('msg:', msg);
//     switch(msg) {
//         // heartbeat message
//         case 'alive':
//           clearTimeout(heartbeatTimer);
//           if (botStatus != 'alive') {
//             document.getElementById("namestatus").textContent = "Bot 0 - Connected";
//             document.getElementById("namestatus").style.color = '#1DB954';
//             botStatus = 'alive';
//           }
//           heartbeatTimer = setTimeout(function(){
//             botStatus = '';
//             console.log("reset heartbeat");
//             document.getElementById("namestatus").textContent = "Bot 0 - Offline";
//             document.getElementById("namestatus").style.color = "red";
//           }, 7000);
//           break;
//     }
// });

initMap()
//get notes from other wizards
socket.on('server-note', function(msg){
  //only print notes from other wizards
  //https://stackoverflow.com/questions/6614424/check-if-text-is-in-a-string
  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf
  if (msg.indexOf(wizardName + ':') == -1) {
    addNote(msg);
  }
});

socket.on('data-msg', (topic, message) =>{
    connected = true
    console.log(topic, message)
    const topicArray = topic.split('/')
    const topicId =dataPaths[topicArray[1]][topicArray[3]][topicArray[4]]
    if (topicId) {document.getElementById(topicId).innerText=message}
    const lat=parseFloat(document.getElementById(dataPaths[topicArray[1]]['gps']['latitude']).innerText)
    const lng=parseFloat(document.getElementById(dataPaths[topicArray[1]]['gps']['longitude']).innerText)
    if (topic.includes('gps')) {
        redraw(lat, lng)
    }
    document.getElementById("namestatus").textContent = "Bot 0 - Connected";
    document.getElementById("namestatus").style.color = '#1DB954';
    clearTimeout(heartbeatTimer);
    heartbeatTimer = setTimeout(() => {
        console.log('reset timer');
        document.getElementById("namestatus").textContent = "Bot 0 - Offline";
        document.getElementById("namestatus").style.color = "red";
    }, 7000);
})

// Update GPS coordinates
// socket.on('gps', function(msg){
//     var gps_data = JSON.parse(msg);
//     console.log(gps_data);
//     current.lat = gps_data.lat;
//     current.lng = gps_data.long;
//     redraw(current)
// });



// setup bot


function addControls(noCams) {
    const camControls=document.getElementById('cam-controls' );
    for (let i = 0; i < noCams; i++) {
        console.log(i);
        const item = Object.assign(document.createElement('div'), {className: 'flexitem'})
        
        const dataVals= `
        Accel: X: <span id="accel-x-cam${i}"></span>, Y: <span id="accel-y-cam${i}"></span>, Z: <span id="accel-z-cam${i}"></span><br>
        GPS: (<span id="lat-cam${i}"></span>, <span id="long-cam${i}"></span>)<br>
        Speed: <span id="speed-cam${i}"></span> <br>
        Battery: <span id="battery-cam${i}">?</span>
        `
        dataPaths[`cam${i}`]={
            Accelerometer: 
                {x: `accel-x-cam${i}`,y: `accel-y-cam${i}`, z: `accel-z-cam${i}`}, 
            gps: {latitude: `lat-cam${i}`, longitude: `long-cam${i}`, speed: `speed-cam${i}`},
            battery: {percentage: `battery-cam${i}`},
        }
        const data = Object.assign(document.createElement('div'), {className: 'data', innerHTML: dataVals})
        item.appendChild(data)
        const camButtons = Object.assign(document.createElement('div'), {className: 'cam-buttons'})
        const sayRadio = Object.assign(document.createElement('input'),{type: 'radio', value: `cam${i}`, id: `cam${i}`, name: 'say'})
        const flipCamera = Object.assign(document.createElement('button'), {innerText: 'flip camera'})
        const restartCamera = Object.assign(document.createElement('button'), {innerText: 'restart camera'})
        if (i === 0) { sayRadio.checked = true; }
        const sayLabel = Object.assign(document.createElement('label'), {for: `cam${i}`, innerText: `speak from cam${i}`})
        sayLabel.appendChild(sayRadio)
        camButtons.appendChild(sayLabel)
        camButtons.appendChild(flipCamera)
        camButtons.appendChild(restartCamera)
        item.appendChild(camButtons)
        sayRadio.onchange = () => {console.log(sayRadio.value)}
        camControls.appendChild(item)

    }
}


var form = document.getElementById("bot-selector");
form.onsubmit = (e) => {
    e.preventDefault();
    const status =document.getElementById('connection-status');
    status.innerText='Connecting'
    status.classList.add('connecting');
    const botData = {username: form.user.value, pass: form.pass.value, botId: form.botId.value, cams: form.num_cams.value}
    socket.emit('start', botData)
    setTimeout(() => {
        if(connected) {
            addControls(botData.cams)
            status.classList.remove('connecting');
            status.innerText='Connected!'
            setTimeout(()=>{toggleDiv(coll)}, 1000)
        } else {
            status.classList.remove('connecting');
            status.innerText='Error connecting!'
        }
    }, 2000)
}

addControls(3)









