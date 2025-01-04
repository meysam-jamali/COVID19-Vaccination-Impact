(() => {
    console.log("Main JavaScript file loaded!");

    // Set up larger dimensions for better display
    const margin = { top: 40, right: 60, bottom: 100, left: 110 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // File paths for datasets
    const vaccinationDataUrl = "/data/Section 5/owid-covid-data.csv";
    const socioeconomicDataUrl = "/data/Section 5/WIID_28NOV2023.csv";

    // Append SVG for heatmap
    const svgHeatmap = d3.select("#socioeconomic-heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Append tooltip
    const tooltip = d3.select("#socioeconomic-heatmap")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "4px")
        .style("display", "none");

    // List of 10 specific countries to include
    const selectedCountries = ["USA", "BRA", "IND", "RUS", "CHN", "ZAF", "FRA", "DEU", "GBR", "JPN"];

    // Load and process data
    Promise.all([d3.csv(vaccinationDataUrl), d3.csv(socioeconomicDataUrl)])
        .then(([vaccinationData, socioeconomicData]) => {
            console.log("Data loaded successfully.");

            // Debug: Log column names and sample data
            console.log("Vaccination Data Columns:", Object.keys(vaccinationData[0]));
            console.log("Socioeconomic Data Columns:", Object.keys(socioeconomicData[0]));
            console.log("Sample Vaccination Data:", vaccinationData.slice(0, 5));
            console.log("Sample Socioeconomic Data:", socioeconomicData.slice(0, 5));

            // Filter and calculate vaccination data
            const filteredVaccinationData = vaccinationData
                .filter(d => selectedCountries.includes(d.iso_code))
                .map(d => ({
                    isoCode: d.iso_code,
                    country: d.location,
                    date: d.date,
                    population: parseFloat(d.population) || null,
                    total_vaccinations: parseFloat(d.total_vaccinations) || null,
                    vaccinationRate:
                        d.total_vaccinations && d.population
                            ? (parseFloat(d.total_vaccinations) / parseFloat(d.population)) * 1_000_000
                            : 0,
                }))
                .filter(d => d.vaccinationRate > 0);

            console.log("Filtered Vaccination Data:", filteredVaccinationData);

            // Aggregate latest data by country
            const latestVaccinationData = {};
            filteredVaccinationData.forEach(d => {
                if (!latestVaccinationData[d.isoCode] || new Date(d.date) > new Date(latestVaccinationData[d.isoCode].date)) {
                    latestVaccinationData[d.isoCode] = d;
                }
            });

            const vaccinationRates = Object.values(latestVaccinationData).map(d => ({
                isoCode: d.isoCode,
                country: d.country,
                vaccinationRate: d.vaccinationRate,
            }));

            console.log("Latest Vaccination Data by Country:", vaccinationRates);

            // Filter socioeconomic data
            const socioeconomicRates = socioeconomicData
                .filter(d => selectedCountries.includes(d.c3))
                .map(d => ({
                    c3: d.c3,
                    country: d.country,
                    giniIndex: parseFloat(d.gini) || 0,
                }));

            console.log("Filtered Socioeconomic Data:", socioeconomicRates);

            // Merge datasets by isoCode and country
            const mergedData = vaccinationRates.map(v => {
                const socioData = socioeconomicRates.find(s => s.c3 === v.isoCode);
                return {
                    country: v.country,
                    vaccinationRate: v.vaccinationRate,
                    giniIndex: socioData ? socioData.giniIndex : null,
                };
            }).filter(d => d.giniIndex !== null);

            console.log("Merged Data for Heatmap:", mergedData);

            if (mergedData.length === 0) {
                console.error("No merged data found! Check filtering or data sources.");
                return;
            }

            // Create scales for heatmap
            const xScale = d3.scaleBand()
                .domain(mergedData.map(d => d.country))
                .range([0, width])
                .padding(0.1);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(mergedData, d => d.vaccinationRate)])
                .range([height, 0]);

            const colorScale = d3.scaleSequential(d3.interpolateBlues)
                .domain([0, d3.max(mergedData, d => d.giniIndex)]);

            // Draw heatmap
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
                    tooltip
                        .style("display", "block")
                        .html(`<strong>Country:</strong> ${d.country}<br>
                               <strong>Vaccination Rate:</strong> ${d.vaccinationRate.toFixed(2)} per million<br>
                               <strong>Gini Index:</strong> ${d.giniIndex.toFixed(2)}`);
                })
                .on("mousemove", (event) => {
                    tooltip
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`);
                })
                .on("mouseout", () => tooltip.style("display", "none"));

            // Add axes
            svgHeatmap.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end");

            svgHeatmap.append("g")
                .call(d3.axisLeft(yScale));

            // Add labels
            svgHeatmap.append("text")
                .attr("x", width / 2)
                .attr("y", height + margin.bottom - 10)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("Countries");

            svgHeatmap.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("Vaccination Rate (per million)");

            // Add legend
            const legendWidth = 300;
            const legendHeight = 10;

            const legendSvg = d3.select("#socioeconomic-heatmap")
                .append("svg")
                .attr("width", legendWidth + margin.left + margin.right)
                .attr("height", 50)
                .append("g")
                .attr("transform", `translate(${margin.left},10)`);

            const legendScale = d3.scaleLinear()
                .domain(colorScale.domain())
                .range([0, legendWidth]);

            const legendAxis = d3.axisBottom(legendScale)
                .ticks(5)
                .tickFormat(d3.format(".2f"));

            legendSvg.selectAll("rect")
                .data(d3.range(legendWidth))
                .enter()
                .append("rect")
                .attr("x", d => d)
                .attr("y", 0)
                .attr("width", 1)
                .attr("height", legendHeight)
                .attr("fill", d => colorScale(legendScale.invert(d)));

            legendSvg.append("g")
                .attr("transform", `translate(0,${legendHeight})`)
                .call(legendAxis);

            console.log("Heatmap successfully rendered!");
        })
        .catch(error => {
            console.error("Error loading or processing data:", error);
        });
})();
