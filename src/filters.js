const ts = require('unix-timestamp');

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

export function planetFromNode(node) {
	return /\w+ \(([\w\s]+)\)/.exec(node)[1];
}

export function items(items, itemString) {
	let itemsCheck = false;
	for (const itemType in items) {
		if (Object.prototype.hasOwnProperty.call(items, itemType)) {
			if (itemType === 'blueprints') {
				itemString = itemString.replace(' Blueprint', '');
			}

			if (items[itemType][itemString] === true) {
				itemsCheck = true;
				return itemsCheck;
			}

			if (items[itemType][resourceFromString(itemString)] === true) {
				itemsCheck = true;
				return itemsCheck;
			}
		}
	}

	return itemsCheck;
}

export function customItems(items, itemString) {
	let itemsCheck = false;
	if (items) {
		const customItems = items.split(',');
		for (let i = 0; i < customItems.length; i++) {
			if (customItems[i].trim() === itemString && itemString !== '') {
				itemsCheck = true;
				if (i < customItems.length) {
					break;
				}
			}
		}

		return itemsCheck;
	}

	return itemsCheck;
}

export function planets(planets, planet) {
	if (Object.prototype.hasOwnProperty.call(planets, planet)) {
		if (planets[planet] === true) {
			return true;
		}
	}

	return false;
}

export function credits(configObj, credits) {
	if (configObj > 0) {
		if (credits >= configObj) {
			return true;
		}

		return false;
	}

	return false;
}

export function endo(endo, alertObj) {
	if (alertObj.rewardTypes.includes('endo') && endo > 0) {
		if (endoFromString(alertObj.itemString) >= endo) {
			return true;
		}

		return false;
	}

	return false;
}

export function helmets(helmets, alertObj) {
	if (alertObj.rewardTypes.includes('helmet')) {
		if (helmets) {
			return true;
		}

		return false;
	}
}

export function traces(traces, alertObj) {
	if (alertObj.rewardTypes.includes('traces')) {
		if (traces > 0 && tracesFromString(alertObj.itemString) >= traces) {
			return true;
		}

		return false;
	}
}

export function kubrow(kubrowEgg, itemString) {
	if (itemString === 'Kubrow Egg') {
		if (kubrowEgg) {
			return true;
		}

		return false;
	}
}

export function weaponSkins(weaponSkin, alertObj) {
	if (alertObj.rewardTypes.includes('skin')) {
		if (weaponSkin) {
			return true;
		}

		return false;
	}
}

// Returns false if expired
export function expiry(expiry) {
	if (!expiry) {
		return false;
	}

	const nowTs = ts.now() * 1000;
	const expiryTs = ts.fromDate(expiry) * 1000;
	if (nowTs <= expiryTs) {
		return true;
	}

	return false;
}

export function isGiftLotus(description) {
	if (description === 'Gift From The Lotus') {
		return true;
	}

	return false;
}
