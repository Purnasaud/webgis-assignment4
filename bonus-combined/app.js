// BONUS: unified map with toggles
const statusEl = document.getElementById('status');

// Basemaps. CARTO's anonymous tile endpoints now require an API key and serve
// watermarked tiles instead, so these use Esri's keyless Canvas services.
// NOTE: Esri tile URLs are {z}/{y}/{x}, not {z}/{x}/{y}.
const base_Light = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19, maxNativeZoom: 16,   // service tops out at 16; Leaflet upscales past it
  attribution: 'Tiles &copy; Esri'
});
const base_Dark = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19, maxNativeZoom: 16,
  attribution: 'Tiles &copy; Esri'
});
const base_OSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const map = L.map('map', {
  center:[37.8,-96],
  zoom:4,
  layers:[base_Light],
  worldCopyJump:true
});

// Radar
const radarWMS = L.tileLayer.wms('https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi', {
  layers: 'nexrad-n0r-900913',
  format: 'image/png', transparent:true, opacity:.65
});

// Alerts layer
const severityColors = {'Extreme':'#ef4444','Severe':'#f59e0b','Moderate':'#eab308','Minor':'#22c55e','Unknown':'#94a3b8'};
function alertStyle(f){ const sev=f.properties?.severity||'Unknown'; return {color:severityColors[sev]||'#94a3b8', weight:2, fillOpacity:.15}; }
function onEachAlert(feature, layer){
  const p=feature.properties||{};
  const html = `<div class="popup"><h3>${p.headline||p.event||'Weather Alert'}</h3>
      <div><small><b>Severity:</b> ${p.severity||'Unknown'}</small></div>
      <div><small><b>Areas:</b> ${p.areaDesc||'—'}</small></div>
      <a href="${p.id||p.url||'https://www.weather.gov/'}" target="_blank">More details</a></div>`;
  layer.bindPopup(html);
}
const alerts = L.geoJSON(null,{style:alertStyle,onEachFeature:onEachAlert});

// Earthquake layer
function magColor(m){ return m>=6?'#b91c1c':m>=5?'#ef4444':m>=4?'#f97316':m>=3?'#f59e0b':m>=2?'#84cc16':m>=1?'#22c55e':'#a3a3a3'; }
function magRadius(m){ return 3 + Math.max(m,0) * 3; }
function onEachEQ(feature, layer){
  const p=feature.properties||{};
  const html = `<div class="popup"><h3>M ${p.mag?.toFixed? p.mag.toFixed(1):p.mag||'—'} — ${p.place||'Unknown'}</h3>
      <div><small><b>Time:</b> ${p.time?new Date(p.time).toLocaleString():'—'}</small></div>
      <a href="${p.url||'https://earthquake.usgs.gov/earthquakes/'}" target="_blank">USGS event page</a></div>`;
  layer.bindPopup(html);
}
const quakes = L.geoJSON(null,{
  pointToLayer:(f,latlng)=>L.circleMarker(latlng,{
    radius: magRadius(f.properties?.mag||0),
    color: magColor(f.properties?.mag||0),
    weight: 1.5, fillColor: magColor(f.properties?.mag||0), fillOpacity:.7
  }),
  onEachFeature:onEachEQ
});

// Store counts
let alertCount = 0;
let quakeCount = 0;

// Track which view the toggle is showing, and whether each feed actually loaded.
// Without this the status line can report the wrong layer's count, or report
// "0" when a feed failed — which reads as "no active hazards" rather than "no data".
let currentView = 'weather';
let alertFailed = false;
let quakeFailed = false;

function updateStatus(){
  if(currentView === 'quakes'){
    statusEl.textContent = quakeFailed
      ? 'Earthquake feed unavailable'
      : `Earthquakes (24h): ${quakeCount}`;
  } else {
    statusEl.textContent = alertFailed
      ? 'Alert feed unavailable'
      : `Active alerts: ${alertCount}`;
  }
}

// Loaders
async function loadAlerts() {
  const url = "https://api.weather.gov/alerts/active";
  try {
    const res = await fetch(url, { headers: { "Accept": "application/geo+json" } });
    if(!res.ok) throw new Error(`NWS alerts API returned ${res.status}`);
    const gj = await res.json();
    alerts.clearLayers();
    alerts.addData(gj);
    alertCount = gj.features?.length || 0;
    alertFailed = false;
  } catch (err) {
    console.error(err);
    alertCount = 0;
    alertFailed = true;
  }
}

