(() => {
    const width = 960;
    const height = 600;
    const margin = { top: 60, right: 60, bottom: 100, left: 100 };

    const svg = d3.select("#economic-recovery-boxplot")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    console.log("SVG element created for enhanced box plot.");

    const xScale = d3.scaleBand().range([0, width - margin.left - margin.right]).padding(0.1);
    const yScale = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]);

    d3.csv("/data/Section 5/owid-covid-data.csv").then(data => {
        console.log("CSV data loaded.");

        const processedData = d3.groups(
            data
                .filter(d => d.people_fully_vaccinated_per_hundred && d.gdp_per_capita)
                .map(d => ({
                    vaccinationGroup: Math.floor(+d.people_fully_vaccinated_per_hundred / 10) * 10, // Group vaccination rates
                    gdpGrowth: +d.gdp_per_capita
                })),
            d => d.vaccinationGroup
        );

        console.log("Processed data for enhanced box plot:", processedData);

        xScale.domain(processedData.map(d => `${d[0]}-${d[0] + 10}%`));
        yScale.domain([
            d3.min(processedData, d => d3.min(d[1], v => v.gdpGrowth)) - 1000,
            d3.max(processedData, d => d3.max(d[1], v => v.gdpGrowth)) + 1000
        ]);

        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g").call(d3.axisLeft(yScale));

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

            svg.append("rect")
                .attr("x", x)
                .attr("y", yScale(q3))
                .attr("width", boxWidth)
                .attr("height", yScale(q1) - yScale(q3))
                .attr("fill", "#69b3a2")
                .attr("stroke", "black");

            svg.append("line")
                .attr("x1", x)
                .attr("x2", x + boxWidth)
                .attr("y1", yScale(median))
                .attr("y2", yScale(median))
                .attr("stroke", "black");

            svg.append("line")
                .attr("x1", x + boxWidth / 2)
                .attr("x2", x + boxWidth / 2)
                .attr("y1", yScale(min))
                .attr("y2", yScale(max))
                .attr("stroke", "black");

            svg.append("line")
                .attr("x1", x + boxWidth / 4)
                .attr("x2", x + (3 * boxWidth) / 4)
                .attr("y1", yScale(min))
                .attr("y2", yScale(min))
                .attr("stroke", "black");

            svg.append("line")
                .attr("x1", x + boxWidth / 4)
                .attr("x2", x + (3 * boxWidth) / 4)
                .attr("y1", yScale(max))
                .attr("y2", yScale(max))
                .attr("stroke", "black");
        });

        svg.append("path")
            .datum(averages)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => xScale(d.group) + xScale.bandwidth() / 2)
                .y(d => yScale(d.avg))
            );

        averages.forEach(d => {
            svg.append("text")
                .attr("x", xScale(d.group) + xScale.bandwidth() / 2)
                .attr("y", yScale(d.avg) - 5)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .text(d.avg.toFixed(2));
        });

        console.log("Enhanced box plot created.");
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
})();
