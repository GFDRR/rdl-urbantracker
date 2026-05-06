import $ from 'jquery'
import {chain, omit, defaults, filter, debounce} from 'lodash'

import TmplCityTrackerNavItem from '../templates/city-tracker-nav-item'
import {setContent, slugify, collapseListGroup, queryByHook} from '../util'

export default class {
  constructor (opts) {
    this.elements = {
      cityTrackerNavList: queryByHook('city-tracker-nav-list', opts.el),
      cityTrackerNavSearch: queryByHook('city-tracker-nav-search', opts.el),
    }
   
    const citiesMarkup = this._cities(opts).map(TmplCityTrackerNavItem)
    setContent(this.elements.cityTrackerNavList, citiesMarkup)

    const searchMarkup = `
      <div class="position-relative city-tracker-nav-search">
        <input type="text" class="form-control list-group-item mt-2" placeholder="Search cities..." autocomplete="off">
      </div>
    `
    setContent(this.elements.cityTrackerNavSearch, searchMarkup)
    this.searchResults = []
    this._search(opts)
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
            flag: result.cityFlag,
            flag_attribution: result.cityFlag && 'Wikimedia',
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

  _search(opts) {
    const nestedSearchElement = this.elements.cityTrackerNavSearch.children('.city-tracker-nav-search');
    const handleInput = debounce(async (e) => {
      const query = e.target.value.trim()
      this.searchResults = []
      if (query.length === 0) {
        const citiesMarkup = this._cities(opts).map(TmplCityTrackerNavItem)
        setContent(this.elements.cityTrackerNavList, citiesMarkup)
        nestedSearchElement?.toggleClass('loading',false);
        return
      }

      const filteredCities = filter(opts.cities, (city) => {
        const titleMatch = city.title && city.title.toLowerCase().includes(query.toLowerCase())
        const idMatch = city.city_id && city.city_id.toLowerCase().includes(query.toLowerCase())
        return titleMatch || idMatch
      })

      let resultsHtml = ''
      
      if (filteredCities.length > 0) {
        nestedSearchElement?.toggleClass(false);
        resultsHtml += filteredCities.map(city => {
          const citySlug = slugify(city.city_id)
          const itemParams = defaults({city: citySlug}, opts.params)
          const url = '?' + $.param(itemParams)
          
          return `
            <a href="${url}" class="list-group-item list-group-item-action city-search-item">
              <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${city.title}</h6>
              </div>
              <small class="text-muted">${city.city_id}</small>
            </a>
          `
        }).join('\n')
        setContent(this.elements.cityTrackerNavList, resultsHtml)
      } else {
        try {
          nestedSearchElement?.toggleClass('loading',true);
          await this._fetchWikidataCities(query)
          if (!this.searchResults.length) {
            throw new Error('No cities found')
          }
          resultsHtml += this.searchResults.map(city => {
            const citySlug = slugify(city.city_id)
            const itemParams = defaults({city: citySlug}, opts.params)
            const encodedParams = Object.entries(city).map(kv => kv.map(encodeURIComponent).join("=")).join("&");
            const url = "/editor/#/collections/cities/new?" + encodedParams
            return `
            <a href="${url}" class="city-search-item list-group-item list-group-item-action">
              <i class="fa fa-plus-circle"></i>
              <small class="text-muted">Add ${city.title}</small>
            </a>
            `
          }).join('\n')
          setContent(this.elements.cityTrackerNavList, resultsHtml)
        } catch (err) {
          const url = "/editor/#/collections/cities/new?city=" + query
          resultsHtml = `
            <a href="${url}" class="city-search-item list-group-item list-group-item-action">
              <i class="fa fa-plus-circle"></i>
              <small class="text-muted">Add ${query} manually</small>
            </a>
          `
          setContent(this.elements.cityTrackerNavList, resultsHtml)
          console.error(err)
        } finally {
          nestedSearchElement?.toggleClass('loading',true);
        }
      }
    }, 800);
    this.elements.cityTrackerNavSearch.on('input', handleInput)
  }

  _cities(opts){
    const sortedCities = opts.cities.sort((a, b) => a.title.localeCompare(b.title));
    if (!opts.params.city) {
      const firstCity = sortedCities[0]
      opts.params.city = slugify(firstCity.city_id)
    }
    
    return opts.cities.map(city => {
      const citySlug = slugify(city.city_id)
      const citySlugFromParams = slugify(opts.params.city)
      const selected = citySlugFromParams && citySlugFromParams === citySlug
      const itemParams = selected ? omit(opts.params, 'city') : defaults({city: citySlug}, opts.params)

      const cityDatasets = opts.datasets.filter(d => d.cities && d.cities.some(c => c.city_id === city.city_id))
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
        coverage: (stats.countFulfilled / opts.datatypes.length * 100).toFixed(2)+"%",
        url: '?' + $.param(itemParams),
        selected: selected
      }
    })
  }
}