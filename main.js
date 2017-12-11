// initialize the width and height of the svg
var width = 1200,
    height = 600;

//initialize the svg with the width and height
var svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

// initialize the map for the name, total pop values
var totalPop = d3.map();

// initialize the map for the name, median income values
var medianIncome = d3.map();

// initialize the projection
var projection = d3.geoAlbersUsa();

// initialize the radius and it's radius
var radius = d3.scaleSqrt()
                .range([15,40]);

// initialize the color function and it's range
var color = d3.scaleQuantize()
              .range(d3.schemeBlues[5]);

// set isTotalPop to be true so that's the first thing you see on the landing page
var isTotalPop = true

// global variable for simulation
var simulation;

// global variable for legend
var legend;

var word;

// load data asynchronously and set the key value pairs for totalPop and medianIncome
d3.queue()
  .defer(d3.json, 'data/us-states-centroids.json')
  .defer(d3.csv, 'data/acs_pop_income.csv', function(d) {
    totalPop.set(d.name, +d.total_pop);
    medianIncome.set(d.name, +d.median_income)
  })
  .await(main);

// main function which will initialize the nodes, set up the domains for radius and color, initialize the simulation
// and initialize the positions for the bubbles and text
function main(error, us) {
    if (error) throw error;
    // pre define array of nodes using projection
    var nodes = us.features.map(function(d) {
    var point = projection(d.geometry.coordinates),
        value = totalPop.get(d.properties.name)

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

  // array of the min and max values of the d.value to be used for radius and color
  var extent = d3.extent(nodes, function(d) {
    return d.value;
  });

  // setting up the radius' and color's domains
  radius.domain(extent);
  color.domain(extent)

  // initialize simulation with charge and collision, which will call the ticked function
  simulation = d3.forceSimulation(nodes)
                  .force('charge', d3.forceManyBody().strength(1))
                  .force('collision', d3.forceCollide().strength(1).radius(function(d) {
                    return radius(d.value)
                  }))
                  .on('tick', ticked)

  // initializing the locations of the bubbles as x0, and y0
  var bubbles = svg.append('g')
                  .selectAll('circle')
                  .data(nodes)
                  .enter()
                  .append('circle')
                  .attr('r', function(d){
                    return radius(d.value)
                  })
                  .attr('cx', function(d) {
                    return d.x0
                  })
                  .attr('cy', function(d) {
                    return d.y0
                  })
                  .attr('fill', function(d) {
                    return color(d.value)
                  })
  // initializing the positions of the text using x0 and y0
  var text = svg.selectAll("text")
                .data(nodes)
                .enter()
                .append('text')
                .attr("x", function(d){ return d.x0; })
                .attr("y", function(d){ return d.y0; })
                .attr("text-anchor", "middle")
                .text(function(d){ return d.label; })
                .style({
                    "fill":"black",
                    "font-family":"lato",
                    "font-size": "12px"
                });

}
// ticked function to move the bubbles
function ticked() {

  //if isTotalPop is true, then set the toggle button to be median income and the word in the hover to be Total Population
  if (isTotalPop) {
    document.getElementById("myBtn").value = "Median Income";
    word = "Total population:"
  }

  //if isTotalPop is false, then set the toggle button to be total population and the word in the hover to be Median Income
  if (!(isTotalPop)) {
      document.getElementById("myBtn").value = "Total Population";
      word = "Median Income:"

  }

  // update the position of the bubbles to x and y
  var bubbles =  svg.selectAll('circle')
                    .attr('r', function(d){
                      return radius(d.value)
                    })
                    .attr('cx', function(d) {
                      return d.x
                    })
                    .attr('cy', function(d) {
                      return d.y
                    })
                    .attr('fill', function(d) {
                      return color(d.value)
                    })
                    .attr('stroke', '#333')
                    .on('mouseover', function(d) {
                      tooltip.html(d.name + "<br>" + word + d.value);
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

    // update the position of the text to be x and y
    var text = svg.selectAll("text")
                  .attr("x", function(d){ return d.x; })
                  .attr("y", function(d){ return d.y; })
                  // .attr("text-anchor", "middle")
                  .text(function(d){ return d.label; })
                  .style({
                      "fill":"black",
                      "font-family":"lato",
                      "font-size": "12px"
                  });

    // append the legend
    svg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(10, 450)');

    // if median income is the view, have the title be median income, and vice versa
    // also used a label formatter to make the legend look nice
    if (!(isTotalPop)) {
      legend = d3.legendColor().labelFormat(d3.format(".2s"))
        .title('Median Income:')
        .titleWidth(75)
        .scale(color);
    } else {
      legend = d3.legendColor().labelFormat(d3.format(".2s"))
        .title('Total Population:')
        .titleWidth(75)
        .scale(color);
    }

    // update the legend
      svg.select('.legend')
        .call(legend);

}

// function to update the bubble chart after the user clicks on the toggle button
function update() {
  isTotalPop = !(isTotalPop)
  // initial values so I can find the min and max to be later used for the domain of radius and color
  var min_val = Number.MAX_VALUE;
  var max_val = Number.MIN_VALUE;
  // if median income, update value to be the value in median income
  if (!(isTotalPop)) {
    d3.selectAll('circle').data()
    .forEach(function(d) {
      d.value = medianIncome.get(d.name)
      if (d.value < min_val) {
        min_val = d.value
      }
      if (d.value > max_val) {
        max_val = d.value
      }
    })

    radius.domain([min_val, max_val]);
    color.domain([min_val, max_val])
  } else {
    // update value to be total population for the state name
    d3.selectAll('circle').data()
    .forEach(function(d) {
      d.value = totalPop.get(d.name)
      if (d.value < min_val) {
        min_val = d.value
      }
      if (d.value > max_val) {
        max_val = d.value
      }
    })
    radius.domain([min_val, max_val]);
    color.domain([min_val, max_val]);
  }
  // restart the simulation
  simulation.nodes(svg.selectAll('circle').data()).alpha(1).restart();
  for (var i = 0; i < 150; i++) {
    simulation.tick();
  }
  // call ticked to move the bubbles
  ticked();
}
// initialize tooltip
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
