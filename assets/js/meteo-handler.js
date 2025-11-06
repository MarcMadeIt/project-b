async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation,weathercode` +
    `&forecast_days=7&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Kunne ikke hente vejrdata");
  const json = await res.json();
  if (!json.current_weather) throw new Error("Ingen vejrdata fundet");
  return json;
}

async function fetchCurrentWeather(lat, lon) {
  return fetchWeather(lat, lon);
}

async function fetchDailyForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Kunne ikke hente dagsprognose");
  const json = await res.json();
  if (!json.daily) throw new Error("Ingen dagsprognose fundet");
  return json.daily;
}

function mapWeather(code) {
  if ([0].includes(code))
    return { type: 'sun', text: "Skyfrit", icon: "sun.svg" };
  if ([1, 2].includes(code))
    return {
      type: 'sun_cloud',
      text: "Delvist sol",
      icon: "sun_cloud.svg",
    };
  if ([3, 45, 48].includes(code))
    return {
      type: 'cloud',
      text: "Skyet/Tåget",
      icon: "sun_cloud.svg",
    };

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      type: 'rain',
      text: "Regn",
      icon: "sun_cloud_rain.svg",
    };
  }
  if (code >= 71 && code <= 77)
    return { type: 'snow', text: "Sne", icon: "snow.svg" };
  if ([95, 96, 99].includes(code))
    return {
      type: 'thunder',
      text: "Torden",
      icon: "thunder.svg",
    };

  return {
    type: 'mix',
    text: "Skiftende vejr",
    icon: "sun_cloud.svg",
  };
}

function getClothesForWeather(profile, type, tempC) {
  const p = (String(profile).toLowerCase() === 'm' || String(profile).toLowerCase() === 'w')
    ? String(profile).toLowerCase()
    : 'n';

  const aliases = {
    sunny: 'sun',
    clear: 'sun',
    partly_cloudy: 'sun_cloud',
    partlycloudy: 'sun_cloud',
    overcast: 'cloud',
    cloudy: 'cloud',
    drizzle: 'rain',
    showers: 'rain',
    sleet: 'mix',
    hail: 'mix',
    thunderstorm: 'thunder',
  };
  const normTypeRaw = String(type || '').toLowerCase().trim();
  const typeNorm = ([
    'sun', 'sun_cloud', 'cloud', 'rain', 'snow', 'thunder', 'mix'
  ].includes(normTypeRaw) ? normTypeRaw : (aliases[normTypeRaw] || 'mix'));

  const adviceForBand = (band) => {
    switch (band) {
      case 'extreme_cold':
        return p === 'w'
          ? 'Ekstrem kulde: meget varm frakke, hue, handsker, halstørklæde og varme støvler'
          : p === 'm'
            ? 'Ekstrem kulde: kraftig vinterjakke, hue, handsker, halstørklæde og vinterstøvler'
            : 'Ekstrem kulde: meget varmt overtøj, hue, handsker og støvler';
      case 'very_cold':
        return p === 'w'
          ? 'Varm frakke, hue, handsker og vinterstøvler'
          : p === 'm'
            ? 'Vinterjakke, hue, handsker og vinterstøvler'
            : 'Varm jakke, hue og handsker';
      case 'cold':
        return p === 'w'
          ? 'Varm jakke og trøje, lukkede sko'
          : p === 'm'
            ? 'Jakke/sweatshirt og lukkede sko'
            : 'Varm jakke og lukkede sko';
      case 'cool':
        return p === 'w'
          ? 'Let jakke eller cardigan over bluse'
          : p === 'm'
            ? 'Let jakke eller trøje over T‑shirt'
            : 'Let jakke eller trøje';
      case 'mild':
        return p === 'w'
          ? 'Let bluse eller T‑shirt, evt. tynd jakke'
          : p === 'm'
            ? 'T‑shirt og let trøje'
            : 'T‑shirt, evt. let jakke';
      case 'warm':
        return p === 'w'
          ? 'Sommerligt: kjole eller T‑shirt/shorts'
          : p === 'm'
            ? 'Sommerligt: T‑shirt og shorts'
            : 'Let sommertøj';
      case 'hot':
        return p === 'w'
          ? 'Meget varmt: let sommertøj og solbeskyttelse'
          : p === 'm'
            ? 'Meget varmt: T‑shirt/shorts og solbeskyttelse'
            : 'Meget let sommertøj og solbeskyttelse';
      default:
        return 'Praktisk tøj efter vejret';
    }
  };

  const imgForBand = (band) => {
    switch (band) {
      case 'extreme_cold':
      case 'very_cold':
        return 'snow';
      case 'cold':
        return 'cloud';
      case 'cool':
      case 'mild':
        return 'spring';
      case 'warm':
        return 'sunandcloud';
      case 'hot':
        return 'sun';
      default:
        return 'mix';
    }
  };
  let band = 'mild';
  const hasTemp = typeof tempC === 'number' && !Number.isNaN(tempC);
  if (hasTemp) {
    const t = tempC;
    if (t < -15) band = 'extreme_cold';
    else if (t < 0) band = 'very_cold';
    else if (t < 10) band = 'cold';
    else if (t < 15) band = 'cool';
    else if (t < 20) band = 'mild';
    else if (t < 25) band = 'warm';
    else band = 'hot';
  }
  let advice = adviceForBand(band);

  let imgKey = imgForBand(band);
  if (typeNorm === 'rain') {
    advice += ' + regnjakke/vandtætte sko';
    imgKey = 'rain';
  } else if (typeNorm === 'thunder') {
    advice += ' + vandtæt lag; undgå åbne områder ved torden';
    imgKey = 'thunder';
  } else if (typeNorm === 'snow' && (band !== 'extreme_cold' && band !== 'very_cold')) {
    advice += ' + varme handsker og hue';
    imgKey = 'snow';
  }

  if (!hasTemp) {
    const textByType = {
      sun: p === 'w' ? 'Let sommertøj og solbriller'
        : p === 'm' ? 'T-shirt, shorts og kasket'
          : 'Let sommertøj',
      sun_cloud: p === 'w' ? 'Let bluse eller T-shirt og evt. en tynd cardigan'
        : p === 'm' ? 'T-shirt og let trøje'
          : 'Let trøje eller T-shirt',
      cloud: p === 'w' ? 'Let jakke eller windbreaker'
        : p === 'm' ? 'Jakke eller sweatshirt'
          : 'Let jakke',
      rain: p === 'w' ? 'Regnjakke, vandtætte sko og evt. paraply'
        : p === 'm' ? 'Regnfrakke eller skaljakke og vandtætte sko'
          : 'Regnfrakke/paraply og vandtætte sko',
      snow: p === 'w' ? 'Varm frakke, hue, handsker og støvler'
        : p === 'm' ? 'Vinterjakke, hue, handsker og støvler'
          : 'Varm jakke, hue og handsker',
      thunder: p === 'w' ? 'Vandtæt jakke og solide sko (undgå åbne områder)'
        : p === 'm' ? 'Vandtæt jakke og robuste sko'
          : 'Vandtæt jakke og solide sko',
      mix: p === 'w' ? 'Lag-på-lag: let jakke over bluse eller T-shirt'
        : p === 'm' ? 'Lag-på-lag: trøje over T-shirt'
          : 'Fleksibelt lag-på-lag (skiftende vejr)'
    };
    const imgTypeMap = {
      sun: 'sun',
      sun_cloud: 'sunandcloud',
      cloud: 'cloud',
      rain: 'rain',
      snow: 'snow',
      thunder: 'thunder',
      mix: 'mix'
    };
    advice = textByType[typeNorm] || 'Praktisk tøj efter vejret';
    imgKey = imgTypeMap[typeNorm] || 'mix';
  }

  return {
    text: advice,
    img: `clothes/${p}-${imgKey}.png`,

    type: typeNorm
  };
}


