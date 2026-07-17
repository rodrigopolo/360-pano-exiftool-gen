'use strict';

// -- Per-target viewer compatibility policy -----------------------------------
// Empirical results from testing GPano Pose/InitialView tags across 15 sample
// panoramas in Facebook, Photo Sphere Viewer (PSV), and a third "Spherical
// Viewer". Each tag maps to one of three actions per target:
//   WRITE      - write the value as-is (correct, or has no visible effect)
//   STRIP      - omit the tag entirely - the viewer renders it non-linearly/
//                unpredictably (e.g. snaps to +-90), so no value we write
//                would be correct
//   COMPENSATE - write the negated value - the viewer applies a clean,
//                consistent sign-flip, so negating on write cancels it out
// Pure math/data, no DOM dependency, so it can be loaded as a <script> in the
// browser and required() in Node tests unmodified (same pattern as rotation.js).
(function (global) {
	const VIEWER_TARGETS = {
		facebook: {
			label: 'Facebook',
			policy: {
				PoseHeadingDegrees:        'STRIP',
				PosePitchDegrees:          'STRIP',
				PoseRollDegrees:           'STRIP',
				InitialViewHeadingDegrees: 'WRITE',
				InitialViewPitchDegrees:   'WRITE',
				InitialViewRollDegrees:    'STRIP',
			},
		},
		psv: {
			label: 'Photo Sphere Viewer',
			policy: {
				PoseHeadingDegrees:        'COMPENSATE',
				PosePitchDegrees:          'WRITE',
				PoseRollDegrees:           'COMPENSATE',
				InitialViewHeadingDegrees: 'STRIP',
				InitialViewPitchDegrees:   'STRIP',
				InitialViewRollDegrees:    'STRIP',
			},
		},
		spherical: {
			label: 'Spherical Viewer',
			policy: {
				PoseHeadingDegrees:        'WRITE',
				PosePitchDegrees:          'STRIP',
				PoseRollDegrees:           'STRIP',
				InitialViewHeadingDegrees: 'WRITE',
				InitialViewPitchDegrees:   'STRIP',
				InitialViewRollDegrees:    'STRIP',
			},
		},
	};

	// Resolve what to do for one tag under a target. targetKey null/'strict'
	// (or unknown) always means WRITE-as-is - the default, spec-compliant path.
	function resolveTagAction(tag, rawValue, targetKey) {
		const target = targetKey && VIEWER_TARGETS[targetKey];
		const action = target ? (target.policy[tag] || 'WRITE') : 'WRITE';
		if (action === 'STRIP')      return { action, value: null };
		if (action === 'COMPENSATE') return { action, value: -rawValue };
		return { action: 'WRITE', value: rawValue };
	}

	// Human-readable warning text for a non-WRITE action, matching the
	// #upload-error box's plain-sentence tone.
	function describeAction(tag, action, targetLabel) {
		if (action === 'STRIP') {
			return targetLabel + ': ' + tag + ' will be cleared (written empty) - ' + targetLabel +
			       ' cannot render this tag correctly regardless of the value written.';
		}
		if (action === 'COMPENSATE') {
			return targetLabel + ': ' + tag + ' will be written inverted to compensate ' +
			       'for a known ' + targetLabel + ' rendering bug.';
		}
		return null;
	}

	const api = { VIEWER_TARGETS, resolveTagAction, describeAction };

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = api;
	} else {
		global.ViewerPolicy = api;
	}
}(typeof window !== 'undefined' ? window : globalThis));
