function initForecastTabs() {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = {
    "forecast-hours": document.getElementById('forecast-hours'),
    "forecast-week": document.getElementById('forecast-week')
  };

  function activate(tab) {
    // Deaktiver alle tabs
    tabs.forEach(t => {
      t.classList.remove('is-active');
      t.setAttribute('aria-selected', 'false');
    });
    // Skjul alle paneler
    Object.values(panels).forEach(p => p.hidden = true);

    // Aktiver valgt tab + panel
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    const panelId = tab.getAttribute('aria-controls');
    if (panelId && panels[panelId]) panels[panelId].hidden = false;
  }

  // Klik-aktivering
  tabs.forEach(t => t.addEventListener('click', () => activate(t)));

  // Tastaturnavigation (valgfrit)
  const tablistEl = document.querySelector('[role="tablist"]');
  if (tablistEl) {
    tablistEl.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(i + 1) % tabs.length].focus(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); tabs[(i - 1 + tabs.length) % tabs.length].focus(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(document.activeElement); }
    });
  }

  // Start med week-tab
  activate(document.getElementById('tab-week'));
}

// Kald funktionen når DOM'en er klar
document.addEventListener('DOMContentLoaded', initForecastTabs);




// ---- Settings modal (localStorage) ----
const settingsBtn = document.getElementById('settingsBtn');
const settingsPopup = document.getElementById('userSettings');
const settingsCloseBtn = document.getElementById('closePopupBtn');
const settingsForm = document.getElementById('settingsForm');
const saveBtn = settingsForm ? settingsForm.querySelector('.save-btn') : null;

const prefCityInput = document.getElementById('prefCity');
const prefClothesSelect = document.getElementById('prefClothesSelect');
const themeSelect = document.getElementById('themeSelect');
const notifToggle = document.getElementById('notifToggle');
// Settings-only city search controls (use the same prefCityInput as the search box)
const settingsCityResults = document.getElementById('settingsCityResults');
const settingsCityLoading = document.getElementById('settingsCityLoading');
const settingsCityError = document.getElementById('settingsCityError');
let settingsCityDebounce = null;

let lastFocused = null;

const LS_KEY = 'ahvejr.settings';
const DEFAULTS = {
  city: { name: '', lat: null, lon: null, country: '', country_code: '' },
  clothes: 'neutral',
  theme: 'light',
  notifications: true
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      city: { ...DEFAULTS.city, ...(parsed.city || {}) }
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(LS_KEY, JSON.stringify(settings));
}

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function setFormFromSettings(s) {
  if (prefCityInput) prefCityInput.value = s.city?.name || '';
  if (prefCityInput) {
    if (s.city?.lat != null) prefCityInput.dataset.lat = String(s.city.lat);
    if (s.city?.lon != null) prefCityInput.dataset.lon = String(s.city.lon);
    if (s.city?.country) prefCityInput.dataset.country = String(s.city.country);
    if (s.city?.country_code) prefCityInput.dataset.countryCode = String(s.city.country_code);
  }
  if (prefClothesSelect) prefClothesSelect.value = s.clothes || 'neutral';
  if (themeSelect) themeSelect.value = s.theme || 'light';
  if (notifToggle) notifToggle.value = String(!!s.notifications);
}

function getSettingsFromForm() {
  const s = loadSettings();
  s.city.name = (prefCityInput?.value || '').trim();
  // take lat/lon from dataset if present
  if (prefCityInput && prefCityInput.dataset.lat && prefCityInput.dataset.lon) {
    s.city.lat = parseFloat(prefCityInput.dataset.lat);
    s.city.lon = parseFloat(prefCityInput.dataset.lon);
  }
  s.city.country = prefCityInput.dataset.country || '';
  s.city.country_code = prefCityInput.dataset.countryCode || '';
  s.clothes = prefClothesSelect ? prefClothesSelect.value : 'neutral';
  s.theme = themeSelect ? themeSelect.value : 'light';
  s.notifications = notifToggle ? notifToggle.value === 'true' : true;
  return s;
}

function settingsEqual(a, b) {
  return (
    (a.city?.name || '') === (b.city?.name || '') &&
    (Number(a.city?.lat) || null) === (Number(b.city?.lat) || null) &&
    (Number(a.city?.lon) || null) === (Number(b.city?.lon) || null) &&
    (a.city?.country || '') === (b.city?.country || '') &&
    (a.city?.country_code || '') === (b.city?.country_code || '') &&
    (a.clothes || 'neutral') === (b.clothes || 'neutral') &&
    (a.theme || 'light') === (b.theme || 'light') &&
    Boolean(a.notifications) === Boolean(b.notifications)
  );
}

