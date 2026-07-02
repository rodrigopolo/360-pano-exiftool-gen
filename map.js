'use strict';

// -- Leaflet map --------------------------------------------------------------
function initMap() {
	map = L.map('map').setView([20, 0], 2);

	L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
		attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' +
								 ' contributors © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
		subdomains: 'abcd',
		maxZoom: 19,
	}).addTo(map);

	map.on('click', e => { setGPS(e.latlng.lat, e.latlng.lng); map.panTo(e.latlng); });

	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			pos => map.setView([pos.coords.latitude, pos.coords.longitude], 10),
			() => {}
		);
	}
}

function setGPS(lat, lon) {
	gpsLat = parseFloat(parseFloat(lat).toFixed(6));
	gpsLon = parseFloat(parseFloat(lon).toFixed(6));
	document.getElementById('lat-input').value = gpsLat;
	document.getElementById('lon-input').value = gpsLon;

	if (marker) {
		marker.setLatLng([gpsLat, gpsLon]);
	} else {
		marker = L.marker([gpsLat, gpsLon], { draggable: true }).addTo(map);
		marker.on('dragend', () => {
			const ll = marker.getLatLng();
			gpsLat = parseFloat(ll.lat.toFixed(6));
			gpsLon = parseFloat(ll.lng.toFixed(6));
			document.getElementById('lat-input').value = gpsLat;
			document.getElementById('lon-input').value = gpsLon;
			generateCommand();
		});
	}
	generateCommand();
}

document.getElementById('lat-input').addEventListener('change', () => {
	const lat = parseFloat(document.getElementById('lat-input').value);
	if (!isNaN(lat)) setGPS(lat, gpsLon !== null ? gpsLon : 0);
});
document.getElementById('lon-input').addEventListener('change', () => {
	const lon = parseFloat(document.getElementById('lon-input').value);
	if (!isNaN(lon)) setGPS(gpsLat !== null ? gpsLat : 0, lon);
});
document.getElementById('clear-gps-btn').addEventListener('click', () => {
	gpsLat = gpsLon = null;
	document.getElementById('lat-input').value        = '';
	document.getElementById('lon-input').value        = '';
	document.getElementById('location-search').value  = '';
	if (marker) { marker.remove(); marker = null; }
	generateCommand();
});

// -- Location search (DMS / decimal, via parseDMS in calc.js) ----------------
function searchLocation() {
	const str = document.getElementById('location-search').value;
	const r   = parseDMS(str);
	if (r) {
		setGPS(r.lat, r.lon);
		map.setView([r.lat, r.lon], 14);
	} else {
		alert(
			'Could not parse coordinates.\n\nAccepted formats:\n' +
			'  37.7749, -122.4194\n' +
			'  14°33‧44.7″N 90°31‧20.9″W'
		);
	}
}

document.getElementById('search-btn').addEventListener('click', searchLocation);
document.getElementById('location-search').addEventListener('keydown', e => {
	if (e.key === 'Enter') searchLocation();
});
