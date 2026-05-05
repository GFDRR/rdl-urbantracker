export default (data) => (
`<a href="${data.url}" class="list-group-item ${data.selected ? 'override-active ' : 'override-inactive'} list-group-item-action">
  ${data.title}
  <span>${
    data.selected
      ? '<span class="badge override-active rounded-pill"><i class="fa fa-times"></i></span>'
      : '<span class="badge override-inactive rounded-pill">' + data.count + '</span>'}
  </span>
</a>`
)
