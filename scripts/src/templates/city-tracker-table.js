export default ({ cityDatatypes, sortField, sortDirection }) => {
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
          <th scope="col" data-sort="category" style="cursor: pointer;">Category ${getSortIcon('category')}</th>
          <th scope="col" data-sort="datatype" style="cursor: pointer;">Datatype ${getSortIcon('datatype')}</th>
          <th scope="col" data-sort="dataset" style="cursor: pointer;">Dataset ${getSortIcon('dataset')}</th>
        </tr>
      </thead>
      <tbody>
        ${cityDatatypes.map((cdt) => `
          <tr>
            <td>${cdt.datatype.category}</td>
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
          `)
          .join("\n")}
      </tbody>
    </table>
  `;
};
