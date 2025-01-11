(() => {
    const width = 960;
    const height = 600;
    const margin = { top: 60, right: 180, bottom: 120, left: 100 };

    // Append SVG for the box plot
    const svg = d3.select("#economic-recovery-boxplot")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Tooltip
    const vaccinationEconomicRecoveryTooltip = d3.select("body")
        .append("div")
        .attr("class", "vaccination-economic-recovery-tooltip")
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

    const xScale = d3.scaleBand().range([0, width - margin.left - margin.right]).padding(0.2);
    const yScale = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]);

    d3.csv("/data/Section 5/owid-covid-data.csv").then(data => {
        const processedData = d3.groups(
            data
                .filter(d => d.people_fully_vaccinated_per_hundred && d.gdp_per_capita)
                .map(d => ({
                    vaccinationGroup: Math.floor(+d.people_fully_vaccinated_per_hundred / 10) * 10,
                    gdpGrowth: +d.gdp_per_capita
                })),
            d => d.vaccinationGroup
        );

        xScale.domain(processedData.map(d => `${d[0]}-${d[0] + 10}%`));
        yScale.domain([
            d3.min(processedData, d => d3.min(d[1], v => v.gdpGrowth)) - 1000,
            d3.max(processedData, d => d3.max(d[1], v => v.gdpGrowth)) + 1000
        ]);

        // Add X-axis
        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickSize(0).tickPadding(10))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "12px")
            .style("fill", "#424242"); // Material Gray 800

        svg.append("text")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", height - margin.bottom + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#212121") // Material Gray 900
            .text("Vaccination Rate Groups (%)");

        // Add Y-axis
        svg.append("g")
            .call(d3.axisLeft(yScale).tickSize(-width + margin.left + margin.right).tickPadding(10))
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#424242"); // Material Gray 800

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height - margin.top - margin.bottom) / 2)
            .attr("y", -margin.left + 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14spx")
            .style("font-weight", "bold")
            .style("fill", "#212121") // Material Gray 900
            .text("GDP Per Capita");

        const averages = [];

        processedData.forEach(group => {
            const values = group[1].map(d => d.gdpGrowth).sort(d3.ascending);
            const q1 = d3.quantile(values, 0.25);
            const median = d3.quantile(values, 0.5);
            const q3 = d3.quantile(values, 0.75);
            const iqr = q3 - q1;
            const min = Math.max(values[0], q1 - 1.5 * iqr);
            const max = Math.min(values[values.length - 1], q3 + 1.5 * iqr);
            const avg = d3.mean(values);

            averages.push({ group: `${group[0]}-${group[0] + 10}%`, avg });

            const x = xScale(`${group[0]}-${group[0] + 10}%`);
            const boxWidth = xScale.bandwidth();

            // Draw box
            svg.append("rect")
                .attr("x", x)
                .attr("y", yScale(q3))
                .attr("width", boxWidth)
                .attr("height", yScale(q1) - yScale(q3))
                .attr("fill", "#42A5F5") // Material Blue 500
                .attr("stroke", "#1E88E5") // Material Blue 600
                .on("mouseover", () => vaccinationEconomicRecoveryTooltip.style("display", "block"))
                .on("mousemove", (event) => {
                    vaccinationEconomicRecoveryTooltip
                        .style("left", `${event.pageX + 15}px`)
                        .style("top", `${event.pageY - 25}px`)
                        .html(`
                            <strong>Group:</strong> ${group[0]}-${group[0] + 10}%<br>
                            <strong>Q1:</strong> ${q1.toFixed(2)}<br>
                            <strong>Median:</strong> ${median.toFixed(2)}<br>
                            <strong>Q3:</strong> ${q3.toFixed(2)}<br>
                            <strong>Avg:</strong> ${avg.toFixed(2)}
                        `);
                })
                .on("mouseout", () => vaccinationEconomicRecoveryTooltip.style("display", "none"));

            // Median line
            svg.append("line")
                .attr("x1", x)
                .attr("x2", x + boxWidth)
                .attr("y1", yScale(median))
                .attr("y2", yScale(median))
                .attr("stroke", "#1E88E5") // Material Blue 600
                .attr("stroke-width", 1.5);

            // Whiskers
            svg.append("line")
                .attr("x1", x + boxWidth / 2)
                .attr("x2", x + boxWidth / 2)
                .attr("y1", yScale(min))
                .attr("y2", yScale(max))
                .attr("stroke", "#1E88E5"); // Material Blue 600

            svg.append("line")
                .attr("x1", x + boxWidth / 4)
                .attr("x2", x + (3 * boxWidth) / 4)
                .attr("y1", yScale(min))
                .attr("y2", yScale(min))
                .attr("stroke", "#1E88E5");

            svg.append("line")
                .attr("x1", x + boxWidth / 4)
                .attr("x2", x + (3 * boxWidth) / 4)
                .attr("y1", yScale(max))
                .attr("y2", yScale(max))
                .attr("stroke", "#1E88E5");
        });

        // Draw average line
        svg.append("path")
            .datum(averages)
            .attr("fill", "none")
            .attr("stroke", "#FF5722") // Material Deep Orange 500
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => xScale(d.group) + xScale.bandwidth() / 2)
                .y(d => yScale(d.avg))
            );

        // Legend
        const legend = svg.append("g").attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "#42A5F5"); // Material Blue 500

        legend.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text("GDP Distribution")
            .style("font-size", "14px")
            .style("alignment-baseline", "middle");

        legend.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 40)
            .attr("y2", 40)
            .attr("stroke", "#FF5722") // Material Deep Orange 500
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 30)
            .attr("y", 45)
            .text("Average GDP")
            .style("font-size", "14px")
            .style("alignment-baseline", "middle");
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
})();
