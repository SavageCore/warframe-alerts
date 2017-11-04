// This helper remembers the size and position of your windows (and restores
// them in that place after app relaunch).
// Can be used for more than one window, just construct many
// instances of it and give each different name.

import defaultConfig from '../config';

const Store = require('electron-store');

const store = new Store({defaults: defaultConfig});

export default store;
