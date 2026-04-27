/**
 * Usage:
 * <div data-component="datasets-list">
 *   <h3 class="datasets-count" data-hook="datasets-count"></h3>
 *   <input type="text" data-hook="search-query" placeholder="Search..." class="form-control">
 *   <div data-hook="datasets-items"></div>
 * </div>
 *
 * Optionally, add filters to the component element such as
 *   data-dataype="sample-department"
 *   data-city="education"
 */
import {pick, defaults, filter} from 'lodash'

import TmplDatasetItem from '../templates/dataset-item'
import {queryByHook, setContent, createDatasetFilters} from '../util'

export default class {
  constructor (opts) {
    const elements = {
      datasetsItems: queryByHook('datasets-items', opts.el),
      datasetsCount: queryByHook('datasets-count', opts.el),
      searchQuery: queryByHook('search-query', opts.el)
    }

    const paramFilters = pick(opts.params, ['datatype', 'datatypeCategory', 'city'])
    const attributeFilters = pick(opts.el.data(), ['datatype', 'datatypeCategory', 'city'])
    const filters = createDatasetFilters(defaults(paramFilters, attributeFilters))
    const filteredDatasets = filter(opts.datasets, filters)
    const datasetsMarkup = filteredDatasets.map(TmplDatasetItem)
    setContent(elements.datasetsItems, datasetsMarkup)

    const datasetSuffix =  filteredDatasets.length > 1 ? 's' : ''
    const datasetsCountMarkup = filteredDatasets.length + ' dataset' + datasetSuffix;
    setContent(elements.datasetsCount, datasetsCountMarkup)

    const searchFunction = this._createSearchFunction(filteredDatasets)
    elements.searchQuery.on('keyup', (e) => {
      const query = e.currentTarget.value

      const results = searchFunction(query)
      const resultsMarkup = results.map(TmplDatasetItem)
      setContent(elements.datasetsItems, resultsMarkup)

      const resultsCountMarkup = results.length + ' datasets'
      setContent(elements.datasetsCount, resultsCountMarkup)
    })
  }

  _createSearchFunction (datasets) {
    const keys = ['title', 'notes']
    return function (query) {
      const lowerCaseQuery = query.toLowerCase()
      return filter(datasets, function (dataset) {
        return keys.reduce(function (previousValue, key) {
          return previousValue || (dataset[key] && dataset[key].toLowerCase().indexOf(lowerCaseQuery) !== -1)
        }, false)
      })
    }
  }
}
