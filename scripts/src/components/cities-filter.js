import $ from 'jquery'
import {chain, pick, omit, filter, defaults} from 'lodash'

import TmplListGroupItem from '../templates/list-group-item'
import {setContent, slugify, createDatasetFilters, collapseListGroup} from '../util'

export default class {
  constructor (opts) {
    const cities = this._citiesWithCount(opts.cities, opts.datasets, opts.params)
    const citiesMarkup = '<h5>City</h5><div class="list-group-inner overflow-scroll">' + cities.map(TmplListGroupItem).join('') + '</div>'
    setContent(opts.el, citiesMarkup)
    collapseListGroup(opts.el)
  }

  _citiesWithCount(cities, datasets, params) {
    return chain(cities)
      .map(city => {
        const paramFilters = createDatasetFilters(pick(params, ['city']))
        const filteredDatasets = filter(datasets, paramFilters)
        const cityFilters = createDatasetFilters({ city: slugify(city.city_id) })
        const datasetsInCity = filter(datasets, cityFilters)
        const citySlug = slugify(city.city_id)
        const selected = params.city && params.city === citySlug
        const itemParams = selected ? omit(params, 'city') : defaults({city: citySlug}, params)
        return {
          title: city.title,
          url: '?' + $.param(itemParams),
          count: datasetsInCity.length,
          selected: selected
        }
      })
      .orderBy('title', 'asc')
      .value()
  }
}
