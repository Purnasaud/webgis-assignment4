# WebGIS Assignment 4 – Leaflet + Open Data

**Author:** Purna Saud  
**Course:** WebGIS  

---

## 📌 Overview
This assignment demonstrates the use of **Leaflet.js** and open geospatial data services to design, implement, and publish interactive web maps.  
The project consists of three maps:

1. **Weather Map** – Integrates a live NEXRAD radar layer (WMS) with active **NWS Alerts**, styled by severity.  
2. **Earthquakes Map** – Displays the **USGS all-day earthquake feed** with circle markers scaled and colored by magnitude, along with interactive popups and a magnitude legend.  
3. **Bonus Task: Unified Hazard Map** – A combined application with a **custom toggle control** to switch between Weather Alerts (with optional Radar) and Earthquakes.  

Each map includes cartographically thoughtful basemaps, dynamic legends, layer controls, scale bars, and accessible popups to enhance usability and design.

---

## 🖥️ How to View Locally
1. Clone or download this repository.  
2. Open the project in VS Code (or any code editor).  
3. Use the **Live Server** extension to run `index.html` in each subfolder:
   - `weather/index.html`
   - `earthquakes/index.html`
   - `bonus-combined/index.html`

---

## 🌐 Live Demo (GitHub Pages)
Deployed via **GitHub Pages** for direct online access:

- 🌦️ [Weather Map](https://purnasaud.github.io/webgis-assignment4/weather/)  
- 🌍 [Earthquakes Map](https://purnasaud.github.io/webgis-assignment4/earthquakes/)  
- ⚡ [Bonus Unified Hazard Map](https://purnasaud.github.io/webgis-assignment4/bonus-combined/)  

---

## 🔧 Technical Details
- **Framework:** [Leaflet.js](https://leafletjs.com/)  
- **Basemaps:** CARTO Positron (light) and DarkMatter (dark), optimized for contrast with overlay data.
