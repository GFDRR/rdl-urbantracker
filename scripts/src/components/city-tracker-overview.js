import $ from 'jquery'
import { defaults, filter, pick } from 'lodash'
import TmplCityTrackerHeader from '../templates/city-tracker-header'
import TmplCityTrackerTable from '../templates/city-tracker-table'
import {createDatasetFilters, queryByHook, setContent, slugify} from '../util'

export default class {
  constructor (opts) {
    this.elements = {
      cityTrackerHeader: queryByHook('city-tracker-header', opts.el),
      cityTrackerTable: queryByHook('city-tracker-table', opts.el),
    }
    this.cities = opts.cities;
    this.datasets = opts.datasets;
    this.datatypes = opts.datatypes;
    this.params = opts.params;
    this.sortField = 'category';
    this.sortDirection = 'asc';

    if (!this.params.city) {
      const firstCity = opts.cities[0]
      this.params.city = slugify(firstCity.city_id)
    }

    const paramFilters = pick(this.params, ['datatypeCategory', 'city'])
    const attributeFilters = pick(opts.el.data(), ['datatypeCategory', 'city'])
    const filters = createDatasetFilters(defaults(paramFilters, attributeFilters))
    const filteredDatasets = filter(this.datasets, filters)
    
    this.cityStats = this._calculateCityStats(filteredDatasets);

    const filteredDatatypes = defaults(paramFilters, attributeFilters).datatypeCategory
      ? this.datatypes.filter(dt => slugify(dt.category) === defaults(paramFilters, attributeFilters).datatypeCategory)
      : this.datatypes;
    this.cityDatatypes = filteredDatatypes.map(datatype => {
      const dataset = filteredDatasets.find(d => d.datatypes && d.datatypes.some(dt => dt.title === datatype.title))
      return {
        datatype: datatype,
        dataset: dataset,
      }
    })
    this._render()
  }

  _calculateCityStats(filteredDatasets) {
    const stats = filteredDatasets.reduce((acc, dataset) => {
      const datatypes = dataset.datatypes || [];
      if (dataset.is_partial || dataset.is_unavailable) {
        acc.countExcluded += datatypes.length
      } else {
        acc.countComplete += datatypes.length
      }
      return acc
    }, {
      countComplete: 0,
      countExcluded: 0,      
    });
    const city = this.cities.find(c => slugify(c.city_id) === slugify(this.params.city));
    return {
      ...city,
      countComplete: stats.countComplete,
      countExcluded: stats.countExcluded,
      coverage: (stats.countComplete / this.datatypes.length * 100).toFixed(2)+"%"
    }
  }

  _sortCityDatatypes(cityDatatypes) {
    const sortHierarchy = ['category', 'datatype', 'dataset']
      .sort((a,b) => a == this.sortField ? -1 : b == this.sortField ? 1 : 0);
    const getSortValue = {
      category: item => item.datatype.category || ''.toString().toLowerCase(),
      datatype: item => item.datatype.title || ''.toString().toLowerCase(),
      dataset: item => !!item.dataset?.title,
    }
    return cityDatatypes.sort((a, b) => {
      return sortHierarchy.reduce((result, field, i) => {
        if (result !== 0) return result;
        const aVal = getSortValue[field](a);
        const bVal = getSortValue[field](b);
        if (i > 0 || aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      }, 0); 
    })
  }


  _attachSortListeners() {
    const headers = this.elements.cityTrackerTable.find('th[data-sort]');
    headers.on('click', (e) => {
      const field = $(e.currentTarget).data('sort');
      
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      
      this._render();
    });
  }

  _render() {
    setContent(this.elements.cityTrackerHeader, TmplCityTrackerHeader(this.cityStats))
    setContent(this.elements.cityTrackerTable, TmplCityTrackerTable({ cityDatatypes: this._sortCityDatatypes(this.cityDatatypes), sortField: this.sortField, sortDirection: this.sortDirection }))
    this._attachSortListeners()
  }
}
