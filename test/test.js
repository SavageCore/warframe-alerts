import test from 'ava';
import {Application} from 'spectron';

const path = require('path');

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
