/* global document window URL */
/* eslint-disable import/no-unassigned-import */

import {ipcRenderer} from 'electron';
import './helpers/external-links';

window.jQuery = require('../node_modules/jquery/dist/jquery.js');

window.$ = window.jQuery;
window.Hammer = require('../node_modules/materialize-css/js/hammer.min.js');
require('materialize-css');

const log = require('electron-log');

const logElem = document.querySelector('#log');
const scrollContainer = document.querySelector('.container');
const is = require('@sindresorhus/is');
const ucfirst = require('ucfirst');
const unhandled = require('electron-unhandled');

unhandled({
	logger: err => {
		log.error(err);
	},
	showDialog: true
});

// Disable eval
// eslint-disable-next-line no-multi-assign, no-eval
window.eval = global.eval = function () {
	throw new Error('Sorry, this app does not support window.eval().');
};

let autoScroll = true;

// Enable/Disable Autoscroll on scroll wheel
window.addEventListener('mousewheel', () => {
	autoScroll = scrollContainer.scrollTop + scrollContainer.offsetHeight >= logElem.scrollHeight;
});

ipcRenderer.on('log-data', (event, msg, status) => {
	let statusClass = '';
	if (status) {
		statusClass = ` class="${status}"`;
	}
	logElem.innerHTML += `<p${statusClass}>${msg}</p>\n`;
	if (autoScroll) {
		scrollContainer.scrollTop = logElem.scrollHeight;
	}
});

ipcRenderer.on('filter-data', (event, settings, defaults) => {
	const pages = document.querySelectorAll('.tabs .tab');
	let page;
	for (let i = 0; i < pages.length; i++) {
		page = new URL(pages[i].firstChild.href).hash.replace('#', '');
		if (page === 'log') {
			continue;
		} else if (page === 'planets') {
			populatePage(page, settings.planets, 'filters.planets', defaults.planets);
		} else if (page === 'other') {
			populateOtherPage(settings.other, 'filters.other', defaults.other);
		} else {
			populatePage(page, settings.items[page], 'filters.items.' + page, defaults.items[page]);
		}
	}
});

document.querySelector('#menuBar').addEventListener('click', () => {
	if (logElem.className.indexOf('active') > -1) {
		document.querySelector('body').style = 'overflow-y: auto';
		scrollContainer.scrollTop = logElem.scrollHeight;
	} else {
		document.querySelector('body').style = 'overflow-y: hidden';
		scrollContainer.scrollTop = 0;
	}
	autoScroll = false;
}, false);

function populatePage(page, settings, configNode, defaults) {
	const selector = '#' + page;
	const elem = document.querySelector(selector);
	let HTML = '<form action="#" id="' + page + '">\n';
	HTML += '<div class="row">';
	HTML += '<div class="col s4">';
	let i = 0;
	for (const item in defaults) {
		if (Object.prototype.hasOwnProperty.call(defaults, item)) {
			let checked = '';
			if (is.boolean(settings[item]) || is.boolean(defaults[item])) {
				if (is.truthy(settings[item])) {
					checked = ' checked ';
				}
				HTML += '<p><input type="checkbox" id="' + item + '" class="filled-in"' + checked + 'data-config-node="' + configNode + '"/><label for="' + item + '" title="Shift click to Select/Deselect All"><a href="http://warframe.wikia.com/wiki/Special:Search?query=' + encodeURIComponent(item.replace(/(\d+) /, '')) + '" class="js-external-link" title="Open Warframe Wiki">' + ucfirst(item) + '</a></label></p>';
			}
			// New column after 12 lines
			if ((++i % 12) === 0 && i !== 0) {
				HTML += '</div><div class="col s4">';
			}
		}
	}
	HTML += '</div>';
	HTML += '</div>';
	HTML += '</form>\n';
	elem.innerHTML = HTML;
	bindEvents(page);
}

