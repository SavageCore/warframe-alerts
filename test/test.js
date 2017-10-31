// Import electron from 'electron';
import test from 'ava';
import {Application} from 'spectron';
// Import {matchesFilter} from '../app/api';

const path = require('path');
// Const WorldState = require('warframe-worldstate-parser');

const electron = path.resolve(__dirname, '../node_modules/electron/dist/electron.exe');

test.beforeEach(async t => {
	t.context.app = new Application({
		path: electron,
		args: ['.'],
		startTimeout: 10000,
		waitTimeout: 10000
	});
	await t.context.app.start();
	const app = t.context.app;
	await app.client.waitUntilWindowLoaded();
});

test.afterEach.always(async t => {
	const app = t.context.app;
	if (app && app.isRunning()) {
		await t.context.app.stop();
	}
});

test('App loading', async t => {
	const app = t.context.app;
	t.is(await app.client.getWindowCount(), 1);
	t.regex(await app.client.getText('#log'), /Warframe Alerts v\d+.\d+.\d+ Started/);
});

// Test('Filters: Planets', t => {
// 	const forma = require('./forma.json');
// 	console.log(forma);
// 	const ws = new WorldState();
// 	ws.alerts.forEach(item => {
// 		const alertObj = {
// 			node: item.mission.node,
// 			itemString: item.mission.reward.itemString,
// 			credits: item.mission.reward.credits,
// 			rewardTypes: item.rewardTypes,
// 			expiry: item.expiry
// 		};
// 		console.log(alertObj);
// 		const app = t.context.app;
// 		console.log(app);
// 		matchesFilter({
// 			node: item.mission.node,
// 			itemString: item.mission.reward.itemString,
// 			credits: item.mission.reward.credits,
// 			rewardTypes: item.rewardTypes,
// 			expiry: item.expiry
// 		});
// 	});
// });

// Test('Closes to tray', async t => {
// 	const app = t.context.app;
// 	const win = app.browserWindow;
// 	win.close();
// 	t.true(await app.isRunning());
// });
