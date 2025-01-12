// Paths to datasets
const vaccinationDatasetUrl = './data/Section 3/vaccination-data.csv';
const covidDatasetUrl = './data/Section 3/WHO-COVID-19-global-data.csv';

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
 * Combines vaccination and death data.
 */
function combineVaccinationAndDeathData(vaccinationData, covidData, countries) {
    return countries.map(country => {
        const vaccinationEntry = vaccinationData.find(entry => entry['COUNTRY'] === country);
        const covidEntries = covidData.filter(entry => entry['Country'] === country);

        if (!vaccinationEntry || !covidEntries.length) {
            console.warn(`No matching data found for ${country}`);
            return null;
        }

        let previousDeaths = 0;
        const yearlyDeaths = ['2020', '2021', '2022', '2023'].map(year => {
            const yearData = covidEntries.filter(entry => entry['Date_reported'].startsWith(year));
            const lastEntry = yearData.length ? parseInt(yearData[yearData.length - 1]['Cumulative_deaths'], 10) || 0 : 0;
            const newDeaths = lastEntry - previousDeaths;
            previousDeaths = lastEntry;
            return Math.max(newDeaths, 0);
        });

        return {
            country,
            vaccinationRate: parseFloat(vaccinationEntry['TOTAL_VACCINATIONS_PER100']) || 0,
            yearlyDeaths,
        };
    }).filter(entry => entry !== null);
}

/**
 * Renders the vaccination-death bar chart with D3.js.
 */
function renderBarChart(containerId, title, chartData) {
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove(); // Clear previous chart

    // Chart dimensions
    const margin = { top: 40, right: 30, bottom: 100, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 550 - margin.top - margin.bottom;

    const colors = ['#4DB6AC', '#FF8A80', '#FFB74D', '#64B5F6', '#BA68C8', '#81C784', '#F06292'];

    const svg = container
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left + 30},${margin.top})`);

    // X and Y scales
    const xScale = d3.scaleBand()
        .domain(chartData.labels)
        .range([0, width])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData.datasets.flatMap(dataset => dataset.data))])
        .nice()
        .range([height, 0]);

    // X-axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', '#757575');

    // Y-axis
    svg.append('g')
        .call(d3.axisLeft(yScale).ticks(10).tickFormat(d => `${d.toLocaleString()}`))
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', '#757575');

    // X-axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#424242')
        .text('Year');

    // Y-axis label
    svg.append('text')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 5)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#424242')
        .text('New Deaths');

    // Tooltip
    const tooltip = d3.select('body')
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', '#FFFFFF')
        .style('border', '1px solid #E0E0E0')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('font-size', '12px')
        .style('box-shadow', '0px 2px 6px rgba(0, 0, 0, 0.1)');

    // Bars
    svg.selectAll('.bar')
        .data(chartData.datasets.flatMap((dataset, i) =>
            dataset.data.map((d, index) => ({
                year: chartData.labels[index],
                value: d,
                country: dataset.label,
                color: colors[i % colors.length],
            }))
        ))
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.value))
        .attr('fill', d => d.color)
        .on('mouseover', (event, d) => {
            tooltip
                .style('visibility', 'visible')
                .html(`<strong>${d.country}</strong><br><b>Year:</b> ${d.year}<br><b>Deaths:</b> ${d.value.toLocaleString()}`);
        })
        .on('mousemove', event => {
            tooltip
                .style('top', `${event.pageY - 40}px`)
                .style('left', `${event.pageX + 10}px`);
        })
        .on('mouseout', () => {
            tooltip.style('visibility', 'hidden');
        });

    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 200}, 0)`);

    chartData.datasets.forEach((dataset, i) => {
        const legendGroup = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

        legendGroup.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', colors[i]);

        legendGroup.append('text')
            .attr('x', 25)
            .attr('y', 14)
            .text(dataset.label)
            .style('font-size', '12px')
            .style('fill', '#424242');
    });
}


/**
 * Initializes the chart.
 */
async function initializeVisualization() {
    const vaccinationData = await fetchCsvData(vaccinationDatasetUrl);
    const covidData = await fetchCsvData(covidDatasetUrl);

    if (!vaccinationData.length || !covidData.length) {
        console.error('Failed to load datasets.');
        return;
    }

    const countries = ['United States', 'United Kingdom', 'Russia', 'China', 'India', 'Germany', 'France', 'Japan', 'Canada'];

    const combinedData = combineVaccinationAndDeathData(vaccinationData, covidData, countries);

    const chartData = {
        labels: ['2020', '2021', '2022', '2023'],
        datasets: combinedData.map(entry => ({
            label: entry.country,
            data: entry.yearlyDeaths,
        })),
    };

    renderBarChart('vaccination-death-chart', 'COVID-19 Deaths vs. Vaccinations', chartData);
}

document.addEventListener('DOMContentLoaded', initializeVisualization);
