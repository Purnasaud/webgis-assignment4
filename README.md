# WebGIS Assignment 4 – Leaflet + Open Data

This repository contains three web maps built with **Leaflet**:

- **Weather Map:** Live NEXRAD radar (WMS) + active **NWS Alerts** styled by severity.  
   `weather/index.html`  
- **Earthquakes Map:** USGS all‑day GeoJSON feed with magnitude‑scaled circle markers, popups and legend.  
   `earthquakes/index.html`  
- **Bonus task – Unified Hazard Map:** A single map with a **toggle control** to switch between Weather Alerts and Earthquakes (plus optional Radar).  
   `bonus-combined/index.html`  

## How to view locally
Use VS Code Live Server.

## Deploy on GitHub Pages

## 4. Live Demo Links

- [Weather Map](https://purnasaud.github.io/webgis-assignment4/weather/)
- [Earthquakes Map](https://purnasaud.github.io/webgis-assignment4/earthquakes/)
- [Bonus Unified Hazard Map](https://purnasaud.github.io/webgis-assignment4/bonus-combined/)

## Notes
- Basemaps from **CARTO** (Positron/DarkMatter) were chosen to maximize contrast for radar & alert polygons.  
- Alerts are fetched from the official NWS endpoint `https://api.weather.gov/alerts/active`.  
- Earthquakes are fetched from **USGS** `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`.  
- All maps include legends, layer controls, scale bars, accessible popups, and a glass‑morphism UI for clarity.
