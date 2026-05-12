import $ from 'jquery'
import {chain, pick, omit, filter, defaults} from 'lodash'

import TmplListGroupItem from '../templates/list-group-item'
import {setContent, slugify, createDatasetFilters} from '../util'

export default class {
  constructor (opts) {
    const cities = this._citiesWithCount(opts.cities, opts.datasets, opts.params)
    const citiesMarkup = '<h5>City</h5><div class="list-group-inner overflow-scroll">' + cities.map(TmplListGroupItem).join('') + '</div>'
    setContent(opts.el, citiesMarkup)
  }

  _citiesWithCount(cities, datasets, params) {
    return chain(cities)
      .map(city => {
        const filters = createDatasetFilters({ ...params, city: slugify(city.city_id) })
        const filteredDatasets = filter(datasets, filters)
        const citySlug = slugify(city.city_id)
        const selected = params.city && params.city === citySlug
        const itemParams = selected ? omit(params, 'city') : defaults({city: citySlug}, params)
        return {
          title: city.title,
          url: '?' + $.param(itemParams),
          count: filteredDatasets.length,
          selected: selected
        }
      })
      .orderBy(['selected','title'], ['desc','asc'])
      .value()
  }
}
