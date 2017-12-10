
var width = 1200,
    height = 600;

var svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

var totalPop = d3.map();

var medianIncome = d3.map();

var projection = d3.geoAlbersUsa();

var radius = d3.scaleSqrt();

// var color = d3.scaleQuantize()
var color = d3.scaleOrdinal(d3.schemeCategory10);


var simulation;

var legend;

d3.queue()
  .defer(d3.json, 'data/us-states-centroids.json')
  .defer(d3.csv, 'data/acs_pop_income.csv', function(d) {
    totalPop.set(d.name, +d.total_pop);
    medianIncome.set(d.name, +d.median_income)
  })
  .await(main);

// console.log("hello", totalPop)
// console.log("hello world?")

function main(error, us) {
    if (error) throw error;
    //console.log(us);
    console.log(totalPop.values())
    var nodes = us.features.map(function(d) {
      //console.log("d", d)
    var point = projection(d.geometry.coordinates),
        value = totalPop.get(d.properties.name)
        //console.log('value', value)

    return {
      id: d.id,
      name: d.properties.name,
      label: d.properties.label,
      coords: d.geometry.coordinates,
      x: point[0],
      y: point[1],
      x0: point[0],
      y0: point[1],
      r: radius(value),
      value: value
    };
  });

  //console.log('nodes', nodes)

  var categories = ["1000", "700000", "15M to 23M", "23M to 31M", "31M to 38M"]

  var numCategories = categories.length;

  // color.domain(categories)
  //   .range(categories.map(function(d, i) {
  //     return d3.interpolateYlGnBu(i / (numCategories - 1));
  //   }));

  simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(1))
    .force('collide', d3.forceCollide().strength(1).radius(function(d) {
          return d.r;
      }))
    .stop();

  // for (var i = 0; i < 150; i++) {
  //   simulation.tick();
  // }
  ticked();

  function ticked() {
    var bubbles = svg.append('g')
      .selectAll('circle')
      .data(nodes, function(d) {
        console.log(d)
        return d.label;
      })
      .enter();

      //console.log(nodes[0].r)


    bubbles.append('circle')
      //.merge(bubbles)
      .attr('r', function(d) {
        //console.log("r d", d)
        return radius(d.r);
      })
      .attr('cx', function(d) {
        return d.x;
      })
      .attr('cy', function(d) {
        return d.y;
      })
      .attr('fill', function(d) {
        return color(d.v);
      })
      .attr('stroke', '#333')
      .on('mouseover', function(d) {
        tooltip.html(d.name + "<br>" + "Total population:" + d.value);
        tooltip.style('visibility', 'visible');
        d3.select(this).attr('stroke', 'white');
      })
      .on('mousemove', function() {
        tooltip.style('top', (d3.event.pageY - 10) + 'px')
          .style('left', (d3.event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        tooltip.style('visibility', 'hidden');
        d3.select(this).attr('stroke', '#333');
      });

      bubbles.append("text")
          .attr("x", function(d){ return d.x; })
          .attr("y", function(d){ return d.y + 5; })
          .attr("text-anchor", "middle")
          .text(function(d){ return d.label; })
          .style({
              "fill":"black",
              "font-family":"lato",
              "font-size": "12px"
          });
  }
  svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(0, 400)');

    legend = d3.legendColor()
      .title('Total Population:')
      .titleWidth(75)
      .scale(color);

    svg.select('.legend')
      .call(legend);
}

var tooltip = d3.select('body')
  .append('div')
  .style('position', 'absolute')
  .style('visibility', 'hidden')
  .style('color', 'white')
  .style('padding', '8px')
  .style('background-color', '#626D71')
  .style('border-radius', '6px')
  .style('text-align', 'center')
  .style('font-family', 'avenir next')
  .text('');
