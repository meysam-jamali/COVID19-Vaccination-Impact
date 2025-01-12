(() => {
    const width = 960;
    const height = 600;

    // Append SVG for the map
    const svg = d3.select("#policy-impact-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoNaturalEarth1()
        .scale(160)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 100]);
    const sizeScale = d3.scaleSqrt().domain([0, 100]).range([1, 15]);

    // Load GeoJSON and CSV data
    Promise.all([
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
        d3.csv("/data/Section-5/owid-covid-data.csv")
    ]).then(([geojson, data]) => {
        const countryData = data
            .filter(d => d.stringency_index && d.people_fully_vaccinated_per_hundred)
            .reduce((acc, d) => {
                acc[d.location] = {
                    stringencyIndex: +d.stringency_index,
                    vaccinationRate: +d.people_fully_vaccinated_per_hundred
                };
                return acc;
            }, {});

        // Draw the map
        svg.append("g")
            .selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#888");

        const filteredFeatures = geojson.features.filter(d => countryData[d.properties.name]);

        // Add proportional symbols (circles)
        svg.append("g")
            .selectAll("circle")
            .data(filteredFeatures)
            .enter().append("circle")
            .attr("cx", d => projection(d3.geoCentroid(d))[0])
            .attr("cy", d => projection(d3.geoCentroid(d))[1])
            .attr("r", d => sizeScale(countryData[d.properties.name].vaccinationRate))
            .attr("fill", d => colorScale(countryData[d.properties.name].stringencyIndex))
            .attr("stroke", "#333")
            .attr("opacity", 0.7)
            .on("mouseover", (event, d) => {
                const country = d.properties.name;
                const data = countryData[country];
                const tooltip = d3.select("body")
                    .append("div")
                    .attr("class", "section-8-role-of-government-policies-proportional-symbol-maps-tooltip")
                    .style("display", "block")
                    .html(`
                        <strong>Country:</strong> ${country}<br>
                        <strong>Stringency Index:</strong> ${data.stringencyIndex}<br>
                        <strong>Vaccination Rate:</strong> ${data.vaccinationRate}%
                    `);
                tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", () => d3.select(".section-8-role-of-government-policies-proportional-symbol-maps-tooltip").remove());

        // Add legend for bubble size
        const sizeLegend = svg.append("g").attr("transform", `translate(40, 180)`);

        sizeLegend.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "section-8-role-of-government-policies-proportional-symbol-maps-bubble-legend-text")
            .text("Bubble Size: Vaccination Rate (%)");

        [10, 50, 100].forEach((rate, i) => {
            sizeLegend.append("circle")
                .attr("cx", 20)
                .attr("cy", 30 + i * 30)
                .attr("r", sizeScale(rate))
                .attr("class", "section-8-role-of-government-policies-proportional-symbol-maps-bubble");

            sizeLegend.append("text")
                .attr("x", 50)
                .attr("y", 35 + i * 30)
                .attr("class", "section-8-role-of-government-policies-proportional-symbol-maps-bubble-legend-label")
                .text(`${rate}%`);
        });

        // Add legend for color scale
        const colorLegend = svg.append("g").attr("transform", `translate(40, 330)`);

        colorLegend.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "section-8-role-of-government-policies-proportional-symbol-maps-color-legend-text")
            .text("Color: Stringency Index");

        [20, 50, 80].forEach((index, i) => {
            colorLegend.append("rect")
                .attr("x", 0)
                .attr("y", 20 + i * 20)
                .attr("width", 20)
                .attr("height", 10)
                .attr("fill", colorScale(index));

            colorLegend.append("text")
                .attr("x", 30)
                .attr("y", 30 + i * 20)
                .attr("class", "section-8-role-of-government-policies-proportional-symbol-maps-color-legend-label")
                .text(`${index}`);
        });
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
})();
