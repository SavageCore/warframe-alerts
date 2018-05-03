const childProcess = require('child_process');
const electron = require('electron');
const webpack = require('webpack');
const mri = require('mri');
const config = require('./webpack.app.config');

const args = mri(process.argv.slice(2));
const env = args.env ? args.env : 'development';
const compiler = webpack(config(env));
let electronStarted = false;

const watching = compiler.watch({}, (err, stats) => {
	if (!err && !stats.hasErrors() && !electronStarted) {
		electronStarted = true;

childProcess
	.spawn(electron, ['.'], {stdio: 'inherit'})
	.on('close', () => {
watching.close();
	});
	}
});
