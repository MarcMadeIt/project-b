// --- Open-Meteo: current weather for coords ---
async function fetchCurrentWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Kunne ikke hente vejrdata");
  const json = await res.json();
  if (!json.current_weather) throw new Error("Ingen vejrdata fundet");
  return json.current_weather;
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

function updateWeatherUI(cityName, current, countryName) {

  //Laura

  const cityEl = document.querySelector(".current-city h3");

  //const cityEl = document.querySelector(".header .header-items h3");

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
    clothes = "Vinterjakke og varmt tøj";
      clothesImg = `clothes/${profile}-snow.png`;
  } else if (current.temperature < 10) {
    clothes = "Jakke eller cardigan";
      clothesImg = `clothes/${profile}-mix.png`;
  } else if (current.temperature > 25) {
    clothes = "Let sommertøj";
      clothesImg = `clothes/${profile}-sun.png`;
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


async function applyLocationAndClosePopup(name, lat, lon, country, countryCode) {
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
    updateWeatherUI(name, current, country);
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