function populateOtherPage(settings, configNode) {
	const elem = document.querySelector('#other');
	let HTML = '<form action="#" id="other">\n';
	HTML += '<div class="row">';
	HTML += '<div class="col s3">';
	let helmetsChecked = '';
	let weaponSkinsChecked = '';
	let kubrowEggChecked = '';
	let giftLotusChecked = '';
	const creditsValue = settings.credits || 0;
	const endoValue = settings.endo || 0;
	const tracesValue = settings.traces || 0;
	const customValue = settings.custom;
	if (is.truthy(settings.helmets)) {
		helmetsChecked = ' checked ';
	}
	if (is.truthy(settings.weaponSkins)) {
		weaponSkinsChecked = ' checked ';
	}
	if (is.truthy(settings.kubrowEgg)) {
		kubrowEggChecked = ' checked ';
	}
	if (is.truthy(settings.giftLotus)) {
		giftLotusChecked = ' checked ';
	}
	HTML += '<p><input type="checkbox" id="helmets" class="filled-in"' + helmetsChecked + 'data-config-node="' + configNode + '"/><label for="helmets" title="Shift click to Select/Deselect All">Helmets</label></p>';
	HTML += '<p><input type="checkbox" id="weaponSkins" class="filled-in"' + weaponSkinsChecked + 'data-config-node="' + configNode + '"/><label for="weaponSkins">Weapon Skins</label></p>';
	HTML += '<p><input type="checkbox" id="kubrowEgg" class="filled-in"' + kubrowEggChecked + 'data-config-node="' + configNode + '"/><label for="kubrowEgg">Kubrow Eggs</label></p>';
	HTML += '<p><input type="checkbox" id="giftLotus" class="filled-in"' + giftLotusChecked + 'data-config-node="' + configNode + '"/><label for="giftLotus">Gift from the Lotus</label></p>';
	HTML += '<p>At least: </p>';
	HTML += '<p><input type="number" id="credits" data-config-node="' + configNode + '" value="' + creditsValue + '"/><label for="credits">Credits</label></p>';
	HTML += '<p><input type="number" id="endo" data-config-node="' + configNode + '" value="' + endoValue + '"/><label for="endo">Endo</label></p>';
	HTML += '<p><input type="number" id="traces" data-config-node="' + configNode + '" value="' + tracesValue + '"/><label for="traces">Traces</label></p>';
	HTML += '</div><div class="col s9">';
	HTML += '<p>Comma seperated list of exact item names: </p>';
	HTML += '<textarea id="custom" class="materialize-textarea" data-config-node="' + configNode + '"/>' + customValue + '</textarea><label for="custom">Custom</label></p>';
	HTML += '</div>';
	HTML += '</div>';
	HTML += '</form>\n';
	elem.innerHTML = HTML;
	bindEvents('other');
}

function bindEvents(page) {
	const checkboxes = document.querySelectorAll(`form#${page} input[type=checkbox]`);
	for (let i = 0; i < checkboxes.length; i++) {
		checkboxes[i].addEventListener('click', checkAll, false);
	}
	const body = document.querySelector(`form#${page}`);
	if (body) {
		body.addEventListener('change', evt => {
			updateFilter(evt.target);
		}, false);
	}
}

function checkAll(evt) {
	if (evt.shiftKey || evt.ctrlKey) {
		const formElems = document.querySelectorAll(`#${evt.target.form.id} input[type=checkbox]`);
		for (let i = 0; i < formElems.length; i++) {
			formElems[i].checked = evt.target.checked;
			updateFilter(formElems[i]);
		}
	}
}

function updateFilter(elem) {
	const opts = {
		config: elem.getAttribute('data-config-node'),
		item: elem.id
	};
	if (elem.type === 'checkbox') {
		opts.value = elem.checked;
		ipcRenderer.send('update-filter', opts);
	} else if (elem.type === 'number') {
		opts.value = Number(elem.value);
		ipcRenderer.send('update-filter', opts);
	} else if (elem.type === 'text') {
		opts.value = elem.value;
		ipcRenderer.send('update-filter', opts);
	} else if (elem.type === 'textarea') {
		opts.value = elem.value;
		ipcRenderer.send('update-filter', opts);
	}
}
