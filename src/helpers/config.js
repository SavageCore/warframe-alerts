// This helper remembers the size and position of your windows (and restores
// them in that place after app relaunch).
// Can be used for more than one window, just construct many
// instances of it and give each different name.

const Store = require('electron-store');

const store = new Store({
	defaults: {
		app: {
			trayWarning: false,
			logUnmatched: false
		},
		filters: {
			planets: {
				Mercury: true,
				Venus: true,
				Earth: true,
				Lua: true,
				Mars: true,
				Phobos: true,
				Ceres: true,
				Jupiter: true,
				Europa: true,
				Saturn: true,
				Uranus: true,
				Neptune: true,
				Pluto: true,
				Sedna: true,
				Eris: true,
				Void: true,
				'Kuva Fortress': true
			},
			items: {
				auras: {
					'Brief Respite': false,
					'Corrosive Projection': false,
					'Dead Eye': false,
					'Emp Aura': false,
					'Empowered Blades': false,
					'Enemy Radar': false,
					'Energy Siphon': false,
					'Growing Power': false,
					'Infested Impedance': false,
					'Loot Detector': false,
					Physique: false,
					'Pistol Amp': false,
					'Pisol Scavenger': false,
					Rejuvenation: false,
					'Rifle Amp': false,
					'Rifle Scavenger': false,
					'Shield Disruption': false,
					'Shotgun Amp': false,
					'Shotgun Scavenger': false,
					'Sniper Scavenger': false,
					'Speed Holster': false,
					'Sprint Boost': false,
					'Stand United': false,
					'Steel Charge': false,
					'Toxin Resistance': false
				},
				blueprints: {
					'Ceramic Dagger': false,
					'Dark Dagger': false,
					'Dark Sword': false,
					'Exilus Adapter': false,
					Forma: false,
					Glaive: false,
					'Heat Dagger': false,
					'Heat Sword': false,
					'Jaw Sword': false,
					'Orokin Catalyst': false,
					'Orokin Reactor': false,
					'Pangolin Sword': false,
					'Plasma Sword': false,
					'Vauban Chassis': false,
					'Vauban Neuroptics': false,
					'Vauban Systems': false
				},
				mods: {
					'Accelerated Blast': false,
					'Animal Instinct': false,
					'Armored Agility': false,
					Blaze: false,
					'Chilling Reload': false,
					Constitution: false,
					'Drifting Contact': false,
					'Focus Energy': false,
					Fortitude: false,
					'Hammer Shot': false,
					'Ice Storm': false,
					'Lethal Torrent': false,
					'Rending Strike': false,
					'Seeking Fury': false,
					Shred: false,
					'Streamlined Form': false,
					'Stunning Speed': false,
					Vigor: false,
					Wildfire: false
				},
				resources: {
					'Alloy Plate': false,
					'Argon Crystal': false,
					Circuits: false,
					'Control Module': false,
					'Detonite Injector': false,
					Ferrite: false,
					Fieldron: false,
					Gallium: false,
					'Kavat Genetic Code': false,
					Morphics: false,
					'Mutagen Mass': false,
					'Mutalist Alad V Nav Coordinate': false,
					'Neural Sensors': false,
					'Nano Spores': false,
					Neurodes: false,
					'Nitain Extract': false,
					'Orokin Cell': false,
					Oxium: false,
					'Polymer Bundle': false,
					Plastids: false,
					Rubedo: false,
					Salvage: false,
					Synthula: false,
					Tellurium: false
				},
				weaponParts: {
					'Dera Vandal Blueprint': false,
					'Dera Vandal Barrel': false,
					'Dera Vandal Receiver': false,
					'Dera Vandal Stock': false,
					'Karak Wraith Blueprint': false,
					'Karak Wraith Barrel': false,
					'Karak Wraith Receiver': false,
					'Karak Wraith Stock': false,
					'Latron Wraith Blueprint': false,
					'Latron Wraith Barrel': false,
					'Latron Wraith Receiver': false,
					'Latron Wraith Stock': false,
					'Sheev Blueprint': false,
					'Sheev Blade': false,
					'Sheev Heatsink': false,
					'Sheev Hilt': false,
					'Snipetron Vandal Blueprint': false,
					'Snipetron Vandal Barrel': false,
					'Snipetron Vandal Receiver': false,
					'Snipetron Vandal Stock': false,
					'Strun Wraith Blueprint': false,
					'Strun Wraith Barrel': false,
					'Strun Wraith Receiver': false,
					'Strun Wraith Stock': false,
					'Twin Vipers Wraith Blueprint': false,
					'Twin Vipers Wraith Barrels': false,
					'Twin Vipers Wraith Receivers': false,
					'Twin Vipers Wraith Link': false
				}
			},
			other: {
				helmets: false,
				weaponSkins: false,
				kubrowEgg: false,
				credits: 0,
				endo: 0,
				traces: 0,
				custom: ''
			}
		}
	}
});

export default store;
