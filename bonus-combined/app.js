
// BONUS: unified map with toggles
const statusEl = document.getElementById('status');

const base_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap, &copy; CARTO'
});
const base_Dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap, &copy; CARTO'
});

const map = L.map('map', {
  center:[37.8,-96],
  zoom:4,
  layers:[base_Positron],
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

// Loaders
async function loadAlerts(){
  const url='https://api.weather.gov/alerts/active?status=actual&message_type=alert&limit=500';
  const res=await fetch(url,{headers:{'Accept':'application/geo+json'}});
  const gj=await res.json(); alerts.clearLayers(); alerts.addData(gj);
}
async function loadQuakes(){
  const url='https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
  const res=await fetch(url); const gj=await res.json(); quakes.clearLayers(); quakes.addData(gj);
}
async function init(){
  statusEl.textContent='Loading alerts and earthquakes…';
  await Promise.all([loadAlerts(), loadQuakes()]);
  statusEl.textContent='Use the toggle to switch layers.';
}
init();

// Layer control
const baseLayers = {'Light (Positron)':base_Positron,'Dark':base_Dark};
const overlays = {'NEXRAD Radar (WMS)':radarWMS,'NWS Alerts':alerts,'Earthquakes':quakes};
L.control.layers(baseLayers, overlays, {collapsed:true}).addTo(map);

// Custom toggle control 
const Toggle = L.Control.extend({
  onAdd: function(){
    const container = L.DomUtil.create('div'); container.className = 'toggle';
    const btnWeather = L.DomUtil.create('button','',container); btnWeather.textContent='Weather Alerts';
    const btnQuakes  = L.DomUtil.create('button','',container); btnQuakes.textContent='Earthquakes';

    function showWeather(){
      btnWeather.classList.add('active'); btnQuakes.classList.remove('active');
      if(!map.hasLayer(alerts)) alerts.addTo(map);
      if(!map.hasLayer(radarWMS)) radarWMS.addTo(map);
      if(map.hasLayer(quakes)) map.removeLayer(quakes);
    }
    function showQuakes(){
      btnQuakes.classList.add('active'); btnWeather.classList.remove('active');
      if(!map.hasLayer(quakes)) quakes.addTo(map);
      if(map.hasLayer(alerts)) map.removeLayer(alerts);
      if(map.hasLayer(radarWMS)) map.removeLayer(radarWMS);
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
