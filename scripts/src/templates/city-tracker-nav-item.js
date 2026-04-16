export default (data) => (
`<a href="${data.url}" class="list-group-item${data.selected ? ' active ' : ''} list-group-item-action">
  <p>${data.title}</p>
  <p>${data.city_id}</p>
  <p>Coverage: ${data.coverage}</p>
</a>`
)
