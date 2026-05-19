import $ from 'jquery'
import {chain, omit, defaults, filter, orderBy, debounce} from 'lodash'

import {setContent, slugify, queryByHook} from '../util'

export default class {
  constructor (opts) {
    this.elements = {
      overallCoverage: queryByHook('overall-coverage', opts.el),
    }
    const overallCoverage = this._calculateOverallCoverage(opts);
    this.elements.overallCoverage.text(`Overall Coverage: ${overallCoverage}`)
  }

  _calculateOverallCoverage(opts) {
    const citiesWithStats = opts.cities.map(city => {
      const cityDatasets = opts.datasets.filter(dataset => 
        dataset.cities && dataset.cities.some(c => slugify(c.city_id) === slugify(city.city_id))
      );
      const stats = cityDatasets.reduce((acc, dataset) => {
        const datatypes = dataset.datatypes || [];
        if (!dataset.is_partial && !dataset.is_unavailable) {
          datatypes.forEach(dt => acc.datatypesFulfilled.add(dt.title))
        }
        return acc
      }, {
        datatypesFulfilled: new Set()    
      });      
      
      return {
        ...city,
        countFulfilled: stats.datatypesFulfilled.size,
        countUnfulfilled: opts.datatypes.length - stats.datatypesFulfilled.size,
        coverage: (stats.datatypesFulfilled.size / opts.datatypes.length * 100).toFixed(2)+"%",
        datatypesFulfilled: stats.datatypesFulfilled,
      };
    });
    return citiesWithStats.reduce((acc, cityWithStats) => {
      const totalCountFulfilled= acc.totalCountFulfilled + cityWithStats.countFulfilled;
      return {
        totalCountFulfilled,
        coverage: (totalCountFulfilled / (opts.datatypes.length*opts.cities.length) * 100).toFixed(2)+"%",
      }
    }, {
      totalCountFulfilled: 0,
    }).coverage;
  }
}