// The path to the CesiumJS source code
const cesiumSource = 'node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DotEnv = require('dotenv-webpack');

module.exports = {
	context: __dirname,
	entry: {
		app: './src/js/index.js',
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
		sourcePrefix: '',
	},
	amd: {
		// Enable webpack-friendly use of require in Cesium
		toUrlUndefined: true,
	},
	resolve: {
		alias: {
			cesium: path.resolve(__dirname, cesiumSource),
		},
		mainFiles: ['index', 'Cesium'],
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							[
								'@babel/preset-env',
								{
									targets: {
										esmodules: true,
									},
								},
							],
							'@babel/preset-react',
						],
					},
				},
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
				use: ['url-loader'],
			},
		],
	},
	plugins: [
		new DotEnv(),
		new HtmlWebpackPlugin({
			template: 'index.html',
		}),
		// Copy Cesium Assets, Widgets, and Workers to a static directory
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.join(cesiumSource, cesiumWorkers),
					to: 'Workers',
				},
				{
					from: path.join(cesiumSource, 'Assets'),
					to: 'Assets',
				},
				{
					from: path.join(cesiumSource, 'Widgets'),
					to: 'Widgets',
				},
				{
					from: path.join(cesiumSource, 'ThirdParty'),
					to: 'ThirdParty',
				},
			],
		}),
		new webpack.DefinePlugin({
			// Define relative base path in cesium for loading assets
			CESIUM_BASE_URL: JSON.stringify('./'),
		}),
	],
	mode: 'development',
	devtool: 'inline-source-map',
	target: 'electron-renderer',
};
