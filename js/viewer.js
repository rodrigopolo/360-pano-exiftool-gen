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
			viewer.setHorizonRoll(-p.horizonRoll);
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
			viewer.setHorizonRoll(-p.horizonRoll);
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
// Pannellum's horizonRoll rotates opposite the GPano PoseRollDegrees
// convention, so it's negated here; horizonPitch already matches GPano's
// PosePitchDegrees convention directly (no negation). Verified with an
// unambiguous marker/plain-2D-rotation test against real pixel positions,
// independent of this app's own rotation math. Pannellum's own per-frame
// correction handles local/world conversion once these signs are right, so
// pitch/yaw need no pre-transform here — same direct-pass-through pattern
// as setHeading() uses for compass heading.
function buildViewer() {
	if (viewer) { viewer.destroy(); viewer = null; }

	let yaw = ((p.initialHeading - p.poseHeading) % 360 + 360) % 360;
	if (yaw > 180) yaw -= 360;

	viewer = pannellum.viewer('pannellum-container', {
		type:         'equirectangular',
		panorama:     imageUrl,
		autoLoad:     true,
		compass:      true,
		northOffset:  p.poseHeading,
		pitch:        p.initialPitch,
		yaw:          yaw,
		hfov:         p.initialFov,
		horizonPitch: p.horizonPitch,
		horizonRoll:  -p.horizonRoll,
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
	p.initialHeading = r1(PanoRotation.normalize360(viewer.getYaw() + p.poseHeading));
	p.initialPitch   = r1(clamp(viewer.getPitch(), -90, 90));
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
