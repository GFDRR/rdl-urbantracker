import $ from 'jquery'
import { defaults, filter, first, pick } from 'lodash'
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

    this._initialize(opts);
  }

  _initialize(opts) {
    this._applyFilters(opts);
    this._render()
    
    const tableHeaders = this.elements.cityTrackerTable.find('th[data-sort]');
    tableHeaders.on('click', (e) => {
      const field = $(e.currentTarget).data('sort');
      
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      
      this._render();
    });

    const firstCategoryHeader = document.querySelectorAll('.category-header')[0];
    const toggleCategoryHeader = this._toggleCategoryHeader;
    toggleCategoryHeader(firstCategoryHeader);

    document.addEventListener('click', function(e) {
      const header = e.target.closest('.category-header');
      if (!header) return;
      document.querySelectorAll('.category-header').forEach(h => {
        if (h === header) {
          toggleCategoryHeader(h);
        }
      });
    })
  }

  _applyFilters(opts) {
    const paramFilters = pick(this.params, ['datatypeCategory', 'city'])
    const attributeFilters = pick(opts.el.data(), ['datatypeCategory', 'city'])
    const filters = createDatasetFilters(defaults(paramFilters, attributeFilters))
    const filteredDatasets = filter(this.datasets, filters)
    
    this.cityStats = this._calculateCityStats(filteredDatasets);

    const filteredDatatypes = defaults(paramFilters, attributeFilters).datatypeCategory
      ? this.datatypes.filter(dt => slugify(dt.category) === defaults(paramFilters, attributeFilters).datatypeCategory)
      : this.datatypes;
    this.cityDatatypes = filteredDatatypes.map(datatype => {
      return {
        datatype: datatype,
        isFulfilled: this.cityStats.datatypesFulfilled.has(datatype.title),
        url: `/datasets?datatype=${slugify(datatype.title)}&city=${slugify(this.cityStats.city_id)}`,
      }
    })
  }

  _calculateCityStats(filteredDatasets) {
    const stats = filteredDatasets.reduce((acc, dataset) => {
      const datatypes = dataset.datatypes || [];
      if (!dataset.is_partial && !dataset.is_unavailable) {
        datatypes.forEach(dt => acc.datatypesFulfilled.add(dt.title))
      }
      return acc
    }, {
      datatypesFulfilled: new Set()    
    });
    const city = this.cities.find(c => slugify(c.city_id) === slugify(this.params.city));
    return {
      ...city,
      countFulfilled: stats.datatypesFulfilled.size,
      countUnfulfilled: this.datatypes.length - stats.datatypesFulfilled.size,
      coverage: (stats.datatypesFulfilled.size / this.datatypes.length * 100).toFixed(2)+"%",
      datatypesFulfilled: stats.datatypesFulfilled,
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

  _toggleCategoryHeader(categoryHeader) {
    const category = categoryHeader.getAttribute('data-category');
    const categoryRows = document.querySelectorAll('.category-row.' + category);
    const icon = categoryHeader.querySelector('.toggle-icon');
    const isExpanded = categoryRows[0] && categoryRows[0].style.display !== 'none';

    categoryRows.forEach(function(row) {
      row.style.display = isExpanded ? 'none' : 'table-row';
    });

    if (icon) {
      icon.classList.toggle('fa-chevron-right', isExpanded);
      icon.classList.toggle('fa-chevron-down', !isExpanded);
    }
  }

  _render() {
    const cityDatatypes = this._sortCityDatatypes(this.cityDatatypes);
    if (!this.params.city) {
      const firstCity = cityDatatypes[0]
      this.params.city = slugify(firstCity.city_id)
    }
    setContent(this.elements.cityTrackerHeader, TmplCityTrackerHeader(this.cityStats))
    setContent(this.elements.cityTrackerTable, TmplCityTrackerTable({ cityDatatypes, sortField: this.sortField, sortDirection: this.sortDirection }))
  }
}
