import $ from "jquery";
import WBK from "wikibase-sdk";

export function queryByHook(hook, container) {
  return $(`[data-hook~=${hook}]`, container);
}

export function queryByComponent(component, container) {
  return $(`[data-component~=${component}]`, container);
}

export function setContent(container, content) {
  return container.empty().append(content);
}

// Meant to mimic Jekyll's slugify function
// https://github.com/jekyll/jekyll/blob/master/lib/jekyll/utils.rb#L142
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "-") // Replace non-alphanumeric chars with -
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^\-|\-$/i, ""); // Remove leading/trailing hyphen
}

// Given an object of filters to use, returns a function to be used by _.filter()
export function createDatasetFilters(filters) {
  return function (dataset) {
    const conditions = [];
    if (filters.datatype) {
      conditions.push(
        dataset.datatypes &&
          dataset.datatypes.some(function (datatype) {
            return slugify(datatype.title).indexOf(filters.datatype) !== -1;
          }),
      );
    }
    if (filters.datatypeCategory) {
      conditions.push(
        dataset.datatypes &&
          dataset.datatypes.some(function (datatype) {
            return (
              slugify(datatype.category).indexOf(filters.datatypeCategory) !==
              -1
            );
          }),
      );
    }
    if (filters.city) {
      conditions.push(
        dataset.cities &&
          dataset.cities.some(function (city) {
            return slugify(city.city_id).indexOf(filters.city) !== -1;
          }),
      );
    }
    return conditions.every(function (value) {
      return !!value;
    });
  };
}

// Collapses a bootstrap list-group to only show a few items by default
// Number of items to show can be specified in [data-show] attribute or passed as param
export function collapseListGroup(container, show) {
  if (!show) show = container.data("show") || 5;

  const itemsToHide = $(
    ".list-group-item:gt(" + (show - 1) + "):not(.active)",
    container,
  );
  if (itemsToHide.length) {
    itemsToHide.hide();

    const showMoreButton = $(
      '<a href="#" class="list-group-item">Show ' +
        itemsToHide.length +
        " more...</a>",
    );
    showMoreButton.on("click", function (e) {
      itemsToHide.show();
      $(this).off("click");
      $(this).remove();
      e.preventDefault();
    });
    container.append(showMoreButton);
  }
}

const wdk = WBK({
  instance: "https://www.wikidata.org",
  sparqlEndpoint: "https://query.wikidata.org/sparql",
});
export async function fetchWikidataCity(cityLabel) {
  const query = `SELECT DISTINCT ?city ?cityLabel ?cityDescription ?population WHERE {
    ?city (wdt:P31/(wdt:P279*)) wd:Q515;
      wdt:P1082 ?population.
    FILTER(?population > 0 )
    ?city rdfs:label ?cityLabel.
    FILTER((LANG(?cityLabel)) = "en")
    FILTER(CONTAINS(LCASE(?cityLabel), "${cityLabel}"))
    ?city schema:description ?cityDescription.
    FILTER((LANG(?cityDescription)) = "en")
  }
  ORDER BY DESC (?population)`;

  const url = wdk.sparqlQuery(query);
  const rawResults = await fetch(url, {
    headers: {
      // A custom user-agent is required for Wikimedia services, see https://foundation.wikimedia.org/wiki/Policy:User-Agent_policy
      "user-agent":
        "rdl-urbantracker/0.0 (https://github.com/GFDRR/rdl-urbantracker; lydia@oldgrowth.city)",
    },
  })
    .then((res) => res.json())
    .then(console.log)
    .catch(console.error);
}
