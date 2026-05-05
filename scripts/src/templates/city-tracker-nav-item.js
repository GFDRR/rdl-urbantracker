export default (data) => (
`
  <a href="${data.url}" class="list-group-item${data.selected ? ' override-active ' : ''} list-group-item-action">
    <div class="d-flex w-100 justify-content-between">
      <h6 class="mb-1">${data.title}</h6>
    </div>
    <small class="text-muted">${data.coverage ?? data.city_id}</small>
  </a>
`
)
