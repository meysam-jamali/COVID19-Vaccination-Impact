// URLs for GeoJSON and vaccination data
const geoJsonUrl = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
const vaccinationDataUrl = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.json';

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

async function renderChoroplethMap() {
    const geoJson = await fetchData(geoJsonUrl);
    const vaccinationData = await fetchData(vaccinationDataUrl);

    if (!geoJson || !vaccinationData) {
        console.error('Failed to load necessary data for the choropleth map.');
        return;
    }

    console.log('GeoJSON Data:', geoJson); // Debugging output
    console.log('Vaccination Data:', vaccinationData); // Debugging output

    const width = 600;
    const height = 400;

    const svg = d3.select('#choropleth-map')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const projection = d3.geoMercator()
        .scale(100)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, 100]);

    // Map vaccination data by country ISO code
    const vaccinationMap = {};
    vaccinationData.forEach((entry) => {
        if (entry.iso_code && entry.data) {
            const latest = entry.data.slice(-1)[0]; // Get the latest entry
            vaccinationMap[entry.iso_code] = latest.people_vaccinated_per_hundred || 0;
        }
    });

    console.log('Vaccination Map:', vaccinationMap); // Debugging output

    // Merge GeoJSON with vaccination data
    geoJson.features.forEach((feature) => {
        const isoCode = feature.properties.ISO_A3;
        feature.properties.vaccinationRate = vaccinationMap[isoCode] || 'No data';
    });

    // Draw the map
    svg.selectAll('path')
        .data(geoJson.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', (d) => {
            const rate = d.properties.vaccinationRate;
            return typeof rate === 'number' ? colorScale(rate) : '#ccc'; // Gray for "No data"
        })
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5)
        .append('title') // Tooltip with vaccination rate
        .text((d) => `${d.properties.ADMIN}: ${d.properties.vaccinationRate}`);
}

// Updated Region Map with ISO Alpha-3 codes (Oceania removed)
const regionMap = {
    Africa: ['DZA', 'EGY', 'NGA', 'ZAF', /* Add more African country ISO Alpha-3 codes */],
    Asia: ['CHN', 'IND', 'JPN', /* Add more Asian country ISO Alpha-3 codes */],
    Europe: ['FRA', 'DEU', 'ITA', /* Add more European country ISO Alpha-3 codes */],
    'North America': ['USA', 'CAN', 'MEX', /* Add more North American ISO Alpha-3 codes */],
    'South America': ['BRA', 'ARG', 'CHL', /* Add more South American ISO Alpha-3 codes */],
};

// Render Bar Chart with Updated ISO Mapping (Oceania removed)
async function renderBarChart() {
    const vaccinationData = await fetchData(vaccinationDataUrl);

    if (!vaccinationData) {
        console.error('Failed to load vaccination data for the bar chart.');
        return;
    }

    console.log('Vaccination Data:', vaccinationData); // Debugging output

    // Initialize vaccination data by region
    const regionalData = Object.keys(regionMap).map((region) => {
        const countries = regionMap[region];
        const regionData = countries.map((isoCode) => {
            const countryData = vaccinationData.find((d) => d.iso_code === isoCode);
            if (!countryData) {
                console.warn(`No data found for ISO code: ${isoCode}`);
                return 0;
            }
            return countryData.data.slice(-1)[0]?.people_vaccinated_per_hundred || 0;
        });
        const averageVaccination = regionData.reduce((sum, value) => sum + value, 0) / regionData.length;
        console.log(`Region: ${region}, Vaccination Data:`, regionData); // Debugging output
        return averageVaccination;
    });

    console.log('Regional Data:', regionalData); // Debugging output

    // Bar Chart Data
    const barChartData = {
        labels: Object.keys(regionMap), // No Oceania in labels
        datasets: [
            {
                label: 'Vaccination Coverage (%)',
                data: regionalData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Render Bar Chart
    const ctx = document.getElementById('bar-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: barChartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            },
        },
    });
}

// Initialize Section
async function initGlobalTrends() {
    try {
        await renderChoroplethMap();
        await renderBarChart();
    } catch (error) {
        console.error('Error initializing Global Trends section:', error);
    }
}

// Run
initGlobalTrends();

