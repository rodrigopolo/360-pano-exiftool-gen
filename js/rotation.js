'use strict';

// -- GPano rotation helper ---------------------------------------------------
// Implements the Google GPano spec's Euler angle composition:
//   R = R_Z(-heading) . R_X(pitch) . R_Y(roll)
// (Z = up, X = east, Y = north; heading = compass bearing clockwise from
// north, pitch = elevation above horizontal.) Pure math, no DOM dependency,
// so it can be loaded as a <script> in the browser and required() in Node
// tests unmodified.
(function (global) {
	const DEG = Math.PI / 180;

	function normalize360(v) {
		return ((v % 360) + 360) % 360;
	}

	function clampUnit(v) {
		return Math.min(1, Math.max(-1, v));
	}

	function toVector(heading, pitch) {
		const h = heading * DEG, p = pitch * DEG;
		return {
			x: Math.sin(h) * Math.cos(p), // east
			y: Math.cos(h) * Math.cos(p), // north
			z: Math.sin(p),               // up
		};
	}

	function toAngles(v) {
		return {
			heading: normalize360(Math.atan2(v.x, v.y) / DEG),
			pitch:   Math.asin(clampUnit(v.z)) / DEG,
		};
	}

	// local (pano-frame) direction -> world (compass-frame) direction, given Pose
	function localToWorld(pose, local) {
		const r = pose.roll * DEG, p = pose.pitch * DEG, h = pose.heading * DEG;
		const v0 = toVector(local.heading, local.pitch);

		// Ry(roll) -- signed so positive roll rotates the horizon counterclockwise,
		// per the GPano spec ("as roll increases, the horizon rotates
		// counterclockwise"); verified against an independently-built test image
		// with a known baked-in roll tilt.
		const v1 = {
			x:  v0.x * Math.cos(r) - v0.z * Math.sin(r),
			y:  v0.y,
			z:  v0.x * Math.sin(r) + v0.z * Math.cos(r),
		};
		// Rx(pitch)
		const v2 = {
			x: v1.x,
			y: v1.y * Math.cos(p) - v1.z * Math.sin(p),
			z: v1.y * Math.sin(p) + v1.z * Math.cos(p),
		};
		// Rz(-heading)
		const v3 = {
			x: v2.x * Math.cos(h) + v2.y * Math.sin(h),
			y: -v2.x * Math.sin(h) + v2.y * Math.cos(h),
			z: v2.z,
		};

		return toAngles(v3);
	}

	// world (compass-frame) direction -> local (pano-frame) direction, given Pose
	// (inverse of localToWorld: Ry(-roll) . Rx(-pitch) . Rz(heading))
	function worldToLocal(pose, world) {
		const r = pose.roll * DEG, p = pose.pitch * DEG, h = pose.heading * DEG;
		const w = toVector(world.heading, world.pitch);

		// Rz(heading)
		const v2 = {
			x: w.x * Math.cos(h) - w.y * Math.sin(h),
			y: w.x * Math.sin(h) + w.y * Math.cos(h),
			z: w.z,
		};
		// Rx(-pitch)
		const v1 = {
			x: v2.x,
			y: v2.y * Math.cos(p) + v2.z * Math.sin(p),
			z: -v2.y * Math.sin(p) + v2.z * Math.cos(p),
		};
		// Ry(-roll) -- inverse of the Ry(roll) step in localToWorld above
		const v0 = {
			x:  v1.x * Math.cos(r) + v1.z * Math.sin(r),
			y:  v1.y,
			z: -v1.x * Math.sin(r) + v1.z * Math.cos(r),
		};

		return toAngles(v0);
	}

	const api = { normalize360, localToWorld, worldToLocal };

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = api;
	} else {
		global.PanoRotation = api;
	}
}(typeof window !== 'undefined' ? window : globalThis));
