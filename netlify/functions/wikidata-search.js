exports.handler = async (event) => {
  const { query } = event.queryStringParameters;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Query parameter required' })
    };
  }

  try {
    // Step 1: Search for cities matching the query
    const searchUrl = new URL('https://www.wikidata.org/w/api.php');
    searchUrl.searchParams.append('action', 'query');
    searchUrl.searchParams.append('format', 'json');
    searchUrl.searchParams.append('list', 'search');
    searchUrl.searchParams.append('srsearch', `${query} city`);
    searchUrl.searchParams.append('srnamespace', '0');
    searchUrl.searchParams.append('srlimit', '50');
    searchUrl.searchParams.append('srwhat', 'text');
    const searchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': "rdl-urbantracker/0.0 (https://github.com/GFDRR/rdl-urbantracker; lydia@oldgrowth.city)",
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Wikidata search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const results = searchData.query.search || [];
    // Step 2: Extract Wikidata IDs from search results and fetch entity data
    const entityIds = results
      .slice(0, 5)
      .map(result => {
        const match = result.title.match(/^Q\d+$/);
        return match ? match[0] : null;
      })
      .filter(Boolean);
    if (entityIds.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ results: [] })
      };
    }

    // Step 3: Fetch entity data with claims (population, country, flag)
    const entitiesUrl = new URL('https://www.wikidata.org/w/api.php');
    entitiesUrl.searchParams.append('action', 'wbgetentities');
    entitiesUrl.searchParams.append('format', 'json');
    entitiesUrl.searchParams.append('ids', entityIds.join('|'));
    entitiesUrl.searchParams.append('props', 'labels|claims');
    entitiesUrl.searchParams.append('languages', 'en');
    entitiesUrl.searchParams.append('languagefallback', '1');

    const entitiesResponse = await fetch(entitiesUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': "rdl-urbantracker/0.0 (https://github.com/GFDRR/rdl-urbantracker; lydia@oldgrowth.city)",
      }
    });

    if (!entitiesResponse.ok) {
      throw new Error(`Wikidata entities error: ${entitiesResponse.status}`);
    }

    const entitiesData = await entitiesResponse.json();

    // Step 4: Process and filter results
    const processedResults = [];

    for (const entityId of entityIds) {
      const entity = entitiesData.entities[entityId];
      if (!entity || !entity.labels) continue;

      const cityLabel = entity.labels.en?.value;
      if (!cityLabel) continue;

      // Extract population (P1082)
      const populationClaim = entity.claims?.P1082?.[0];
      const population = populationClaim?.mainsnak?.datavalue?.value?.amount
        ? parseInt(populationClaim.mainsnak.datavalue.value.amount)
        : 0;

      if (population <= 0) continue;

      // Extract country (P17)
      const countryClaim = entity.claims?.P17?.[0];
      const countryId = countryClaim?.mainsnak?.datavalue?.value?.id;

      // Extract flag (P41)
      const flagClaim = entity.claims?.P41?.[0];
      const flagFilename = flagClaim?.mainsnak?.datavalue?.value;

      let cityFlag = null;
      if (flagFilename) {
        const encodedFilename = encodeURIComponent(flagFilename);
        cityFlag = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodedFilename}`;
      }

      processedResults.push({
        city: entityId,
        cityLabel,
        countryEntity: countryId,
        population,
        cityFlag
      });
    }
    // Step 5: Fetch country labels for entities that have them
    const countryIds = [...new Set(processedResults.map(r => r.countryEntity).filter(Boolean))];
    if (countryIds.length > 0) {
      const countriesUrl = new URL('https://www.wikidata.org/w/api.php');
      countriesUrl.searchParams.append('action', 'wbgetentities');
      countriesUrl.searchParams.append('format', 'json');
      countriesUrl.searchParams.append('ids', countryIds.join('|'));
      countriesUrl.searchParams.append('props', 'labels');
      countriesUrl.searchParams.append('languages', 'en');
      countriesUrl.searchParams.append('languagefallback', '1');

      const countriesResponse = await fetch(countriesUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': "rdl-urbantracker/0.0 (https://github.com/GFDRR/rdl-urbantracker; lydia@oldgrowth.city)",
        }
      });

      if (countriesResponse.ok) {
        const countriesData = await countriesResponse.json();

        processedResults.forEach(result => {
          if (result.countryEntity) {
            const countryEntity = countriesData.entities[result.countryEntity];
            result.countryLabel = countryEntity?.labels?.en?.value || null;
          }
        });
      }
    }

    // Step 6: Sort by population and return
    processedResults.sort((a, b) => b.population - a.population);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ results: processedResults })
    };
  } catch (error) {
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
