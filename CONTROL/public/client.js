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
function initMap(){
    // var farm ={lat: 42.992, lng: -78.578};
    map = new google.maps.Map(document.getElementById('map'), {zoom: 14, center: current});
    mark= new google.maps.Marker({position:current,
        icon: {path:google.maps.SymbolPath.CIRCLE, scale: 3}, map: map})
    }

function redraw(location){
    map.setCenter({lat:location.lat, lng:location.lng, alt:0});
    mark.setPosition({lat:location.lat, lng:location.lng, alt:0});

    lineCoords.push(new google.maps.LatLng(location.lat, location.lng));
    var lineCoordinatesPath = new google.maps.Polyline({
        path: lineCoords,
        geodesic: true,
        strokeColor: '#2E10FF'
  });
  lineCoordinatesPath.setMap(map);
}

//display location with google maps JS API
function initMap(){
    // var farm ={lat: 42.992, lng: -78.578};
    map = new google.maps.Map(document.getElementById('map'), {zoom: 14, center: current});
    mark= new google.maps.Marker({position:current,
        icon: {path:google.maps.SymbolPath.CIRCLE, scale: 3}, map: map})
    }

function redraw(location){
    map.setCenter({lat:location.lat, lng:location.lng, alt:0});
    mark.setPosition({lat:location.lat, lng:location.lng, alt:0});

    lineCoords.push(new google.maps.LatLng(location.lat, location.lng));
    var lineCoordinatesPath = new google.maps.Polyline({
        path: lineCoords,
        geodesic: true,
        strokeColor: '#2E10FF'
  });
  lineCoordinatesPath.setMap(map);
}


// read the data from the message that the server sent and change the
// background of the webpage based on the data in the message
socket.on('server-msg', function(msg) {
    console.log('msg:', msg);
    switch(msg) {
        // heartbeat message
        case 'alive':
          clearTimeout(heartbeatTimer);
          if (botStatus != 'alive') {
            document.getElementById("namestatus").textContent = "Bot 0 - Connected";
            document.getElementById("namestatus").style.color = '#1DB954';
            botStatus = 'alive';
          }
          heartbeatTimer = setTimeout(function(){
            botStatus = '';
            console.log("reset heartbeat");
            document.getElementById("namestatus").textContent = "Bot 0 - Offline";
            document.getElementById("namestatus").style.color = "red";
          }, 7000);
          break;
    }
});

//get notes from other wizards
socket.on('server-note', function(msg){
  //only print notes from other wizards
  //https://stackoverflow.com/questions/6614424/check-if-text-is-in-a-string
  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf
  if (msg.indexOf(wizardName + ':') == -1) {
    addNote(msg);
  }
});

// Update GPS coordinates
socket.on('gps', function(msg){
    var gps_data = JSON.parse(msg);
    console.log(gps_data);
    current.lat = gps_data.lat;
    current.lng = gps_data.long;
    redraw(current)
});