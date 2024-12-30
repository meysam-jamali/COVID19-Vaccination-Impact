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
 * Combines vaccination and death data.
 */
function combineVaccinationAndDeathData(vaccinationData, covidData, countries) {
    const combinedData = countries.map(country => {
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
            return newDeaths > 0 ? newDeaths : 0;
        });

        return {
            country,
            vaccinationRate: parseFloat(vaccinationEntry['TOTAL_VACCINATIONS_PER100']) || 0,
            yearlyDeaths,
        };
    });

    return combinedData.filter(entry => entry !== null);
}

/**
 * Renders the vaccination-death bar chart with D3.js.
 */
function renderBarChart(containerId, title, chartData) {
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove(); // Clear previous chart

    // Adjust chart dimensions
    const margin = { top: 70, right: 30, bottom: 100, left: 70 };
    const width = 1000 - margin.left - margin.right; // Increased width for better spacing
    const height = 400 - margin.top - margin.bottom;

    const colors = d3.schemeTableau10; // D3 color scheme

    const svg = container
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // X and Y scales
    const xScale = d3.scaleBand()
        .domain(chartData.labels)
        .range([0, width])
        .padding(0.3); // Reduced padding for wider bars

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData.datasets.flatMap(dataset => dataset.data))])
        .nice()
        .range([height, 0]);

    // Add X-axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)') // Rotate to fit long labels
        .style('text-anchor', 'end')
        .style('font-size', '12px'); // Smaller font for better fit

    // Add Y-axis
    svg.append('g')
        .call(d3.axisLeft(yScale));

    // Add chart title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text(title);

    // Tooltip
    const tooltip = d3.select('body')
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', '#fff')
        .style('border', '1px solid #ccc')
        .style('padding', '5px')
        .style('border-radius', '5px')
        .style('box-shadow', '0px 0px 10px rgba(0,0,0,0.1)');

    // Add bars
    svg.selectAll('.bar')
        .data(chartData.datasets.flatMap((dataset, i) => 
            dataset.data.map((d, index) => ({
                year: chartData.labels[index],
                value: d,
                color: colors[i % colors.length],
            }))
        ))
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.year)) // Use xScale for years
        .attr('y', d => yScale(d.value))
        .attr('width', xScale.bandwidth()) // Use the full bandwidth of xScale
        .attr('height', d => height - yScale(d.value))
        .attr('fill', d => d.color)
        .on('mouseover', (event, d) => {
            tooltip
                .style('visibility', 'visible')
                .text(`${d.year}: ${d.value}`);
        })
        .on('mousemove', event => {
            tooltip
                .style('top', `${event.pageY - 20}px`)
                .style('left', `${event.pageX + 10}px`);
        })
        .on('mouseout', () => {
            tooltip.style('visibility', 'hidden');
        });

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 150}, 0)`);

    chartData.datasets.forEach((dataset, i) => {
        legend.append('rect')
            .attr('x', 0)
            .attr('y', i * 20)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', colors[i]);

        legend.append('text')
            .attr('x', 25)
            .attr('y', i * 20 + 14)
            .text(dataset.label)
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');
    });
}


/**
 * Initializes the vaccination-death chart.
 */
async function initializeVisualization() {
    const vaccinationData = await fetchCsvData(vaccinationDatasetUrl);
    const covidData = await fetchCsvData(covidDatasetUrl);

    if (!vaccinationData.length || !covidData.length) {
        console.error('Failed to load datasets.');
        return;
    }

    const importantCountries = ['United States', 'United Kingdom', 'Russia', 'China', 'India', 'Germany', 'France', 'Japan', 'Canada'];

    const combinedDataForDeaths = combineVaccinationAndDeathData(vaccinationData, covidData, importantCountries);

    const chartData = {
        labels: ['2020', '2021', '2022', '2023'],
        datasets: combinedDataForDeaths.map(entry => ({
            label: entry.country,
            data: entry.yearlyDeaths,
        })),
    };

    renderBarChart('vaccination-death-chart', 'New COVID-19 Deaths per Year', chartData);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeVisualization();
});
