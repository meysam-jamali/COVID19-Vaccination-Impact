(() => {
    const margin = { top: 60, right: 80, bottom: 120, left: 110 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const vaccinationDataUrl = "/data/Section-5/owid-covid-data.csv";
    const socioeconomicDataUrl = "/data/Section-5/WIID_28NOV2023.csv";

    const svgBarChart = d3.select("#socioeconomic-bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 100)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "section-5-socioeconomic-factors-grouped-bar-chart-tooltip");

    const selectedCountries = ["USA", "BRA", "IND", "RUS", "CHN", "ZAF", "FRA", "DEU", "GBR", "JPN"];

    Promise.all([d3.csv(vaccinationDataUrl), d3.csv(socioeconomicDataUrl)])
        .then(([vaccinationData, socioeconomicData]) => {
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
                .attr("class", "section-5-socioeconomic-factors-grouped-bar-chart-axis-text")
                .attr("transform", "rotate(-45)") // Rotates labels by 45 degrees
                .style("text-anchor", "end"); // Aligns text at the end


            // Y-axis (left)
            svgBarChart.append("g")
                .call(d3.axisLeft(yLeftScale));

            // Y-axis label (left)
            svgBarChart.append("text")
                .attr("class", "section-5-socioeconomic-factors-grouped-bar-chart-y-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 20)
                .text("Vaccination Rate (per million)");

            // Y-axis (right)
            svgBarChart.append("g")
                .attr("transform", `translate(${width},0)`)
                .call(d3.axisRight(yRightScale));

            // Y-axis label (right)
            svgBarChart.append("text")
                .attr("class", "section-5-socioeconomic-factors-grouped-bar-chart-y-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", width + margin.right - 20)
                .text("Gini Index");

            // Bars for vaccination rate
            svgBarChart.selectAll(".bar-vaccination")
                .data(mergedData)
                .enter()
                .append("rect")
                .attr("class", "section-5-socioeconomic-factors-grouped-bar-chart-bar-vaccination")
                .attr("x", d => xScale(d.country))
                .attr("y", d => yLeftScale(d.vaccinationRate))
                .attr("width", xScale.bandwidth() / 2)
                .attr("height", d => height - yLeftScale(d.vaccinationRate))
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
                .attr("class", "section-5-socioeconomic-factors-grouped-bar-chart-bar-gini")
                .attr("x", d => xScale(d.country) + xScale.bandwidth() / 2)
                .attr("y", d => yRightScale(d.giniIndex))
                .attr("width", xScale.bandwidth() / 2)
                .attr("height", d => height - yRightScale(d.giniIndex))
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
                .attr("transform", `translate(${width / 2 - 100},${height + 70})`);

            legend.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#4CAF50");

            legend.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .text("Vaccination Rate")
                .style("font-size", "12px");

            legend.append("rect")
                .attr("x", 150)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#FFC107");

            legend.append("text")
                .attr("x", 180)
                .attr("y", 15)
                .text("Gini Index")
                .style("font-size", "12px");
        })
        .catch(error => console.error("Error processing data:", error));
})();
