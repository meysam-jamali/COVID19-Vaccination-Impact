(() => {
    // console.log("Diverging Bar Chart for Gender and Health Factors Loaded!");

    const margin = { top: 40, right: 80, bottom: 120, left: 150 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const maleSmokersColor = "#6A1B9A"; // Purple
    const femaleSmokersColor = "#26A69A"; // Teal

    // Append SVG
    const svg = d3.select("#gender-health-diverging-bar")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // console.log("SVG created and appended to #gender-health-diverging-bar");

    // Tooltip
    const genderHealthTooltip = d3.select("body")
        .append("div")
        .attr("class", "gender-health-tooltip")
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

    // console.log("Tooltip created");

    const selectedCountries = ["USA", "BRA", "IND", "CHN", "GBR", "FRA", "DEU", "JPN", "ZAF", "RUS", "ITA", "CAN", "AUS"];

    Promise.all([
        d3.csv("/data/Section 5/owid-covid-data.csv"),
        d3.csv("/data/Section 5/WIID_28NOV2023.csv")
    ])
        .then(([vaccinationData]) => {
            // console.log("Data loaded successfully");

            const filteredVaccinationData = vaccinationData
                .filter(d => selectedCountries.includes(d.iso_code))
                .map(d => ({
                    country: d.location,
                    vaccinationRate: parseFloat(d.total_vaccinations) / (parseFloat(d.population) || 1) * 1_000_000,
                    maleSmokers: parseFloat(d.male_smokers) || 0,
                    femaleSmokers: parseFloat(d.female_smokers) || 0
                }))
                .filter(d => d.vaccinationRate > 0);

            // console.log("Filtered vaccination data:", filteredVaccinationData);

            const chartData = filteredVaccinationData.map(d => ({
                country: d.country,
                maleSmokers: -d.maleSmokers, // Negative for diverging effect
                femaleSmokers: d.femaleSmokers,
                vaccinationRate: d.vaccinationRate
            }));

            const xScale = d3.scaleLinear()
                .domain([d3.min(chartData, d => d.maleSmokers), d3.max(chartData, d => d.femaleSmokers)])
                .range([0, width]);

            const yScale = d3.scaleBand()
                .domain(chartData.map(d => d.country))
                .range([0, height])
                .padding(0.2);

            // Male Smokers Bars
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
                    // console.log(`Mouse over: Male smokers for ${d.country}`);
                    genderHealthTooltip.style("display", "block")
                        .html(`
                            <strong>Country:</strong> ${d.country}<br>
                            <strong>Male Smokers:</strong> ${Math.abs(d.maleSmokers).toFixed(2)}%<br>
                            <strong>Vaccination Rate:</strong> ${d.vaccinationRate.toFixed(2)} per million
                        `);
                })
                .on("mousemove", event => {
                    // console.log("Tooltip moving");
                    genderHealthTooltip
                        .style("left", `${event.pageX + 15}px`)
                        .style("top", `${event.pageY - 25}px`);
                })
                .on("mouseout", () => {
                    // console.log("Mouse out from male bar");
                    genderHealthTooltip.style("display", "none");
                });

            // Female Smokers Bars
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
                    // console.log(`Mouse over: Female smokers for ${d.country}`);
                    genderHealthTooltip.style("display", "block")
                        .html(`
                            <strong>Country:</strong> ${d.country}<br>
                            <strong>Female Smokers:</strong> ${d.femaleSmokers.toFixed(2)}%<br>
                            <strong>Vaccination Rate:</strong> ${d.vaccinationRate.toFixed(2)} per million
                        `);
                })
                .on("mousemove", event => {
                    // console.log("Tooltip moving");
                    genderHealthTooltip
                        .style("left", `${event.pageX + 15}px`)
                        .style("top", `${event.pageY - 25}px`);
                })
                .on("mouseout", () => {
                    // console.log("Mouse out from female bar");
                    genderHealthTooltip.style("display", "none");
                });

            // console.log("Bars rendered");

            // Axes
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${Math.abs(d)}%`));

            svg.append("g").call(d3.axisLeft(yScale));

            // Labels
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + margin.bottom - 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("weight", "600")
                .text("Smoking Prevalence (%)");

            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("weight", "600")
                .text("Countries");

            // console.log("Axes and labels added");
        })
        .catch(error => {
            console.error("Error loading or processing data:", error);
        });
})();
