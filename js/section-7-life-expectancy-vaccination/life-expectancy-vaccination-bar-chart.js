(() => {
    const margin = { top: 40, right: 60, bottom: 120, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Append SVG for the bar chart
    const svg = d3.select("#life-expectancy-scatterplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tooltip
    const lifeExpectancyTooltip = d3.select("body")
        .append("div")
        .attr("class", "life-expectancy-tooltip")
        .style("position", "absolute")
        .style("background-color", "#FAFAFA") // Material Gray 50
        .style("border", "1px solid #BDBDBD") // Material Gray 400
        .style("padding", "10px")
        .style("border-radius", "8px")
        .style("box-shadow", "0px 4px 8px rgba(0, 0, 0, 0.15)")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", 10000)
        .style("display", "none");

    d3.csv("/data/Section 5/owid-covid-data.csv").then(data => {
        const selectedCountries = ["USA", "BRA", "IND", "CHN", "GBR", "FRA", "DEU", "JPN", "ZAF", "RUS", "ITA", "CAN", "AUS"];
        
        // Process data
        const groupedData = d3.groups(
            data
                .filter(d => selectedCountries.includes(d.iso_code))
                .map(d => ({
                    lifeExpectancyRange: Math.floor(parseFloat(d.life_expectancy) / 5) * 5, // Group into 5-year ranges
                    vaccinationRate: parseFloat(d.total_vaccinations) / (parseFloat(d.population) || 1) * 1_000_000
                })),
            d => d.lifeExpectancyRange
        )
        .map(group => ({
            range: group[0],
            avgVaccinationRate: d3.mean(group[1], d => d.vaccinationRate) // Calculate average vaccination rate
        }))
        .sort((a, b) => a.range - b.range); // Sort the data by range

        const xScale = d3.scaleBand()
            .domain(groupedData.map(d => d.range)) // Ensure sorted order
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(groupedData, d => d.avgVaccinationRate)])
            .nice()
            .range([height, 0]);

        // Bars
        svg.selectAll("rect")
            .data(groupedData)
            .enter().append("rect")
            .attr("x", d => xScale(d.range))
            .attr("y", d => yScale(d.avgVaccinationRate))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.avgVaccinationRate))
            .attr("fill", "#6A1B9A") // Material Purple 700
            .on("mouseover", (event, d) => {
                // console.log("Mouse over event triggered:", d); // Debug log for mouseover
                lifeExpectancyTooltip.style("display", "block")
                    .html(`
                        <strong>Life Expectancy Range:</strong> ${d.range}-${d.range + 4} years<br>
                        <strong>Avg Vaccination Rate:</strong> ${d.avgVaccinationRate.toFixed(2)} per million
                    `);
            })
            .on("mousemove", event => {
                // console.log("Mouse move event triggered:", event.pageX, event.pageY); // Debug log for mousemove
                lifeExpectancyTooltip
                    .style("left", `${event.pageX + 15}px`)
                    .style("top", `${event.pageY - 25}px`);
            })
            .on("mouseout", () => {
                // console.log("Mouse out event triggered"); // Debug log for mouseout
                lifeExpectancyTooltip.style("display", "none");
            });

        // Axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d => `${d}-${d + 4}`));

        svg.append("g")
            .call(d3.axisLeft(yScale));

        // Labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Life Expectancy Range (Years)");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Average Vaccination Rate (per million)");

        // Legend
        const legend = svg.append("g")
        .attr("transform", `translate(${width / 2 - 100}, 10)`); // Shifted more to the left

        legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#6A1B9A"); // Material Purple 700

        legend.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .text("Avg Vaccination Rate")
        .style("font-size", "14px")
        .style("alignment-baseline", "middle");


    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
})();
