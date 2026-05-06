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
    this.wikidataCity = {}
    this._search(opts)
  }

  async _fetchWikidataCity(query, retries = 3) {
    const url = `/.netlify/functions/wikidata-search?query=${encodeURIComponent(query)}`;
    const nestedSearchElement = this.elements.cityTrackerNavSearch.children('.city-tracker-nav-search');
    nestedSearchElement?.toggleClass('loading',true);

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
            logo: result.cityFlag?.value,
            logo_credit: result.cityFlag?.value && 'Wikimedia',
            country: result.countryLabel.value
          };
        }
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Retry ${i + 1} failed...`, error);
        await new Promise(res => setTimeout(res, 1000));
      } finally {
        nestedSearchElement?.toggleClass('loading',false);
      }
    }
  }

  _search(opts) {
    const handleInput = debounce(async (e) => {
      const query = e.target.value.trim()
      this.wikidataCity = {}
      if (query.length === 0) {
        const citiesMarkup = this._cities(opts).map(TmplCityTrackerNavItem)
        setContent(this.elements.cityTrackerNavList, citiesMarkup)
        return
      }

      const filteredCities = filter(opts.cities, (city) => {
        const titleMatch = city.title && city.title.toLowerCase().includes(query.toLowerCase())
        const idMatch = city.city_id && city.city_id.toLowerCase().includes(query.toLowerCase())
        return titleMatch || idMatch
      })

      let resultsHtml = ''
      
      if (filteredCities.length > 0) {
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
          await this._fetchWikidataCity(query)
          if (!this.wikidataCity?.city) {
            throw new Error('City not found')
          }
          const encodedParams = Object.entries(this.wikidataCity).map(kv => kv.map(encodeURIComponent).join("=")).join("&");
  
          resultsHtml += `
            <a href="/editor/#/collections/cities/new?${encodedParams}" class="city-search-item list-group-item list-group-item-action">
              <i class="mb-1 fa fa-plus-circle"></i>
              <small class="text-muted">Add ${this.wikidataCity.city}</small>
            </a>
          `;
          setContent(this.elements.cityTrackerNavList, resultsHtml)
        } catch (err) {
          resultsHtml = `<div class="city-search-item list-group-item text-danger">Search failed.</div>`
          setContent(this.elements.cityTrackerNavList, resultsHtml)
          console.error(err)
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