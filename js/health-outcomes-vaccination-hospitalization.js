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
 * @param {Array} vaccinationData - Vaccination dataset.
 * @param {Array} hospitalizationData - Hospitalization dataset.
 * @param {Array} countries - List of countries to include in the analysis.
 * @returns {Array} Combined data for visualization.
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
 * Prepares chart data for paired grouped bar chart.
 * @param {Array} combinedData - Combined data for visualization.
 * @returns {Object} Chart-ready data.
 */
function preparePairedChartData(combinedData) {
    const labels = combinedData.map(entry => entry.country);
    const vaccinationColor = 'rgba(75, 192, 192, 0.6)';
    const hospitalizationColor = 'rgba(255, 99, 132, 0.6)';
    const datasets = [];

    const years = ['2020', '2021', '2022', '2023'];

    years.forEach((year, yearIndex) => {
        datasets.push({
            label: `Vaccination (${year})`,
            data: combinedData.map(entry => entry.trends[yearIndex].avgVaccinationRate),
            backgroundColor: vaccinationColor,
        });
        datasets.push({
            label: `Hospitalization (${year})`,
            data: combinedData.map(entry => entry.trends[yearIndex].avgHospitalizationRate),
            backgroundColor: hospitalizationColor,
        });
    });

    return { labels, datasets };
}

/**
 * Renders a paired grouped bar chart for trends.
 * @param {string} canvasId - ID of the canvas element.
 * @param {string} title - Title for the Y-axis.
 * @param {Object} chartData - Chart-ready data.
 */
function renderPairedGroupedBarChart(canvasId, title, chartData) {
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
                        label: context => `${context.dataset.label}: ${context.raw.toFixed(2)}`,
                    },
                },
            },
            scales: {
                x: { title: { display: true, text: 'Countries' } },
                y: { title: { display: true, text: title }, beginAtZero: true },
            },
        },
    });
}

/**
 * Initializes the vaccination-hospitalization trends chart with paired grouping.
 */
async function initVaccinationHospitalizationTrendsChart() {
    console.log('Fetching Vaccination Dataset:', vaccinationDataFile);
    console.log('Fetching Hospitalization Dataset:', hospitalizationDataFile);

    const vaccinationData = await fetchCsvData(vaccinationDataFile);
    const hospitalizationData = await fetchCsvData(hospitalizationDataFile);

    if (!vaccinationData.length || !hospitalizationData.length) {
        console.error('Failed to load datasets for hospitalization chart.');
        return;
    }

    console.log('Vaccination Data:', vaccinationData);
    console.log('Hospitalization Data:', hospitalizationData);

    const importantCountries = ['United States', 'United Kingdom', 'Germany', 'France', 'Japan', 'China', 'India', 'Canada', 'Australia', 'Italy'];

    const combinedDataForHospitalization = combineVaccinationAndHospitalizationTrends(vaccinationData, hospitalizationData, importantCountries);
    console.log('Combined Data for Hospitalization:', combinedDataForHospitalization);

    const chartData = preparePairedChartData(combinedDataForHospitalization);

    renderPairedGroupedBarChart('vaccination-hospitalization-chart', 'Rates (Vaccination vs. Hospitalization)', chartData);
}

// Run analysis on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Visualization script loaded!');
    initVaccinationHospitalizationTrendsChart();
});
