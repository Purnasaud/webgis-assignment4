// EARTHQUAKE MAP
const statusEl = document.getElementById('status');

const base_OSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
// CARTO's anonymous tile endpoints now require an API key and serve watermarked
// tiles instead of failing, so these use Esri's keyless Canvas services.
// NOTE: Esri tile URLs are {z}/{y}/{x}, not {z}/{x}/{y}.
const base_Light = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19, maxNativeZoom: 16,   // service tops out at 16; Leaflet upscales past it
  attribution: 'Tiles &copy; Esri'
});
const base_DarkGray = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19, maxNativeZoom: 16,
  attribution: 'Tiles &copy; Esri'
});

// Default map now Light Gray
const map = L.map('map', {
  center:[20,0],
  zoom:2,
  layers:[base_Light],
  worldCopyJump:true
});

// Color scale for magnitude
function magColor(m){
  return m >= 6 ? '#b91c1c' :
         m >= 5 ? '#ef4444' :
         m >= 4 ? '#f97316' :
         m >= 3 ? '#f59e0b' :
         m >= 2 ? '#84cc16' :
         m >= 1 ? '#22c55e' : '#a3a3a3';
}
function magRadius(m){ return 3 + Math.max(m,0) * 3; }

function onEachEQ(feature, layer){
  const p = feature.properties || {};
  const timeStr = p.time ? new Date(p.time).toLocaleString() : '—';
  const place = p.place || 'Unknown location';
  const mag = (p.mag != null) ? p.mag.toFixed(1) : '—';
  const url = p.url || 'https://earthquake.usgs.gov/earthquakes/';
  const html = `
    <div class="popup">
      <h3>M ${mag} — ${place}</h3>
      <div><small><b>Time:</b> ${timeStr}</small></div>
      <a href="${url}" target="_blank" rel="noopener">USGS event page</a>
    </div>`;
  layer.bindPopup(html);
}

const earthquakes = L.geoJSON(null, {
  pointToLayer: (feature, latlng) => {
    const m = feature.properties?.mag || 0;
    return L.circleMarker(latlng, {
      radius: magRadius(m),
      color: magColor(m),
      weight: 1.5,
      fillColor: magColor(m),
      fillOpacity: 0.7
    });
  },
  onEachFeature: onEachEQ
}).addTo(map);

async function loadEQ(){
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
  statusEl.textContent = 'Fetching USGS earthquakes…';
  try{
    const res = await fetch(url);
    // fetch() does not throw on 404/500 — it hands back an error page that
    // res.json() would choke on further down. Fail here instead.
    if(!res.ok) throw new Error(`USGS feed returned ${res.status}`);
    const gj = await res.json();
    earthquakes.clearLayers();
    earthquakes.addData(gj);
    statusEl.textContent = `Earthquakes: ${gj.features?.length || 0} • Updated ${new Date().toLocaleTimeString()}`;
  }catch(err){
    console.error(err);
    statusEl.textContent = 'Failed to load earthquakes (check console).';
  }
}
loadEQ();

// Base Layers
const baseLayers = {
  'Light Gray (Esri)': base_Light,
  'Dark Gray (Esri)': base_DarkGray,
  'OSM Standard': base_OSM
};
L.control.layers(baseLayers, {'Earthquakes': earthquakes}, {collapsed:true}).addTo(map);
L.control.scale({metric:true,imperial:true}).addTo(map);

// Legend for magnitude
const legend = L.control({position:'bottomleft'});
legend.onAdd = function(){
  const div = L.DomUtil.create('div','legend');
  div.innerHTML = '<b>Magnitude</b>';
  const grades = [0,1,2,3,4,5,6];
  for (let i=0;i<grades.length-1;i++){
    const from = grades[i], to = grades[i+1];
    const row = document.createElement('div'); row.className='row';
    const sw = document.createElement('span'); sw.className='swatch'; sw.style.background = magColor(from+0.01);
    const label = document.createElement('span'); label.textContent = `${from}–${to}`;
    row.appendChild(sw); row.appendChild(label); div.appendChild(row);
  }
  const row = document.createElement('div'); row.className='row';
  const sw = document.createElement('span'); sw.className='swatch'; sw.style.background = magColor(6.5);
  const label = document.createElement('span'); label.textContent = `6+`;
  row.appendChild(sw); row.appendChild(label); div.appendChild(row);
  return div;
};
legend.addTo(map);
