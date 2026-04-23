import { defaults, filter, pick } from 'lodash'
import TmplCityTrackerHeader from '../templates/city-tracker-header'
import TmplCityTrackerTable from '../templates/city-tracker-table'
import {createDatasetFilters, queryByHook, setContent, slugify} from '../util'

export default class {
  constructor (opts) {
    const elements = {
      cityTrackerHeader: queryByHook('city-tracker-header', opts.el),
      cityTrackerTable: queryByHook('city-tracker-table', opts.el),
    }
    if (!opts.params.city) {
      const firstCity = opts.cities[0]
      opts.params.city = slugify(firstCity.city_id)
    }
    
    const paramFilters = pick(opts.params, ['datatypeCategory', 'city'])
    const attributeFilters = pick(opts.el.data(), ['datatypeCategory', 'city'])
    const filters = createDatasetFilters(defaults(paramFilters, attributeFilters))
    const filteredDatasets = filter(opts.datasets, filters)
    
    const stats = filteredDatasets.reduce((acc, dataset) => {
      const datatypes = dataset.datatypes || [];
      if (dataset.is_partial || dataset.is_unavailable) {
        acc.countExcluded += datatypes.length
      } else {
        acc.countComplete += datatypes.length
      }
      return acc
    }, {
      countComplete: 0,
      countExcluded: 0,      
    });
    const city = opts.cities.find(c => slugify(c.city_id) === opts.params.city);
    const headerData = {
      ...city,
      countComplete: stats.countComplete,
      countExcluded: stats.countExcluded,
      coverage: (stats.countComplete / opts.datatypes.length * 100).toFixed(2)+"%"
    }
    const filteredDatatypes = defaults(paramFilters, attributeFilters).datatypeCategory
      ? opts.datatypes.filter(dt => slugify(dt.category) === defaults(paramFilters, attributeFilters).datatypeCategory)
      : opts.datatypes;
    const cityDatatypes = filteredDatatypes.map(datatype => {
      const dataset = filteredDatasets.find(d => d.datatypes && d.datatypes.some(dt => dt.title === datatype.title))
      return {
        datatype: datatype,
        dataset: dataset,
      }
    }).sort((a, b) => {
      if ( a.datatype.category < b.datatype.category ){
        return -1;
      }
      if ( a.datatype.category > b.datatype.category ){
        return 1;
      }
      if ( a.datatype.title < b.datatype.title ){
        return -1;
      }
      if ( a.datatype.title > b.datatype.title ){
        return 1;
      }
      if (a.dataset && b.dataset) {
        if (a.dataset.title < b.dataset.title) {
          return -1;
        }
        if (a.dataset.title > b.dataset.title) {
          return 1;
        }
      }
      return 0;
    })
    setContent(elements.cityTrackerHeader, TmplCityTrackerHeader(headerData))
    setContent(elements.cityTrackerTable, TmplCityTrackerTable(cityDatatypes))
  }
}
