import $ from 'jquery'
import {chain, pick, omit, filter, defaults} from 'lodash'

import TmplListGroupItem from '../templates/list-group-item'
import {setContent, slugify, createDatasetFilters, collapseListGroup} from '../util'

export default class {
  constructor (opts) {
    const cities = this._citiesWithCount(opts.datasets, opts.params)
    const citiesMarkup = cities.map(TmplListGroupItem)
    setContent(opts.el, citiesMarkup)
    collapseListGroup(opts.el)
  }

  // Given an array of datasets, returns an array of their cities with counts
  _citiesWithCount (datasets, params) {
    return chain(datasets)
      .filter('city')
      .flatMap(function (value) {
        // Explode objects where city is an array into one object per city
        if (typeof value.city === 'string') return value
        const duplicates = []
        value.city.forEach(function (city) {
          duplicates.push(defaults({city: city}, value))
        })
        return duplicates
      })
      .groupBy('city')
      .map(function (datasetsInCity, city) {
        const filters = createDatasetFilters(pick(params, ['city']))
        const filteredDatasets = filter(datasetsInCity, filters)
        const citySlug = slugify(city)
        const selected = params.city && params.city === citySlug
        const itemParams = selected ? omit(params, 'city') : defaults({city: citySlug}, params)
        return {
          title: city,
          url: '?' + $.param(itemParams),
          count: filteredDatasets.length,
          unfilteredCount: datasetsInCity.length,
          selected: selected
        }
      })
      .orderBy('unfilteredCount', 'desc')
      .value()
  }
}
