// This gives you default context menu (cut, copy, paste)
// in all input fields and textareas across your app.

/* global document window */

import {remote} from 'electron';

const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

const globalStore = {
	eventTargetHref: null
};

const isAnyTextSelected = () => {
	return window.getSelection().toString() !== '';
};

const cut = new MenuItem({
	label: 'Cut',
	click: () => {
		document.execCommand('cut');
	}
});

const copy = new MenuItem({
	label: 'Copy',
	click: () => {
		document.execCommand('copy');
	}
});

const paste = new MenuItem({
	label: 'Paste',
	click: () => {
		document.execCommand('paste');
	}
});

const copyLink = new MenuItem({
	label: 'Copy Link',
	click: () => {
		console.log(globalStore.eventTargetHref);
		copyToClipboard(globalStore.eventTargetHref);
	}
});

const normalMenu = new Menu();
normalMenu.append(copy);

const textEditingMenu = new Menu();
textEditingMenu.append(cut);
textEditingMenu.append(copy);
textEditingMenu.append(paste);

const linkMenu = new Menu();
linkMenu.append(copyLink);

document.addEventListener('contextmenu', event => {
	switch (event.target.nodeName) {
		case 'TEXTAREA':
		case 'INPUT':
			event.preventDefault();
			textEditingMenu.popup(remote.getCurrentWindow());
			break;
		case 'A':
			event.preventDefault();
			globalStore.eventTargetHref = event.target.href;
			linkMenu.popup(remote.getCurrentWindow());
			break;
		default:
			if (isAnyTextSelected()) {
				event.preventDefault();
				normalMenu.popup(remote.getCurrentWindow());
			}
	}
}, false);

function copyToClipboard(text) {
	const textArea = document.createElement('textarea');
	textArea.textContent = text;
	document.body.appendChild(textArea);
	textArea.select();
	try {
		return document.execCommand('copy');
	} catch (err) {
		console.warn('Copy to clipboard failed.', err);
		return false;
	} finally {
		document.body.removeChild(textArea);
	}
}
