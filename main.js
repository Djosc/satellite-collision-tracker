const { BrowserWindow, app } = require('electron');
const path = require('path');

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		backgroundColor: 'white',
		webPreferences: {
			nodeIntegrations: false,
			worldSafeExecuteJavaScript: true,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	win.loadFile('dist/index.html');
}

// require('electron-reload')(__dirname, {
// 	electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
// });

app.whenReady().then(createWindow);
