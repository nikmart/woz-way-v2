var socket = io();

var data = [
]

var minimumTime = new Date();

var vlSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  width: "container",
  height: "container",
  "background": "WhiteSmoke",
  data: { name: 'table' },
  mark: 'line',
  encoding: {
    x: { timeunit: "minutes", field: 'time', type: 'temporal'},
    y: { field: 'value', type: 'quantitative', "scale": {"domain": [-15, 15]} },
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
    window.setInterval(function () {
      minimumTime = Date.parse(new Date()) - 30000;
      //console.log(minimumTime);
      var changeSet = vega
        .changeset()
        .remove(function (t) {
          // console.log(Date.parse(t.time));
          // console.log(minimumTime);
          return Date.parse(t.time) < minimumTime;
        });
      result.view.change('table', changeSet).run();
    }, 300);
  })
  .catch(console.warn);