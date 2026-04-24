exports.handler = async (event) => {
  const { query } = event.queryStringParameters;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Query parameter required' })
    };
  }

  const sparqlQuery = `
    SELECT DISTINCT ?city ?cityLabel ?countryEntity ?countryLabel ?cityFlag WHERE {
      VALUES ?myCatalog {
        "${query}"@en
      }
      ?city rdfs:label ?myCatalog;
        (wdt:P31/(wdt:P279*)) wd:Q515;
        wdt:P1082 ?population;
        wdt:P17 ?countryEntity.
      OPTIONAL { ?city wdt:P41 ?cityFlag. }
      FILTER(?population > 0 )
      ?countryEntity rdfs:label ?country.
      FILTER((LANG(?country)) = "en")
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    }
    ORDER BY DESC (?population)
    LIMIT 5
  `;

  console.log(sparqlQuery)

  try {
    const url = new URL('https://query.wikidata.org/sparql');
    url.searchParams.append('format', 'json');
    url.searchParams.append('query', sparqlQuery);
    console.log(url.toString())
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': "rdl-urbantracker/0.0 (https://github.com/GFDRR/rdl-urbantracker; lydia@oldgrowth.city)",
      }
    });

    if (!response.ok) {
      throw new Error(`Wikidata API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: error.status,
      body: JSON.stringify({ error: error.message })
    };
  }
};
