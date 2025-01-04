(() => {
    const width = 960;
    const height = 600;

    console.log("Initializing map...");

    // Append SVG for the map
    const svg = d3.select("#policy-impact-chart") // Correct ID
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    console.log("SVG element created.");

    const projection = d3.geoNaturalEarth1()
        .scale(160)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, 100]); // For stringency index

    const sizeScale = d3.scaleSqrt()
        .domain([0, 100]) // For vaccination rate (%)
        .range([1, 15]); // Reduced circle size range for better clarity

    console.log("Scales and projection set.");

    // Load GeoJSON and CSV data
    Promise.all([
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
        d3.csv("/data/Section 5/owid-covid-data.csv")
    ]).then(([geojson, data]) => {
        console.log("GeoJSON and CSV data loaded successfully.");

        // Filter and process CSV data
        const countryData = data
            .filter(d => d.stringency_index && d.people_fully_vaccinated_per_hundred)
            .reduce((acc, d) => {
                acc[d.location] = {
                    stringencyIndex: +d.stringency_index,
                    vaccinationRate: +d.people_fully_vaccinated_per_hundred
                };
                return acc;
            }, {});

        console.log("Processed country data:", countryData);

        // Draw the map
        svg.append("g")
            .selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#888");

        console.log("Map paths drawn.");

        // Filter GeoJSON features for countries that exist in the CSV data
        const filteredFeatures = geojson.features.filter(d => countryData[d.properties.name]);
        console.log("Filtered GeoJSON features for valid countries:", filteredFeatures);

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
                const tooltip = d3.select("#policy-impact-chart")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("background-color", "#fff")
                    .style("border", "1px solid #ccc")
                    .style("padding", "10px")
                    .style("border-radius", "4px")
                    .style("display", "block")
                    .html(`
                        <strong>Country:</strong> ${country}<br>
                        <strong>Stringency Index:</strong> ${data.stringencyIndex}<br>
                        <strong>Vaccination Rate:</strong> ${data.vaccinationRate}%
                    `);
                tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", () => d3.select(".tooltip").remove());

        console.log("Proportional symbols added.");

        // Add legend for bubble size
        const sizeLegend = svg.append("g")
            .attr("transform", `translate(20, 200)`); // Moved to the left side

        sizeLegend.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .text("Bubble Size: Vaccination Rate (%)")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        [10, 50, 100].forEach((rate, i) => {
            sizeLegend.append("circle")
                .attr("cx", 20)
                .attr("cy", 30 + i * 30)
                .attr("r", sizeScale(rate))
                .attr("fill", "none")
                .attr("stroke", "black");

            sizeLegend.append("text")
                .attr("x", 50)
                .attr("y", 35 + i * 30)
                .text(`${rate}%`)
                .style("font-size", "10px");
        });

        // Add legend for color scale
        const colorLegend = svg.append("g")
            .attr("transform", `translate(20, 350)`); // Moved to the left side

        colorLegend.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .text("Color: Stringency Index")
            .style("font-size", "12px")
            .style("font-weight", "bold");

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
                .text(`${index}`)
                .style("font-size", "10px");
        });

        console.log("Legends added.");
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
})();
