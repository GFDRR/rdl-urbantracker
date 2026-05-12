export default ({ cityDatatypes, sortField, sortDirection }) => {
  const getSortIcon = (field) => {
    return '';
    if (sortField !== field) return '<i class="fa fa-sort text-muted"></i>';
    return sortDirection === 'asc' 
      ? '<i class="fa fa-sort-up"></i>' 
      : '<i class="fa fa-sort-down"></i>';
  };

  const groupedByCategory = cityDatatypes.reduce((acc, cdt) => {
    if (!acc[cdt.datatype.category]) {
      acc[cdt.datatype.category] = [];
    }
    acc[cdt.datatype.category].push(cdt);
    return acc;
  }, {});

  const getCategoryId = (category) => {
    return 'category-' + category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  const getTooltipAttrs = (cdt) => {
    const description = cdt.datatype.description;
    if (!description) return ''
    const exampleIndicators = cdt.datatype.example_indicators;
    const title = description + (exampleIndicators ? ', e.g. ' + exampleIndicators : '');
    return `data-scope="city-tracker" data-bs-toggle="tooltip" data-bs-placement="right" title="${title}"`
  }

  return `
    <table class="table table-hover m-0">
      <thead>
        <tr>
          <th scope="col" data-sort="datatype">Datatype ${getSortIcon('datatype')}</th>
          <th scope="col" data-sort="dataset">Fulfilled ${getSortIcon('dataset')}</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(groupedByCategory).map(([category, items]) => {
          const categoryId = getCategoryId(category);
          return `
          <tr class="category-header" data-category="${categoryId}" style="cursor: pointer;">
            <td class="font-weight-bold">
              <i class="fa fa-chevron-right mr-2 toggle-icon"></i>
              ${category}
              <span class="badge badge-secondary ml-2 count-badge">${items.filter(item => !!item.isFulfilled).length}/${items.length}</span>
            </td>
            <td class="cell-is-fulfilled"></td>
          </tr>
          ${items.map((cdt) => `
            <tr class="category-row ${categoryId}" style="display: none;">
              <td><span ${getTooltipAttrs(cdt)}>${cdt.datatype.title}</span></td>
              <td class="cell-is-fulfilled">${cdt.isFulfilled
                ? `<a href="${cdt.url}">
                    <i class="m-1 fa fa-check"></i>View
                  </a>
                  <a href="${cdt.addUrl}">
                    <i class="m-1 fa fa-plus-circle"></i>Add More
                  </a>`
                : `<a class="text-danger" href="${cdt.addUrl}">
                    <i class="m-1 fa fa-plus-circle"></i>Add
                  </a>`
              }</td>
            </tr>
          `).join("\n")}
          `;
        }).join("\n")}
      </tbody>
    </table>
    <script>
      var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"][data-scope="city-tracker"]'))
      var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
       return new bootstrap.Tooltip(tooltipTriggerEl)
      })
    </script>
  `;
};
