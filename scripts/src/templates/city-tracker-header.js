export default (data) => (`
  <h3>${data.title}</h3>
  <h6><a href="https://www.wikidata.org/wiki/${data.city_id}">${data.city_id}</a></h6>

  <p class="city-tracker-header-stats">${data.countComplete} Complete - ${data.countPartial} Partial - ${data.countIncomplete} Incomplete - Coverage ${data.coverage}</p>
`)
