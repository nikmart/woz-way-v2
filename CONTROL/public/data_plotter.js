var socket = io();

var data = [
]

var vlSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  width: "container",
  height: "container",
  data: { name: 'table' },
  mark: 'line',
  encoding: {
    x: { timeunit: "utcminutesseconds", field: 'time', type: 'temporal'},
    y: { field: 'value', type: 'quantitative' },
    "color": { "field": "sensor", "type": "nominal" }
  }
};

vegaEmbed('#vis', vlSpec, { defaultStyle: true })
  .then(function (result) {
    const view = result.view;
    
    // Update accel coordinates
    socket.on('data', function (msg) {
      // Use the Vega view api to insert data
      //console.log(msg);
      view.insert("table", JSON.parse(msg)).run();
    });
  })
  .catch(console.warn);