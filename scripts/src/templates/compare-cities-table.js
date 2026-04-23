export default ({ cities, sortField, sortDirection }) => {
  
  const getSortIcon = (field) => {
    if (sortField !== field) return '<i class="fa fa-sort text-muted"></i>';
    return sortDirection === 'asc' 
      ? '<i class="fa fa-sort-up"></i>' 
      : '<i class="fa fa-sort-down"></i>';
  };

  return `
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th scope="col">Logo</th>
          <th scope="col" data-sort="title" style="cursor: pointer;">
            City ${getSortIcon('title')}
          </th>
          <th scope="col" data-sort="country" style="cursor: pointer;">
            Country ${getSortIcon('country')}
          </th>
          <th scope="col" data-sort="countComplete" style="cursor: pointer;">
            Complete ${getSortIcon('countComplete')}
          </th>
          <th scope="col" data-sort="countExcluded" style="cursor: pointer;">
            Excluded ${getSortIcon('countExcluded')}
          </th>
          <th scope="col" data-sort="coverage" style="cursor: pointer;">
            Coverage ${getSortIcon('coverage')}
          </th>
        </tr>
      </thead>
      <tbody>
        ${cities.length === 0 ? `
          <tr>
            <td colspan="6" class="text-center text-muted">No cities found</td>
          </tr>
        ` : cities.map(city => `
          <tr>
            <td>
              ${city.logo ? `<img src="${city.logo}" alt="${city.title} logo" style="max-height: 30px; max-width: 50px;">` : '-'}
            </td>
            <td>
              <a href="/city-tracker?city=${city.city_id}">${city.title}</a>
            </td>
            <td>${city.country || '-'}</td>
            <td>${city.countComplete}</td>
            <td>${city.countExcluded}</td>
            <td>
              <div class="d-flex align-items-center">
                <div class="progress flex-grow-1 me-2" style="height: 20px; min-width: 100px;">
                  <div class="progress-bar ${city.coveragePercent >= 80 ? 'bg-success' : city.coveragePercent >= 50 ? 'bg-warning' : 'bg-danger'}" 
                      role="progressbar" 
                      style="width: ${city.coveragePercent}%" 
                      aria-valuenow="${city.coveragePercent}" 
                      aria-valuemin="0" 
                      aria-valuemax="100">
                  </div>
                </div>
                <span class="text-nowrap">${city.coverage}</span>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};
