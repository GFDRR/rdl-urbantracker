/* global settings */
import Alpine from 'alpinejs'
import "bootstrap/js/dist/collapse";
import "core-js/actual";
import $ from "jquery";
import { filter } from "lodash";

import DatasetsList from "./components/datasets-list";
import CityTrackerNav from "./components/city-tracker-nav";
import CityTrackerOverview from "./components/city-tracker-overview";
import CompareCities from "./components/compare-cities";
import CitiesFilter from "./components/cities-filter";
import DatatypesFilter from "./components/datatypes-filter";
import DatatypeCategoriesFilter from "./components/datatype-categories-filter";
import { createDatasetFilters, queryByComponent } from "./util";

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

let datatypeCategoriesCache;
function getDatatypeCategories() {
  datatypeCategoriesCache =
    datatypeCategoriesCache || $.getJSON(`${settings.BASE_URL}/datatype-categories.json`);
  return datatypeCategoriesCache;
}

const components = [
  { tag: "datasets-list", class: DatasetsList },
  { tag: "city-tracker-nav", class: CityTrackerNav },
  { tag: "city-tracker-overview", class: CityTrackerOverview },
  { tag: "compare-cities", class: CompareCities },
  { tag: "cities-filter", class: CitiesFilter },
  { tag: "datatypes-filter", class: DatatypesFilter },
  {
    tag: "datatype-categories-filter",
    class: DatatypeCategoriesFilter,
  },
];

Alpine.store('filter', {
  cities: [],
  filteredCities: [],
  datasets: [],
  filteredDatasets: [],
  datatypes: [],
  filteredDatatypes: [],
  datatypeCategories: [],
  filteredDatatypeCategories: [],
  filterDatasets(params) {
    const filters = createDatasetFilters(params)
    this.filteredDatasets = filter(this.datasets,filters)
  },
  init() {
    Promise.all([getCities(), getDatasets(), getDatatypes(), getDatatypeCategories()])
    .then(([cities, datasets, datatypes, datatypeCategories]) => {
      this.cities = cities
      this.filteredCities = cities
      this.datasets = datasets
      this.filteredDatasets = datasets
      this.datatypes = datatypes
      this.filteredDatatypes = datatypes
      this.datatypeCategories = datatypeCategories
      this.filteredDatatypeCategories = datatypeCategories
    })
    .then(() => {
      for (let component of components) {
        const els = queryByComponent(component.tag);
        if (els.length) {
          els.each(
            (_, el) =>
              new component.class({ el: $(el), Alpine, params }),
          ); 
        }
      }
    })
  }
});

window.Alpine = Alpine
Alpine.start()
