export default () => (
`
  <div class="mb-3 position-relative">
    <input type="text" class="form-control" id="cityTrackerNavSearchBar" placeholder="Search cities..." autocomplete="off">
    <div id="cityTrackerNavSearchResults" class="list-group position-absolute w-100 shadow-sm" style="z-index: 1000; max-height: 300px; overflow-y: auto; display: none;"></div>
  </div>
`
)