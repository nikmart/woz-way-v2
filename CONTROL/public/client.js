// JavaScript Document
var socket = io();
var restore = false;
var queueCount = 0;
var botStatus = '';
const timers= {};
var wizardName = '';
var map;
var mark;
var current = {lat: 42.992, lng: -78.578};
var lineCoords=[];
let connected = false;
const dataPaths={}
let bot = null;

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
    addNote(`${moment.start}-${moment.end}`)

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
    const topicArray = topic.split('/')
    if(topicArray[0]===bot.botId){
    connected = true;
    // console.log(topic, message)
    const statusIcon =document.getElementById(`status-${topicArray[1]}`);
    statusIcon.innerText='🟢'
    clearTimeout(timers[topicArray[1]]);
    timers[topicArray[1]]= setTimeout(() => {statusIcon.innerText='🔴'}, 3000)

    const topicId =dataPaths[topicArray[1]][topicArray[3]][topicArray[4]]
    if (topicId) {document.getElementById(topicId).innerText=message}
    const lat=parseFloat(document.getElementById(dataPaths[topicArray[1]]['gps']['latitude']).innerText)
    const lng=parseFloat(document.getElementById(dataPaths[topicArray[1]]['gps']['longitude']).innerText)
    if (topic.includes('gps')) {
        redraw(lat, lng)
    }
    // document.getElementById("namestatus").textContent = "Bot 0 - Connected";
    // document.getElementById("namestatus").style.color = '#1DB954';
    // clearTimeout(timers.heartbeatTimer);
    // timers.heartbeatTimer = setTimeout(() => {
    //     console.log('reset timer');
    //     document.getElementById("namestatus").textContent = "Bot 0 - Offline";
    //     document.getElementById("namestatus").style.color = "red";
    // }, 7000);
    }
})

function phoneTrigger(phone, action) {
    console.log(phone, action)
    socket.emit('phoneTrigger', phone, action)
}


// setup bot


function addControls(nophones) {
    const phoneControls=document.getElementById('phone-controls' );
    phoneControls.textContent='';


    for (let i = 0; i < nophones; i++) {
        console.log(i);
        const item = Object.assign(document.createElement('div'), {className: 'flexitem'})
        
        const dataVals= `
        <span id="say-phone${i}" class="icons say-icons"></span><span id="status-phone${i}" class="icons">🟡</span><br>
        Accel: X: <span id="accel-x-phone${i}"></span>, Y: <span id="accel-y-phone${i}"></span>, Z: <span id="accel-z-phone${i}"></span><br>
        GPS: (<span id="lat-phone${i}"></span>, <span id="long-phone${i}"></span>)<br>
        Speed: <span id="speed-phone${i}"></span> <br>
        Battery: <span id="battery-phone${i}">?</span><br>

        `
        dataPaths[`phone${i}`]={
            Accelerometer: 
                {x: `accel-x-phone${i}`,y: `accel-y-phone${i}`, z: `accel-z-phone${i}`}, 
            gps: {latitude: `lat-phone${i}`, longitude: `long-phone${i}`, speed: `speed-phone${i}`},
            battery: {percentage: `battery-phone${i}`},
        }
        const data = Object.assign(document.createElement('div'), {className: 'data', innerHTML: dataVals})
        item.appendChild(data)
        const phoneButtons = Object.assign(document.createElement('div'), {className: 'phone-buttons'})
        const sayRadio = Object.assign(document.createElement('input'),{type: 'radio', value: `phone${i}`, id: `phone${i}`, name: 'say'})
        const restartphone = Object.assign(document.createElement('button'), {innerText: 'restart phone', onclick: () => phoneTrigger(`phone${i}`, 'restart-phone')})
        const flipcamera = Object.assign(document.createElement('button'), {innerText: 'flip camera', onclick: () => phoneTrigger(`phone${i}`, 'flip-camera')})
        const reconnect = Object.assign(document.createElement('button'), {innerText: 'reconnect', onclick: () => phoneTrigger(`phone${i}`, 'reconnect-phone')})

        sayRadio.onchange = () => {
            console.log(sayRadio.value);
            [...document.getElementsByClassName('say-icons')].forEach((icon) => icon.innerText='')
            document.getElementById(`say-${sayRadio.value}`).innerText='💬'
            phoneTrigger(sayRadio.value, 'switchSay')
        }


        const sayLabel = Object.assign(document.createElement('label'), {for: `phone${i}`, innerText: `speak from phone${i}`})
        sayLabel.appendChild(sayRadio)
        phoneButtons.appendChild(sayLabel)
        phoneButtons.appendChild(restartphone)
        phoneButtons.appendChild(reconnect)
        phoneButtons.appendChild(flipcamera)
        item.appendChild(phoneButtons)
        phoneControls.appendChild(item)
        timers[`phone${i}`]=setTimeout(() => {document.getElementById(`status-phone${i}`).innerText='🔴'}, 3000);
        if (i === 0) { 
            sayRadio.checked = true; 
            document.getElementById(`say-${sayRadio.value}`).innerText='💬'
        }

    }
}

var form = document.getElementById("bot-selector");
const disconnect = document.getElementById('disconnect')
disconnect.onclick = () => {
    socket.emit('disconnectBot', bot.botId);
    document.getElementById('connection-status').innerText='disconnected!';
}

form.onsubmit = (e) => {
    e.preventDefault();
    const status =document.getElementById('connection-status');
    status.innerText='Connecting'
    status.classList.add('connecting');
    bot = {username: form.user.value, pass: form.pass.value, botId: form.botId.value, phones: form.num_phones.value, sayId: 'phone0', zoomlink: form.zoomlink.value}
    console.log(bot)
    socket.emit('start', bot)
    setTimeout(() => {
        if(connected) {
            addControls(bot.phones)
            status.classList.remove('connecting');
            status.innerText='Connected!'
            disconnect.style.visibility='visible'
            setTimeout(()=>{toggleDiv(coll)}, 1000)
        } else {
            status.classList.remove('connecting');
            status.innerText='Error connecting!'
        }
    }, 15000)
}










