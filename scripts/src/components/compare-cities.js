import $ from 'jquery'
import { filter, pick, defaults } from 'lodash';
import TmplCompareCitiesTable from '../templates/compare-cities-table';
import { queryByHook, setContent, slugify, createDatasetFilters } from '../util';

export default class {
  constructor(opts) {
    this.elements = {
      compareCitiesTable: queryByHook('compare-cities-table', opts.el),
      searchQuery: queryByHook('compare-cities-search-query', opts.el)
    };
    
    this.cities = opts.cities;
    this.datasets = opts.datasets;
    this.datatypes = opts.datatypes;
    this.params = opts.params;
    
    // State for sorting
    this.sortField = 'title';
    this.sortDirection = 'asc';
    
    // Calculate stats for all cities
    this.cityStats = this._calculateCityStats();
    
    // Initial render
    this._render();
    
    // Setup event listeners
    this._setupEventListeners();
  }
  
  _calculateCityStats() {
    const paramFilters = pick(this.params, ['datatypeCategory']);
    const filters = createDatasetFilters(paramFilters);
    const filteredDatasets = filter(this.datasets, filters);
    
    return this.cities.map(city => {
      const cityDatasets = filteredDatasets.filter(dataset => 
        dataset.cities && dataset.cities.some(c => slugify(c.city_id) === slugify(city.city_id))
      );
      
      const stats = cityDatasets.reduce((acc, dataset) => {
        const datatypes = dataset.datatypes || [];
        if (dataset.is_partial || dataset.is_unavailable) {
          acc.countExcluded += datatypes.length;
        } else {
          acc.countComplete += datatypes.length;
        }
        return acc;
      }, {
        countComplete: 0,
        countExcluded: 0
      });
      
      const totalDatatypes = this.datatypes.length;
      const coveragePercent = totalDatatypes > 0 
        ? (stats.countComplete / totalDatatypes * 100) 
        : 0;
      
      return {
        ...city,
        countComplete: stats.countComplete,
        countExcluded: stats.countExcluded,
        coverage: coveragePercent.toFixed(2) + '%',
        coveragePercent: Math.round(coveragePercent)
      };
    });
  }


  _sortCities(cities) {
    const sortHierarchy = ['title', 'country', 'coverage', 'countComplete', 'countExcluded']
      .sort((a,b) => a == this.sortField ? -1 : b == this.sortField ? 1 : 0);
    const getSortValue = {
      title: item => item.title.toString().toLowerCase(),
      country: item => item.country.toString().toLowerCase(),
      coverage: item => item.coverage.toString().toLowerCase(),
      countComplete: item => parseFloat(item.countComplete) || 0,
      countExcluded: item => parseFloat(item.countExcluded) || 0,
    }
    return cities.sort((a, b) => {
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
  
  _filterCities(query) {
    if (!query) return this.cityStats;
    
    const lowerQuery = query.toLowerCase();
    return this.cityStats.filter(city => {
      return (
        (city.title && city.title.toLowerCase().includes(lowerQuery)) ||
        (city.country && city.country.toLowerCase().includes(lowerQuery))
      );
    });
  }
  
  _render(searchQuery = '') {
    let filteredCities = this._filterCities(searchQuery);
    filteredCities = this._sortCities([...filteredCities]);
    
    const tableData = {
      cities: filteredCities,
      sortField: this.sortField,
      sortDirection: this.sortDirection
    };
    
    setContent(this.elements.compareCitiesTable, TmplCompareCitiesTable(tableData));
    
    // Re-attach sort listeners after render
    this._attachSortListeners();
  }
  
  _setupEventListeners() {
    // Search input listener
    this.elements.searchQuery.on('keyup', (e) => {
      const query = e.currentTarget.value;
      this._render(query);
    });
  }
  
  _attachSortListeners() {
    const headers = this.elements.compareCitiesTable.find('th[data-sort]');
    headers.on('click', (e) => {
      const field = $(e.currentTarget).data('sort');
      
      // Toggle direction if clicking same field, otherwise default to asc
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      
      const query = this.elements.searchQuery.val();
      this._render(query);
    });
  }
}