function updateSaveDisabled() {
  if (!saveBtn) return;
  const stored = loadSettings();
  const fromForm = getSettingsFromForm();
  saveBtn.disabled = settingsEqual(stored, fromForm);
}

function openSettingsPopup() {
  lastFocused = document.activeElement;
  const s = loadSettings();
  setFormFromSettings(s);
  applyTheme(s.theme);
  settingsPopup.style.display = 'flex';
  settingsPopup.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  updateSaveDisabled();
}

function closeSettingsPopup() {
  settingsPopup.style.display = 'none';
  settingsPopup.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}


if (settingsBtn) settingsBtn.addEventListener('click', openSettingsPopup);
if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', closeSettingsPopup);

// luk ved klik på overlay
if (settingsPopup) {
  settingsPopup.addEventListener('click', (e) => {
    if (e.target === settingsPopup) closeSettingsPopup();
  });
}

// ESC luk
document.addEventListener('keydown', (e) => {
  if (settingsPopup && settingsPopup.style.display === 'flex' && e.key === 'Escape') {
    e.preventDefault();
    closeSettingsPopup();
  }
});

// Gem handler (form submit)
if (settingsForm) {
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const s = getSettingsFromForm();
    saveSettings(s);
    applyTheme(s.theme);
    // Apply preferred city across the app when saved (if coords present)
    if (s.city?.name && s.city.lat != null && s.city.lon != null && typeof window.applyLocationAndClosePopup === 'function') {
      window.applyLocationAndClosePopup(s.city.name, s.city.lat, s.city.lon, s.city.country, s.city.country_code);
    }
    closeSettingsPopup();
  });

  // Track changes to enable/disable save
  settingsForm.addEventListener('input', updateSaveDisabled);
  settingsForm.addEventListener('change', updateSaveDisabled);
}

// Hold city in sync when user selects a city from the location modal
// Hook into city selection from the location modal without auto-saving.
// Wait until applyLocationAndClosePopup is defined (it's in meteo-handler.js).
(function hookApplyCity() {
  let tries = 0;
  const id = setInterval(() => {
    if (typeof window.applyLocationAndClosePopup === 'function') {
      const orig = window.applyLocationAndClosePopup;
      window.applyLocationAndClosePopup = async function (name, lat, lon) {
        // Update form for preferred city (do NOT save yet)
        if (prefCityInput) {
          prefCityInput.value = name;
          prefCityInput.dataset.lat = String(lat);
          prefCityInput.dataset.lon = String(lon);
          // country may be provided in extended signature via arguments[3]/[4]
          const country = arguments[3];
          const countryCode = arguments[4];
          if (country) prefCityInput.dataset.country = String(country);
          if (countryCode) prefCityInput.dataset.countryCode = String(countryCode);
          updateSaveDisabled();
        }
        // Proceed with original behavior (fetch + update UI + close modal)
        const country = arguments[3];
        const countryCode = arguments[4];
        return orig(name, lat, lon, country, countryCode);
      };
      clearInterval(id);
    } else if (++tries > 60) {
      clearInterval(id);
    }
  }, 100);
})();

