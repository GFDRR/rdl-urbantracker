import $ from 'jquery'
import {chain, pick, omit, filter, defaults} from 'lodash'

import TmplListGroupItem from '../templates/list-group-item'
import {setContent, slugify, createDatasetFilters, collapseListGroup} from '../util'

export default class {
  constructor (opts) {
    const datatypes = this._datatypesWithCount(opts.datasets, opts.params)
    const datatypesMarkup = datatypes.map(TmplListGroupItem)
    setContent(opts.el, datatypesMarkup)
    collapseListGroup(opts.el)
  }

  _datatypesWithCount (datasets, params) {
    return chain(datasets)
    .filter('datatypes')
    .flatMap(function (dataset) {
      return dataset.datatypes.map(function (datatype) {
        return {
          datatype: datatype.title,
          dataset: dataset
        }
      })
    })
      .groupBy('datatype')
      .map(function (datatypeDatasets, datatype) {
        const datasetsInDatatype = datatypeDatasets.map(function (dd) { return dd.dataset })
        const filters = createDatasetFilters(pick(params, ['datatype']))
        const filteredDatasets = filter(datasetsInDatatype, filters)
        const datatypeSlug = slugify(datatype)
        const selected = params.datatype && params.datatype === datatypeSlug
        const itemParams = selected ? omit(params, 'datatype') : defaults({datatype: datatypeSlug}, params)
        return {
          title: datatype,
          url: '?' + $.param(itemParams),
          count: filteredDatasets.length,
          unfilteredCount: datasetsInDatatype.length,
          selected: selected
        }
      })
      .orderBy('unfilteredCount', 'desc')
      .value()
  }
}
