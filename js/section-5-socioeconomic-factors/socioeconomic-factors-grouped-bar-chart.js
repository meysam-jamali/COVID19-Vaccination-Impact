(() => {
    // console.log("Modern Grouped Bar Chart Script Loaded!");

    const margin = { top: 60, right: 80, bottom: 120, left: 110 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const vaccinationDataUrl = "/data/Section 5/owid-covid-data.csv";
    const socioeconomicDataUrl = "/data/Section 5/WIID_28NOV2023.csv";

    const svgBarChart = d3.select("#socioeconomic-bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 100)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "socioeconomic-bar-chart-tooltip")
        .style("position", "absolute")
        .style("background-color", "#FAFAFA")
        .style("border", "1px solid #E0E0E0")
        .style("padding", "10px")
        .style("border-radius", "8px")
        .style("box-shadow", "0 4px 10px rgba(0, 0, 0, 0.15)")
        .style("font-size", "12px")
        .style("display", "none")
        .style("pointer-events", "none");

    const selectedCountries = ["USA", "BRA", "IND", "RUS", "CHN", "ZAF", "FRA", "DEU", "GBR", "JPN"];

    Promise.all([d3.csv(vaccinationDataUrl), d3.csv(socioeconomicDataUrl)])
        .then(([vaccinationData, socioeconomicData]) => {
            // console.log("Data loaded successfully!");

            const filteredVaccinationData = vaccinationData
                .filter(d => selectedCountries.includes(d.iso_code))
                .map(d => ({
                    isoCode: d.iso_code,
                    country: d.location,
                    vaccinationRate: d.total_vaccinations && d.population
                        ? (parseFloat(d.total_vaccinations) / parseFloat(d.population)) * 1_000_000
                        : 0,
                }))
                .filter(d => d.vaccinationRate > 0);

            const socioeconomicRates = socioeconomicData
                .filter(d => selectedCountries.includes(d.c3))
                .map(d => ({
                    isoCode: d.c3,
                    country: d.country,
                    giniIndex: parseFloat(d.gini) || 0,
                }));

            const mergedData = filteredVaccinationData.map(v => {
                const socio = socioeconomicRates.find(s => s.isoCode === v.isoCode);
                return {
                    country: v.country,
                    vaccinationRate: v.vaccinationRate,
                    giniIndex: socio ? socio.giniIndex : 0,
                };
            });

            const xScale = d3.scaleBand()
                .domain(mergedData.map(d => d.country))
                .range([0, width])
                .padding(0.2);

            const yLeftScale = d3.scaleLinear()
                .domain([0, d3.max(mergedData, d => d.vaccinationRate)]).nice()
                .range([height, 0]);

            const yRightScale = d3.scaleLinear()
                .domain([0, d3.max(mergedData, d => d.giniIndex)]).nice()
                .range([height, 0]);

            // X-axis
            svgBarChart.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end")
                .style("font-size", "12px");

            // Y-axis (left)
            svgBarChart.append("g")
                .call(d3.axisLeft(yLeftScale));

            // Y-axis label (left)
            svgBarChart.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "600")
                .text("Vaccination Rate (per million)");

            // Y-axis (right)
            svgBarChart.append("g")
                .attr("transform", `translate(${width},0)`)
                .call(d3.axisRight(yRightScale));

            // Y-axis label (right)
            svgBarChart.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", width + margin.right - 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "600")
                .text("Gini Index");

            // Bars for vaccination rate
            svgBarChart.selectAll(".bar-vaccination")
                .data(mergedData)
                .enter()
                .append("rect")
                .attr("class", "bar-vaccination")
                .attr("x", d => xScale(d.country))
                .attr("y", d => yLeftScale(d.vaccinationRate))
                .attr("width", xScale.bandwidth() / 2)
                .attr("height", d => height - yLeftScale(d.vaccinationRate))
                .attr("fill", "#4CAF50")
                .on("mouseover", (event, d) => {
                    tooltip.style("display", "block").html(`
                        <strong>Country:</strong> ${d.country}<br>
                        <strong>Vaccination Rate:</strong> ${d.vaccinationRate.toFixed(2)} per million
                    `);
                })
                .on("mousemove", (event) => {
                    tooltip.style("left", `${event.pageX + 15}px`).style("top", `${event.pageY - 35}px`);
                })
                .on("mouseout", () => tooltip.style("display", "none"));

            // Bars for Gini Index
            svgBarChart.selectAll(".bar-gini")
                .data(mergedData)
                .enter()
                .append("rect")
                .attr("class", "bar-gini")
                .attr("x", d => xScale(d.country) + xScale.bandwidth() / 2)
                .attr("y", d => yRightScale(d.giniIndex))
                .attr("width", xScale.bandwidth() / 2)
                .attr("height", d => height - yRightScale(d.giniIndex))
                .attr("fill", "#FFC107")
                .on("mouseover", (event, d) => {
                    tooltip.style("display", "block").html(`
                        <strong>Country:</strong> ${d.country}<br>
                        <strong>Gini Index:</strong> ${d.giniIndex.toFixed(2)}
                    `);
                })
                .on("mousemove", (event) => {
                    tooltip.style("left", `${event.pageX + 15}px`).style("top", `${event.pageY - 35}px`);
                })
                .on("mouseout", () => tooltip.style("display", "none"));

            // Legend
            const legend = svgBarChart.append("g")
            .attr("transform", `translate(${width / 2 - 60},${height + 70})`); // Adjusted horizontally for margin

            legend.append("rect")
            .attr("x", -100)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "#4CAF50");

            legend.append("text")
            .attr("x", -70)
            .attr("y", 15)
            .text("Vaccination Rate")
            .style("font-size", "14px");

            legend.append("rect")
            .attr("x", 50)  // Added 50px left margin here
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "#FFC107");

            legend.append("text")
            .attr("x", 80)  // Adjusted to reflect the 50px margin left for Gini Index
            .attr("y", 15)
            .text("Gini Index")
            .style("font-size", "14px");


            // console.log("Grouped bar chart successfully rendered!");
        })
        .catch(error => console.error("Error processing data:", error));
})();
