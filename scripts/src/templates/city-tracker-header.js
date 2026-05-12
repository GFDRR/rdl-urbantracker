export default (data) => (`
  <h3>${data.title}</h3>
  <h6>Wikidata ID: <a data-scope="city-tracker-header" data-bs-toggle="tooltip" data-bs-placement="right" title="Link to Wikidata entry" href="https://www.wikidata.org/wiki/${data.city_id}">${data.city_id}</a></h6>
  <p class="city-tracker-header-stats">${data.countFulfilled} Fulfilled - ${data.countUnfulfilled} Unfulfilled - Coverage ${data.coverage}</p>
  <script>
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"][data-scope="city-tracker-header"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })
  </script>
`)
