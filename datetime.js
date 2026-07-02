'use strict';

// -- Date & time UI wiring ----------------------------------------------------
// (pure formatting helpers live in calc.js: toDatetimeLocal, fromDatetimeLocal,
// extractDateFromFilename, systemTzOffset, isValidOffset)

function detectDateTime(file, data) {
	let dtLocal = extractDateFromFilename(file.name);

	if (!dtLocal) {
		if (data && data.DateTimeOriginal) {
			dtLocal = toDatetimeLocal(data.DateTimeOriginal);
		} else if (data && data.CreateDate) {
			dtLocal = toDatetimeLocal(data.CreateDate);
		} else if (data && data.ModifyDate) {
			dtLocal = toDatetimeLocal(data.ModifyDate);
		}
	}

	if (!dtLocal) return;

	document.getElementById('datetime-input').value = dtLocal;
	photoDate = fromDatetimeLocal(dtLocal);
	tzOffset  = systemTzOffset();
	document.getElementById('tz-input').value = tzOffset;
}

document.getElementById('detect-date-btn').addEventListener('click', async () => {
	if (!currentFile) return;
	try {
		const data = await exifr.parse(currentFile, { exif: true, tiff: true });
		detectDateTime(currentFile, data || {});
		generateCommand();
	} catch (_) {
		detectDateTime(currentFile, {});
		generateCommand();
	}
});

document.getElementById('datetime-input').addEventListener('input', () => {
	photoDate = fromDatetimeLocal(document.getElementById('datetime-input').value);
	generateCommand();
});

document.getElementById('tz-input').addEventListener('input', () => {
	const val = document.getElementById('tz-input').value.trim();
	tzOffset = isValidOffset(val) ? val : null;
	generateCommand();
});

document.getElementById('clear-date-btn').addEventListener('click', () => {
	photoDate = null;
	tzOffset  = null;
	document.getElementById('datetime-input').value = '';
	document.getElementById('tz-input').value        = '';
	generateCommand();
});
