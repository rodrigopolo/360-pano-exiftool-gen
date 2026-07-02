'use strict';

// -- EXIF reading ---------------------------------------------------------------
async function readExif(file) {
	try {
		// Default to {} rather than early-returning when no metadata is found
		// at all — filename-based date detection (detectDateTime) must still
		// run for images with zero embedded EXIF/XMP.
		const data = await exifr.parse(file, { xmp: true, gps: true, exif: true, tiff: true }) || {};
		if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
			setGPS(data.latitude, data.longitude);
			map.setView([data.latitude, data.longitude], 14);
		}
		// Slider-bound fields
		if (typeof data.InitialHorizontalFOVDegrees === 'number') setControl('initial-fov', data.InitialHorizontalFOVDegrees);
		// Non-slider fields — assign directly to p
		if (typeof data.PoseHeadingDegrees        === 'number') p.poseHeading    = r1(PanoRotation.normalize360(data.PoseHeadingDegrees));
		if (typeof data.PosePitchDegrees          === 'number') p.horizonPitch   = r1(clamp(data.PosePitchDegrees,        -90,   90));
		if (typeof data.PoseRollDegrees           === 'number') p.horizonRoll    = r1(clamp(data.PoseRollDegrees,         -180,  180));
		if (typeof data.InitialViewHeadingDegrees === 'number') p.initialHeading = r1(PanoRotation.normalize360(data.InitialViewHeadingDegrees));
		if (typeof data.InitialViewPitchDegrees   === 'number') p.initialPitch   = r1(clamp(data.InitialViewPitchDegrees,  -90,   90));
		detectDateTime(file, data);

	} catch (_) { /* no/invalid EXIF is fine */ }
}
