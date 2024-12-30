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
            console.log('Fetched data:', data); // Debugging: Log fetched data
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
        console.log('Regional Data:', regionalData); // Debugging: Log regional data
        

        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 50, left: 50 };

        const svg = d3.select('#bar-chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        console.log('SVG created'); // Debugging: Confirm SVG creation


        const xScale = d3.scaleBand()
            .domain(regionalData.map(d => d.region))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(regionalData, d => d.averageVaccination)])
            .nice()
            .range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(10).tickFormat(d => `${d}%`));

        // Create a tooltip div (hidden by default)
        const tooltip = d3.select('#bar-chart')
            .append('div')
            .style('position', 'absolute')
            .style('background', '#fff')
            .style('border', '1px solid #ccc')
            .style('padding', '5px')
            .style('border-radius', '5px')
            .style('box-shadow', '0px 0px 10px rgba(0,0,0,0.1)')
            .style('visibility', 'hidden')
            .style('pointer-events', 'none')
            .style('z-index', '10');

        // Add bars with hover effect
        svg.selectAll('.bar')
            .data(regionalData)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.region))
            .attr('y', d => yScale(d.averageVaccination))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.averageVaccination))
            .attr('fill', 'rgba(54, 162, 235, 0.6)')
            .on('mouseover', (event, d) => {
                tooltip
                    .style('visibility', 'visible')
                    .html(`<strong>${d.region}</strong>: ${d.averageVaccination.toFixed(2)}%`);
            })
            .on('mousemove', (event) => {
                tooltip
                    .style('top', `${event.pageY - 20}px`)
                    .style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', () => {
                tooltip.style('visibility', 'hidden');
            });
    }

    renderBarChart();
})();