function updateWeekFromDaily(daily) {
  const list = document.querySelector('.forecast-week');
  if (!list || !daily || !daily.time) return;

  const items = Array.from(list.children);
  const count = Math.min(items.length, daily.time.length, 7);

  const startOffset = 1;

  for (let k = 0; k < count; k++) {
    const i = (startOffset + k) % daily.time.length;
    const dateStr = daily.time[i];
    const d = new Date(dateStr + 'T12:00:00');
    const dayName = d.toLocaleDateString('da-DK', { weekday: 'long' })
      .replace(/^\w/, c => c.toUpperCase());

    const code = daily.weathercode[i];
    const vis = mapWeather(code);
    const maxC = Math.round(daily.temperature_2m_max[i]);

    const li = items[k];
    const nameEl = li.querySelector('.forecast-item span');
    const imgEl = li.querySelector('.forecast-day img, .forecast-icon img');
    const tempEl = li.querySelector('.forecast-item:last-child span');

    if (nameEl) nameEl.textContent = dayName;

    if (imgEl) {
      imgEl.src = `./assets/img/${vis.icon}`;
      imgEl.alt = vis.text || 'Vejr';
    }

    if (tempEl) tempEl.textContent = `${maxC}°`;
  }
}


// Try to use the requested non-binary icon; fall back to a free, widely supported alternative
function resolveNeutralFaIcon() {
  const preferred = 'fa-non-binary';
  const fallback = 'fa-genderless';
  try {
    const tmp = document.createElement('i');
    tmp.className = `fa-solid ${preferred}`;
    tmp.style.position = 'absolute';
    tmp.style.opacity = '0';
    tmp.style.pointerEvents = 'none';
    tmp.style.left = '-9999px';
    document.body.appendChild(tmp);
    const content = getComputedStyle(tmp, '::before').content;
    document.body.removeChild(tmp);
    // If Font Awesome defines this icon, ::before will be a quoted unicode string like "\fxyz"
    if (content && content !== 'none' && content !== 'normal' && content !== '""') {
      return preferred;
    }
  } catch (_) { /* ignore cross-browser quirks and just fall back */ }
  return fallback;
}


