import TmplCityTrackerHeader from '../templates/city-tracker-header'
import {queryByHook, setContent, slugify} from '../util'

export default class {
  constructor (opts) {
    const elements = {
      cityTrackerHeader: queryByHook('city-tracker-header', opts.el),
      cityTrackerDatatypes: queryByHook('city-tracker-datatypes', opts.el),
    }
    if (!opts.params.city) {
      const firstCity = opts.cities[0]
      opts.params.city = slugify(firstCity.city_id)
    }
    const city = opts.cities.find(c => slugify(c.city_id) === opts.params.city);
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
   
    const headerData = {
      ...city,
      countComplete: stats.countComplete,
      countPartial: stats.countPartial,
      countIncomplete: opts.datatypes.length - stats.countComplete - stats.countPartial,
      coverage: (stats.countComplete / opts.datatypes.length * 100).toFixed(2)+"%"
    }
    setContent(elements.cityTrackerHeader, TmplCityTrackerHeader(headerData))
  }
}
