'use strict';

// -- Heading navigation control (viewer-only, not stored as metadata) -------
function setHeading(compassBearing) {
	const v = r1(PanoRotation.normalize360(parseFloat(compassBearing) || 0));
	document.getElementById('heading-slider').value = v;
	document.getElementById('heading-num').value    = v;
	// Freeze accumulated correction and reset Straighten slider
	baseRoll  = p.horizonRoll;
	basePitch = p.horizonPitch;
	document.getElementById('straighten-slider').value = 0;
	document.getElementById('straighten').value        = 0;
	if (!viewer) return;
	let yaw = ((v - p.poseHeading) % 360 + 360) % 360;
	if (yaw > 180) yaw -= 360;
	viewer.setYaw(yaw, false);
}

(function bindHeading() {
	const slider = document.getElementById('heading-slider');
	const num    = document.getElementById('heading-num');
	slider.addEventListener('input',  () => setHeading(slider.value));
	num.addEventListener('input',     () => setHeading(num.value));
	num.addEventListener('change',    () => setHeading(num.value));
	function resetToCenter() { setHeading(p.poseHeading); }
	slider.addEventListener('dblclick', resetToCenter);
	num.addEventListener('dblclick',    resetToCenter);
}());

// -- Straighten control (direction-relative: decomposes into roll + pitch) --
(function bindStraighten() {
	const slider = document.getElementById('straighten-slider');
	const num    = document.getElementById('straighten');

	function update(raw) {
		const s = r1(clamp(parseFloat(raw) || 0, -30, 30));
		slider.value = s;
		num.value    = s;
		const headingVal = parseFloat(document.getElementById('heading-slider').value) || 0;
		const imageYaw   = ((headingVal - p.poseHeading) % 360 + 360) % 360;
		const θ = imageYaw * Math.PI / 180;
		p.horizonRoll  = r1(baseRoll  + s * Math.cos(θ));
		p.horizonPitch = r1(basePitch + s * Math.sin(θ));
		if (viewer) {
			viewer.setHorizonRoll(p.horizonRoll);
			viewer.setHorizonPitch(p.horizonPitch);
		}
		generateCommand();
	}

	function resetStraighten() {
		p.horizonRoll  = baseRoll;
		p.horizonPitch = basePitch;
		slider.value   = 0;
		num.value      = 0;
		if (viewer) {
			viewer.setHorizonRoll(p.horizonRoll);
			viewer.setHorizonPitch(p.horizonPitch);
		}
		generateCommand();
	}

	slider.addEventListener('input', () => update(slider.value));
	num.addEventListener('input',    () => update(num.value));
	num.addEventListener('change',   () => update(num.value));
	slider.addEventListener('dblclick', resetStraighten);
	num.addEventListener('dblclick',    resetStraighten);
}());

// -- Pannellum ----------------------------------------------------------------
function buildViewer() {
	if (viewer) { viewer.destroy(); viewer = null; }

	const northOffset = p.poseHeading;
	const pose  = { heading: p.poseHeading, pitch: p.horizonPitch, roll: p.horizonRoll };
	const local = PanoRotation.worldToLocal(pose, { heading: p.initialHeading, pitch: p.initialPitch });
	const yaw   = local.heading > 180 ? local.heading - 360 : local.heading;

	viewer = pannellum.viewer('pannellum-container', {
		type:         'equirectangular',
		panorama:     imageUrl,
		autoLoad:     true,
		compass:      true,
		northOffset:  northOffset,
		pitch:        local.pitch,
		yaw:          yaw,
		hfov:         p.initialFov,
		horizonPitch: p.horizonPitch,
		horizonRoll:  p.horizonRoll,
		showControls: true,
	});
	document.getElementById('pannellum-container').appendChild(gridEl);
}

function applyLiveUpdate(changedKey) {
	if (!viewer || changedKey !== 'initialFov') return;
	viewer.setHfov(p.initialFov, false);
}

// -- Action buttons -----------------------------------------------------------
document.getElementById('use-current-view').addEventListener('click', () => {
	if (!viewer) return;
	const local = { heading: PanoRotation.normalize360(viewer.getYaw()), pitch: viewer.getPitch() };
	const pose  = { heading: p.poseHeading, pitch: p.horizonPitch, roll: p.horizonRoll };
	const world = PanoRotation.localToWorld(pose, local);
	p.initialHeading = r1(world.heading);
	p.initialPitch   = r1(clamp(world.pitch, -90, 90));
	generateCommand();
});

document.getElementById('set-north').addEventListener('click', () => {
	if (!viewer) return;
	const yaw     = viewer.getYaw();
	p.poseHeading = ((-yaw % 360) + 360) % 360;
	viewer.setNorthOffset(p.poseHeading);
	baseRoll  = p.horizonRoll;
	basePitch = p.horizonPitch;
	document.getElementById('straighten-slider').value = 0;
	document.getElementById('straighten').value        = 0;
	document.getElementById('heading-slider').value    = 0;
	document.getElementById('heading-num').value       = 0;
	generateCommand();
});

// -- Viewer overlay toggles -----------------------------------------------------
document.getElementById('toggle-grid').addEventListener('click', function () {
	const active = document.getElementById('pano-grid').classList.toggle('active');
	this.classList.toggle('active', active);
});
