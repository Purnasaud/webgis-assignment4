# WebGIS Assignment 4 – Leaflet + Open Data

This repository contains three production‑ready web maps built with **Leaflet**:

- **Weather Map:** Live NEXRAD radar (WMS) + active **NWS Alerts** styled by severity.  
  👉 `weather/index.html`  
- **Earthquakes Map:** USGS all‑day GeoJSON feed with magnitude‑scaled circle markers, popups and legend.  
  👉 `earthquakes/index.html`  
- **Bonus – Unified Hazard Map:** A single map with a **toggle control** to switch between Weather Alerts and Earthquakes (plus optional Radar).  
  👉 `bonus-combined/index.html`  

## How to view locally
Double‑click any `index.html` file or use VS Code Live Server.

## Deploy on GitHub Pages (no frameworks)
1. Push this repo to GitHub.
2. In **Settings → Pages**, select **Deploy from branch** and choose `main` and `/ (root)` (or `/docs` if you move files there).
3. Your site will be live at `https://<username>.github.io/<repo>/`.
4. In your README, link to the pages using relative URLs:  
   - Weather: `./weather/index.html`  
   - Earthquakes: `./earthquakes/index.html`  
   - Bonus unified: `./bonus-combined/index.html`  

## Notes
- Basemaps from **CARTO** (Positron/DarkMatter) were chosen to maximize contrast for radar & alert polygons.  
- Alerts are fetched from the official NWS endpoint `https://api.weather.gov/alerts/active`.  
- Earthquakes are fetched from **USGS** `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`.  
- All maps include legends, layer controls, scale bars, accessible popups, and a glass‑morphism UI for clarity.
- Last generated on: 2025-10-01T15:54:52Z.
