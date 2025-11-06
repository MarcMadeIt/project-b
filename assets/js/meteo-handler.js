// fetch the weather data for given lat/lon
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


// Finder de næste 7 dage
async function fetchDailyForecast(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Kunne ikke hente dagsprognose");
    const json = await res.json();
    if (!json.daily) throw new Error("Ingen dagsprognose fundet");
    return json.daily; // { time[], weathercode[], temperature_2m_max[], ... }
}

function mapWeather(code) {
  if ([0].includes(code))
    return { text: "Skyfrit", icon: "sun.svg", background: "sun_big.png" };
  if ([1, 2].includes(code))
    return {
      text: "Delvist sol",
      icon: "sun_cloud.svg",
      background: "sun_cloud_big.png",
    };
  if ([3, 45, 48].includes(code))
    return {
      text: "Skyet/tåget",
      icon: "sun_cloud.svg",
      background: "sun_cloud_big.png",
    };

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      text: "Regn",
      icon: "sun_cloud_rain.svg",
      background: "sun_cloud_rain_big.png",
    };
  }
  if (code >= 71 && code <= 77)
    return { text: "Sne", icon: "snow.svg", background: "snow_big.png" };
  if ([95, 96, 99].includes(code))
    return {
      text: "Torden",
      icon: "thunder.svg",
      background: "thunder_big.png",
    };

  return {
    text: "Skiftende vejr",
    icon: "sun_cloud.svg",
    background: "sun_cloud_big.png",
  };
}

//week info
function updateWeekFromDaily(daily) {
    const list = document.querySelector('.forecast-week');
    if (!list || !daily || !daily.time) return;

    const items = Array.from(list.children);  
    const count = Math.min(items.length, daily.time.length, 7);

    // start fra +1 dag
    const startOffset = 1;

    for (let k = 0; k < count; k++) {
        const i = (startOffset + k) % daily.time.length;
        const dateStr = daily.time[i];               // "YYYY-MM-DD"
        const d = new Date(dateStr + 'T12:00:00');   // undgå TZ-drift
        const dayName = d.toLocaleDateString('da-DK', { weekday: 'long' })
            .replace(/^\w/, c => c.toUpperCase());

        const code = daily.weathercode[i];
        const vis = mapWeather(code);                // genbruger mapWeather funktion
        const maxC = Math.round(daily.temperature_2m_max[i]);

        const li = items[k];
        const nameEl = li.querySelector('.forecast-item span'); // første kolonne (dag)
        const imgEl = li.querySelector('.forecast-day img, .forecast-icon img'); // midt (ikon)
        const tempEl = li.querySelector('.forecast-item:last-child span'); // sidste (temp)

        if (nameEl) nameEl.textContent = dayName;

        if (imgEl) {
            // vælger ikon fra mapWeather
            imgEl.src = `./assets/img/${vis.icon}`;
            imgEl.alt = vis.text || 'Vejr';
        }

        if (tempEl) tempEl.textContent = `${maxC}°`;
    }
}
//slut

function updateWeatherUI(cityName, data, countryName) {

  const current = data.current_weather;


  const cityEl = document.querySelector(".current-city h3");

  const tempEl = document.querySelector(".current-temp h4");

  const descEl = document.querySelector(".current-temp span");

  const iconEl = document.querySelector(".current-icon img");

  //get body for background update

  const bodyEl = document.querySelector("body");


  //Laura

  const clothesImgEl = document.querySelector(".image-clothing");

  const clothesTextEl = document.querySelector(".recommended .recommended-item span");

  const { text, icon, background } = mapWeather(current.weathercode);

  // Simple clothing recommendation based on temperature
  let clothes = "Almindeligt tøj";
  let clothesImg = "image.png";
    const profile = getUserClothesProfile();

    if (current.temperature < 0) {
        if (profile === 'm') clothes = "Varm vinterjakke og støvler";
        else if (profile === 'w') clothes = "Vinterfrakke, hue og støvler";
        else clothes = "Varm jakke, hue og handsker";

        clothesImg = `clothes/${profile}-snow.png`;

    } else if (current.temperature < 10) {
        if (profile === 'm') clothes = "Jakke og sweatshirt";
        else if (profile === 'w') clothes = "Cardigan og lange bukser";
        else clothes = "Let jakke og jeans";

        clothesImg = `clothes/${profile}-mix.png`;

  } else if (current.temperature > 25) {
        if (profile === 'm') clothes = "T-shirt, shorts og kasket";
        else if (profile === 'w') clothes = "Top, nederdel eller kjole og solbriller";
        else clothes = "T-shirt, shorts og solbriller";

      clothesImg = `clothes/${profile}-sun.png`;
    

} else if (current.temperature <= 25) {
    if (profile === 'm') clothes = "Langærmet trøje eller T-shirt med bukser";
    else if (profile === 'w') clothes = "Let bluse, jeans eller en tynd jakke";
    else clothes = "Langærmet trøje og bukser";

    clothesImg = `clothes/${profile}-spring.png`;
}

  if (cityEl) cityEl.textContent = countryName ? `${cityName}, ${countryName}` : cityName;

  if (tempEl) tempEl.textContent = `${Math.round(current.temperature)}°`;

  if (descEl) descEl.textContent = text;

  if (iconEl) iconEl.src = `./assets/img/${icon}`;

  if (bodyEl) bodyEl.style.backgroundImage = `url(./assets/img/${background})`;

  // Laura

  if (clothesTextEl) clothesTextEl.textContent = clothes;

  if (clothesImgEl) {

    clothesImgEl.src = `./assets/img/${clothesImg}`;

    clothesImgEl.alt = clothes;

  }

  renderForecastHours(data.hourly, 12);
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


// Funktion til at få tøjprofilen
function getUserClothesProfile() {
    try {
        const raw = localStorage.getItem('ahvejr.settings');
        if (!raw) return 'n'; // neutral som standard
        const s = JSON.parse(raw);
        switch (s.clothes) {
            case 'male': return 'm';
            case 'female': return 'w';
            default: return 'n';
        }
    } catch {
        return 'n';
    }
}

//slut

// opdateret så kommende dage oogså er med
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
      // henter både nuværende vejr + forventet vejr
      const [current, daily] = await Promise.all([
          fetchWeather(lat, lon),
          fetchDailyForecast(lat, lon),
      ]);

      // opdatere UI
      updateWeatherUI(name, current, country);
      updateWeekFromDaily(daily); 

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
