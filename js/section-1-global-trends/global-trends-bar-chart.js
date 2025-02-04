(() => {
    const vaccinationDataUrl = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.json';

    const regionMap = {
        Africa: ['DZA', 'EGY', 'NGA', 'ZAF'],
        Asia: ['CHN', 'IND', 'JPN'],
        Europe: ['FRA', 'DEU', 'ITA'],
        'North America': ['USA', 'CAN', 'MEX'],
        'South America': ['BRA', 'ARG', 'CHL'],
    };

    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }

    async function renderBarChart() {
        const vaccinationData = await fetchData(vaccinationDataUrl);

        if (!vaccinationData) {
            console.error('Failed to load vaccination data for the bar chart.');
            return;
        }

        const regionalData = Object.keys(regionMap).map((region) => {
            const countries = regionMap[region];
            const regionData = countries.map((isoCode) => {
                const countryData = vaccinationData.find((d) => d.iso_code === isoCode);
                if (!countryData) {
                    return 0;
                }
                return countryData.data.slice(-1)[0]?.people_vaccinated_per_hundred || 0;
            });
            const averageVaccination = regionData.reduce((sum, value) => sum + value, 0) / regionData.length;
            return {
                region,
                averageVaccination: averageVaccination || 0,
            };
        });

        const width = 500;
        const height = 400;
        const margin = { top: 40, right: 30, bottom: 80, left: 70 };

        const svg = d3.select('#bar-chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(regionalData.map(d => d.region))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(regionalData, d => d.averageVaccination)])
            .nice()
            .range([height, 0]);

        const colorScale = d3.scaleOrdinal()
            .domain(regionalData.map(d => d.region))
            .range(['#FF8A80', '#FFB74D', '#4DB6AC', '#64B5F6', '#BA68C8']);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('class', 'section1-global-trends-bar-chart-x-axis-tick') // Updated tick class name
            .attr('dy', '1em');

        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(10).tickFormat(d => `${d}%`));

        // Add x-axis label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .attr('class', 'section1-global-trends-bar-chart-x-axis-label') // Updated x-axis label class name
            .text('Regions');

        // Add y-axis label
        svg.append('text')
            .attr('x', -height / 2)
            .attr('y', -margin.left + 20)
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('class', 'section1-global-trends-bar-chart-y-axis-label') // Updated y-axis label class name
            .text('Average Vaccination (%)');

        // Create a tooltip
        const tooltip = d3.select('#bar-chart')
            .append('div')
            .attr('class', 'section1-global-trends-bar-chart-tooltip'); // Updated tooltip class name

        // Add bars
        svg.selectAll('.bar')
            .data(regionalData)
            .enter()
            .append('rect')
            .attr('class', 'section1-global-trends-bar-chart-bar') // Updated bar class name
            .attr('x', d => xScale(d.region))
            .attr('y', d => yScale(d.averageVaccination))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.averageVaccination))
            .attr('fill', d => colorScale(d.region))
            .on('mouseover', function (event, d) {
                d3.select(this).classed('section1-global-trends-bar-chart-bar-hover', true); // Updated hover class name
                tooltip
                    .style('visibility', 'visible')
                    .html(`<strong>${d.region}</strong><br>Average Vaccination: ${d.averageVaccination.toFixed(2)}%`);
                svg.append('text')
                    .attr('class', 'section1-global-trends-bar-chart-hover-label') // Updated hover label class name
                    .attr('x', xScale(d.region) + xScale.bandwidth() / 2)
                    .attr('y', yScale(d.averageVaccination) - 5)
                    .attr('text-anchor', 'middle')
                    .text(`${d.averageVaccination.toFixed(1)}%`);
            })
            .on('mousemove', function (event) {
                tooltip
                    .style('top', `${event.pageY - 40}px`)
                    .style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', function () {
                d3.select(this).classed('section1-global-trends-bar-chart-bar-hover', false); // Updated hover class name
                tooltip.style('visibility', 'hidden');
                svg.selectAll('.section1-global-trends-bar-chart-hover-label').remove(); // Updated hover label class name
            });

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 100},${-20})`);

        regionalData.forEach((d, i) => {
            legend.append('rect')
                .attr('class', 'section1-global-trends-bar-chart-legend-rect') // Updated legend rect class name
                .attr('x', 0)
                .attr('y', i * 20)
                .attr('fill', colorScale(d.region));

            legend.append('text')
                .attr('class', 'section1-global-trends-bar-chart-legend-text') // Updated legend text class name
                .attr('x', 20)
                .attr('y', i * 20 + 10)
                .text(d.region);
        });
    }

    renderBarChart();
})();
