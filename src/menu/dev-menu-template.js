import {app, BrowserWindow} from 'electron';
import {openProcessManager} from 'electron-process-manager';

const devMenuTemplate = {
	label: 'Development',
	submenu: [{
		label: 'Reload',
		accelerator: 'CmdOrCtrl+R',
		click: () => {
			BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
		}
	},
	{
		label: 'Toggle DevTools',
		accelerator: 'Alt+CmdOrCtrl+I',
		click: () => {
			BrowserWindow.getFocusedWindow().toggleDevTools();
		}
	},
	{
		label: 'Processes',
		accelerator: 'CmdOrCtrl+P',
		click: () => {
			openProcessManager();
		}
	},
	{
		label: 'Quit',
		accelerator: 'CmdOrCtrl+Q',
		click: () => {
			app.isQuiting = true;
			app.quit();
		}
	}]
};

export default devMenuTemplate;
