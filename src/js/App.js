import React from 'react';
import { CzmlDataSource, Viewer } from 'resium';

import { iss } from '../data/czml';

function App() {
	return (
		<Viewer full>
			<CzmlDataSource data={iss} />
		</Viewer>
	);
}

export default App;
