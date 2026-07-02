'use strict';

// -- State --------------------------------------------------------------------
let viewer    = null;
const gridEl  = document.getElementById('pano-grid');
let debTimer  = null;
let imageUrl  = null;
let imageName = null;
let imageW    = 0;
let imageH    = 0;
let map       = null;
let marker    = null;
let gpsLat    = null;
let gpsLon    = null;
let photoDate = null;   // 'YYYY:MM:DD HH:MM:SS' or null
let tzOffset  = null;   // '+HH:MM' / '-HH:MM' or null
let currentFile = null; // File reference for "Detect from image"
let baseRoll  = 0;      // accumulated horizonRoll before current Straighten session
let basePitch = 0;      // accumulated horizonPitch before current Straighten session

const p = {
	poseHeading:    0,   // set by Set North + EXIF
	initialHeading: 0,   // set by Use Current View + EXIF
	initialPitch:   0,   // set by Use Current View + EXIF
	horizonPitch:   0,   // derived from Straighten + heading
	horizonRoll:    0,   // derived from Straighten + heading
	initialFov:     100, // FOV slider
};

const loadedVals = {
	poseHeading:    0,
	initialHeading: 0,
	initialPitch:   0,
	horizonPitch:   0,
	horizonRoll:    0,
	initialFov:     100,
};

// -- Control definitions (slider-bound controls only) -----------------------
const CONTROLS = [
	{ id: 'initial-fov', key: 'initialFov', min: 30, max: 150, def: 100 },
];

// -- Slider ↔ number input binding -----------------------------------------
function bindControls() {
	CONTROLS.forEach(({ id, key, min, max }) => {
		const num    = document.getElementById(id);
		const slider = document.getElementById(id + '-slider');

		function update(raw) {
			const v  = r1(clamp(parseFloat(raw) || 0, min, max));
			p[key]       = v;
			num.value    = v;
			slider.value = v;
			generateCommand();
			if (!imageUrl) return;
			if (viewer) {
				applyLiveUpdate(key);
			} else {
				clearTimeout(debTimer);
				debTimer = setTimeout(buildViewer, 250);
			}
		}

		num.addEventListener('input',  () => update(num.value));
		num.addEventListener('change', () => update(num.value));
		slider.addEventListener('input', () => update(slider.value));

		function resetToLoaded() { update(loadedVals[key]); }
		slider.addEventListener('dblclick', resetToLoaded);
		num.addEventListener('dblclick',    resetToLoaded);
	});
}

function setControl(id, val) {
	const ctrl = CONTROLS.find(c => c.id === id);
	if (!ctrl) return;
	const v = r1(clamp(parseFloat(val) || 0, ctrl.min, ctrl.max));
	p[ctrl.key] = v;
	document.getElementById(id).value             = v;
	document.getElementById(id + '-slider').value = v;
}

function resetControls() {
	CONTROLS.forEach(({ id, key, def }) => { setControl(id, def); loadedVals[key] = def; });
	p.poseHeading    = 0;
	p.initialHeading = 0;
	p.initialPitch   = 0;
	p.horizonPitch   = 0;
	p.horizonRoll    = 0;
	baseRoll         = 0;
	basePitch        = 0;
	document.getElementById('heading-slider').value    = 0;
	document.getElementById('heading-num').value       = 0;
	document.getElementById('straighten-slider').value = 0;
	document.getElementById('straighten').value        = 0;
	photoDate = null;
	tzOffset  = null;
	document.getElementById('datetime-input').value = '';
	document.getElementById('tz-input').value        = '';
}
