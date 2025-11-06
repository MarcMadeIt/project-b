
async function getGeoInfo(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&language=da`;
  const response = await fetch(url);
  const json = await response.json();
  if (!json.results || !json.results.length) throw new Error("By ikke fundet");
  return json.results.map((g) => ({
    name: g.name,
    country: g.country,
    country_code: g.country_code,
    latitude: g.latitude,
    longitude: g.longitude,
    region: g.admin2 || g.admin1 || "",
  }));
}

// Geolocation helper wrapped in a Promise
function getCurrentPositionPromise(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      return reject(new Error('Geolocation ikke tilgængelig'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      options
    );
  });
}

// Reverse geocoding: coords -> nearest place info
async function getGeoInfoReverse(lat, lon) {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&language=da`;
  const response = await fetch(url);
  const json = await response.json();
  if (!json.results || !json.results.length) return null;
  const g = json.results[0];
  return {
    name: g.name,
    country: g.country,
    country_code: g.country_code,
    latitude: g.latitude,
    longitude: g.longitude,
    region: g.admin2 || g.admin1 || "",
  };
}

(function () {
  let locationButton, locationModal, closeLocationBtn, searchInput, resultsBox, loadingEl, errorEl, tpl, useCurrentBtn;
  let debounceTimer = null;

  document.addEventListener('DOMContentLoaded', () => {
    locationButton = document.getElementById('locationBtn');
    locationModal = document.getElementById('popup');
    closeLocationBtn = document.getElementById('close-popup');
    searchInput = document.getElementById('search-input');
    resultsBox = document.getElementById('geo-results');
    loadingEl = document.getElementById('geo-loading');
    errorEl = document.getElementById('geo-error');
    tpl = document.getElementById('geo-result-template');
    useCurrentBtn = document.getElementById('use-current-location');

    setup();
  });

  function setup() {
    if (locationButton) locationButton.addEventListener('click', openLocationModal);
    if (closeLocationBtn) closeLocationBtn.addEventListener('click', closeLocationModal);

    if (locationModal) {
      locationModal.addEventListener('click', (e) => {
        if (e.target === locationModal) closeLocationModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (locationModal && locationModal.style.display === 'flex' && e.key === 'Escape') {
        e.preventDefault();
        closeLocationModal();
      }
    });

    if (searchInput) searchInput.addEventListener('input', handleSearchInput);
    if (resultsBox) resultsBox.addEventListener('click', handleResultClick);
    if (useCurrentBtn) useCurrentBtn.addEventListener('click', handleUseCurrentLocation);
  }

  function openLocationModal() {
    if (!locationModal) return;
    locationModal.style.display = 'flex';
    locationModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    showDefaultCities();
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
  }

  function closeLocationModal() {
    if (!locationModal) return;
    locationModal.style.display = 'none';
    locationModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function showDefaultCities() {
    const defaultCities = [
      { name: 'København', country: 'Danmark', country_code: 'DK', latitude: 55.6761, longitude: 12.5683, region: 'Hovedstaden' },
      { name: 'Aarhus', country: 'Danmark', country_code: 'DK', latitude: 56.1629, longitude: 10.2039, region: 'Midtjylland' },
      { name: 'Odense', country: 'Danmark', country_code: 'DK', latitude: 55.4038, longitude: 10.4024, region: 'Fyn' },
      { name: 'Aalborg', country: 'Danmark', country_code: 'DK', latitude: 57.0488, longitude: 9.9217, region: 'Nordjylland' },
      { name: 'Esbjerg', country: 'Danmark', country_code: 'DK', latitude: 55.4765, longitude: 8.4594, region: 'Syddanmark' }
    ];
    renderResults(defaultCities);
  }

  function toggleLoading(show) {
    if (!loadingEl) return;
    loadingEl.hidden = !show;
  }

  function toggleError(msg) {
    if (!errorEl) return;
    if (msg) {
      errorEl.hidden = false;
      const span = errorEl.querySelector('span');
      if (span) span.textContent = msg;
    } else {
      errorEl.hidden = true;
    }
  }

  async function handleUseCurrentLocation() {
    if (!useCurrentBtn) return;
    toggleError(null);
    useCurrentBtn.disabled = true;
    toggleLoading(true);
    try {
      const pos = await getCurrentPositionPromise({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      const { latitude, longitude } = pos.coords;
      // Try reverse geocoding to display a friendly name
      let place = null;
      try {
        place = await getGeoInfoReverse(latitude, longitude);
      } catch { /* ignore reverse errors; we can still proceed */ }

      const name = place?.name || 'Din placering';
      const country = place?.country || '';
      const countryCode = place?.country_code || '';

      if (typeof applyLocationAndClosePopup === 'function') {
        await applyLocationAndClosePopup(name, latitude, longitude, country, countryCode);
      } else {
        updateCurrentCity(name, latitude, longitude, country);
        closeLocationModal();
      }
    } catch (err) {
      let msg = 'Kunne ikke få adgang til geolocation';
      if (err && err.code === 1) msg = 'Tillad adgang til placering for at bruge denne funktion'; // PERMISSION_DENIED
      toggleError(msg);
    } finally {
      toggleLoading(false);
      useCurrentBtn.disabled = false;
    }
  }

  function clearResults() {
    if (resultsBox) resultsBox.innerHTML = '';
  }

  function buildResultItem(item) {
    const node = tpl && tpl.content ? tpl.content.firstElementChild.cloneNode(true) : document.createElement('button');
    node.className = node.className || 'result-item';
    node.dataset.lat = item.latitude;
    node.dataset.lon = item.longitude;
    node.dataset.name = item.name;
    node.dataset.country = item.country || '';
    node.dataset.countryCode = item.country_code || '';
    node.setAttribute('aria-label', `Vælg ${item.name}`);
    const nameEl = node.querySelector('.result-name');
    const subEl = node.querySelector('.result-sub');
    if (nameEl) nameEl.textContent = item.name;
    if (subEl) subEl.textContent = `${item.region ? item.region + ', ' : ''}${item.country} (${item.country_code})`;
    if (!nameEl || !subEl) {
      node.innerHTML = `<i class="fas fa-location-dot"></i><span>${item.name}</span><small>${item.region ? item.region + ', ' : ''}${item.country} (${item.country_code})</small>`;
    }
    return node;
  }

  function renderResults(list) {
    clearResults();
    if (!list || !list.length) {
      const empty = document.createElement('div');
      empty.className = 'result-item';
      empty.textContent = 'Ingen resultater';
      resultsBox.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    for (const item of list) frag.appendChild(buildResultItem(item));
    resultsBox.appendChild(frag);
  }

  function updateCurrentCity(name, lat, lon, country) {
    const currentCityElement = document.querySelector('.current-city h3');
    if (currentCityElement) currentCityElement.textContent = country ? `${name}, ${country}` : name;
    window.selectedCity = { name, lat, lon };
  }

  function handleResultClick(e) {
    const btn = e.target.closest('.result-item');
    if (!btn) return;
    const name = btn.dataset.name;
    const lat = parseFloat(btn.dataset.lat);
    const lon = parseFloat(btn.dataset.lon);
    const country = btn.dataset.country || '';
    const countryCode = btn.dataset.countryCode || '';
    if (typeof applyLocationAndClosePopup === 'function') {
      applyLocationAndClosePopup(name, lat, lon, country, countryCode);
    } else {
      updateCurrentCity(name, lat, lon, country);
      closeLocationModal();
    }
  }

  function handleSearchInput() {
    const q = (searchInput?.value || '').trim();
    if (debounceTimer) clearTimeout(debounceTimer);

    if (!q) {
      showDefaultCities();
      return;
    }

    toggleError(null);
    toggleLoading(false);
    if (resultsBox) resultsBox.innerHTML = '<div class="loading"><i class="fas fa-hourglass-half fa-spin"></i><span>Søger...</span></div>';

    debounceTimer = setTimeout(async () => {
      try {
        toggleError(null);
        toggleLoading(true);
        const data = await getGeoInfo(q);
        renderResults(data);
      } catch (err) {
        renderResults([]);
        toggleError(err?.message || 'Noget gik galt');
      } finally {
        toggleLoading(false);
      }
    }, 600);
  }
})();
