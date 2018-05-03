import {app} from 'electron';
import env from 'env';
import defaultConfig from '../config';

const Store = require('electron-store');

let store; // eslint-disable-line import/no-mutable-exports
if (env.name === 'production') {
	store = new Store({defaults: defaultConfig});
} else {
	store = new Store({defaults: defaultConfig, cwd: `${app.getPath('userData')} (${env.name})`});
}

export default store;
