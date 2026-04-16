import $ from 'jquery'
import {chain, omit, defaults} from 'lodash'

import CityTrackerNavItem from '../templates/city-tracker-nav-item'
import {setContent, slugify, collapseListGroup} from '../util'

export default class {
  constructor (opts) {
    if (!opts.params.city) {
      const firstCity = opts.cities[0]
      opts.params.city = slugify(firstCity.city_id)
    }
    const citiesData = opts.cities.map(city => {
      const citySlug = slugify(city.city_id)
      const selected = opts.params.city && opts.params.city === citySlug
      const itemParams = selected ? omit(opts.params, 'city') : defaults({city: citySlug}, opts.params)

      const cityDatasets = opts.datasets.filter(d => d.cities && d.cities.some(c => c.city_id === city.city_id))
      const stats = cityDatasets.reduce((acc, dataset) => {
        const datatypes = dataset.datatypes || []
        datatypes.forEach(datatype => {
          if (datatype.isPartial) {
            acc.countPartial += 1
          } else {
            acc.countComplete += 1
          }
        })
        return acc
      }, {
        countComplete: 0,
        countPartial: 0,      
      });
      return {
        ...city,
        ...stats,
        coverage: (stats.countComplete / opts.datatypes.length * 100).toFixed(2)+"%",
        url: '?' + $.param(itemParams),
        selected: selected
      }
    })
   

    const citiesMarkup = citiesData.map(CityTrackerNavItem)
    setContent(opts.el, citiesMarkup)
    collapseListGroup(opts.el)
    // TODO: implement search and add to filter section
  }

  // Given an array of datasets, returns an array of their cities with counts
  _cities (datasets, params) {
    return chain(datasets)
      .filter('cities')
      .flatMap(function (dataset) {
        return dataset.cities.map(function (city) {
          return {
            title: city.title,
            id: city.city_id,
          }
        })
      })
      .map(function (city) {
        const citySlug = slugify(city.id)
        const selected = params.city && params.city === citySlug
        const itemParams = selected ? omit(params, 'city') : defaults({city: citySlug}, params)
        return {
          title: city.title,
          id: city.id,
          url: '?' + $.param(itemParams),
          selected: selected
        }
      })
      .orderBy('unfilteredCount', 'desc')
      .value()
  }
}
