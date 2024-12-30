// vaccination-death.js

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
 * Prepares chart data for vaccination and deaths.
 */
function prepareChartForDeaths(combinedData) {
    const labels = ['2020', '2021', '2022', '2023'];
    const datasets = combinedData.map(entry => ({
        label: entry.country,
        data: entry.yearlyDeaths,
        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`,
    }));

    return { labels, datasets };
}

/**
 * Renders the vaccination-death chart.
 */
function renderUniqueBarChart(canvasId, title, chartData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID '${canvasId}' not found.`);
        return;
    }

    const ctx = canvas.getContext('2d');

    if (window[canvasId] instanceof Chart) {
        window[canvasId].destroy();
    }

    window[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: ${context.raw}`,
                    },
                },
            },
            scales: {
                x: { title: { display: true, text: 'Years' } },
                y: { title: { display: true, text: 'New Deaths per Year' }, beginAtZero: true },
            },
        },
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
    const deathChartData = prepareChartForDeaths(combinedDataForDeaths);

    renderUniqueBarChart('vaccination-death-chart', 'New COVID-19 Deaths per Year', deathChartData);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeVisualization();
});
