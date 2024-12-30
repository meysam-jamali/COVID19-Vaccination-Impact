(() => {
    const efficacyDataUrl = 'https://example.com/efficacy-data.json'; // Replace with actual URL

    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function createBubblePlot(data) {
        const width = 600;
        const height = 400;
        const margin = { top: 50, right: 50, bottom: 50, left: 80 };

        const svg = d3.select('#bubble-plot')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.variant))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.efficacy)])
            .range([height, 0]);

        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.sampleSize)])
            .range([5, 30]);

        svg.selectAll('.bubble')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.variant) + xScale.bandwidth() / 2)
            .attr('cy', d => yScale(d.efficacy))
            .attr('r', d => radiusScale(d.sampleSize))
            .attr('fill', 'rgba(75, 192, 192, 0.6)')
            .attr('stroke', 'black');

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append('g')
            .call(d3.axisLeft(yScale));

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .text('Variants');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left + 20)
            .attr('text-anchor', 'middle')
            .text('Efficacy (%)');
    }

    function createScatterPlot(data) {
        const width = 600;
        const height = 400;
        const margin = { top: 50, right: 50, bottom: 50, left: 80 };

        const svg = d3.select('#scatter-plot')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.date)))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.infectionRate)])
            .range([height, 0]);

        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(new Date(d.date)))
            .attr('cy', d => yScale(d.infectionRate))
            .attr('r', 5)
            .attr('fill', 'rgba(255, 99, 132, 0.6)')
            .attr('stroke', 'black');

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %Y')));

        svg.append('g')
            .call(d3.axisLeft(yScale));

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .text('Date');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left + 20)
            .attr('text-anchor', 'middle')
            .text('Infection Rate');
    }

    async function renderVisualizations() {
        const data = await fetchData(efficacyDataUrl);

        if (!data) {
            console.error('Failed to load efficacy data.');
            return;
        }

        const bubbleData = data.filter(d => d.type === 'bubble');
        const scatterData = data.filter(d => d.type === 'scatter');

        createBubblePlot(bubbleData);
        createScatterPlot(scatterData);
    }

    renderVisualizations();
})();