async function loadQuakes(){
  try {
    const url='https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
    const res=await fetch(url);
    if(!res.ok) throw new Error(`USGS feed returned ${res.status}`);
    const gj=await res.json();
    quakes.clearLayers(); quakes.addData(gj);
    quakeCount = gj.features?.length || 0;
    quakeFailed = false;
  } catch (err){
    console.error(err);
    quakeCount = 0;
    quakeFailed = true;
  }
}

async function init(){
  statusEl.textContent='Loading alerts and earthquakes…';
  await Promise.all([loadAlerts(), loadQuakes()]);
  // Report whichever view the user is actually looking at by now.
  updateStatus();
}
init();

// Layer control
const baseLayers = {'Light Gray (Esri)':base_Light,'Dark Gray (Esri)':base_Dark,'OSM Standard':base_OSM};
const overlays = {'NEXRAD Radar (WMS)':radarWMS,'NWS Alerts':alerts,'Earthquakes':quakes};
L.control.layers(baseLayers, overlays, {collapsed:true}).addTo(map);

// Custom toggle control
const Toggle = L.Control.extend({
  onAdd: function(){
    const container = L.DomUtil.create('div'); container.className = 'toggle';
    const btnWeather = L.DomUtil.create('button','',container); btnWeather.textContent='Weather Alerts';
    const btnQuakes  = L.DomUtil.create('button','',container); btnQuakes.textContent='Earthquakes';

    // Keep clicks on the buttons from panning the map underneath them.
    L.DomEvent.disableClickPropagation(container);

    function showWeather(){
      btnWeather.classList.add('active'); btnQuakes.classList.remove('active');
      if(!map.hasLayer(alerts)) alerts.addTo(map);
      if(!map.hasLayer(radarWMS)) radarWMS.addTo(map);
      if(map.hasLayer(quakes)) map.removeLayer(quakes);
      currentView = 'weather';
      updateStatus();
    }
    function showQuakes(){
      btnQuakes.classList.add('active'); btnWeather.classList.remove('active');
      if(!map.hasLayer(quakes)) quakes.addTo(map);
      if(map.hasLayer(alerts)) map.removeLayer(alerts);
      if(map.hasLayer(radarWMS)) map.removeLayer(radarWMS);
      currentView = 'quakes';
      updateStatus();
    }
    btnWeather.onclick = (e)=>{ e.preventDefault(); showWeather(); };
    btnQuakes.onclick  = (e)=>{ e.preventDefault(); showQuakes();  };

    // default state
    showWeather();
    return container;
  },
  onRemove: function(){}
});
(new Toggle({position:'topright'})).addTo(map);

// Legends (dynamic based on visible layer)
const legend = L.control({position:'bottomleft'});
legend.onAdd = function(){
  const div = L.DomUtil.create('div','legend');
  div.id = 'legend-box';
  return div;
};
legend.addTo(map);

function renderWeatherLegend(){
  const div = document.getElementById('legend-box');
  div.innerHTML = '<b>NWS Alert Severity</b>';
  ['Extreme','Severe','Moderate','Minor','Unknown'].forEach(k=>{
    const row=document.createElement('div'); row.className='row';
    const sw=document.createElement('span'); sw.className='swatch'; sw.style.background=severityColors[k];
    const label=document.createElement('span'); label.textContent=k;
    row.appendChild(sw); row.appendChild(label); div.appendChild(row);
  });
}
function renderQuakeLegend(){
  const div = document.getElementById('legend-box');
  div.innerHTML = '<b>Magnitude</b>';
  const bins=[0,1,2,3,4,5,6];
  for(let i=0;i<bins.length-1;i++){
    const from=bins[i],to=bins[i+1];
    const row=document.createElement('div'); row.className='row';
    const sw=document.createElement('span'); sw.className='swatch'; sw.style.background=magColor(from+.01);
    const label=document.createElement('span'); label.textContent=`${from}–${to}`;
    row.appendChild(sw); row.appendChild(label); div.appendChild(row);
  }
  const row=document.createElement('div'); row.className='row';
  const sw=document.createElement('span'); sw.className='swatch'; sw.style.background=magColor(6.5);
  const label=document.createElement('span'); label.textContent='6+';
  row.appendChild(sw); row.appendChild(label); div.appendChild(row);
}

// Update legend when layers toggle
map.on('layeradd layerremove', ()=>{
  const hasQuakes = map.hasLayer(quakes);
  const hasAlerts = map.hasLayer(alerts);
  if(hasQuakes && !hasAlerts){ renderQuakeLegend(); }
  else { renderWeatherLegend(); }
});
renderWeatherLegend();
