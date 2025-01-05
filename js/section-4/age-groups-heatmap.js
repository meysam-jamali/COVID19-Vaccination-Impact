(() => {
    const ageGroupDatasetUrl = './data/Section 4/vaccinations-age.csv';

    /**
     * Fetch and parse CSV data.
     * @param {string} url - URL or path to the CSV file.
     * @returns {Promise<Array>} Parsed data as an array of objects.
     */
    async function fetchCsvData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${url}: ${response.status}`);
            }
            const csvText = await response.text();
            const rows = csvText.trim().split('\n').map(row => row.split(','));
            const headers = rows[0];
            return rows.slice(1).map(row =>
                headers.reduce((acc, header, index) => {
                    acc[header.trim()] = row[index]?.trim() || null;
                    return acc;
                }, {})
            );
        } catch (error) {
            console.error(`Error fetching CSV data from ${url}:`, error);
            return [];
        }
    }

    /**
     * Prepare data for rendering a heatmap.
     * @param {Array} data - Parsed dataset.
     * @returns {Array} Heatmap-ready data grouped by date and age group.
     */
    function prepareHeatmapData(data) {
        const parsedData = data
            .filter(entry => entry.date && !isNaN(new Date(entry.date)))
            .map(entry => ({
                ageGroup: entry.age_group,
                date: new Date(entry.date),
                vaccinationRate: parseFloat(entry.people_vaccinated_per_hundred) || 0,
            }));

        const relevantAgeGroups = ['18-29', '30-39', '40-49', '50-59'];
        return relevantAgeGroups.map(ageGroup => ({
            ageGroup,
            data: parsedData.filter(d => d.ageGroup === ageGroup),
        }));
    }

    /**
     * Render a heatmap using D3.js for selected age groups and time periods.
     * @param {string} containerId - ID of the container for the SVG.
     * @param {Array} heatmapData - Processed heatmap data for rendering.
     */
    function renderHeatmap(containerId, heatmapData) {
        const container = d3.select(`#${containerId}`);
        const containerWidth = container.node().clientWidth;
        const containerHeight = 500;

        const margin = { top: 80, right: 30, bottom: 100, left: 120 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        // Clear the container before rendering
        container.selectAll('*').remove();

        // Append a new SVG element
        const svg = container.append('svg')
            .attr('width', containerWidth)
            .attr('height', containerHeight)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const allDates = [...new Set(heatmapData.flatMap(group => group.data.map(d => d.date.toISOString().split('T')[0])))];
        allDates.sort((a, b) => new Date(a) - new Date(b));
        const ageGroups = heatmapData.map(group => group.ageGroup);

        const xScale = d3.scaleBand().domain(allDates).range([0, width]).padding(0.05);
        const yScale = d3.scaleBand().domain(ageGroups).range([0, height]).padding(0.05);

        const colorScale = d3.scaleSequential().interpolator(d3.interpolateViridis).domain([0, 100]);

        // X-axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickValues(
                allDates.filter((_, i, arr) => i % Math.ceil(arr.length / 10) === 0)
            ))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Y-axis
        svg.append('g').call(d3.axisLeft(yScale));

        // Add axis labels
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Date');

        svg.append('text')
            .attr('x', -height / 2)
            .attr('y', -margin.left + 60)
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Age Group');

        // Tooltip
        const tooltip = d3.select('body')
            .append('div')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', 'rgba(0, 0, 0, 0.7)')
            .style('color', '#fff')
            .style('border-radius', '8px')
            .style('padding', '10px')
            .style('font-size', '12px')
            .style('box-shadow', '0px 4px 6px rgba(0, 0, 0, 0.1)');

        // Heatmap cells
        svg.selectAll('rect')
            .data(heatmapData.flatMap(group => group.data.map(d => ({
                ageGroup: group.ageGroup,
                date: d.date.toISOString().split('T')[0],
                vaccinationRate: d.vaccinationRate,
            }))))
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.date))
            .attr('y', d => yScale(d.ageGroup))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.vaccinationRate))
            .on('mouseover', (event, d) => {
                tooltip.style('visibility', 'visible')
                    .html(`<strong>Date:</strong> ${d.date}<br><strong>Age Group:</strong> ${d.ageGroup}<br><strong>Rate:</strong> ${d.vaccinationRate.toFixed(2)}%`);
            })
            .on('mousemove', event => {
                tooltip.style('top', `${event.pageY - 40}px`).style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', () => {
                tooltip.style('visibility', 'hidden');
            });

        // Add legend
        const legendWidth = 300;
        const legendHeight = 20;
        
        // Position
        const legendSvg = svg.append('g')
            .attr('transform', `translate(${(width - legendWidth) / 2 - 40}, ${-margin.top / 2})`);

        const gradientId = `legend-gradient-${containerId}`;
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', gradientId)
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '0%');

        gradient.append('stop').attr('offset', '0%').attr('stop-color', d3.interpolateViridis(0));
        gradient.append('stop').attr('offset', '100%').attr('stop-color', d3.interpolateViridis(1));

        legendSvg.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', `url(#${gradientId})`);

        legendSvg.append('g')
            .attr('transform', `translate(0,${legendHeight})`)
            .call(d3.axisBottom(d3.scaleLinear().domain([0, 100]).range([0, legendWidth])).ticks(5).tickFormat(d => `${d}%`));

        // Legend labels
        legendSvg.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .text('Low (0%)')
            .style('font-size', '12px')
            .style('font-weight', 'bold');

        legendSvg.append('text')
            .attr('x', legendWidth)
            .attr('y', -5)
            .attr('text-anchor', 'end')
            .text('High (100%)')
            .style('font-size', '12px')
            .style('font-weight', 'bold');
    }

    /**
     * Initialize visualization with a heatmap for selected age groups.
     */
    async function initHeatmapVisualization() {
        const ageGroupData = await fetchCsvData(ageGroupDatasetUrl);

        if (!ageGroupData.length) {
            console.error('No data available for visualization.');
            return;
        }

        const heatmapData = prepareHeatmapData(ageGroupData);
        renderHeatmap('age-group-chart', heatmapData);
    }

    initHeatmapVisualization();
})();
