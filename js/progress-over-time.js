const vaccinationDataUrlProgress = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.json';

// Function to fetch data
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

// Render Line Chart: Cumulative Vaccinations Over Time
async function renderLineChart() {
    const vaccinationData = await fetchData(vaccinationDataUrlProgress);

    if (!vaccinationData) {
        console.error('Failed to load vaccination data for the line chart.');
        return;
    }

    const globalData = vaccinationData.find((entry) => entry.iso_code === 'OWID_WRL');
    if (!globalData || !globalData.data) {
        console.error('No global data found in vaccination dataset.');
        return;
    }

    const dates = globalData.data.map((d) => d.date);
    const cumulativeVaccinations = globalData.data.map((d) => d.total_vaccinations || 0);

    const lineChartData = {
        labels: dates,
        datasets: [
            {
                label: 'Cumulative Vaccinations',
                data: cumulativeVaccinations,
                fill: false,
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1, // Thinner line
                tension: 0.4, // Smooth curve
            },
        ],
    };

    const ctx = document.getElementById('line-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: lineChartData,
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
            },
            scales: {
                x: { title: { display: true, text: 'Date' } },
                y: { title: { display: true, text: 'Cumulative Vaccinations' } },
            },
        },
    });
}

// Render Stacked Area Chart: Vaccination Categories Over Time
async function renderStackedAreaChart() {
    const vaccinationData = await fetchData(vaccinationDataUrlProgress);

    if (!vaccinationData) {
        console.error('Failed to load vaccination data for the stacked area chart.');
        return;
    }

    const globalData = vaccinationData.find((entry) => entry.iso_code === 'OWID_WRL');
    if (!globalData || !globalData.data) {
        console.error('No global data found in vaccination dataset.');
        return;
    }

    const dates = globalData.data.map((d) => d.date);
    const fullyVaccinated = globalData.data.map((d) => d.people_fully_vaccinated || 0);
    const partiallyVaccinated = globalData.data.map((d) => d.people_vaccinated - (d.people_fully_vaccinated || 0));
    const boosterDoses = globalData.data.map((d) => d.total_boosters || 0);

    const stackedAreaData = {
        labels: dates,
        datasets: [
            {
                label: 'Fully Vaccinated',
                data: fullyVaccinated,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1, // Thinner line
                tension: 0.4, // Smooth curve
                fill: true,
            },
            {
                label: 'Partially Vaccinated',
                data: partiallyVaccinated,
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1, // Thinner line
                tension: 0.4, // Smooth curve
                fill: true,
            },
            {
                label: 'Booster Doses',
                data: boosterDoses,
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1, // Thinner line
                tension: 0.4, // Smooth curve
                fill: true,
            },
        ],
    };

    const ctx = document.getElementById('stacked-area-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: stackedAreaData,
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
            },
            scales: {
                x: { title: { display: true, text: 'Date' } },
                y: { 
                    stacked: true, 
                    title: { display: true, text: 'Number of Vaccinations' } 
                },
            },
        },
    });
}

// Initialize Progress Over Time Section
async function initProgressOverTime() {
    try {
        await renderLineChart();
        await renderStackedAreaChart();
    } catch (error) {
        console.error('Error initializing Progress Over Time section:', error);
    }
}

// Run
initProgressOverTime();
