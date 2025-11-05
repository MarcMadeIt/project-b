// getting the geo info from Open-Meteo geocoding API
async function getGeoInfo(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    name
  )}&language=da`;
  const response = await fetch(url);
  const json = await response.json();
  if (!json.results || !json.results.length) throw new Error("By ikke fundet");
  const results = json?.results.map((g) => ({
    name: g.name,
    country: g.country,
    country_code: g.country_code,
    latitude: g.latitude,
    longitude: g.longitude,
    region: g.admin2 || g.admin1 || "",
  }));
  return results;
}

// search pop up handling
const searchButton = document.getElementById("search-button");
const popup = document.getElementById("popup");
const closeButton = document.getElementById("close-popup");

searchButton.addEventListener("click", () => {
  popup.style.display = "flex";
  // focus input field when pop up opens - user can start typing right away
  const si = document.getElementById("search-input");
  if (si) si.focus();
});

closeButton.addEventListener("click", () => {
  popup.style.display = "none";
});

// close popup when clicking outside the content
popup.addEventListener("click", (e) => {
  if (e.target === popup) popup.style.display = "none";
});

// debouncing the search - only search when user stops typing for 3s
const searchInput = document.getElementById("search-input");
const resultsBox = document.getElementById("geo-results");
let debounceTimer = null;

// UI helpers
function showWaiting() {
  resultsBox.innerHTML = `
    <div class="loading">
      <i class="fas fa-hourglass-half fa-spin"></i>
      <span>Waiting for input...</span>
    </div>
  `;
}
function showLoading() {
  resultsBox.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Searching…</span>
    </div>
  `;
}
function showError(msg) {
  resultsBox.innerHTML = `
    <div class="error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>${msg}</span>
    </div>
  `;
}
function renderResults(list) {
  resultsBox.innerHTML = list
    .map(
      (result, index) => `
      <button key="${index}" class="result-item" data-lat="${result.latitude}" data-lon="${result.longitude}" data-name="${result.name}" aria-label="Vælg ${result.name}">
        <i class="fas fa-location-dot"></i>
        <span>${result.name}</span>
        <small>${result.region}, ${result.country} (${result.country_code})</small>
      </button>`
    )
    .join("");

  // attach click handlers
  resultsBox.querySelectorAll(".result-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const lat = parseFloat(btn.dataset.lat);
      const lon = parseFloat(btn.dataset.lon);
      applyLocationAndClosePopup(name, lat, lon); // from meteo-handler.js
    });
  });
}

function clearResults() {
  resultsBox.innerHTML = "";
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim();
  if (debounceTimer) clearTimeout(debounceTimer);

  if (!q) {
    clearResults();
    return;
  }

  // show "waiting" indicator while user might still be typing
  showWaiting();

  debounceTimer = setTimeout(async () => {
    try {
      showLoading(); // now start the fetch
      const data = await getGeoInfo(q);
      renderResults(data);
    } catch (err) {
      showError(err?.message || "Noget gik galt");
    }
  }, 3000);
});
