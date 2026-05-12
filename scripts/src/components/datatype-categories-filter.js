import $ from 'jquery'
import {chain, pick, omit, filter, defaults} from 'lodash'

import TmplListGroupItem from '../templates/list-group-item'
import {setContent, slugify, createDatasetFilters} from '../util'

export default class {
  constructor (opts) {
    if (opts.params.datatype && !opts.params.datatypeCategory) {
      const selectedDatatype = opts.datatypes.find(dt => slugify(dt.title) === opts.params.datatype)
      opts.params.datatypeCategory = slugify(selectedDatatype.category)
    }
    const datatypeCategories = this._datatypeCategoriesWithCount(opts)
    const datatypeCategoriesMarkup = '<h5>Category</h5><div class="list-group-inner overflow-scroll">' + datatypeCategories.map(TmplListGroupItem).join('') + '</div>'
    setContent(opts.el, datatypeCategoriesMarkup)
  }

  _datatypeCategoriesWithCount({datasets, datatypes, params, el}) {
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
        const datatypeCategorySlug = slugify(datatypeCategory)
        const filters = createDatasetFilters({...params, datatype: null, datatypeCategory: datatypeCategorySlug})
        const filteredDatasets = filter(datasetsInDatatypeCategory, filters)
        const selected = params.datatypeCategory && params.datatypeCategory === datatypeCategorySlug
        const selectedDatatype = datatypes.find(dt => slugify(dt.title) === params.datatype)
        const isCurrentDatatypeInCategory = selectedDatatype?.category === datatypeCategory;
        const itemParams = selected ? omit(params, 'datatypeCategory', 'datatype') : defaults({ datatype: isCurrentDatatypeInCategory ? slugify(selectedDatatype) : null, datatypeCategory: datatypeCategorySlug}, params)

        return {
          title: datatypeCategory,
          url: '?' + $.param(itemParams),
          count: filteredDatasets.length,
          selected: selected,
        }
      })
      .orderBy(['selected','title'], ['desc','asc'])
      .value()
  }
}
