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
          <th scope="col">Flag</th>
          <th scope="col" data-sort="title" style="cursor: pointer;">
            City ${getSortIcon('title')}
          </th>
          <th scope="col" data-sort="country" style="cursor: pointer;">
            Country ${getSortIcon('country')}
          </th>
          <th scope="col" data-sort="countFulfilled" style="cursor: pointer;">
            <span data-scope="compare-cities" data-bs-toggle="tooltip" data-bs-placement="top" title="Number of datatypes satisfied by dataset catalog">Fulfilled ${getSortIcon('countFulfilled')}</span>
          </th>
          <th scope="col" data-sort="countUnfulfilled" style="cursor: pointer;">
            <span data-scope="compare-cities" data-bs-toggle="tooltip" data-bs-placement="top" title="Number of datatypes not satisfied by dataset catalog">Unfulfilled ${getSortIcon('countUnfulfilled')}</span>
          </th>
          <th scope="col" data-sort="coverage" style="cursor: pointer;">
            <span data-scope="compare-cities" data-bs-toggle="tooltip" data-bs-placement="top" title="Percentage of datatypes satisfied by dataset catalog">Coverage ${getSortIcon('coverage')}</span>
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
              ${city.flag ? `<img src="${city.flag}" alt="${city.title} flag" style="max-height: 30px; max-width: 50px;">` : '-'}
            </td>
            <td>
              <a href="/city-tracker?city=${city.city_id}">${city.title}</a>
            </td>
            <td>${city.country || '-'}</td>
            <td>${city.countFulfilled}</td>
            <td>${city.countUnfulfilled}</td>
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
    <script>
      var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"][data-scope="compare-cities"]'))
      var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
      })
    </script>
  `;
};
