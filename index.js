const fetchMap = async () => {
    const response = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json')
    const data = await response.json()
    return data
}

const fetchEducationData = async () => {
    const response = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json')
    const data = await response.json()
    return data
}

const drawMap = (data, educationData) => {
    
    const w = 1800
    const h = 1300

    const topPadding = -100
    const bottomPadding = 50
    const leftPadding = 100
    const rightPadding = 100

    const body = d3.select('body')

    body.append('h1')
        .attr('id', 'title')
        .text('United States Educational Attainment')

    body.append('p')
        .attr('id', 'description')
        .attr('class', 'description')
        .text(`Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)`)

    const svg = body.append('svg')
        .attr('width', w)
        .attr('height', h)

    const geoJson = topojson.feature(data, data.objects.counties)

    const path = d3.geoPath()
        .projection(d3.geoIdentity()
            .fitExtent([[leftPadding, topPadding], [w - rightPadding, h - bottomPadding]], geoJson)
            )

    const colorScale = d3.scaleQuantize()
        .domain(d3.extent(educationData, d => d.bachelorsOrHigher))
        .range(d3.schemeGreens[8])

    const legendPoints = [d3.min(educationData, d => d.bachelorsOrHigher), ...colorScale.thresholds(), d3.max(educationData, d => d.bachelorsOrHigher)]

    const legendScale = d3.scalePoint()
        .domain(legendPoints)
        .range([0, 500])
        .padding(1)

    const legendAxis = d3.axisBottom(legendScale)
        
    
    const legend = svg.append('g')
        .attr('id', 'legend')
        .attr('class', 'axis')

    legend.append('g')
        .attr('id', 'legend-axis')
        .attr('transform', 'translate(1000, 100)')
        .call(legendAxis.tickFormat(d => d.toFixed(1) + '%'))

    legend.selectAll('rect')
        .data(legendPoints.filter(point => point < d3.max(educationData, d => d.bachelorsOrHigher)))
        .enter()
        .append('rect')
        .attr('x', d => legendScale(d))
        .attr('y', 50)
        .attr('width', legendScale.step())
        .attr('height', 50)
        .attr('transform', 'translate(1000, 0)')
        .attr('fill', d => colorScale(d))


    svg.append('g').selectAll('path')
        .data(geoJson.features)
        .enter()
        .append('path')
            .attr('d', path)
            .attr('class', 'county')
            .attr('data-fips', d => {
                const [county] = educationData.filter(county => county.fips === d.id)
                return county.fips
            })
            .attr('data-education', d => {
                const [county] = educationData.filter(county => county.fips === d.id)
                return county.bachelorsOrHigher
            })
            .attr('data-county-name', d => {
                const [county] = educationData.filter(county => county.fips === d.id)
                return county.area_name
            })
            .attr('data-state-name', d => {
                const [county] = educationData.filter(county => county.fips === d.id)
                return county.state
            })
            .attr('fill', d => {
                const [county] = educationData.filter(county => county.fips === d.id)
                return colorScale(county.bachelorsOrHigher)
            })
            .on('mouseover', (e) => {
                const education = e.currentTarget.getAttribute('data-education')
                const county = e.currentTarget.getAttribute('data-county-name')
                const state = e.currentTarget.getAttribute('data-state-name')
                
                body.append('div')
                    .attr('id', 'tooltip')
                    .attr('class', 'tooltip')
                    .attr('data-education', education)
                    .style('position', 'absolute')
                    .style('top', d3.pointer(e)[1] + 30 + 'px')
                    .style('left', d3.pointer(e)[0] + 'px')
                    .text(d => `${county}, ${state}: ${education}%`)
            })
            .on('mouseout', () => {
                document.getElementById('tooltip').remove()
            })
}

const renderMap = async () => {
    const countyData = await fetchMap()
    const educationData = await fetchEducationData()
    drawMap(countyData, educationData)
}

renderMap()