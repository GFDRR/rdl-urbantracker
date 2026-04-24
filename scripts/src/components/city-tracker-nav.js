import $ from 'jquery'
import {chain, omit, defaults, filter, debounce} from 'lodash' // Added debounce

import TmplCityTrackerNavItem from '../templates/city-tracker-nav-item'
import TmplCityTrackerNavSearchBar from '../templates/city-tracker-nav-search-bar'
import {setContent, slugify, collapseListGroup, queryByHook} from '../util'

export default class {
  constructor (opts) {
    const elements = {
      cityTrackerNavList: queryByHook('city-tracker-nav-list', opts.el),
      cityTrackerNavSearch: queryByHook('city-tracker-nav-search', opts.el),
    }
   
    const citiesMarkup = this._cities(opts).map(TmplCityTrackerNavItem)
    setContent(elements.cityTrackerNavList, citiesMarkup)

    const searchMarkup = TmplCityTrackerNavSearchBar()
    setContent(elements.cityTrackerNavSearch, searchMarkup)
    this.wikidataCity = {}
    this._search(opts)
  }

  async _fetchWikidataCity(query, retries = 3) {
    const url = `/.netlify/functions/wikidata-search?query=${encodeURIComponent(query)}`;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.results && data.results.bindings.length > 0) {
          const result = data.results.bindings[0];
          this.wikidataCity = {
            city: result.cityLabel.value,
            city_id: result.city.value.split('/').pop(),
            title: result.cityLabel.value + ', ' + result.countryLabel.value,
            logo: result.cityFlag.value,
            logo_credit: 'Wikimedia',
            country: result.countryLabel.value
          };
        }
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Retry ${i + 1} failed...`);
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  }

  _search(opts) {
    const searchInput = $('#cityTrackerNavSearchBar')
    const searchResults = $('#cityTrackerNavSearchResults')
    const cities = opts.cities

    const handleInput = debounce(async (e) => {
      const query = e.target.value.trim()
      this.wikidataCity = {}
      if (query.length === 0) {
        searchResults.hide()
        return
      }

      const filteredCities = filter(cities, (city) => {
        const titleMatch = city.title && city.title.toLowerCase().includes(query.toLowerCase())
        const idMatch = city.city_id && city.city_id.toLowerCase().includes(query.toLowerCase())
        return titleMatch || idMatch
      })

      let resultsHtml = ''
      
      if (filteredCities.length > 0) {
        filteredCities.forEach(city => {
          const citySlug = slugify(city.city_id)
          const itemParams = defaults({city: citySlug}, opts.params)
          const url = '?' + $.param(itemParams)
          
          resultsHtml += `
            <a href="${url}" class="list-group-item list-group-item-action">
              <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${city.title}</h6>
              </div>
              <small class="text-muted">${city.city_id}</small>
            </a>
          `
        })
      } else {
        try {
          await this._fetchWikidataCity(query)
          if (!this.wikidataCity?.city) {
            throw new Error('City not found')
          }
          const encodedParams = Object.entries(this.wikidataCity).map(kv => kv.map(encodeURIComponent).join("=")).join("&");
  
          resultsHtml += `
            <div class="list-group-item">
              <a href="/editor/#/collections/cities/new?${encodedParams}" class="list-group-item list-group-item-action list-group-item-info">
                <i class="mb-1 fa fa-plus-circle"></i> Add ${this.wikidataCity.city}
              </a>
            </div>
          `;
        } catch (err) {
          resultsHtml = `<div class="list-group-item text-danger">Search failed.</div>`
        }
      }

      searchResults.html(resultsHtml)
      searchResults.show()
    }, 500)

    searchInput.on('input', handleInput)

    $(document).on('click', (e) => {
      if (!$(e.target).closest('#cityTrackerNavSearchBar, #cityTrackerNavSearchResults').length) {
        searchResults.hide()
      }
    })

    searchInput.on('focus', () => {
      if (searchInput.val().trim().length > 0) {
        searchResults.show()
      }
    })
  }

  _cities(opts){
    if (!opts.params.city) {
      const firstCity = opts.cities[0]
      opts.params.city = slugify(firstCity.city_id)
    }
    
    return opts.cities.map(city => {
      const citySlug = slugify(city.city_id)
      const selected = opts.params.city && opts.params.city === citySlug
      const itemParams = selected ? omit(opts.params, 'city') : defaults({city: citySlug}, opts.params)

      const cityDatasets = opts.datasets.filter(d => d.cities && d.cities.some(c => c.city_id === city.city_id))
      const stats = cityDatasets.reduce((acc, dataset) => {
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
      return {
        ...city,
        ...stats,
        coverage: (stats.countComplete / opts.datatypes.length * 100).toFixed(2)+"%",
        url: '?' + $.param(itemParams),
        selected: selected
      }
    })
  }
}