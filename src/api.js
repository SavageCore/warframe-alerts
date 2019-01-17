import fs from 'fs';
import {app, Notification} from 'electron';
import store from './helpers/config';
import updateLog from './background';
import * as filters from './filters';

const WorldState = require('warframe-worldstate-parser');
const got = require('got');
const ts = require('unix-timestamp');
const log = require('electron-log');
const unhandled = require('electron-unhandled');

unhandled({
	logger: err => {
		log.error(err);
	},
	showDialog: true
});

function cleanupAlerts() {
	const seenAlerts = store.get('seenAlerts', {});
	for (const alert in seenAlerts) {
		if (Object.prototype.hasOwnProperty.call(seenAlerts, alert)) {
			if (ts.now() > ts.fromDate(seenAlerts[alert]) || isNaN(ts.fromDate(seenAlerts[alert]))) {
				delete seenAlerts[alert];
			}
		}
	}

	store.set('seenAlerts', seenAlerts);
}

function cleanupInvasions(ws) {
	const seenInvasions = store.get('seenInvasions', {});
	for (const invasion in seenInvasions) {
		if (Object.prototype.hasOwnProperty.call(seenInvasions, invasion)) {
			if (!hasValue(ws.invasions, 'id', invasion)) {
				delete seenInvasions[invasion];
				store.set('seenInvasions', seenInvasions);
			}
		}
	}
}

function matchesAlertFilter(alertObj) {
	const planets = store.get('filters.planets');
	const credits = store.get('filters.other.credits', 0);
	const items = store.get('filters.items');
	const endo = store.get('filters.other.endo', 0);
	const custom = store.get('filters.other.custom');
	const helmets = store.get('filters.other.helmets');
	const traces = store.get('filters.other.traces', 0);
	const kubrowEgg = store.get('filters.other.kubrowEgg');
	const weaponSkin = store.get('filters.other.weaponSkins');

	const expiryCheck = filters.expiry(alertObj.expiry);
	if (!expiryCheck) {
		return false;
	}

	const planetsCheck = filters.planets(planets, filters.planetFromNode(alertObj.node));
	const itemsCheck = filters.items(items, alertObj.itemString);
	const customItemsCheck = filters.customItems(custom, alertObj.itemString);
	const creditsCheck = filters.credits(credits, alertObj.credits);
	const endoCheck = filters.endo(endo, alertObj);
	const helmetsCheck = filters.helmets(helmets, alertObj);
	const tracesCheck = filters.traces(traces, alertObj);
	const kubrowCheck = filters.kubrow(kubrowEgg, alertObj.itemString);
	const weaponSkinCheck = filters.weaponSkins(weaponSkin, alertObj);
	const giftLotusCheck = filters.isGiftLotus(alertObj.description);

	if (planetsCheck && (creditsCheck || endoCheck || itemsCheck || customItemsCheck || helmetsCheck || tracesCheck || kubrowCheck || weaponSkinCheck || giftLotusCheck)) {
		return true;
	}

	return false;
}

async function matchesInvasionFilter(invasionObj) {
	const planets = store.get('filters.planets');
	const credits = store.get('filters.other.credits', 0);
	const items = store.get('filters.items');
	const custom = store.get('filters.other.custom');

	const completedCheck = invasionObj.completed;
	if (completedCheck === true) {
		return false;
	}

	const planetsCheck = filters.planets(planets, filters.planetFromNode(invasionObj.node));
	const attackingItemsCheck = filters.items(items, invasionObj.attacking.itemString);
	const defendingItemsCheck = filters.items(items, invasionObj.defending.itemString);
	const attackingCustomItemsCheck = filters.customItems(custom, invasionObj.attacking.itemString);
	const defendingCustomItemsCheck = filters.customItems(custom, invasionObj.defending.itemString);
	const attackingCreditsCheck = filters.credits(credits, invasionObj.attacking.credits);
	const defendingCreditsCheck = filters.credits(credits, invasionObj.defending.credits);

	if (planetsCheck && ((attackingCreditsCheck || defendingCreditsCheck) || (attackingCustomItemsCheck || defendingCustomItemsCheck) || (attackingItemsCheck || defendingItemsCheck))) {
		return true;
	}

	return false;
}

