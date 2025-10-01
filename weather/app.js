
// WEATHER MAP
const statusEl = document.getElementById('status');

// Base maps
const base_OSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
});
const base_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap, &copy; CARTO'
});
const base_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap, &copy; CARTO'
});

const map = L.map('map', {
  center: [39.5, -98.5], // US centroid
  zoom: 5,
  layers: [base_Positron],
  zoomControl: true,
  worldCopyJump: true
});

// Radar WMS overlay (Iowa State Mesonet)
const radarWMS = L.tileLayer.wms('https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi', {
  layers: 'nexrad-n0r-900913',
  format: 'image/png',
  transparent: true,
  opacity: 0.7,
  attribution: 'IEM NEXRAD'
}).addTo(map);

// Severity colors
const severityColors = {
  'Extreme': '#ef4444', // red
  'Severe':  '#f59e0b', // amber
  'Moderate':'#eab308', // yellow
  'Minor':   '#22c55e', // green
  'Unknown': '#94a3b8'  // slate
};

function alertStyle(feature){
  const sev = feature.properties?.severity || 'Unknown';
  return {
    color: severityColors[sev] || severityColors['Unknown'],
    weight: 2,
    opacity: 1,
    fillOpacity: 0.15
  };
}

function onEachAlert(feature, layer){
  const p = feature.properties || {};
  const headline = p.headline || p.event || 'Weather Alert';
  const areas = p.areaDesc || '—';
  const sent = p.sent ? new Date(p.sent).toLocaleString() : '—';
  const effective = p.effective ? new Date(p.effective).toLocaleString() : '—';
  const expires = p.expires ? new Date(p.expires).toLocaleString() : '—';
  const sev = p.severity || 'Unknown';
  const src = p.senderName || 'NWS';
  const link = p?.id ? p.id : p?.url || 'https://www.weather.gov/';
  const html = `
    <div class="popup">
      <h3>${headline}</h3>
      <div><small><b>Severity:</b> ${sev} • <b>Source:</b> ${src}</small></div>
      <div><small><b>Areas:</b> ${areas}</small></div>
      <div><small><b>Effective:</b> ${effective}</small></div>
      <div><small><b>Expires:</b> ${expires}</small></div>
      <a href="${link}" target="_blank" rel="noopener">More details</a>
    </div>`;
  layer.bindPopup(html);
  layer.on('mouseover', e => e.target.setStyle({weight: 3, fillOpacity: .25}));
  layer.on('mouseout',  e => e.target.setStyle({weight: 2, fillOpacity: .15}));
}

// Load active alerts
const alertsLayer = L.geoJSON(null, {
  style: alertStyle,
  onEachFeature: onEachAlert
}).addTo(map);

async function loadAlerts(){
  const url = "https://api.weather.gov/alerts/active?status=actual&message_type=alert&limit=500";
  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/geo+json",
        "User-Agent": "PurnaSaud (purnasaud3@gmail.com)"
      }
    });
    const gj = await res.json();
    alertsLayer.clearLayers();
    alertsLayer.addData(gj);
    statusEl.textContent = `Active alerts: ${gj.features?.length || 0}`;
  } catch(err){
    console.error(err);
    statusEl.textContent = "Failed to load alerts (see console).";
  }
}

loadAlerts();

// Base + overlay controls
const baseLayers = {
  'CARTO Positron (light)': base_Positron,
  'CARTO Dark Matter': base_DarkMatter,
  'OSM Standard': base_OSM
};
const overlays = {
  'NEXRAD Radar (WMS)': radarWMS,
  'NWS Alerts (active)': alertsLayer
};
L.control.layers(baseLayers, overlays, {collapsed:true}).addTo(map);
L.control.scale({metric:false, imperial:true}).addTo(map);

// Legend
const legend = L.control({position:'bottomleft'});
legend.onAdd = function(){
  const div = L.DomUtil.create('div','legend');
  div.innerHTML = '<b>NWS Alert Severity</b>';
  const order = ['Extreme','Severe','Moderate','Minor','Unknown'];
  order.forEach(k => {
    const row = document.createElement('div');
    row.className = 'row';
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = severityColors[k];
    row.appendChild(sw);
    const label = document.createElement('span');
    label.textContent = k;
    row.appendChild(label);
    div.appendChild(row);
  });
  return div;
};
legend.addTo(map);
