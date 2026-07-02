'use strict';

// -- Pure calculation & formatting helpers -----------------------------------
// No DOM access, no shared state — safe to unit test the same way as
// rotation.js (see calc.test.js).

function clamp(v, mn, mx) { return Math.min(mx, Math.max(mn, v)); }
function r1(v)             { return Math.round(v * 10) / 10; }

// -- GPS DMS <-> decimal ------------------------------------------------------
function ddToDms(decimal) {
	const abs = Math.abs(decimal);
	const d   = Math.floor(abs);
	const mf  = (abs - d) * 60;
	const m   = Math.floor(mf);
	const s   = (mf - m) * 60;
	return d + ' ' + m + ' ' + s.toFixed(4);
}

function parseDMS(str) {
	str = str.trim();

	const dec = str.match(/^(-?[\d.]+)[,\s]+(-?[\d.]+)$/);
	if (dec) {
		const lat = parseFloat(dec[1]), lon = parseFloat(dec[2]);
		if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
	}

	const dms = str.match(
		/(\d+)[°\s]\s*(\d+)[''\s]\s*([\d.]+)["″\s]*([NS])[,;\s]+(\d+)[°\s]\s*(\d+)[''\s]\s*([\d.]+)["″\s]*([EW])/i
	);
	if (dms) {
		let lat = +dms[1] + +dms[2] / 60 + +dms[3] / 3600;
		let lon = +dms[5] + +dms[6] / 60 + +dms[7] / 3600;
		if (/s/i.test(dms[4])) lat = -lat;
		if (/w/i.test(dms[8])) lon = -lon;
		return { lat, lon };
	}
	return null;
}

// -- Date & time helpers ------------------------------------------------------
function systemTzOffset() {
	const off  = -new Date().getTimezoneOffset();
	const sign = off >= 0 ? '+' : '-';
	const hh   = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0');
	const mm   = String(Math.abs(off) % 60).padStart(2, '0');
	return sign + hh + ':' + mm;
}

function isValidOffset(s) {
	return /^[+-]\d{2}:\d{2}$/.test(s);
}

function toDatetimeLocal(val) {
	if (!val) return '';
	let d;
	if (val instanceof Date) {
		d = val;
	} else {
		const m = String(val).match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
		if (!m) return '';
		d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
	}
	if (isNaN(d.getTime())) return '';
	const pad = n => String(n).padStart(2, '0');
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
	       'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function fromDatetimeLocal(val) {
	if (!val) return null;
	const m = val.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
	if (!m) return null;
	const ss = m[6] || '00';
	return m[1] + ':' + m[2] + ':' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + ss;
}

function extractDateFromFilename(filename) {
	const m1 = filename.match(/(\d{8})_(\d{6})/);
	if (m1) {
		const d = m1[1], t = m1[2];
		return d.slice(0,4) + '-' + d.slice(4,6) + '-' + d.slice(6,8) +
		       'T' + t.slice(0,2) + ':' + t.slice(2,4) + ':' + t.slice(4,6);
	}
	const m2 = filename.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2})\.(\d{2})\.(\d{2})/);
	if (m2) return m2[1] + '-' + m2[2] + '-' + m2[3] + 'T' + m2[4] + ':' + m2[5] + ':' + m2[6];
	return null;
}

// -- Utility ------------------------------------------------------------------
function esc(s) {
	return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
