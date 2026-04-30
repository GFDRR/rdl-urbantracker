export default (data) => (
`<a href="${data.url}" class="city-list-group-item${data.selected ? ' override-active ' : ''} list-group-item-action">
  <p>${data.title}</p>
  <p>Coverage: ${data.coverage}</p>
</a>`
)
