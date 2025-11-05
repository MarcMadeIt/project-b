// --- Open-Meteo: current weather for coords ---
async function fetchCurrentWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Kunne ikke hente vejrdata");
  const json = await res.json();
  if (!json.current_weather) throw new Error("Ingen vejrdata fundet");
  return json.current_weather; // { temperature, weathercode, is_day, windspeed, ... }
}

// --- Map WMO weather codes -> description + icon filename you have ---
function mapWeather(code) {
  // minimal, covers your icon set
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
    // drizzle / rain showers
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

  // fallback
  return {
    text: "Skiftende vejr",
    icon: "sun_cloud.svg",
    background: "sun_cloud_big.png",
  };
}

// --- Update the UI with fetched data ---
function updateWeatherUI(cityName, current) {
  const cityEl = document.querySelector(".header .header-items h3");
  const tempEl = document.querySelector(".current-temp h4");
  const descEl = document.querySelector(".current-temp span");
  const iconEl = document.querySelector(".current-icon img");
  //get body for background update
  const bodyEl = document.querySelector("body");

  const { text, icon, background } = mapWeather(current.weathercode);

  if (cityEl) cityEl.textContent = cityName;
  if (tempEl) tempEl.textContent = `${Math.round(current.temperature)}°`;
  if (descEl) descEl.textContent = text;
  if (iconEl) iconEl.src = `./assets/img/${icon}`;
  if (bodyEl) bodyEl.style.backgroundImage = `url(./assets/img/${background})`;
}

// --- Public: apply a selected location (called from script.js) ---
async function applyLocationAndClosePopup(name, lat, lon) {
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
    const current = await fetchCurrentWeather(lat, lon);
    updateWeatherUI(name, current);
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
