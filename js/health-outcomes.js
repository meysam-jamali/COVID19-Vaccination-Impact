const cdcDataUrl = 'https://data.cdc.gov/resource/km4m-vcsb.json'; // CDC API URL

/**
 * Fetch data from the CDC dataset.
 * @returns {Promise<Array>} Parsed JSON data.
 */
async function fetchCdcData() {
    try {
        const response = await fetch(cdcDataUrl);
        if (!response.ok) {
            throw new Error(`HTTP Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched CDC Data:', data);

        // Log available locations for debugging
        console.log('Available Locations:', [...new Set(data.map(d => d.location))]);

        return data;
    } catch (error) {
        console.error('Error fetching CDC data:', error);
        return null;
    }
}

/**
 * Prepares chart data for the given metric.
 * @param {Array} data - Fetched CDC dataset.
 * @param {string} metric - Metric key (e.g., 'death_rate', 'hospitalization_rate').
 * @returns {Object} Prepared chart data (labels, vaccinatedRates, unvaccinatedRates).
 */
function prepareChartData(data, metric) {
    // Use locations found in the dataset
    const locations = ['CA', 'FL', 'NY', 'TX', 'WA']; // Example abbreviations from the dataset
    const labels = [];
    const vaccinatedRates = [];
    const unvaccinatedRates = [];

    locations.forEach((location) => {
        const locationData = data.find((d) => d.location === location);
        if (locationData) {
            const vaccinated = parseFloat(locationData[`vax_${metric}`]) || 0;
            const unvaccinated = parseFloat(locationData[`unvax_${metric}`]) || 0;
            labels.push(location); // Use location abbreviations
            vaccinatedRates.push(vaccinated);
            unvaccinatedRates.push(unvaccinated);
        } else {
            console.warn(`No data found for location: ${location}`);
            labels.push(location);
            vaccinatedRates.push(0);
            unvaccinatedRates.push(0);
        }
    });

    console.log(`Prepared Chart Data (${metric}):`, { labels, vaccinatedRates, unvaccinatedRates });
    return { labels, vaccinatedRates, unvaccinatedRates };
}

/**
 * Renders a bar chart.
 * @param {string} canvasId - Canvas ID for the chart.
 * @param {string} title - Title for the Y-axis.
 * @param {Array} labels - Labels for the X-axis.
 * @param {Array} vaccinatedRates - Vaccinated rates dataset.
 * @param {Array} unvaccinatedRates - Unvaccinated rates dataset.
 */
function renderBarChart(canvasId, title, labels, vaccinatedRates, unvaccinatedRates) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID '${canvasId}' not found.`);
        return;
    }
    const ctx = canvas.getContext('2d');

    if (window[canvasId] instanceof Chart) {
        window[canvasId].destroy();
        console.log(`Destroyed previous chart instance for ${canvasId}`);
    }

    window[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Vaccinated',
                    data: vaccinatedRates,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Unvaccinated',
                    data: unvaccinatedRates,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        },
                    },
                },
            },
            scales: {
                x: { title: { display: true, text: 'Locations' } },
                y: { title: { display: true, text: title }, beginAtZero: true },
            },
        },
    });
    console.log(`Rendered bar chart for ${canvasId}.`);
}

/**
 * Initializes the charts for Death and Hospitalization Rates.
 */
async function initCharts() {
    const data = await fetchCdcData();
    if (!data) {
        console.error('Failed to fetch CDC data.');
        return;
    }

    // Prepare Death Rates Chart Data
    const deathChartData = prepareChartData(data, 'death_rate');
    renderBarChart(
        'death-chart',
        'Death Rate (per 100,000)',
        deathChartData.labels,
        deathChartData.vaccinatedRates,
        deathChartData.unvaccinatedRates
    );

    // Prepare Hospitalization Rates Chart Data
    const hospitalizationChartData = prepareChartData(data, 'hospitalization_rate');
    renderBarChart(
        'hospitalization-chart',
        'Hospitalization Rate (per 100,000)',
        hospitalizationChartData.labels,
        hospitalizationChartData.vaccinatedRates,
        hospitalizationChartData.unvaccinatedRates
    );
}

// Initialize charts
initCharts();
