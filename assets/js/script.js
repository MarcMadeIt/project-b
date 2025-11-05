  function initForecastTabs() {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const panels = {
      "forecast-hours": document.getElementById('forecast-hours'),
      "forecast-week":  document.getElementById('forecast-week')
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
      if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(i+1)%tabs.length].focus(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); tabs[(i-1+tabs.length)%tabs.length].focus(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(document.activeElement); }
    });
      }

    // Start med week-tab
    activate(document.getElementById('tab-week'));
  }
 
  // Kald funktionen når DOM'en er klar
  document.addEventListener('DOMContentLoaded', initForecastTabs);
 