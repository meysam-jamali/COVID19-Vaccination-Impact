(() => {
    const vaccinationDataFile = './data/Section 3/Vaccinations_global.csv';
    const hospitalizationDataFile = './data/Section 3/Hospitalization.csv';

    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
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
            console.error(`Error fetching data: ${error}`);
            return [];
        }
    }

    async function renderGroupedBarChart() {
        const vaccinationData = await fetchData(vaccinationDataFile);
        const hospitalizationData = await fetchData(hospitalizationDataFile);

        if (!vaccinationData.length || !hospitalizationData.length) {
            console.error('Failed to load datasets.');
            return;
        }

        const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'Japan', 'China', 'India', 'Canada', 'Australia', 'Italy'];
        const years = ['2020', '2021', '2022', '2023'];

        const combinedData = countries
            .map(country => {
                const vaccinationEntries = vaccinationData.filter(entry => entry['country'] === country);
                const hospitalizationEntries = hospitalizationData.filter(entry => entry['country'] === country);

                if (!vaccinationEntries.length || !hospitalizationEntries.length) return null;

                const trends = years.map(year => {
                    const yearlyVaccination = vaccinationEntries
                        .filter(entry => entry['date'].startsWith(year))
                        .reduce((sum, entry) => sum + parseFloat(entry['total_vaccinations_per_hundred'] || 0), 0) /
                        (vaccinationEntries.filter(entry => entry['date'].startsWith(year)).length || 1);

                    const yearlyHospitalization = hospitalizationEntries
                        .filter(entry => entry['date'].startsWith(year))
                        .reduce((sum, entry) => sum + parseFloat(entry['daily_occupancy_hosp_per_1m'] || 0), 0) /
                        (hospitalizationEntries.filter(entry => entry['date'].startsWith(year)).length || 1);

                    return { avgVaccinationRate: yearlyVaccination, avgHospitalizationRate: yearlyHospitalization };
                });

                return { country, trends };
            })
            .filter(entry => entry !== null);

        const width = 800;
        const height = 400;
        const margin = { top: 150, right: 50, bottom: 150, left: 80 };

        const svg = d3.select('#vaccination-hospitalization-chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom + 100)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const vaccinationColor = '#64B5F6'; // Material Blue
        const hospitalizationColor = '#FF8A65'; // Material Orange

        const x0Scale = d3.scaleBand()
            .domain(combinedData.map(entry => entry.country))
            .range([0, width])
            .padding(0.2);

        const x1Scale = d3.scaleBand()
            .domain(years)
            .range([0, x0Scale.bandwidth()])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(combinedData.flatMap(entry => entry.trends.flatMap(trend => [trend.avgVaccinationRate, trend.avgHospitalizationRate])))]).nice()
            .range([height, 0]);

        // X-axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x0Scale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '12px')
            .style('fill', '#757575');

        // X-axis label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 55) // Position below X-axis
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .style('fill', '#424242')
            .text('Countries');

        // Y-axis
        svg.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '12px')
            .style('fill', '#757575');

        // Y-axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -50) // Position left of Y-axis
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .style('fill', '#424242')
            .text('Rates (Vaccination vs. Hospitalization)');

        // Tooltip
        const tooltip = d3.select('body')
            .append('div')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', '#FAFAFA')
            .style('border', '1px solid #E0E0E0')
            .style('padding', '10px')
            .style('border-radius', '8px')
            .style('font-size', '12px')
            .style('box-shadow', '0px 2px 6px rgba(0,0,0,0.1)');

        // Render bars
        const barGroups = svg.selectAll('.bar-group')
            .data(combinedData)
            .enter()
            .append('g')
            .attr('transform', d => `translate(${x0Scale(d.country)},0)`);

        const yearVisibility = years.reduce((acc, year) => {
            acc[year] = true; // Initially, all years are visible
            return acc;
        }, {});

        years.forEach((year, yearIndex) => {
            // Vaccination bars
            barGroups.selectAll(`.bar-${year}`)
                .data(d => [d.trends[yearIndex]])
                .enter()
                .append('rect')
                .attr('class', `bar bar-${year}`)
                .attr('x', () => x1Scale(year))
                .attr('y', d => yScale(d.avgVaccinationRate))
                .attr('width', x1Scale.bandwidth() / 2)
                .attr('height', d => height - yScale(d.avgVaccinationRate))
                .attr('fill', vaccinationColor)
                .style('display', yearVisibility[year] ? 'block' : 'none')
                .on('mouseover', (event, d) => {
                    tooltip.style('visibility', 'visible')
                        .html(`<strong>Year:</strong> <span>${year}</span><br><strong>Vaccination Rate:</strong> <span>${d.avgVaccinationRate.toFixed(2)}%</span>`);
                })
                .on('mousemove', event => {
                    tooltip.style('top', `${event.pageY - 40}px`).style('left', `${event.pageX + 10}px`);
                })
                .on('mouseout', () => tooltip.style('visibility', 'hidden'));

            // Hospitalization bars
            barGroups.selectAll(`.bar-${year}-hospitalization`)
                .data(d => [d.trends[yearIndex]])
                .enter()
                .append('rect')
                .attr('class', `bar bar-${year}-hospitalization`)
                .attr('x', () => x1Scale(year) + x1Scale.bandwidth() / 2)
                .attr('y', d => yScale(d.avgHospitalizationRate))
                .attr('width', x1Scale.bandwidth() / 2)
                .attr('height', d => height - yScale(d.avgHospitalizationRate))
                .attr('fill', hospitalizationColor)
                .style('display', yearVisibility[year] ? 'block' : 'none')
                .on('mouseover', (event, d) => {
                    tooltip.style('visibility', 'visible')
                        .html(`<strong>Year:</strong> <span>${year}</span><br><strong>Hospitalization Rate:</strong> <span>${d.avgHospitalizationRate.toFixed(2)}%</span>`);
                })
                .on('mousemove', event => {
                    tooltip.style('top', `${event.pageY - 40}px`).style('left', `${event.pageX + 10}px`);
                })
                .on('mouseout', () => tooltip.style('visibility', 'hidden'));
        });

        // Append toggleContainer after the SVG
        const toggleContainer = d3.select('#vaccination-hospitalization-chart')
        .append('div')
        .attr('class', 'toggle-container')
        .style('display', 'flex')
        .style('justify-content', 'center') // Center the buttons horizontally
        .style('gap', '10px')
        .style('margin-top', '20px') // Add some spacing above the buttons
        .style('margin-bottom', '10px'); // Add some spacing below the buttons

        // Add buttons for each year
        years.forEach(year => {
        const button = toggleContainer.append('button')
            .text(year)
            .style('padding', '8px 12px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '4px')
            .style('cursor', 'pointer')
            .style('font-size', '12px')
            .style('background-color', '#4CAF50') // Enabled state color
            .style('color', '#FFF')
            .on('click', () => {
                yearVisibility[year] = !yearVisibility[year]; // Toggle visibility
                d3.selectAll(`.bar-${year}, .bar-${year}-hospitalization`)
                    .style('display', yearVisibility[year] ? 'block' : 'none');
                button
                    .style('background-color', yearVisibility[year] ? '#4CAF50' : '#F5F5F5') // Toggle color
                    .style('color', yearVisibility[year] ? '#FFF' : '#000'); // Toggle text color
            });
        }); 
    }

    renderGroupedBarChart();
})();
