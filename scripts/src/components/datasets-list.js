import {pick, defaults, filter} from 'lodash'

import TmplDatasetItem from '../templates/dataset-item'
import {queryByHook, setContent, createDatasetFilters, slugify} from '../util'

export default class {
  constructor (opts) {
    this.elements = {
      datasetsItems: queryByHook('datasets-items', opts.el),
      datasetsHeader: queryByHook('datasets-header', opts.el),
      searchQuery: queryByHook('search-query', opts.el)
    }
    this._initialize(opts)
  }

  _initialize(opts) {
    const filters = createDatasetFilters(opts.params)
    const filteredDatasets = filter(opts.datasets, filters)
    const datasetsMarkup = filteredDatasets.map(TmplDatasetItem)
    setContent(this.elements.datasetsItems, datasetsMarkup)

    this._renderDatasetsHeader(opts, filteredDatasets)

    const searchFunction = this._createSearchFunction(filteredDatasets)
    this.elements.searchQuery.on('keyup', (e) => {
      const query = e.currentTarget.value

      const results = searchFunction(query)
      const resultsMarkup = results.map(TmplDatasetItem)
      setContent(this.elements.datasetsItems, resultsMarkup)

      this._renderDatasetsHeader(opts, results)
    })
  }

  _renderDatasetsHeader(opts, datasets) {
    const datasetSuffix =  datasets.length !== 1 ? 's' : ''
    const cityName = opts.cities.find(c => slugify(c.city_id) === opts.params.city)?.name;
    const datatypeTitle = opts.datatypes.find(dt => slugify(dt.title) === opts.params.datatype)?.title;
    const datatypeCategoryTitle = opts.datatypeCategories.find(dtc => slugify(dtc.title) === opts.params.datatypeCategory)?.title;
    const combinedHeaderText = `${datasets.length} ${datatypeTitle ? datatypeTitle : (datatypeCategoryTitle ?? '')} dataset${datasetSuffix} ${cityName ? ' in ' + cityName : ''}`;
    const datasetsHeaderMarkup = `<h3>${combinedHeaderText}</h3>`;
    setContent(this.elements.datasetsHeader, datasetsHeaderMarkup)
  }

  _createSearchFunction (datasets) {
    const keys = ['title']
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
