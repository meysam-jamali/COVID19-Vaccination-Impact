(() => {
    // console.log("Main JavaScript file loaded!");

    const margin = { top: 40, right: 60, bottom: 100, left: 110 };
    const width = 650 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const vaccinationDataUrl = "/data/Section 5/owid-covid-data.csv";
    const socioeconomicDataUrl = "/data/Section 5/WIID_28NOV2023.csv";

    // SVG for heatmap
    const svgHeatmap = d3.select("#socioeconomic-heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tooltip setup
    const socioeconomicHeatmapTooltip = d3.select("body")
        .append("div")
        .attr("class", "socioeconomic-heatmap-tooltip")
        .style("position", "absolute")
        .style("background-color", "#FAFAFA") // Material Gray 50
        .style("border", "1px solid #BDBDBD") // Material Gray 400
        .style("padding", "10px")
        .style("border-radius", "8px")
        .style("box-shadow", "0px 4px 8px rgba(0, 0, 0, 0.15)")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("display", "none");

    // console.log("Tooltip element created:", socioeconomicHeatmapTooltip);

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
                    c3: d.c3,
                    country: d.country,
                    giniIndex: parseFloat(d.gini) || 0,
                }));

            const mergedData = filteredVaccinationData.map(v => {
                const socioData = socioeconomicRates.find(s => s.c3 === v.isoCode);
                return {
                    country: v.country,
                    vaccinationRate: v.vaccinationRate,
                    giniIndex: socioData ? socioData.giniIndex : null,
                };
            }).filter(d => d.giniIndex !== null);

            // console.log("Merged Data:", mergedData);

            if (mergedData.length === 0) {
                console.error("No merged data found! Check filtering or data sources.");
                return;
            }

            const xScale = d3.scaleBand()
                .domain(mergedData.map(d => d.country))
                .range([0, width])
                .padding(0.1);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(mergedData, d => d.vaccinationRate)])
                .range([height, 0]);

            const colorScale = d3.scaleSequential(d3.interpolateBlues)
                .domain([0, d3.max(mergedData, d => d.giniIndex)]);

            // Heatmap Rectangles
            svgHeatmap.selectAll("rect")
                .data(mergedData)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.country))
                .attr("y", d => yScale(d.vaccinationRate))
                .attr("width", xScale.bandwidth())
                .attr("height", d => height - yScale(d.vaccinationRate))
                .attr("fill", d => colorScale(d.giniIndex))
                .on("mouseover", (event, d) => {
                    // console.log("Tooltip hover detected:", d);
                    socioeconomicHeatmapTooltip
                        .style("display", "block")
                        .html(`
                            <strong>Country:</strong> ${d.country}<br>
                            <strong>Vaccination Rate:</strong> ${d.vaccinationRate.toFixed(2)} per million<br>
                            <strong>Gini Index:</strong> ${d.giniIndex.toFixed(2)}
                        `);
                })
                .on("mousemove", (event) => {
                    socioeconomicHeatmapTooltip
                        .style("left", `${event.pageX + 15}px`)
                        .style("top", `${event.pageY - 35}px`);
                })
                .on("mouseout", () => {
                    socioeconomicHeatmapTooltip.style("display", "none");
                });

            // X and Y Axes
            svgHeatmap.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end")
                .style("font-weight", "bold");

            svgHeatmap.append("g")
                .call(d3.axisLeft(yScale))
                .selectAll("text")
                .style("font-weight", "bold");

            // Axis Labels
            svgHeatmap.append("text")
                .attr("x", width / 2)
                .attr("y", height + margin.bottom - 25)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text("Countries");

            svgHeatmap.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text("Vaccination Rate (per million)");

            // Legend
            const legendWidth = 300;
            const legendHeight = 10;

            const legendSvg = d3.select("#socioeconomic-heatmap")
                .append("svg")
                .attr("width", legendWidth + margin.left + margin.right)
                .attr("height", 70)
                .append("g")
                .attr("transform", `translate(${margin.left},10)`);

            const legendScale = d3.scaleLinear()
                .domain(colorScale.domain())
                .range([0, legendWidth]);

            legendSvg.selectAll("rect")
                .data(d3.range(legendWidth))
                .enter()
                .append("rect")
                .attr("x", d => d)
                .attr("y", 0)
                .attr("width", 1)
                .attr("height", legendHeight)
                .attr("fill", d => colorScale(legendScale.invert(d)))
                .on("mouseover", (event, d) => {
                    socioeconomicHeatmapTooltip
                        .style("display", "block")
                        .html(`<strong>Gini Index:</strong> ${legendScale.invert(d).toFixed(2)}`);
                })
                .on("mousemove", (event) => {
                    socioeconomicHeatmapTooltip
                        .style("left", `${event.pageX + 15}px`)
                        .style("top", `${event.pageY - 35}px`);
                })
                .on("mouseout", () => {
                    socioeconomicHeatmapTooltip.style("display", "none");
                });

            legendSvg.append("g")
                .attr("transform", `translate(0,${legendHeight})`)
                .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".2f")));

            legendSvg.append("text")
                .attr("x", 0)
                .attr("y", legendHeight + 40)
                .text("Low")
                .style("font-size", "12px")
                .style("font-weight", "bold");

            legendSvg.append("text")
                .attr("x", legendWidth)
                .attr("y", legendHeight + 40)
                .attr("text-anchor", "end")
                .text("High")
                .style("font-size", "12px")
                .style("font-weight", "bold");
        })
        .catch(error => {
            console.error("Error loading or processing data:", error);
        });
})();
