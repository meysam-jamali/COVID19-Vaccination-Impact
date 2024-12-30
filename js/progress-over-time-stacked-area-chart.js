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

    async function renderStackedAreaChart() {
        const vaccinationData = await fetchData(vaccinationDataUrlProgress);

        if (!vaccinationData) {
            console.error('Failed to load vaccination data for the stacked area chart.');
            return;
        }

        const globalData = vaccinationData.find((entry) => entry.iso_code === 'OWID_WRL');
        if (!globalData || !globalData.data) {
            console.error('No global data found in vaccination dataset.');
            return;
        }

        const dates = globalData.data.map((d) => d.date);
        const fullyVaccinated = globalData.data.map((d) => d.people_fully_vaccinated || 0);
        const partiallyVaccinated = globalData.data.map((d) => d.people_vaccinated - (d.people_fully_vaccinated || 0));
        const boosterDoses = globalData.data.map((d) => d.total_boosters || 0);

        const data = dates.map((date, i) => ({
            date: new Date(date),
            FullyVaccinated: fullyVaccinated[i],
            PartiallyVaccinated: partiallyVaccinated[i],
            BoosterDoses: boosterDoses[i],
        }));

        const width = 800;
        const height = 500;
        const margin = { top: 80, right: 50, bottom: 100, left: 120 }; // Adjusted margins

        const svg = d3.select('#stacked-area-chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const keys = ['FullyVaccinated', 'PartiallyVaccinated', 'BoosterDoses'];

        const stack = d3.stack()
            .keys(keys)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const series = stack(data);

        const xScale = d3.scaleTime()
            .domain(d3.extent(data, (d) => d.date))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(series, (d) => d3.max(d, (d) => d[1]))])
            .range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(['rgba(75, 192, 192, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(153, 102, 255, 0.6)']);

        svg.selectAll('path')
            .data(series)
            .enter()
            .append('path')
            .attr('fill', (d) => color(d.key))
            .attr('d', d3.area()
                .x((d) => xScale(d.data.date))
                .y0((d) => yScale(d[0]))
                .y1((d) => yScale(d[1]))
            );

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
            .attr('y', height + 70) // Added margin
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Date');

        // Y-axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 30) // Added margin
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Number of Vaccinations');

        // Add guidance (legend) for colors
        const legend = svg.append('g')
            .attr('transform', `translate(0, -50)`); // Position at the top

        keys.forEach((key, i) => {
            const legendGroup = legend.append('g')
                .attr('transform', `translate(${i * 200}, 0)`);

            legendGroup.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 18)
                .attr('height', 18)
                .attr('fill', color(key));

            legendGroup.append('text')
                .attr('x', 25)
                .attr('y', 14)
                .text(key)
                .style('font-size', '12px')
                .attr('alignment-baseline', 'middle');
        });
    }

    renderStackedAreaChart();
})();
