'use strict';

// -- Exiftool command generation ----------------------------------------------
// (ddToDms lives in calc.js)

function generateCommand() {
	if (!imageName) return;

	const lines = [
		'exiftool \\',
		'  -XMP-GPano:ProjectionType="equirectangular" \\',
		'  -XMP-GPano:UsePanoramaViewer=True \\',
		'  -XMP-GPano:FullPanoWidthPixels='              + imageW + ' \\',
		'  -XMP-GPano:FullPanoHeightPixels='             + imageH + ' \\',
		'  -XMP-GPano:CroppedAreaImageWidthPixels='      + imageW + ' \\',
		'  -XMP-GPano:CroppedAreaImageHeightPixels='     + imageH + ' \\',
		'  -XMP-GPano:CroppedAreaLeftPixels=0 \\',
		'  -XMP-GPano:CroppedAreaTopPixels=0 \\',
	];

	const ORIENTATION_TAGS = [
		['PoseHeadingDegrees',        p.poseHeading],
		['PosePitchDegrees',          p.horizonPitch],
		['PoseRollDegrees',           p.horizonRoll],
		['InitialViewHeadingDegrees', p.initialHeading],
		['InitialViewPitchDegrees',   p.initialPitch],
		['InitialViewRollDegrees',    p.initialRoll],
	];
	const warnings   = [];
	const targetInfo = targetViewer !== 'strict' ? ViewerPolicy.VIEWER_TARGETS[targetViewer] : null;
	const targetLabel = targetInfo ? targetInfo.label : null;

	ORIENTATION_TAGS.forEach(([tag, rawValue]) => {
		const { action, value } = ViewerPolicy.resolveTagAction(tag, rawValue, targetViewer);
		if (action === 'STRIP') {
			if (targetLabel) warnings.push(ViewerPolicy.describeAction(tag, action, targetLabel));
			lines.push('  -XMP-GPano:' + tag + '= \\');
			return;
		}
		if (action === 'COMPENSATE' && targetLabel) {
			warnings.push(ViewerPolicy.describeAction(tag, action, targetLabel));
		}
		lines.push('  -XMP-GPano:' + tag + '=' + value.toFixed(1) + ' \\');
	});
	lines.push('  -XMP-GPano:InitialHorizontalFOVDegrees=' + p.initialFov.toFixed(1) + ' \\');

	const warningsEl = document.getElementById('viewer-warnings');
	if (warnings.length) {
		warningsEl.innerHTML = warnings.map(w => '<div>' + esc(w) + '</div>').join('');
		warningsEl.classList.remove('hidden');
	} else {
		warningsEl.textContent = '';
		warningsEl.classList.add('hidden');
	}

	if (gpsLat !== null && gpsLon !== null) {
		const latDms = ddToDms(gpsLat);
		const lonDms = ddToDms(gpsLon);
		const latRef = gpsLat >= 0 ? 'North' : 'South';
		const lonRef = gpsLon >= 0 ? 'East'  : 'West';
		lines.push('  -GPSLatitude="'  + latDms + '" -GPSLatitudeRef='  + latRef + ' \\');
		lines.push('  -GPSLongitude="' + lonDms + '" -GPSLongitudeRef=' + lonRef + ' \\');
	}

	if (photoDate && tzOffset) {
		const parts     = photoDate.split(' ');
		const date_part = parts[0];
		const time_part = parts[1];
		const dt_plain  = photoDate;
		const dt_offset = dt_plain  + tzOffset;
		const time_off  = time_part + tzOffset;
		const dt_subsec = dt_plain  + '.00' + tzOffset;
		lines.push('  -DateTimeOriginal="'          + dt_plain  + '" \\');
		lines.push('  -CreateDate="'                + dt_plain  + '" \\');
		lines.push('  -FileModifyDate="'            + dt_offset + '" \\');
		lines.push('  -ModifyDate="'                + dt_plain  + '" \\');
		lines.push('  -OffsetTime="'                + tzOffset  + '" \\');
		lines.push('  -OffsetTimeOriginal="'         + tzOffset  + '" \\');
		lines.push('  -OffsetTimeDigitized="'        + tzOffset  + '" \\');
		lines.push('  -IPTC:DigitalCreationDate="'  + date_part + '" \\');
		lines.push('  -IPTC:TimeCreated="'           + time_off  + '" \\');
		lines.push('  -IPTC:DigitalCreationTime="'   + time_off  + '" \\');
		lines.push('  -XMP:DateCreated="'            + dt_subsec + '" \\');
	}

	lines.push('  -overwrite_original \\');
	lines.push('  "' + imageName + '"');

	document.getElementById('command-output').textContent = lines.join('\n');
}

// -- Target viewer -------------------------------------------------------------
document.getElementById('target-viewer').addEventListener('change', (e) => {
	targetViewer = e.target.value;
	generateCommand();
});

// -- Copy command ---------------------------------------------------------------
document.getElementById('copy-cmd').addEventListener('click', () => {
	const text = document.getElementById('command-output').textContent;
	if (!text) return;

	const show = () => {
		const el = document.getElementById('copy-status');
		el.classList.add('visible');
		setTimeout(() => el.classList.remove('visible'), 2000);
	};

	if (navigator.clipboard) {
		navigator.clipboard.writeText(text).then(show);
	} else {
		const ta = document.createElement('textarea');
		ta.value = text;
		Object.assign(ta.style, { position: 'fixed', opacity: '0' });
		document.body.appendChild(ta);
		ta.select();
		document.execCommand('copy');
		document.body.removeChild(ta);
		show();
	}
});
