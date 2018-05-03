const path = require('path');
const nodeExternals = require('webpack-node-externals');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = env => {
	return {
		target: 'node',
		node: {
			__dirname: false,
			__filename: false
		},
		externals: [nodeExternals()],
		resolve: {
			alias: {
				env: path.resolve(__dirname, `../config/env_${env}.json`)
			}
		},
		devtool: 'source-map',
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: ['babel-loader']
				},
				{
					test: /\.less$/,
					use: [devMode ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
				}
			]
		},
		plugins: [
			new FriendlyErrorsWebpackPlugin({clearConsole: env === 'development'}),
			new MiniCssExtractPlugin({
				// Options similar to the same options in webpackOptions.output
				// both options are optional
				filename: devMode ? '[name].css' : '[name].[hash].css',
				chunkFilename: devMode ? '[id].css' : '[id].[hash].css'
			})
		],
		mode: devMode ? 'development' : 'production'
	};
};
