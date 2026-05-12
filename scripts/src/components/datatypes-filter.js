import $ from 'jquery'
import {chain, pick, omit, filter, defaults} from 'lodash'

import TmplListGroupItem from '../templates/list-group-item'
import {setContent, slugify, createDatasetFilters} from '../util'

export default class {
  constructor (opts) {
    const datatypes = this._datatypesWithCount(opts.datatypes, opts.datasets, opts.params)
    const datatypesMarkup = '<h5>Datatype</h5><div class="list-group-inner overflow-scroll">' + datatypes.map(TmplListGroupItem).join('') + '</div>'
    setContent(opts.el, datatypesMarkup)
  }

  _datatypesWithCount (datatypes, datasets, params) {
    return chain(datatypes)
      .map(datatype => {
        const filters = createDatasetFilters({...params, datatype: slugify(datatype.title) })
        const filteredDatatypes = filter(datasets, filters)
        const datatypeSlug = slugify(datatype.title)
        const selected = params.datatype && params.datatype === datatypeSlug
        const itemParams = selected ? omit(params, 'datatype') : defaults({datatype: datatypeSlug}, params)
        return {
          title: datatype.title,
          url: '?' + $.param(itemParams),
          count: filteredDatatypes.length,
          selected: selected
        }
      })
      .orderBy(['selected','title'], ['desc','asc'])
      .value()
  }
}
