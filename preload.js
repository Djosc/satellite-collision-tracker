const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
	scrapeCollisionData: (html) => {
		ipcRenderer.send('scrape-collisions', html);
	},
});
