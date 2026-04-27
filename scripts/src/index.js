/* global settings */
import "core-js/actual";
import $ from "jquery";
import "bootstrap/js/dist/collapse";

import DatasetsList from "./components/datasets-list";
import CityTrackerNav from "./components/city-tracker-nav";
import CityTrackerOverview from "./components/city-tracker-overview";
import CitiesFilter from "./components/cities-filter";
import DatatypesFilter from "./components/datatypes-filter";
import DatatypeCategoriesFilter from "./components/datatype-categories-filter";
import DatasetDisplay from "./components/dataset-display";
import { queryByComponent } from "./util";

const urlSearchParams = new URLSearchParams(window.location.search);
const params = {};
urlSearchParams.forEach((value, key) => {
  params[key] = value;
});

let citiesCache;
function getCities() {
  citiesCache = citiesCache || $.getJSON(`${settings.BASE_URL}/cities.json`);
  return citiesCache;
}

let datasetsCache;
function getDatasets() {
  datasetsCache =
    datasetsCache || $.getJSON(`${settings.BASE_URL}/datasets.json`);
  return datasetsCache;
}

let datatypesCache;
function getDatatypes() {
  datatypesCache =
    datatypesCache || $.getJSON(`${settings.BASE_URL}/datatypes.json`);
  return datatypesCache;
}

const components = [
  { tag: "dataset-display", class: DatasetDisplay },
  { tag: "datasets-list", class: DatasetsList, usesData: true },
  { tag: "city-tracker-nav", class: CityTrackerNav, usesData: true },
  { tag: "city-tracker-overview", class: CityTrackerOverview, usesData: true },
  { tag: "cities-filter", class: CitiesFilter, usesData: true },
  { tag: "datatypes-filter", class: DatatypesFilter, usesData: true },
  {
    tag: "datatype-categories-filter",
    class: DatatypeCategoriesFilter,
    usesData: true,
  },
];
for (let component of components) {
  const els = queryByComponent(component.tag);
  if (els.length) {
    if (component.usesData) {
      Promise.all([getCities(), getDatasets(), getDatatypes()]).then(([cities, datasets, datatypes]) => {
        els.each(
          (_, el) =>
            new component.class({ el: $(el), params, cities, datasets, datatypes }),
        ); 
      })
    }
  } else {
    els.each((_, el) => new component.class({ el: $(el), params })); // eslint-disable-line
  }
}