export const checkAlert = async ws => {
	ws.alerts.forEach(item => {
		let seenAlerts = store.get('seenAlerts', {});
		const alertObj = {
			node: item.mission.node,
			id: item.id,
			itemString: item.mission.reward.itemString,
			description: item.mission.description,
			credits: item.mission.reward.credits,
			thumbnail: item.mission.reward.thumbnail,
			rewardTypes: item.rewardTypes,
			expiry: item.expiry
		};
		const bodyStr = `${item.mission.node} - ${item.mission.type} - ${item.eta} - ${item.mission.reward.credits}cr`;
		let bodyStrText = bodyStr;
		let bodyStrHTML = bodyStr;
		if (item.mission.reward.itemString) {
			bodyStrText += ` - ${item.mission.reward.itemString}`;
			bodyStrHTML += ` - <a href="http://warframe.wikia.com/wiki/Special:Search?query=${encodeURIComponent(item.mission.reward.itemString.replace(/(\d+) /, ''))}" class="js-external-link" title="Open Warframe Wiki">${item.mission.reward.itemString}</a>`;
		}

		if (Notification.isSupported()) {
			if (!Object.prototype.hasOwnProperty.call(seenAlerts, item.id) && matchesAlertFilter(alertObj)) {
				if (alertObj.thumbnail) {
					const thumbPath = `${app.getPath('temp')}/${alertObj.itemString.replace(/(\d+) /, '').replace(/\s+/g, '_').toLowerCase()}.png`;
					if (fs.existsSync(thumbPath)) {
						postAlertNotification(item, bodyStrText, thumbPath);
					} else {
						const writeStream = got.stream(alertObj.thumbnail).pipe(fs.createWriteStream(thumbPath));
						writeStream.on('close', () => {
							postAlertNotification(item, bodyStrText, thumbPath);
						});
					}

					log.info(`Alert: ${bodyStrText}`);
					updateLog(`Alert: ${bodyStrHTML}`, 'success');
					seenAlerts = Object.assign(seenAlerts, seenAlerts[item.id] = item.expiry);
					store.set('seenAlerts', seenAlerts);
				} else {
					postAlertNotification(item, bodyStrText);
					log.info(`Alert: ${bodyStrText}`);
					updateLog(`Alert: ${bodyStrHTML}`, 'success');
					seenAlerts = Object.assign(seenAlerts, seenAlerts[item.id] = item.expiry);
					store.set('seenAlerts', seenAlerts);
				}
			} else if (store.get('app.logUnmatched', false) && !Object.prototype.hasOwnProperty.call(seenAlerts, item.id)) {
				log.info(`Unmatched alert: ${bodyStrText}`);
				updateLog(`Unmatched alert: ${bodyStrHTML}`, 'error');
				seenAlerts = Object.assign(seenAlerts, seenAlerts[item.id] = item.expiry);
				store.set('seenAlerts', seenAlerts);
			}
		}
	});
	cleanupAlerts();
};

export const checkInvasion = async () => {
	let seenInvasions = store.get('seenInvasions', {});

	got('http://content.warframe.com/dynamic/worldState.php')
		.then(response => {
			const ws = new WorldState(response.body);
			ws.invasions.forEach(async item => {
				const invasionObj = {
					node: item.node,
					desc: item.desc,
					attacking: {
						itemString: item.attackerReward.itemString,
						credits: item.attackerReward.credits,
						thumbnail: item.attackerReward.thumbnail,
						faction: item.attackingFaction
					},
					defending: {
						itemString: item.defenderReward.itemString,
						credits: item.defenderReward.credits,
						thumbnail: item.defenderReward.thumbnail,
						faction: item.defendingFaction
					},
					rewardTypes: item.rewardTypes,
					completion: item.completion,
					completed: item.completed
				};
				if (Notification.isSupported()) {
					const bodyStr = `${invasionObj.node} - ${invasionObj.attacking.faction}`;
					let bodyStrText = bodyStr;
					let bodyStrHTML = bodyStr;
					if (invasionObj.attacking.itemString) {
						bodyStrText += ` (${invasionObj.attacking.itemString})`;
						bodyStrHTML += ` (<a href="http://warframe.wikia.com/wiki/Special:Search?query=${encodeURIComponent(invasionObj.attacking.itemString.replace(/(\d+) /, ''))}" class="js-external-link" title="Open Warframe Wiki">${invasionObj.attacking.itemString}</a>)`;
					}

					bodyStrText += ` VS. ${invasionObj.defending.faction}`;
					bodyStrHTML += ` VS. ${invasionObj.defending.faction}`;
					if (invasionObj.defending.itemString) {
						bodyStrText += ` (${invasionObj.defending.itemString})`;
						bodyStrHTML += ` (<a href="http://warframe.wikia.com/wiki/Special:Search?query=${encodeURIComponent(invasionObj.defending.itemString.replace(/(\d+) /, ''))}" class="js-external-link" title="Open Warframe Wiki">${invasionObj.defending.itemString}</a>)`;
					}

					if (!Object.prototype.hasOwnProperty.call(seenInvasions, item.id) && await matchesInvasionFilter(invasionObj)) {
						postInvasionNotification(item, bodyStrText);
						log.info(`Invasion: ${bodyStrText}`);
						updateLog(`Invasion: ${bodyStrHTML}`, 'success');
						seenInvasions = Object.assign(seenInvasions, seenInvasions[item.id] = item.completed);
						store.set('seenInvasions', seenInvasions);
					} else if (store.get('app.logUnmatched', false) && !Object.prototype.hasOwnProperty.call(seenInvasions, item.id)) {
						log.info(`Unmatched invasion: ${bodyStrText}`);
						updateLog(`Unmatched invasion: ${bodyStrHTML}`, 'error');
						seenInvasions = Object.assign(seenInvasions, seenInvasions[item.id] = item.completed);
						store.set('seenInvasions', seenInvasions);
					}
				}
			});
			cleanupInvasions(ws);
		})
		.catch(error => {
			console.log(error);
		});
};

function postAlertNotification(item, body, icon) {
	const nowTs = ts.now() * 1000;
	const activationTs = ts.fromDate(item.activation) * 1000;
	let title = 'New Alert!';
	if (nowTs < activationTs) {
		title = 'New Upcoming Alert!';
	}

	const alertNotification = new Notification({
		title,
		body,
		icon
	});
	alertNotification.show();
}

function postInvasionNotification(item, body) {
	const alertNotification = new Notification({
		title: 'New Invasion!',
		body,
		icon: false
	});
	alertNotification.show();
}

function hasValue(obj, key, value) {
	for (const invasion in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, invasion)) {
			if (obj[invasion][key] === value) {
				return true;
			}
		}
	}

	return false;
}
