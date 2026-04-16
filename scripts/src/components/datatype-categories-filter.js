import $ from 'jquery'
import {chain, pick, omit, filter, defaults} from 'lodash'

import TmplListGroupItem from '../templates/list-group-item'
import {setContent, slugify, createDatasetFilters, collapseListGroup} from '../util'

export default class {
  constructor (opts) {
    const datatypeCategories = this._datatypeCategoriesWithCount(opts.datasets, opts.params, opts.el)
    const datatypeCategoriesMarkup = datatypeCategories.map(TmplListGroupItem)
    setContent(opts.el, datatypeCategoriesMarkup)
    collapseListGroup(opts.el)
  }

  _datatypeCategoriesWithCount (datasets, params, el) {
    // Check if this filter is in a sidebar context
    const isSidebar = el.closest('.sidebar-filter').length > 0
    const baseUrl = isSidebar ? (window.settings && window.settings.BASE_URL ? window.settings.BASE_URL : '') : ''

    return chain(datasets)
    .filter('datatypes')
    .flatMap(function (dataset) {
      return dataset.datatypes.map(function (datatype) {
        return {
          datatype: datatype.title,
          datatypeCategory: datatype.category,
          dataset: dataset
        }
      })
    })
      .groupBy('datatypeCategory')
      .map(function (datatypeCategoryDatasets, datatypeCategory) {
        const datasetsInDatatypeCategory = datatypeCategoryDatasets.map(function (dcd) { return dcd.dataset })
        const filters = createDatasetFilters(pick(params, ['datatypeCategory']))
        const filteredDatasets = filter(datasetsInDatatypeCategory, filters)
        const datatypeCategorySlug = slugify(datatypeCategory)
        const selected = params.datatypeCategory && params.datatypeCategory === datatypeCategorySlug
        const itemParams = selected ? omit(params, 'datatypeCategory') : defaults({datatypeCategory: datatypeCategorySlug}, params)

        return {
          title: datatypeCategory,
          url: '?' + $.param(itemParams),
          count: filteredDatasets.length,
          unfilteredCount: datasetsInDatatypeCategory.length,
          selected: selected
        }
      })
      .orderBy('title', 'asc')
      .value()
  }
}
