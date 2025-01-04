(() => {
    console.log("Diverging Bar Chart for Gender and Health Factors Loaded!");

    const margin = { top: 40, right: 80, bottom: 120, left: 150 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Colors
    const maleSmokersColor = "#6A1B9A"; // Purple
    const femaleSmokersColor = "#26A69A"; // Teal

    // Append SVG for the diverging bar chart
    const svg = d3.select("#gender-health-diverging-bar")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("#gender-health-diverging-bar")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "4px")
        .style("display", "none");

    // Selected countries to focus on
    const selectedCountries = ["USA", "BRA", "IND", "CHN", "GBR", "FRA", "DEU", "JPN", "ZAF", "RUS", "ITA", "CAN", "AUS"];

    // Load and process the data
    Promise.all([
        d3.csv("/data/Section 5/owid-covid-data.csv"),
        d3.csv("/data/Section 5/WIID_28NOV2023.csv")
    ]).then(([vaccinationData, socioeconomicData]) => {
        console.log("Data loaded successfully!");

        // Filter and process vaccination data
        const filteredVaccinationData = vaccinationData
            .filter(d => selectedCountries.includes(d.iso_code))
            .map(d => ({
                country: d.location,
                vaccinationRate: parseFloat(d.total_vaccinations) / (parseFloat(d.population) || 1) * 1_000_000,
                maleSmokers: parseFloat(d.male_smokers) || 0,
                femaleSmokers: parseFloat(d.female_smokers) || 0
            }))
            .filter(d => d.vaccinationRate > 0);

        console.log("Filtered Vaccination Data:", filteredVaccinationData);

        // Prepare the data for the diverging bar chart
        const chartData = filteredVaccinationData.map(d => ({
            country: d.country,
            maleSmokers: -d.maleSmokers, // Negative values for left side
            femaleSmokers: d.femaleSmokers,
            vaccinationRate: d.vaccinationRate
        }));

        console.log("Chart Data:", chartData);

        // Scales
        const xScale = d3.scaleLinear()
            .domain([d3.min(chartData, d => d.maleSmokers), d3.max(chartData, d => d.femaleSmokers)])
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(chartData.map(d => d.country))
            .range([0, height])
            .padding(0.2);

        // Add bars for male smokers
        svg.selectAll(".bar-male")
            .data(chartData)
            .enter()
            .append("rect")
            .attr("class", "bar-male")
            .attr("x", d => xScale(d.maleSmokers))
            .attr("y", d => yScale(d.country))
            .attr("width", d => xScale(0) - xScale(d.maleSmokers))
            .attr("height", yScale.bandwidth())
            .attr("fill", maleSmokersColor)
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block").html(`
                    <strong>Country:</strong> ${d.country}<br>
                    <strong>Male Smokers:</strong> ${Math.abs(d.maleSmokers).toFixed(2)}%<br>
                    <strong>Vaccination Rate:</strong> ${d.vaccinationRate.toFixed(2)} per million
                `);
            })
            .on("mousemove", event => {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        // Add bars for female smokers
        svg.selectAll(".bar-female")
            .data(chartData)
            .enter()
            .append("rect")
            .attr("class", "bar-female")
            .attr("x", xScale(0))
            .attr("y", d => yScale(d.country))
            .attr("width", d => xScale(d.femaleSmokers) - xScale(0))
            .attr("height", yScale.bandwidth())
            .attr("fill", femaleSmokersColor)
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block").html(`
                    <strong>Country:</strong> ${d.country}<br>
                    <strong>Female Smokers:</strong> ${d.femaleSmokers.toFixed(2)}%<br>
                    <strong>Vaccination Rate:</strong> ${d.vaccinationRate.toFixed(2)} per million
                `);
            })
            .on("mousemove", event => {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${Math.abs(d)}%`));

        svg.append("g").call(d3.axisLeft(yScale));

        // Add x-axis label
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Smoking Prevalence (%)");

        // Add legend
        const legend = d3.select("#gender-health-diverging-legend");
        legend.html(`
            <span style="color: ${femaleSmokersColor};">&#9632;</span> Female Smokers
            <span style="margin-left: 20px; color: ${maleSmokersColor};">&#9632;</span> Male Smokers
        `);

        console.log("Diverging bar chart successfully rendered!");
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
})();
