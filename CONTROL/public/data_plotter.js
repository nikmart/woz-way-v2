var socket = io();

function setup() {
  let width = 500;
  let height = 430;
  var canvas = createCanvas(width, height);
  canvas.parent('data');
}

function draw() {
    background(245, 245, 245);
    drawAxes();
}

function drawAxes() {
  let length = width/2 - 20;
  stroke(175)

  // Speed
  line(20, 100, width-20, 100);
  // Accel
  line(20, height-150, length, height-150);
  line((height-150)/2-10, height-150-75, (height-150)/2-10, (height-150)/2-10+length);
  
  // Gyro
  line(250, height-150, width-20, height-150);
  line(width-20-(length/2), height-150-75, width-20-(length/2), (height-150)/2-10+length);
}

socket.on('server-msg', function (msg) {
    console.log('msg:', msg);
});