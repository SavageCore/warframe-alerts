import test from 'ava';
import {Application} from 'spectron';
import * as filters from '../src/filters';
import defaultConfig from '../src/config';

const path = require('path');
const ts = require('unix-timestamp');

const electron = path.resolve(__dirname, '../node_modules/electron/dist/electron.exe');

test('App loading', async t => {
	const app = new Application({
		path: electron,
		args: ['.', '--env=test'],
		startTimeout: 30000,
		waitTimeout: 30000
	});
	await app.start();
	await app.client.waitUntilWindowLoaded();
	t.is(await app.client.getWindowCount(), 1);
	t.regex(await app.client.getText('#log'), /Warframe Alerts v\d+.\d+.\d+ Started/);
	if (app && app.isRunning()) {
		await app.stop();
	}
});

test('Planets filter', t => {
	const alertObj = {
		node: 'Syrtis (Mars)'
	};

	t.true(filters.planets(defaultConfig.filters.planets, filters.planetFromNode(alertObj.node)));

	defaultConfig.filters.planets.Mars = false;
	t.false(filters.planets(defaultConfig.filters.planets, filters.planetFromNode(alertObj.node)));
	defaultConfig.filters.planets.Mars = true;
});

test('Aura filter', t => {
	const alertObj = {
		itemString: 'Energy Siphon'
	};

	t.false(filters.items(defaultConfig.filters.items, alertObj.itemString));

	defaultConfig.filters.items.auras['Energy Siphon'] = true;
	t.true(filters.items(defaultConfig.filters.items, alertObj.itemString));
	defaultConfig.filters.items.auras['Energy Siphon'] = false;
});

test('Blueprints filter', t => {
	const alertObj = {
		itemString: 'Orokin Catalyst'
	};

	t.false(filters.items(defaultConfig.filters.items, alertObj.itemString));

	defaultConfig.filters.items.blueprints['Orokin Catalyst'] = true;
	t.true(filters.items(defaultConfig.filters.items, alertObj.itemString));
	defaultConfig.filters.items.blueprints['Orokin Catalyst'] = false;
});

test('Mods filter', t => {
	const alertObj = {
		itemString: 'Animal Instinct'
	};
	t.false(filters.items(defaultConfig.filters.items, alertObj.itemString));

	defaultConfig.filters.items.mods['Animal Instinct'] = true;
	t.true(filters.items(defaultConfig.filters.items, alertObj.itemString));
	defaultConfig.filters.items.mods['Animal Instinct'] = false;
});

test('Resource filter w/o quantity', t => {
	const alertObj = {
		itemString: 'Nitain Extract'
	};

	t.false(filters.items(defaultConfig.filters.items, alertObj.itemString));

	defaultConfig.filters.items.resources['Nitain Extract'] = true;
	t.true(filters.items(defaultConfig.filters.items, alertObj.itemString));
	defaultConfig.filters.items.resources['Nitain Extract'] = false;
});

test('Resource filter with quantity', t => {
	const alertObj = {
		itemString: '300 Salvage'
	};

	t.false(filters.items(defaultConfig.filters.items, alertObj.itemString));

	defaultConfig.filters.items.resources.Salvage = true;
	t.true(filters.items(defaultConfig.filters.items, alertObj.itemString));
	defaultConfig.filters.items.resources.Salvage = false;
});

test('Custom filter', t => {
	const alertObj = {
		itemString: 'Nezha Circa Helmet Blueprint'
	};
	t.false(filters.customItems(defaultConfig.filters.other.custom, alertObj.itemString));
	t.false(filters.customItems('Pangolin Sword Blueprint, Excalibur Pendragon Helmet Blueprint', alertObj.itemString));

	t.true(filters.customItems('Pangolin Sword Blueprint, Excalibur Pendragon Helmet Blueprint, Nezha Circa Helmet Blueprint', alertObj.itemString));
});

test('Weapon part filter', t => {
	t.false(filters.items(defaultConfig.filters.items, 'Karak Wraith Stock'));

	defaultConfig.filters.items.weaponParts['Karak Wraith Stock'] = true;
	t.true(filters.items(defaultConfig.filters.items, 'Karak Wraith Stock'));
	defaultConfig.filters.items.weaponParts['Karak Wraith Stock'] = false;
});

test('Weapon skin filter', t => {
	const alertObj = {
		rewardTypes: ['skin']
	};

	t.false(filters.weaponSkins(defaultConfig.filters.other.weaponSkins, alertObj));
	t.true(filters.weaponSkins(true, alertObj));
});

test('Credits filter', t => {
	const alertObj = {
		credits: 14300
	};

	t.false(filters.credits(defaultConfig.filters.other.credits, alertObj.credits));
	t.false(filters.credits(14301, alertObj.credits));

	t.true(filters.credits(14300, alertObj.credits));
	t.true(filters.credits(14299, alertObj.credits));
});

test('Traces filter', t => {
	const alertObj = {
		itemString: '20 Void Traces',
		rewardTypes: ['traces']
	};

	t.false(filters.traces(defaultConfig.filters.other.traces, alertObj));
	t.false(filters.traces(21, alertObj));

	t.true(filters.traces(20, alertObj));
	t.true(filters.traces(19, alertObj));
});

test('Helmets filter', t => {
	const alertObj = {
		rewardTypes: ['helmet']
	};

	t.false(filters.helmets(defaultConfig.filters.other.helmets, alertObj));
	t.true(filters.helmets(true, alertObj));
});

test('Endo filter', t => {
	const alertObj = {
		itemString: '100 Endo',
		rewardTypes: ['endo']
	};

	t.false(filters.endo(defaultConfig.filters.other.endo, alertObj));
	t.false(filters.endo(101, alertObj));

	t.true(filters.endo(100, alertObj));
	t.true(filters.endo(99, alertObj));
});

test('Kubrow filter', t => {
	t.false(filters.kubrow(defaultConfig.filters.other.kubrowEgg, 'Kubrow Egg'));

	t.true(filters.kubrow(true, 'Kubrow Egg'));
});

test('Expiry filter', t => {
	const now = ts.now();
	const behind = ts.toDate(ts.add(now, '- 0y 0M 0w 0d 0h 1m 0s 0ms'));
	const ahead = ts.toDate(ts.add(now, '+ 0y 0M 0w 0d 0h 1m 0s 0ms'));
	t.false(filters.expiry());
	t.false(filters.expiry(behind));

	t.true(filters.expiry(ahead));
	t.true(filters.expiry(ts.toDate(ts.now())));
});

test('Gift from the Lotus filter', t => {
	const alertObj = {
		description: 'Gift From The Lotus'
	};
	t.true(filters.isGiftLotus(alertObj.description));
	t.false(filters.isGiftLotus('💀'));
});
