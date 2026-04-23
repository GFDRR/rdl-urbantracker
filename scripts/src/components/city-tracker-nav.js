import $ from 'jquery'
import {chain, omit, defaults, filter} from 'lodash'

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
    
    this._search(opts)
  }

  _search(opts) {
    const searchInput = $('#cityTrackerNavSearchBar')
    const searchResults = $('#cityTrackerNavSearchResults')
    const cities = opts.cities

    searchInput.on('input', (e) => {
      const query = e.target.value.toLowerCase().trim()
      
      if (query.length === 0) {
        searchResults.hide()
        return
      }

      // Filter cities based on search query
      const filteredCities = filter(cities, (city) => {
        const titleMatch = city.title && city.title.toLowerCase().includes(query)
        const idMatch = city.city_id && city.city_id.toLowerCase().includes(query)
        return titleMatch || idMatch
      })

      // Build results HTML
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
        resultsHtml += `
          <div class="list-group-item">
            <p class="mb-1 text-muted">No cities found</p>
          </div>
        `
      }

      // Add "Add new city" link at the bottom
      resultsHtml += `
        <a href="/editor/#/collections/cities/new" class="list-group-item list-group-item-action list-group-item-info">
          <i class="fa fa-plus-circle"></i> Add new city
        </a>
      `

      searchResults.html(resultsHtml)
      searchResults.show()
    })

    // Hide dropdown when clicking outside
    $(document).on('click', (e) => {
      if (!$(e.target).closest('#cityTrackerNavSearchBar, #cityTrackerNavSearchResults').length) {
        searchResults.hide()
      }
    })

    // Show dropdown when focusing on input if there's a value
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