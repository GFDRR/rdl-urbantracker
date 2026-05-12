import $ from 'jquery'
import {chain, omit, defaults, filter, orderBy, debounce} from 'lodash'

import {setContent, slugify, queryByHook} from '../util'

export default class {
  constructor (opts) {
    this.elements = {
      cityTrackerNavList: queryByHook('city-tracker-nav-list', opts.el),
      cityTrackerNavSearch: queryByHook('city-tracker-nav-search', opts.el),
    }

    this._initialize(opts)
    this._renderCityList()
    this._renderSearchBar()
  }

  _initialize(opts) {
    this.cities = opts.cities
    this.datasets = opts.datasets
    this.datatypes = opts.datatypes
    this.params = opts.params
    const sortedCities = orderBy(this.cities, ['title'], ['asc']);
    if (!opts.params.city) {
      this.params.city = slugify(sortedCities[0].city_id)
    }
    this.searchResults = []

    this.cities = chain(sortedCities)
      .map(city => {
        const citySlug = slugify(city.city_id)
        const citySlugFromParams = slugify(this.params.city)
        const selected = citySlugFromParams && citySlugFromParams === citySlug
        const itemParams = selected ? omit(this.params, 'city') : defaults({city: citySlug}, this.params)

        const cityDatasets = this.datasets.filter(d => d.cities && d.cities.some(c => c.city_id === city.city_id))
        const stats = cityDatasets.reduce((acc, dataset) => {
          const datatypes = dataset.datatypes || [];
          if (dataset.is_partial || dataset.is_unavailable) {
            acc.countUnfulfilled += datatypes.length
          } else {
            acc.countFulfilled += datatypes.length
          }
          return acc
        }, {
          countFulfilled: 0,
          countUnfulfilled: 0,      
        });
        return {
          ...city,
          ...stats,
          coverage: (stats.countFulfilled / this.datatypes.length * 100).toFixed(2)+"%",
          url: '?' + $.param(itemParams),
          selected: selected
        }
      })
      .orderBy(['selected', 'title'], ['desc', 'asc'])
      .value();
  }

  async _fetchWikidataCities(query, retries = 3) {
    const url = `/.netlify/functions/wikidata-search?query=${encodeURIComponent(query)}`;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          this.searchResults = data.results.map(result => ({
            city: result.cityLabel,
            city_id: result.city,
            title: result.cityLabel + ', ' + result.countryLabel,
            ...(result.cityFlag ? {
              flag: result.cityFlag,
              flag_attribution: 'Wikimedia'
            } : {}),
            country: result.countryLabel
          }));
        }
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Retry ${i + 1} failed...`, error);
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  }

  _makeCityRow(data) {
    if (data.isError) {
      return `
        <a href="${data.url}" class="city-search-item list-group-item list-group-item-action">
          <i class="fa fa-plus-circle"></i>
          <small class="text-muted">Add ${data.query} manually</small>
        </a>
      `
    }
    if (data.isMissing) {
    return `
      <a href="${data.url}" class="list-group-item list-group-item-action">
        <i class="fa fa-plus-circle"></i>
        <small class="text-muted">Add ${data.title}</small>
      </a>
    `;
    }

    return `
      <a href="${data.url}" class="list-group-item${data.selected ? ' override-active ' : ''} list-group-item-action">
        <div class="d-flex w-100 justify-content-between">
          <h6 class="mb-1">${data.title}</h6>
        </div>
        <small class="text-muted">${data.coverage}</small>
      </a>
    `;
  }

  _renderCityList(citiesParam) {
    const cities = citiesParam ?? this.cities;
    const markup = cities.map(this._makeCityRow).join('\n');
    setContent(this.elements.cityTrackerNavList, markup)
  }

  _renderLoadingState() {
    const nestedSearchElement = $('.city-tracker-nav-search');
    nestedSearchElement?.toggleClass('loading',true);
    this._renderCityList([])
    return () => {
      nestedSearchElement?.toggleClass('loading',false);
    }
  }

  _renderSearchBar() { 
    const markup = `
      <div class="position-relative city-tracker-nav-search">
        <input type="text" class="form-control list-group-item mt-2" placeholder="Search cities..." autocomplete="off">
      </div>
    `;
    setContent(this.elements.cityTrackerNavSearch, markup)
    const handleInput = debounce((e) => this._search(e), 800);
    this.elements.cityTrackerNavSearch.on('input', handleInput)
  }

  async _search(e) {
    const query = e.target.value.trim()
    this.searchResults = []
    if (query.length === 0) {
      this._renderCityList()
      return
    }
    const filteredCities = filter(this.cities, (city) => {
      const titleMatch = city.title && city.title.toLowerCase().includes(query.toLowerCase())
      const idMatch = city.city_id && city.city_id.toLowerCase().includes(query.toLowerCase())
      return titleMatch || idMatch
    })

    const stopLoading = this._renderLoadingState()
    if (filteredCities.length > 0) {
      this._renderCityList(filteredCities.map(city => {
        const citySlug = slugify(city.city_id)
        const itemParams = defaults({city: citySlug}, this.params)
        const url = '?' + $.param(itemParams)
        return {
          ...city,
          url,
        }
      }))
    }
    try {
      await this._fetchWikidataCities(query)
      if (!this.searchResults.length) {
        throw new Error('No cities found')
      }
      const mappedSearchResults = this.searchResults.map(city => {
        const citySlug = slugify(city.city_id)
        const itemParams = defaults({city: citySlug}, this.params)
        const encodedParams = Object.entries(city).map(kv => kv.map(encodeURIComponent).join("=")).join("&");
        const url = "/editor/#/collections/cities/new?" + encodedParams
        return {
          ...city,
          url,
          isMissing: true
        }
      })
      const combinedList = [...filteredCities, ...mappedSearchResults]

      this._renderCityList(combinedList)
      } catch (err) {
        const url = "/editor/#/collections/cities/new?city=" + query
        this._renderCityList([...filteredCities, { url, query, isError: true, }])
        console.error(err)
    } finally {
      stopLoading()
    }
    
  }
}