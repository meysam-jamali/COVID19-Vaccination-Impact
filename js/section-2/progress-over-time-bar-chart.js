(() => {
    const vaccinationDataUrlProgress = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.json';

    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return await response.json();
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }

    async function renderLineChart() {
        const vaccinationData = await fetchData(vaccinationDataUrlProgress);

        if (!vaccinationData) {
            console.error('Failed to load vaccination data for the line chart.');
            return;
        }

        const globalData = vaccinationData.find((entry) => entry.iso_code === 'OWID_WRL');
        if (!globalData || !globalData.data) {
            console.error('No global data found in vaccination dataset.');
            return;
        }

        const dates = globalData.data.map((d) => d.date);
        const cumulativeVaccinations = globalData.data.map((d) => d.total_vaccinations || 0);

        const width = 450;
        const height = 400;
        const margin = { top: 60, right: 30, bottom: 70, left: 115 };

        const svg = d3.select('#line-chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleTime()
            .domain([new Date(dates[0]), new Date(dates[dates.length - 1])])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(cumulativeVaccinations)])
            .range([height, 0]);

        const line = d3.line()
            .x((_, i) => xScale(new Date(dates[i])))
            .y((d) => yScale(d))
            .curve(d3.curveMonotoneX);

        // Add line
        svg.append('path')
            .datum(cumulativeVaccinations)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(54, 162, 235, 1)')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Add tooltip
        const tooltip = d3.select('body')
            .append('div')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', '#fff')
            .style('border', '1px solid #ccc')
            .style('padding', '5px')
            .style('border-radius', '5px')
            .style('box-shadow', '0px 0px 10px rgba(0,0,0,0.1)');

        // Add circles for data points and tooltips
        svg.selectAll('circle')
            .data(globalData.data) // Bind the entire global data entries
            .enter()
            .append('circle')
            .attr('cx', (d) => xScale(new Date(d.date)))
            .attr('cy', (d) => yScale(d.total_vaccinations || 0))
            .attr('r', 4)
            .attr('fill', 'rgba(54, 162, 235, 1)')
            .on('mouseover', (event, d) => {
                const date = new Date(d.date);
                const formattedDate = d3.timeFormat('%b %d, %Y')(date);
                const vaccinations = d.total_vaccinations ? d.total_vaccinations.toLocaleString() : 'No data';
                tooltip
                    .style('visibility', 'visible')
                    .html(`Date: ${formattedDate}<br>Cumulative: ${vaccinations}`);
            })
            .on('mousemove', (event) => {
                tooltip
                    .style('top', `${event.pageY - 40}px`)
                    .style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', () => {
                tooltip.style('visibility', 'hidden');
            });



        // X-axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.timeFormat('%b %Y')))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Y-axis
        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(10).tickFormat(d => d.toLocaleString()));

        // X-axis label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 70)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 600)
            .text('Date');

        // Y-axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 25)
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 600)
            .text('Cumulative Vaccinations');

        // Add guidance (legend)
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 150}, -40)`); // Position legend at the top-right

        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', 'rgba(54, 162, 235, 1)');

        legend.append('text')
            .attr('x', 25)
            .attr('y', 14)
            .text('Cumulative Vaccinations')
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');
    }

    renderLineChart();
})();
