import {app, BrowserWindow,	Notification,	screen} from 'electron';
import jetpack from 'fs-jetpack';

import env from 'env'; // eslint-disable-line import/no-unresolved
import store from './config';

const log = require('electron-log');
const argv = require('minimist')(process.argv, {boolean: true});

export default (name, options) => {
	const userDataDir = jetpack.cwd(app.getPath('userData'));
	const stateStoreFile = `window-state-${name}.json`;
	const defaultSize = {
		width: options.width,
		height: options.height
	};
	let state = {};
	let win; // eslint-disable-line prefer-const

	const restore = () => {
		let restoredState = {};
		try {
			restoredState = userDataDir.read(stateStoreFile, 'json');
		} catch (err) {
			log.error(err);
		}
		return Object.assign({}, defaultSize, restoredState);
	};

	const getCurrentPosition = () => {
		const position = win.getPosition();
		const size = win.getSize();
		return {
			x: position[0],
			y: position[1],
			width: size[0],
			height: size[1]
		};
	};

	const windowWithinBounds = (windowState, bounds) => {
		return windowState.x >= bounds.x &&
			windowState.y >= bounds.y &&
			windowState.x + windowState.width <= bounds.x + bounds.width &&
			windowState.y + windowState.height <= bounds.y + bounds.height;
	};

	const resetToDefaults = () => {
		const bounds = screen.getPrimaryDisplay().bounds;
		return Object.assign({}, defaultSize, {
			x: (bounds.width - defaultSize.width) / 2,
			y: (bounds.height - defaultSize.height) / 2
		});
	};

	const ensureVisibleOnSomeDisplay = windowState => {
		const visible = screen.getAllDisplays().some(display => {
			return windowWithinBounds(windowState, display.bounds);
		});
		if (!visible) {
			return resetToDefaults();
		}
		return windowState;
	};

	const saveState = () => {
		if (!win.isMinimized() && !win.isMaximized()) {
			Object.assign(state, getCurrentPosition());
		}
		userDataDir.write(stateStoreFile, state, {
			atomic: true
		});
	};

	state = ensureVisibleOnSomeDisplay(restore());

	win = new BrowserWindow(Object.assign({}, options, state));

	win.on('close', evt => {
		if (!app.isQuiting && env.name !== 'test') {
			saveState();
			evt.preventDefault();
			win.hide();
			if (Notification.isSupported()) {
				if (store.get('app.trayWarning') === false) {
					const minimiseNotification = new Notification({
						title: app.getName(),
						body: `Running in tray - right click icon to Quit`,
						icon: false
					});
					minimiseNotification.show();
					store.set('app.trayWarning', true);
				}
			}
		}
		if (env.name === 'development') {
			store.set('seenAlerts', {});
			store.set('seenInvasions', {});
		}
		return false;
	});

	win.on('minimize', evt => {
		evt.preventDefault();
		win.hide();
	});

	win.once('ready-to-show', () => {
		if (!argv.hidden) {
			win.show();
		}
	});

	return win;
};
