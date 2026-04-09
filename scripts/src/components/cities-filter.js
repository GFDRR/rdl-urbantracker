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
      .filter('cities')
      .flatMap(function (dataset) {
        return dataset.cities.map(function (city) {
          return {
            city: city.title,
            dataset: dataset
          }
        })
      })
      .groupBy('city')
      .map(function (cityDatasets, city) {
        const datasetsInCity = cityDatasets.map(function (cd) { return cd.dataset })
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