function updateWeatherUI(cityName, data, countryName) {

  const current = data.current_weather;


  const cityEl = document.querySelector(".current-city h3");
  const tempEl = document.querySelector(".current-temp h4");
  const descEl = document.querySelector(".current-temp span");
  const iconEl = document.querySelector(".current-icon img");
  const clothesImgEl = document.querySelector(".image-clothing");
  const clothesTextEl = document.querySelector(".recommended .recommended-item span");

  const vis = mapWeather(current.weathercode);
  const { text, icon, type } = vis;

  const profile = getUserClothesProfile();
  const rec = getClothesForWeather(profile, type, current.temperature);
  const clothes = rec.text;
  const clothesImg = rec.img;

  const titleEl = document.querySelector('.recommended .recommended-item h4');
  if (titleEl) {
    let faClass = resolveNeutralFaIcon();
    let aria = 'Non-binær/neutral profil';
    if (profile === 'm') { faClass = 'fa-mars'; aria = 'Mand profil'; }
    else if (profile === 'w') { faClass = 'fa-venus'; aria = 'Kvinde profil'; }

    let profileIcon = titleEl.querySelector('.profile-icon');
    if (!profileIcon) {
      profileIcon = document.createElement('i');
      profileIcon.className = `fa-solid ${faClass} profile-icon`;
      profileIcon.style.marginLeft = '0.4rem';
      profileIcon.setAttribute('aria-label', aria);
      profileIcon.setAttribute('title', aria);
      titleEl.appendChild(profileIcon);
    } else {
      profileIcon.className = `fa-solid ${faClass} profile-icon`;
      profileIcon.setAttribute('aria-label', aria);
      profileIcon.setAttribute('title', aria);
    }
  }

  if (cityEl) cityEl.textContent = countryName ? `${cityName}, ${countryName}` : cityName;

  if (tempEl) tempEl.textContent = `${Math.round(current.temperature)}°`;

  if (descEl) descEl.textContent = text;

  if (iconEl) iconEl.src = `./assets/img/${icon}`;

  if (clothesTextEl) clothesTextEl.textContent = clothes;

  if (clothesImgEl) {

    clothesImgEl.src = `./assets/img/${clothesImg}`;

    clothesImgEl.alt = clothes;

  }

  renderForecastHours(data.hourly, 24);
}

function iconPathForCode(code) {
  return `./assets/img/${mapWeather(code).icon}`;
}


function renderForecastHours(hourly, count = 12) {
  const ul = document.getElementById("forecast-hours");
  if (!ul || !hourly) return;

  const now = Date.now();
  const startIdx = hourly.time.findIndex(t => new Date(t).getTime() >= now);
  const begin = startIdx === -1 ? 0 : startIdx;

  const fmtTime = new Intl.DateTimeFormat("da-DK", { hour: "2-digit", minute: "2-digit" });

  const items = [];
  for (let i = begin; i < Math.min(begin + count, hourly.time.length); i++) {
    const t = new Date(hourly.time[i]);
    const timeLabel = fmtTime.format(t);
    const temp = Math.round(hourly.temperature_2m[i]);
    const icon = iconPathForCode(hourly.weathercode[i]);

    items.push(`
      <li class="forecast-hour">
        <div class="forecast-item"><span>${timeLabel}</span></div>
        <div class="forecast-icon forecast-item"><img src="${icon}" alt=""></div>
        <div class="forecast-item"><span>${temp}°</span></div>
      </li>
    `);
  }

  ul.innerHTML = items.join("");
}

function getUserClothesProfile() {
  try {
    const raw = localStorage.getItem('ahvejr.settings');
    if (!raw) return 'n';
    const s = JSON.parse(raw);
    switch (s.clothes) {
      case 'male': return 'm';
      case 'female': return 'w';
      case 'neutral': return 'n';
      default: return 'n';
    }
  } catch {
    return 'n';
  }
}

async function applyLocationAndClosePopup(name, lat, lon, country) {
  const resultsBox = document.getElementById("geo-results");
  const popup = document.getElementById("popup");

  try {
    if (resultsBox) {
      resultsBox.innerHTML = `
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Henter vejr…</span>
        </div>`;
    }
    const [current, daily] = await Promise.all([
      fetchCurrentWeather(lat, lon),
      fetchDailyForecast(lat, lon),
    ]);

    updateWeatherUI(name, current, country);
    updateWeekFromDaily(daily);

    try {
      window.__ahvejr_currentCity = { name, lat, lon, country: country || '' };
    } catch { }

    if (popup) popup.style.display = "none";
  } catch (err) {
    if (resultsBox) {
      resultsBox.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <span>${err?.message || "Noget gik galt"}</span>
        </div>`;
    }
  }
}
