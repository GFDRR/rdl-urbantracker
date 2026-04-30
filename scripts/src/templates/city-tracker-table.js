export default ({ cityDatatypes, sortField, sortDirection }) => {
  const getSortIcon = (field) => {
    return '';
    if (sortField !== field) return '<i class="fa fa-sort text-muted"></i>';
    return sortDirection === 'asc' 
      ? '<i class="fa fa-sort-up"></i>' 
      : '<i class="fa fa-sort-down"></i>';
  };

  const groupedByCategory = cityDatatypes.reduce((acc, cdt) => {
    const category = cdt.datatype.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cdt);
    return acc;
  }, {});

  const getCategoryId = (category) => {
    return 'category-' + category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  return `
    <table class="table table-striped table-hover m-0">
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
            <td colspan="2" class="font-weight-bold">
              <i class="fa fa-chevron-right mr-2 toggle-icon"></i>
              ${category}
              <span class="badge badge-secondary ml-2">${items.filter(item => !!item.dataset).length}/${items.length}</span>
            </td>
          </tr>
          ${items.map((cdt) => `
            <tr class="category-row ${categoryId}" style="display: none;">
              <td>${cdt.datatype.title}</td>
              <td>${cdt.dataset && !cdt.dataset.is_partial && !cdt.dataset.is_unavailable
                ? `<a href="${cdt.dataset.url}">
                    <i class="m-1 fa fa-check"></i>View
                  </a>`
                : `<a class="text-danger" href="/editor/#/collections/datasets/new">
                    <i class="m-1 fa fa-plus-circle"></i>Add
                  </a>`
              }</td>
            </tr>
          `).join("\n")}
          `;
        }).join("\n")}
      </tbody>
    </table>
  `;
};
