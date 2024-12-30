// Paths to dataset files
const vaccinationDataFile = './data/Section 3/Vaccinations_global.csv';
const hospitalizationDataFile = './data/Section 3/Hospitalization.csv';

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
 * Combines vaccination and hospitalization data for trends analysis.
 */
function combineVaccinationAndHospitalizationTrends(vaccinationData, hospitalizationData, countries) {
    return countries.map(country => {
        const vaccinationEntries = vaccinationData.filter(entry => entry['country'] === country);
        const hospitalizationEntries = hospitalizationData.filter(entry => entry['country'] === country);

        if (!vaccinationEntries.length || !hospitalizationEntries.length) {
            console.warn(`No matching data found for ${country}`);
            return null;
        }

        const years = ['2020', '2021', '2022', '2023'];
        const trends = years.map(year => {
            const yearlyVaccination = vaccinationEntries
                .filter(entry => entry['date'].startsWith(year))
                .reduce((sum, entry) => sum + parseFloat(entry['total_vaccinations_per_hundred'] || 0), 0);

            const yearlyHospitalization = hospitalizationEntries
                .filter(entry => entry['date'].startsWith(year))
                .reduce((sum, entry) => sum + parseFloat(entry['daily_occupancy_hosp_per_1m'] || 0), 0);

            const vaccinationCount = vaccinationEntries.filter(entry => entry['date'].startsWith(year)).length || 1;
            const hospitalizationCount = hospitalizationEntries.filter(entry => entry['date'].startsWith(year)).length || 1;

            return {
                avgVaccinationRate: vaccinationCount > 0 ? yearlyVaccination / vaccinationCount : 0,
                avgHospitalizationRate: yearlyHospitalization / hospitalizationCount,
            };
        });

        return {
            country,
            trends,
        };
    }).filter(entry => entry !== null);
}

/**
 * Renders a grouped paired bar chart for vaccination and hospitalization trends using D3.js.
 */
function renderGroupedPairedBarChart(containerId, title, combinedData) {
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove(); // Clear previous chart

    const margin = { top: 100, right: 30, bottom: 150, left: 70 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = container
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const years = ['2020', '2021', '2022', '2023'];
    const vaccinationColor = '#4CAF50'; // Green for vaccination
    const hospitalizationColor = '#FF5722'; // Orange for hospitalization

    // Flatten data for D3
    const data = [];
    combinedData.forEach(entry => {
        entry.trends.forEach((trend, index) => {
            data.push({
                country: entry.country,
                year: years[index],
                vaccinationRate: trend.avgVaccinationRate,
                hospitalizationRate: trend.avgHospitalizationRate,
            });
        });
    });

    const countries = combinedData.map(entry => entry.country);

    // Scales
    const x0Scale = d3.scaleBand()
        .domain(countries)
        .range([0, width])
        .padding(0.2);

    const x1Scale = d3.scaleBand()
        .domain(years)
        .range([0, x0Scale.bandwidth()])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d.vaccinationRate, d.hospitalizationRate))])
        .range([height, 0]);

    // Axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x0Scale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    svg.append('g').call(d3.axisLeft(yScale));

    // Chart title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -60)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
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
    const barGroups = svg.selectAll('.bar-group')
        .data(combinedData)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${x0Scale(d.country)},0)`);

    years.forEach((year, yearIndex) => {
        barGroups
            .selectAll(`.bar-${year}`)
            .data(d => [d.trends[yearIndex]])
            .enter()
            .append('rect')
            .attr('class', `bar bar-${year}`)
            .attr('x', (d, i) => x1Scale(year))
            .attr('y', d => yScale(d.avgVaccinationRate))
            .attr('width', x1Scale.bandwidth() / 2)
            .attr('height', d => height - yScale(d.avgVaccinationRate))
            .attr('fill', vaccinationColor)
            .on('mouseover', (event, d) => {
                tooltip
                    .style('visibility', 'visible')
                    .text(`${year} Vaccination: ${d.avgVaccinationRate.toFixed(2)}`);
            })
            .on('mousemove', event => {
                tooltip
                    .style('top', `${event.pageY - 20}px`)
                    .style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', () => {
                tooltip.style('visibility', 'hidden');
            });

        barGroups
            .selectAll(`.bar-${year}-hospitalization`)
            .data(d => [d.trends[yearIndex]])
            .enter()
            .append('rect')
            .attr('class', `bar bar-${year}-hospitalization`)
            .attr('x', (d, i) => x1Scale(year) + x1Scale.bandwidth() / 2)
            .attr('y', d => yScale(d.avgHospitalizationRate))
            .attr('width', x1Scale.bandwidth() / 2)
            .attr('height', d => height - yScale(d.avgHospitalizationRate))
            .attr('fill', hospitalizationColor)
            .on('mouseover', (event, d) => {
                tooltip
                    .style('visibility', 'visible')
                    .text(`${year} Hospitalization: ${d.avgHospitalizationRate.toFixed(2)}`);
            })
            .on('mousemove', event => {
                tooltip
                    .style('top', `${event.pageY - 20}px`)
                    .style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', () => {
                tooltip.style('visibility', 'hidden');
            });
    });

    // Add color guidance (vaccination and hospitalization) at the top
    const guidance = svg.append('g')
        .attr('transform', `translate(0, ${-40})`);

    const guidanceData = [
        { label: 'Vaccination', color: vaccinationColor },
        { label: 'Hospitalization', color: hospitalizationColor },
    ];

    guidanceData.forEach((item, i) => {
        const guidanceGroup = guidance.append('g')
            .attr('transform', `translate(${i * 150}, 0)`);

        guidanceGroup.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', item.color);

        guidanceGroup.append('text')
            .attr('x', 25)
            .attr('y', 14)
            .text(item.label)
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');
    });

    // Add year toggle buttons at the bottom
    const legend = svg.append('g')
    .attr('transform', `translate(0, ${height + 70})`); // Added margin by increasing the translate Y position

    years.forEach((year, i) => {
    const legendGroup = legend.append('g')
        .attr('transform', `translate(${i * 120}, 0)`)
        .style('cursor', 'pointer')
        .on('click', () => {
            // Toggle bars for the clicked year
            const bars = svg.selectAll(`.bar-${year}, .bar-${year}-hospitalization`);
            const isHidden = bars.style('opacity') === '0';
            bars.transition().duration(300).style('opacity', isHidden ? 1 : 0);
        });

    legendGroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', '#ccc');

    legendGroup.append('text')
        .attr('x', 25)
        .attr('y', 14)
        .text(year)
        .style('font-size', '12px')
        .attr('alignment-baseline', 'middle');
    });

}

/**
 * Initializes the vaccination-hospitalization trends chart with paired grouping.
 */
async function initVaccinationHospitalizationTrendsChart() {
    const vaccinationData = await fetchCsvData(vaccinationDataFile);
    const hospitalizationData = await fetchCsvData(hospitalizationDataFile);

    if (!vaccinationData.length || !hospitalizationData.length) {
        console.error('Failed to load datasets for hospitalization chart.');
        return;
    }

    const importantCountries = ['United States', 'United Kingdom', 'Germany', 'France', 'Japan', 'China', 'India', 'Canada', 'Australia', 'Italy'];

    const combinedDataForHospitalization = combineVaccinationAndHospitalizationTrends(vaccinationData, hospitalizationData, importantCountries);

    renderGroupedPairedBarChart('vaccination-hospitalization-chart', 'Rates (Vaccination vs. Hospitalization)', combinedDataForHospitalization);
}

// Run analysis on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initVaccinationHospitalizationTrendsChart();
});
