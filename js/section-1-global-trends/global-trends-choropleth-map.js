(() => {
    const geoJsonUrl = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
    const vaccinationDataUrl = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.json';

    const lightTheme = {
        background: '#fff',
        countryFillNoData: '#ccc',
        border: '#333',
        tooltipBackground: '#fff',
        tooltipBorder: '#ccc',
        legendText: '#000',
    };

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

    async function renderChoroplethMap() {
        const geoJson = await fetchData(geoJsonUrl);
        const vaccinationData = await fetchData(vaccinationDataUrl);

        if (!geoJson || !vaccinationData) {
            console.error('Failed to load necessary data for the choropleth map.');
            return;
        }

        const width = 800;
        const height = 500;
        const margin = { top: 20, right: 20, bottom: 60, left: 20 };

        const svg = d3.select('#choropleth-map')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background-color', lightTheme.background);

        const projection = d3.geoMercator()
            .scale(130)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, 100]);

        const vaccinationMap = {};
        vaccinationData.forEach((entry) => {
            if (entry.iso_code && entry.data) {
                const latest = entry.data.slice(-1)[0];
                vaccinationMap[entry.iso_code] = latest.people_vaccinated_per_hundred || 0;
            }
        });

        geoJson.features.forEach((feature) => {
            const isoCode = feature.properties.ISO_A3;
            feature.properties.vaccinationRate = vaccinationMap[isoCode] || 'No data';
        });

        // Tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'global-trends-choropleth-map-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', lightTheme.tooltipBackground)
            .style('border', `1px solid ${lightTheme.tooltipBorder}`)
            .style('padding', '5px')
            .style('border-radius', '5px')
            .style('box-shadow', '0px 0px 10px rgba(0,0,0,0.1)')
            .style('color', lightTheme.legendText);

        // Draw map
        svg.selectAll('path')
            .data(geoJson.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', (d) => {
                const rate = d.properties.vaccinationRate;
                return typeof rate === 'number' ? colorScale(rate) : lightTheme.countryFillNoData;
            })
            .attr('stroke', lightTheme.border)
            .attr('stroke-width', 0.5)
            .on('mouseover', (event, d) => {
                tooltip
                    .style('visibility', 'visible')
                    .html(`<strong>${d.properties.ADMIN}</strong><br>${d.properties.vaccinationRate === 'No data' ? 'No data' : d.properties.vaccinationRate.toFixed(1) + '%'}`);
            })
            .on('mousemove', (event) => {
                tooltip
                    .style('top', `${event.pageY - 40}px`)
                    .style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', () => {
                tooltip.style('visibility', 'hidden');
            });

        // Legend
        const legendWidth = 300;
        const legendHeight = 20;

        const legendSvg = svg.append('g')
            .attr('transform', `translate(${(width - legendWidth) / 2 - 90}, ${height - margin.bottom - 20})`);

        // Gradient for the legend
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'legend-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', d3.interpolateBlues(0));

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', d3.interpolateBlues(1));

        legendSvg.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#legend-gradient)');

        // Legend axis
        const legendScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, legendWidth]);

        legendSvg.append('g')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d => `${d}%`))
            .style('font-size', '12px')
            .style('color', lightTheme.legendText);

        // Legend labels
        legendSvg.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .style('fill', lightTheme.legendText)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text('Low Vaccination');

        legendSvg.append('text')
            .attr('x', legendWidth)
            .attr('y', -5)
            .attr('text-anchor', 'end')
            .style('fill', lightTheme.legendText)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text('High Vaccination');
    }

    renderChoroplethMap();
})();

