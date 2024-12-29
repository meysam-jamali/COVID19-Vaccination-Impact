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
        const data = rows.slice(1).map(row =>
            headers.reduce((acc, header, index) => {
                acc[header.trim()] = row[index]?.trim() || null;
                return acc;
            }, {})
        );
        return data;
    } catch (error) {
        console.error(`Error fetching CSV data from ${url}: ${error}`);
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
        .filter(entry => entry.date && !isNaN(new Date(entry.date))) // Ensure valid dates
        .map(entry => ({
            ageGroup: entry.age_group,
            date: new Date(entry.date),
            vaccinationRate: parseFloat(entry.people_vaccinated_per_hundred) || 0,
        }));

    const relevantAgeGroups = ['18-29', '30-39', '40-49', '50-59'];
    const filteredData = parsedData.filter(d => relevantAgeGroups.includes(d.ageGroup));

    // Create a nested structure with rows as age groups and columns as dates
    const groupedData = d3.groups(filteredData, d => d.ageGroup);
    return groupedData.map(([ageGroup, values]) => ({
        ageGroup,
        data: values.map(d => ({
            date: d.date.toISOString().split('T')[0],
            vaccinationRate: d.vaccinationRate,
        })),
    }));
}

/**
 * Render a heatmap using D3.js for selected age groups and time periods.
 * @param {string} containerId - ID of the container for the SVG.
 * @param {Array} heatmapData - Processed heatmap data for rendering.
 */
function renderHeatmap(containerId, heatmapData) {
    const container = d3.select(`#${containerId}`);
    const containerWidth = container.node().clientWidth; // Get container's width
    const containerHeight = 500; // Set container height explicitly

    const margin = { top: 40, right: 20, bottom: 80, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    container.selectAll('*').remove(); // Clear previous content
    const svg = container.append('svg')
        .attr('width', containerWidth) // Match container width
        .attr('height', containerHeight); // Match container height

    // Flatten data into a matrix format
    const allDates = [...new Set(heatmapData.flatMap(group => group.data.map(d => d.date)))];
    allDates.sort((a, b) => new Date(a) - new Date(b));
    const ageGroups = heatmapData.map(group => group.ageGroup);

    const matrixData = [];
    heatmapData.forEach(group => {
        group.data.forEach(entry => {
            matrixData.push({
                ageGroup: group.ageGroup,
                date: entry.date,
                vaccinationRate: entry.vaccinationRate,
            });
        });
    });

    // Scales
    const xScale = d3.scaleBand()
        .domain(allDates)
        .range([margin.left, width + margin.left])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(ageGroups)
        .range([margin.top, height + margin.top])
        .padding(0.05);

    const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateBlues)
        .domain([0, d3.max(matrixData, d => d.vaccinationRate)]);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickValues(
        allDates.filter((_, i, arr) => i % Math.ceil(arr.length / 10) === 0)
    );
    const yAxis = d3.axisLeft(yScale);

    svg.append('g')
        .attr('transform', `translate(0,${height + margin.top})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(yAxis);

    // Heatmap cells
    svg.selectAll('rect')
        .data(matrixData)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.date))
        .attr('y', d => yScale(d.ageGroup))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.vaccinationRate))
        .append('title') // Add tooltips
        .text(d => `Date: ${d.date}\nAge Group: ${d.ageGroup}\nRate: ${d.vaccinationRate.toFixed(2)}%`);

    // Add legend
    const legendWidth = Math.min(containerWidth * 0.4, 300);
    const legendHeight = 20;
    const legendSvg = svg.append('g')
        .attr('transform', `translate(${(containerWidth - legendWidth) / 2}, ${margin.top - 40})`);

    const legendScale = d3.scaleLinear()
        .domain([0, d3.max(matrixData, d => d.vaccinationRate)])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5);

    const legendGradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');

    legendGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.interpolateBlues(0));

    legendGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d3.interpolateBlues(1));

    legendSvg.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)');

    legendSvg.append('g')
        .attr('transform', `translate(0,${legendHeight})`)
        .call(legendAxis);
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
    console.log('Heatmap Data for Rendering:', heatmapData);

    renderHeatmap('age-group-chart', heatmapData);
}

// Run the visualization on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Heatmap Visualization Script Loaded!');
    initHeatmapVisualization();
});
