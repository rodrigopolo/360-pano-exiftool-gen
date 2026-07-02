'use strict';

// -- Image loading & validation -------------------------------------------------
function processFile(file) {
	if (!file.type.startsWith('image/')) { showError('File is not an image.'); return; }
	currentFile = file;

	const url = URL.createObjectURL(file);
	const img = new Image();

	img.onload = async () => {
		const ratio = img.naturalWidth / img.naturalHeight;
		if (ratio < 1.99 || ratio > 2.01) {
			URL.revokeObjectURL(url);
			showError(
				'Invalid aspect ratio: ' + ratio.toFixed(3) + ':1 (expected 2:1). ' +
				'Detected size: ' + img.naturalWidth + '×' + img.naturalHeight + 'px.'
			);
			return;
		}
		hideError();
		if (imageUrl) URL.revokeObjectURL(imageUrl);
		imageUrl  = url;
		imageName = file.name;
		imageW    = img.naturalWidth;
		imageH    = img.naturalHeight;

		document.getElementById('file-info').innerHTML =
			'<strong>' + esc(file.name) + '</strong>&nbsp;&nbsp;' + imageW + '×' + imageH + 'px';

		resetControls();
		showMain();
		await readExif(file);
		Object.assign(loadedVals, p);
		baseRoll  = p.horizonRoll;
		basePitch = p.horizonPitch;
		buildViewer();
		generateCommand();
	};

	img.onerror = () => { URL.revokeObjectURL(url); showError('Could not read image file.'); };
	img.src = url;
}

function showError(msg) {
	const el = document.getElementById('upload-error');
	el.textContent = msg;
	el.classList.remove('hidden');
}
function hideError() { document.getElementById('upload-error').classList.add('hidden'); }

function showMain() {
	document.getElementById('upload-zone').classList.add('hidden');
	document.getElementById('main-layout').classList.remove('hidden');
	if (!map) initMap();
}

function resetAll() {
	clearTimeout(debTimer);
	if (viewer)   { viewer.destroy(); viewer = null; }
	if (imageUrl) { URL.revokeObjectURL(imageUrl); imageUrl = null; }
	imageName = null; imageW = 0; imageH = 0;
	gpsLat = null; gpsLon = null;
	if (marker) { marker.remove(); marker = null; }

	resetControls();
	document.getElementById('lat-input').value            = '';
	document.getElementById('lon-input').value            = '';
	document.getElementById('location-search').value      = '';
	document.getElementById('command-output').textContent = '';
	document.getElementById('file-input').value           = '';

	document.getElementById('main-layout').classList.add('hidden');
	document.getElementById('upload-zone').classList.remove('hidden');
	hideError();
}

// -- Drag-and-drop & file browse --------------------------------------------
const dropArea = document.getElementById('drop-area');

dropArea.addEventListener('click',     () => document.getElementById('file-input').click());
dropArea.addEventListener('dragover',  e  => { e.preventDefault(); dropArea.classList.add('drag-over'); });
dropArea.addEventListener('dragleave', ()  => dropArea.classList.remove('drag-over'));
dropArea.addEventListener('drop',      e  => {
	e.preventDefault();
	dropArea.classList.remove('drag-over');
	const f = e.dataTransfer.files[0];
	if (f) processFile(f);
});

document.getElementById('browse-btn').addEventListener('click', e => {
	e.stopPropagation();
	document.getElementById('file-input').click();
});
document.getElementById('file-input').addEventListener('change', e => {
	if (e.target.files[0]) processFile(e.target.files[0]);
});
document.getElementById('reset-btn').addEventListener('click', resetAll);

// -- Drag-to-replace an already-loaded image ---------------------------------
// #drop-area above only exists/handles drops while the empty upload-zone is
// visible. This adds a second, window-level path that activates once an
// image is loaded (guarded by imageUrl) so the two never double-handle the
// same event.
let dragHideTimer = null;

window.addEventListener('dragover', e => {
	if (!imageUrl) return;
	if (!Array.from(e.dataTransfer.types).includes('Files')) return;
	e.preventDefault(); // required to allow drop
	clearTimeout(dragHideTimer);
	document.getElementById('drop-overlay').classList.remove('hidden');
});

window.addEventListener('dragleave', () => {
	if (!imageUrl) return;
	dragHideTimer = setTimeout(() => document.getElementById('drop-overlay').classList.add('hidden'), 50);
});

window.addEventListener('drop', e => {
	if (!imageUrl) return;
	e.preventDefault();
	clearTimeout(dragHideTimer);
	document.getElementById('drop-overlay').classList.add('hidden');
	const f = e.dataTransfer.files[0];
	if (f) { resetAll(); processFile(f); }
});
