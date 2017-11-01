import path from 'path';
import url from 'url';
import {app, ipcMain, Menu, Tray} from 'electron';
import {autoUpdater} from 'electron-updater';

import devMenuTemplate from './menu/dev-menu-template';
import createWindow from './helpers/window';
import {checkAlert, checkInvasion} from './api';
import store from './helpers/config';

import env from './env';

const log = require('electron-log');
const makeDir = require('make-dir');
const got = require('got');
const AutoLaunch = require('auto-launch');
const osLocale = require('os-locale');
const ts = require('unix-timestamp');
const WorldState = require('warframe-worldstate-parser');
const unhandled = require('electron-unhandled');

unhandled();

require('electron-context-menu')();

const appAutoLauncher = new AutoLaunch({
	name: app.getName(),
	isHidden: true
});

let mainWindow;

if (env.name !== 'production') {
	const userDataPath = app.getPath('userData');
	app.setPath('userData', `${userDataPath} (${env.name})`);
}

makeDir.sync(app.getPath('userData'));
log.transports.file.file = app.getPath('userData') + '/log.log';
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'debug';
log.info('App starting...');

const setApplicationMenu = () => {
	const menus = [];
	menus.push(devMenuTemplate);
	Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

const updateLog = (msg, status) => {
	let d = new Date();
	const locale = osLocale.sync().replace('_', '-');
	d = d.toLocaleString(locale, {
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	});
	let logLine = `[${d}] `;
	logLine += msg;
	mainWindow.webContents.send('log-data', logLine, status);
};

let interval;
let slowInterval;

const shouldQuit = app.makeSingleInstance(() => {
	if (mainWindow) {
		if (!mainWindow.isVisible()) {
			mainWindow.show();
		}
		mainWindow.focus();
	}
});

if (shouldQuit) {
	app.quit();
}

app.on('ready', () => {
	mainWindow = createWindow('main', {
		width: 1000,
		height: 600,
		show: false,
		backgroundColor: '#1b1e23',
		maximizable: false,
		fullscreenable: false,
		resizable: false,
		webPreferences: {
			devtools: false
		}
	});

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, '/app.html'),
		protocol: 'file:',
		slashes: true
	}));

	if (env.name === 'development') {
		setApplicationMenu();
		mainWindow.openDevTools();
	} else {
		mainWindow.setMenu(null);
	}

	updateCheck();
	setInterval(() => {
		updateCheck();
	}, 86400000);

	const tray = new Tray(path.join(__dirname, '/icon.ico'));

	mainWindow.webContents.on('did-finish-load', async () => {
		updateLog(`Warframe Alerts v${app.getVersion()} Started`);
		mainWindow.webContents.send('filter-data', store.get('filters'));
		checkApi();
		setInterval(async () => {
			checkApi();
		}, 60000);
	});

	let autoStartEnabled;

	appAutoLauncher.isEnabled().then(isEnabled => {
		if (isEnabled) {
			autoStartEnabled = true;
		} else {
			autoStartEnabled = false;
		}

		const logUnmatched = store.get('app.logUnmatched', 'false');
		const contextMenu = Menu.buildFromTemplate([
			{
				label: `Warframe Alerts v${app.getVersion()}`,
				enabled: false
			},
			{
				label: 'Show', click() {
					mainWindow.show();
				}
			},
			{
				type: 'separator'
			},
			{
				label: 'Start with Windows', click() {
					if (autoStartEnabled === true) {
						appAutoLauncher.disable();
					} else {
						appAutoLauncher.enable();
					}
				},
				type: 'checkbox',
				checked: autoStartEnabled
			},
			{
				label: 'Log unmatched alerts', click() {
					store.set('app.logUnmatched', !logUnmatched);
				},
				type: 'checkbox',
				checked: logUnmatched
			},
			{
				type: 'separator'
			},
			{
				label: 'Quit', click() {
					app.isQuiting = true;
					app.quit();
					log.info('App quit');
				}
			}
		]);

		mainWindow.on('show', () => {
			tray.setHighlightMode('always');
		});

		tray.on('click', () => {
			contextMenu.items[1].checked = !contextMenu.items[1].checked;
		});
		tray.on('double-click', () => {
			mainWindow.show();
		});
		tray.setToolTip(app.getName());
		tray.setContextMenu(contextMenu);
		ipcMain.on('update-filter', async (event, arg) => {
			console.log(arg);
			console.log(`${arg.config}.${arg.item}`);
			store.set(`${arg.config}.${arg.item}`, arg.value);
			checkApi();
		});
	}).catch(err => {
		log.error(err);
	});
});

app.on('window-all-closed', () => {
	clearInterval(interval);
	clearInterval(slowInterval);
	app.quit();
});

function updateCheck() {
	const lastUpdateCheck = store.get('app.lastUpdateCheck');
	const nowTs = ts.now() * 1000;
	let diff;
	if (typeof lastUpdateCheck !== 'undefined') {
		diff = nowTs - lastUpdateCheck;
	}
	if (diff >= 86400000 || typeof lastUpdateCheck === 'undefined') {
		autoUpdater.checkForUpdatesAndNotify().then(() => {
			store.set('app.lastUpdateCheck', nowTs);
		}).catch(err => {
			console.log(err);
		});
	}
}

async function checkApi() {
	const response = await got('http://content.warframe.com/dynamic/worldState.php');
	const ws = new WorldState(response.body);
	await checkAlert(ws);
	await checkInvasion(ws);
}
export default updateLog;