// Settings-only city search handlers
function settingsToggleLoading(show) {
  if (settingsCityLoading) settingsCityLoading.hidden = !show;
}
function settingsToggleError(msg) {
  if (!settingsCityError) return;
  if (msg) {
    settingsCityError.hidden = false;
    const span = settingsCityError.querySelector('span');
    if (span) span.textContent = msg;
  } else {
    settingsCityError.hidden = true;
  }
}
function clearSettingsResults() {
  if (settingsCityResults) settingsCityResults.innerHTML = '';
}
function settingsShowResults(show) {
  if (!settingsCityResults) return;
  settingsCityResults.hidden = !show;
}
function renderSettingsResults(list) {
  clearSettingsResults();
  if (!settingsCityResults) return;
  // Ensure container is visible when we have something to show
  settingsShowResults(true);
  if (!list || !list.length) {
    const empty = document.createElement('div');
    empty.className = 'result-item';
    empty.textContent = 'Ingen resultater';
    settingsCityResults.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  for (const item of list) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'result-item';
    btn.dataset.lat = item.latitude;
    btn.dataset.lon = item.longitude;
    btn.dataset.name = item.name;
    btn.dataset.country = item.country || '';
    btn.dataset.countryCode = item.country_code || '';
    btn.innerHTML = `<i class="fas fa-location-dot"></i><span>${item.name}</span><small>${item.region ? item.region + ', ' : ''}${item.country} (${item.country_code})</small>`;
    btn.addEventListener('click', () => {
      // Fill preferred city field and datasets
      if (prefCityInput) {
        prefCityInput.value = item.name;
        prefCityInput.dataset.lat = String(item.latitude);
        prefCityInput.dataset.lon = String(item.longitude);
        if (item.country) prefCityInput.dataset.country = String(item.country);
        if (item.country_code) prefCityInput.dataset.countryCode = String(item.country_code);
      }
      // Clear and hide results after selection
      clearSettingsResults();
      settingsShowResults(false);
      updateSaveDisabled();
    });
    frag.appendChild(btn);
  }
  settingsCityResults.appendChild(frag);
}
function handleSettingsCitySearch() {
  const q = (prefCityInput?.value || '').trim();
  if (settingsCityDebounce) clearTimeout(settingsCityDebounce);
  if (!q) {
    clearSettingsResults();
    settingsToggleError(null);
    settingsToggleLoading(false);
    settingsShowResults(false);
    return;
  }
  settingsToggleError(null);
  settingsToggleLoading(false);
  if (settingsCityResults) {
    settingsCityResults.innerHTML = '<div class="loading"><i class="fas fa-hourglass-half fa-spin"></i><span>Søger...</span></div>';
    settingsShowResults(true);
  }
  settingsCityDebounce = setTimeout(async () => {
    try {
      settingsToggleError(null);
      settingsToggleLoading(true);
      const data = await getGeoInfo(q);
      renderSettingsResults(data);
    } catch (err) {
      renderSettingsResults([]);
      settingsToggleError(err?.message || 'Noget gik galt');
    } finally {
      settingsToggleLoading(false);
    }
  }, 500);
}
if (prefCityInput) prefCityInput.addEventListener('input', handleSettingsCitySearch);

// opsæt vejr efter korrekt rækkefølge
function rotateForecastWeekToTomorrow() {
    const list = document.querySelector('.forecast-week');
    if (!list) return;

    const items = Array.from(list.children);

    // 7 dage
    if (items.length !== 7) return; 

    const jsDay = new Date().getDay();
    const namesJS = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

    // find index i liste udfra navn i html
    const liNames = items.map(li => (li.querySelector('.forecast-item span')?.textContent || '').trim());
    let todayIdx = liNames.findIndex(n => n.toLowerCase() === namesJS[jsDay].toLowerCase());

    // starter fra dagen efter current dag
    const start = (todayIdx + 1) % items.length;
    const rotated = [...items.slice(start), ...items.slice(0, start)];

    // Sæt dem ind i ny rækkefølge
    list.innerHTML = '';
    rotated.forEach(li => list.appendChild(li));
}
//slut

// Kør når DOM er klar
document.addEventListener('DOMContentLoaded', rotateForecastWeekToTomorrow);


// Ensure app default city is preferred city; on first run default to Aarhus
(function applyDefaultCityOnLoad() {
  const ensureAndApply = () => {
    const s = loadSettings();
    let needSave = false;
    if (!s.city || s.city.lat == null || s.city.lon == null || !s.city.name) {
      s.city = { name: 'Aarhus', lat: 56.1629, lon: 10.2039, country: 'Danmark', country_code: 'DK' };
      needSave = true;
    }
    if (needSave) saveSettings(s);
    if (typeof window.applyLocationAndClosePopup === 'function') {
      window.applyLocationAndClosePopup(s.city.name, s.city.lat, s.city.lon, s.city.country, s.city.country_code);
    } else {
      // Wait until available
      let tries = 0;
      const id = setInterval(() => {
        if (typeof window.applyLocationAndClosePopup === 'function') {
          window.applyLocationAndClosePopup(s.city.name, s.city.lat, s.city.lon, s.city.country, s.city.country_code);
          clearInterval(id);
        } else if (++tries > 60) {
          clearInterval(id);
        }
      }, 100);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureAndApply);
  } else {
    ensureAndApply();
  }
})();