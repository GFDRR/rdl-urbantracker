import $ from 'jquery'
import {chain, pick, omit, filter, defaults} from 'lodash'

import TmplListGroupItem from '../templates/list-group-item'
import {setContent, slugify, createDatasetFilters, collapseListGroup} from '../util'

export default class {
  constructor (opts) {
    const datatypes = this._datatypesWithCount(opts.datatypes,opts.datasets, opts.params)
    const datatypesMarkup = datatypes.map(TmplListGroupItem)
    setContent(opts.el, datatypesMarkup)
    collapseListGroup(opts.el)
  }


  _datatypesWithCount (datatypes, datasets, params) {
    return chain(datatypes)
      .map(datatype => {
        const paramFilters = createDatasetFilters(pick(params, ['datatype']))
        const filteredDatasets = filter(datasets, paramFilters)
        const datatypeFilters = createDatasetFilters({ datatype: slugify(datatype.title) })
        const datasetsInDatatype = filter(datasets, datatypeFilters)
        const datatypeSlug = slugify(datatype.title)
        const selected = params.datatype && params.datatype === datatypeSlug
        const itemParams = selected ? omit(params, 'datatype') : defaults({datatype: datatypeSlug}, params)
        return {
          title: datatype.title,
          url: '?' + $.param(itemParams),
          count: datasetsInDatatype.length,
          unfilteredCount: filteredDatasets.length,
          selected: selected
        }
      })
      .orderBy('title', 'asc')
      .value()
  }
}
