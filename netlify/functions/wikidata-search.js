exports.handler = async (event) => {
  const { query } = event.queryStringParameters;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Query parameter required' })
    };
  }

  const sparqlQuery = `
    SELECT DISTINCT ?city ?cityLabel ?cityDescription ?population WHERE {
      ?city (wdt:P31/(wdt:P279*)) wd:Q515;
        wdt:P1082 ?population.
      FILTER(?population > 0)
      ?city rdfs:label ?cityLabel.
      FILTER((LANG(?cityLabel)) = "en")
      FILTER(CONTAINS(LCASE(?cityLabel), "${query.toLowerCase()}"))
      ?city schema:description ?cityDescription.
      FILTER((LANG(?cityDescription)) = "en")
    }
    ORDER BY DESC(?population)
  `;

  try {
    const response = await fetch('https://query.wikidata.org/sparql', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        format: 'json',
        query: sparqlQuery
      })
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
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
