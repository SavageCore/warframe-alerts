import fs from 'fs';
import {app, Notification} from 'electron';
import store from './helpers/config';
import updateLog from './background';

const WorldState = require('warframe-worldstate-parser');
const got = require('got');
const ts = require('unix-timestamp');
const log = require('electron-log');
const unhandled = require('electron-unhandled');

unhandled();

function planetFromNode(node) {
	return /\w+ \(([\w\s]+)\)/.exec(node)[1];
}

function endoFromString(itemString) {
	return /(\d+) Endo/.exec(itemString)[1];
}

function tracesFromString(itemString) {
	return /(\d+) Void Traces/.exec(itemString)[1];
}

function resourceFromString(itemString) {
	const m = /^\d+ ([\w\s]+)$/.exec(itemString);
	if (m) {
		return m[1];
	}
	return '';
}

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

	const expiryCheck = filterExpiry(alertObj.expiry);
	if (!expiryCheck) {
		return false;
	}
	const planetsCheck = filterPlanets(planets, planetFromNode(alertObj.node));
	const itemsCheck = filterItems(items, custom, alertObj.itemString);
	const creditsCheck = filterCredits(credits, alertObj.credits);
	const endoCheck = filterEndo(endo, alertObj);
	const helmetsCheck = filterHelmets(helmets, alertObj);
	const tracesCheck = filterTraces(traces, alertObj);
	const kubrowCheck = filterKubrow(kubrowEgg, alertObj.itemString);
	const weaponSkinCheck = filterWeaponSkin(weaponSkin, alertObj);

	if (planetsCheck && (creditsCheck || endoCheck || itemsCheck || helmetsCheck || tracesCheck || kubrowCheck || weaponSkinCheck)) {
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
	const planetsCheck = filterPlanets(planets, planetFromNode(invasionObj.node));
	const attackingItemsCheck = filterItems(items, custom, invasionObj.attacking.itemString);
	const defendingItemsCheck = filterItems(items, custom, invasionObj.defending.itemString);
	const attackingCreditsCheck = filterCredits(credits, invasionObj.attacking.credits);
	const defendingCreditsCheck = filterCredits(credits, invasionObj.defending.credits);

	if (planetsCheck && ((attackingCreditsCheck || defendingCreditsCheck) || (attackingItemsCheck || defendingItemsCheck))) {
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
			bodyStrHTML += ` - <a href="http://warframe.wikia.com/wiki/Special:Search?query=${encodeURIComponent(item.mission.reward.itemString.replace(/(\d+) /, ''))}" class="js-external-link">${item.mission.reward.itemString}</a>`;
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
					let bodyStr = `${invasionObj.node} - ${invasionObj.attacking.faction}`;
					if (invasionObj.attacking.itemString) {
						bodyStr += ` (${invasionObj.attacking.itemString})`;
					}
					bodyStr += ` VS. ${invasionObj.defending.faction}`;
					if (invasionObj.defending.itemString) {
						bodyStr += ` (${invasionObj.defending.itemString})`;
					}
					if (!Object.prototype.hasOwnProperty.call(seenInvasions, item.id) && await matchesInvasionFilter(invasionObj)) {
						postInvasionNotification(item, bodyStr);
						log.info(`Invasion: ${bodyStr}`);
						updateLog(`Invasion: ${bodyStr}`, 'success');
						seenInvasions = Object.assign(seenInvasions, seenInvasions[item.id] = item.completed);
						store.set('seenInvasions', seenInvasions);
					} else if (store.get('app.logUnmatched', false) && !Object.prototype.hasOwnProperty.call(seenInvasions, item.id)) {
						log.info(`Unmatched invasion: ${bodyStr}`);
						updateLog(`Unmatched invasion: ${bodyStr}`, 'error');
						seenInvasions = Object.assign(seenInvasions, seenInvasions[item.id] = item.completed);
						store.set('seenInvasions', seenInvasions);
					}
				}
			});
			cleanupInvasions(ws);
		})
		.catch(err => {
			console.log(err);
		});
};

function filterItems(items, custom, itemString) {
	let itemsCheck = false;
	for (const itemType in items) {
		if (Object.prototype.hasOwnProperty.call(items, itemType)) {
			if (itemType === 'blueprints') {
				itemString = itemString.replace(' Blueprint', '');
			}
			if (items[itemType][itemString] === true) {
				itemsCheck = true;
				return itemsCheck;
			} else if (items[itemType][resourceFromString(itemString)] === true) {
				itemsCheck = true;
				return itemsCheck;
			}
		}
	}
  // Custom item check
	if (custom) {
		const customItems = custom.split(',');
		for (let i = 0; i < customItems.length; i++) {
			if (customItems[i].trim() === itemString && itemString !== '') {
				itemsCheck = true;
				if (i >= customItems.length) {
					break;
				}
			}
		}
		return itemsCheck;
	}
	return itemsCheck;
}

function filterPlanets(planets, planet) {
	if (Object.prototype.hasOwnProperty.call(planets, planet)) {
		if (planets[planet] === true) {
			return true;
		}
	}
	return false;
}

function filterCredits(configObj, credits) {
	if (configObj > 0) {
		if (credits >= configObj) {
			return true;
		}
		return false;
	}
	return false;
}

function filterEndo(endo, alertObj) {
	if (alertObj.rewardTypes.includes('endo') && endo > 0) {
		if (endoFromString(alertObj.itemString) >= endo) {
			return true;
		}
		return false;
	}
	return false;
}

function filterHelmets(helmets, alertObj) {
	if (alertObj.rewardTypes.includes('helmet')) {
		if (helmets) {
			return true;
		}
		return false;
	}
	return false;
}

function filterTraces(traces, alertObj) {
	if (alertObj.rewardTypes.includes('traces')) {
		if (traces > 0 && traces >= tracesFromString(alertObj.itemString)) {
			return true;
		}
		return false;
	}
}

function filterKubrow(kubrowEgg, itemString) {
	if (itemString === 'Kubrow Egg') {
		if (kubrowEgg) {
			return true;
		}
		return false;
	}
	return false;
}

function filterWeaponSkin(weaponSkin, alertObj) {
	if (alertObj.rewardTypes.includes('skin')) {
		if (weaponSkin) {
			return true;
		}
		return false;
	}
	return false;
}

function filterExpiry(expiry) {
	const nowTs = ts.now() * 1000;
	const expiryTs = ts.fromDate(expiry) * 1000;
	if (nowTs <= expiryTs) {
		return true;
	}
	return false;
}

function postAlertNotification(item, body, icon) {
	const alertNotification = new Notification({
		title: 'New alert!',
		body,
		icon
	});
	alertNotification.show();
}

function postInvasionNotification(item, body) {
	const alertNotification = new Notification({
		title: 'New invasion!',
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
