(() => {
    console.log("Grouped Bar Chart Script Loaded!");

    const margin = { top: 60, right: 80, bottom: 120, left: 110 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const vaccinationDataUrl = "/data/Section 5/owid-covid-data.csv";
    const socioeconomicDataUrl = "/data/Section 5/WIID_28NOV2023.csv";

    const svgBarChart = d3.select("#socioeconomic-bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 100) // Space for legend
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("#socioeconomic-bar-chart")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "4px")
        .style("display", "none");

    const selectedCountries = ["USA", "BRA", "IND", "RUS", "CHN", "ZAF", "FRA", "DEU", "GBR", "JPN"];

    Promise.all([d3.csv(vaccinationDataUrl), d3.csv(socioeconomicDataUrl)])
        .then(([vaccinationData, socioeconomicData]) => {
            console.log("Data loaded successfully!");

            // Filter and calculate vaccination data
            const filteredVaccinationData = vaccinationData
                .filter(d => selectedCountries.includes(d.iso_code))
                .map(d => ({
                    iso_code: d.iso_code,
                    location: d.location,
                    date: d.date,
                    population: parseFloat(d.population) || null,
                    total_vaccinations: parseFloat(d.total_vaccinations) || null,
                    total_vaccinations_per_million:
                        d.total_vaccinations && d.population
                            ? (parseFloat(d.total_vaccinations) / parseFloat(d.population)) * 1_000_000
                            : 0,
                }))
                .filter(d => d.total_vaccinations_per_million > 0);

            const latestVaccinationData = {};
            filteredVaccinationData.forEach(d => {
                if (!latestVaccinationData[d.iso_code] || new Date(d.date) > new Date(latestVaccinationData[d.iso_code].date)) {
                    latestVaccinationData[d.iso_code] = d;
                }
            });

            const vaccinationRates = Object.values(latestVaccinationData).map(d => ({
                isoCode: d.iso_code,
                country: d.location,
                vaccinationRate: d.total_vaccinations_per_million,
            }));

            const socioeconomicRates = socioeconomicData
                .filter(d => selectedCountries.includes(d.c3))
                .map(d => ({
                    isoCode: d.c3,
                    country: d.country,
                    giniIndex: parseFloat(d.gini) || 0,
                }));

            const mergedData = vaccinationRates.map(v => {
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
                .domain([0, d3.max(mergedData, d => d.vaccinationRate)])
                .range([height, 0]);

            const yRightScale = d3.scaleLinear()
                .domain([0, d3.max(mergedData, d => d.giniIndex)])
                .range([height, 0]);

            svgBarChart.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end");

            svgBarChart.append("text")
                .attr("x", width / 2)
                .attr("y", height + margin.bottom - 40)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("Countries");

            svgBarChart.append("g")
                .call(d3.axisLeft(yLeftScale));

            svgBarChart.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("Vaccination Rate (per million)");

            svgBarChart.append("g")
                .attr("transform", `translate(${width},0)`)
                .call(d3.axisRight(yRightScale));

            svgBarChart.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", width + margin.right + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("Gini Index");

            // Add bars for vaccination rate
            svgBarChart.selectAll(".bar-vaccination")
                .data(mergedData)
                .enter()
                .append("rect")
                .attr("class", "bar-vaccination")
                .attr("x", d => xScale(d.country))
                .attr("y", d => yLeftScale(d.vaccinationRate))
                .attr("width", xScale.bandwidth() / 2)
                .attr("height", d => height - yLeftScale(d.vaccinationRate))
                .attr("fill", "steelblue")
                .on("mouseover", (event, d) => {
                    tooltip.style("display", "block").html(`
                        <strong>Country:</strong> ${d.country}<br>
                        <strong>Vaccination Rate:</strong> ${d.vaccinationRate.toFixed(2)} per million
                    `);
                })
                .on("mousemove", (event) => {
                    tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY + 10}px`);
                })
                .on("mouseout", () => tooltip.style("display", "none"));

            // Add bars for Gini Index
            svgBarChart.selectAll(".bar-gini")
                .data(mergedData)
                .enter()
                .append("rect")
                .attr("class", "bar-gini")
                .attr("x", d => xScale(d.country) + xScale.bandwidth() / 2)
                .attr("y", d => yRightScale(d.giniIndex))
                .attr("width", xScale.bandwidth() / 2)
                .attr("height", d => height - yRightScale(d.giniIndex))
                .attr("fill", "orange")
                .on("mouseover", (event, d) => {
                    tooltip.style("display", "block").html(`
                        <strong>Country:</strong> ${d.country}<br>
                        <strong>Gini Index:</strong> ${d.giniIndex.toFixed(2)}
                    `);
                })
                .on("mousemove", (event) => {
                    tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY + 10}px`);
                })
                .on("mouseout", () => tooltip.style("display", "none"));

            // Add legend
            const legend = svgBarChart.append("g")
                .attr("transform", `translate(${width / 2},${height + 50})`);

            legend.append("rect")
                .attr("x", -100)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "steelblue");

            legend.append("text")
                .attr("x", -70)
                .attr("y", 15)
                .text("Vaccination Rate")
                .style("font-size", "12px");

            legend.append("rect")
                .attr("x", 30)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "orange");

            legend.append("text")
                .attr("x", 60)
                .attr("y", 15)
                .text("Gini Index")
                .style("font-size", "12px");

            console.log("Grouped bar chart successfully rendered!");
        })
        .catch(error => console.error("Error processing data:", error));
})();
