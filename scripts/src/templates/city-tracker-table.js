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
          ${cdt.dataset && !cdt.dataset.is_partial && !cdt.dataset.is_unavailable ? `<td><a href="${cdt.dataset.url}">View dataset</a></td>` : `<td>No dataset</td>`}
        </tr>
      `
    }).join('\n')}
  </tbody>
</table>
`)
