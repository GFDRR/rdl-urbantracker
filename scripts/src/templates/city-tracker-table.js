export default (cityDatatypes) => (`
<table class="table">
  <thead>
    <tr>
      <th scope="col">Category</th>
      <th scope="col">Datatype</th>
      <th scope="col">Dataset</th>
    </tr>
  </thead>
  <tbody>
    ${cityDatatypes.map(cdt => {
      return `
        <tr>
          <td>${cdt.datatype.category}</td>
          <td>${cdt.datatype.title}</td>
          ${cdt.dataset && !cdt.dataset.is_partial && !cdt.dataset.is_unavailable
            ? `<td><a href="${cdt.dataset.url}">
                <i class="m-1 fa fa-check"></i>View
              </a></td>`
            : `<td><a class="text-danger" href="/editor/#/collections/datasets/new?datatypes=${encodeURIComponent(cdt.datatype.title)}">
                <i class="m-1 fa fa-plus-circle"></i>Add
              </a></td>`
          }
        </tr>
      `
    }).join('\n')}
  </tbody>
</table>
`)
