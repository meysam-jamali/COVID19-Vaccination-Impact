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
        .attr("class", "section-7-life-expectancy-vaccination-bar-chart-tooltip");

    d3.csv("/data/Section-5/owid-covid-data.csv").then(data => {
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
            .attr("class", "section-7-life-expectancy-vaccination-bar-chart-bar")
            .attr("x", d => xScale(d.range))
            .attr("y", d => yScale(d.avgVaccinationRate))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.avgVaccinationRate))
            .on("mouseover", (event, d) => {
                lifeExpectancyTooltip.style("display", "block")
                    .html(` 
                        <strong>Life Expectancy Range:</strong> ${d.range}-${d.range + 4} years<br>
                        <strong>Avg Vaccination Rate:</strong> ${d.avgVaccinationRate.toFixed(2)} per million
                    `);
            })
            .on("mousemove", event => {
                lifeExpectancyTooltip
                    .style("left", `${event.pageX + 15}px`)
                    .style("top", `${event.pageY - 25}px`);
            })
            .on("mouseout", () => {
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
            .attr("class", "section-7-life-expectancy-vaccination-bar-chart-x-label")
            .text("Life Expectancy Range (Years)");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .attr("class", "section-7-life-expectancy-vaccination-bar-chart-y-label")
            .text("Average Vaccination Rate (per million)");

        // Legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width / 2 - 100}, -30)`);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("class", "section-7-life-expectancy-vaccination-bar-chart-bar");

        legend.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .attr("class", "section-7-life-expectancy-vaccination-bar-chart-legend")
            .text("Avg Vaccination Rate");
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
})();
