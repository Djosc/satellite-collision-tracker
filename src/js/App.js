import React, { useState, useEffect } from 'react';
import { CzmlDataSource, Viewer } from 'resium';

import { satellites } from '../data/czml';

function App() {
	// const [data, setData] = useState('');

	useEffect(() => {
		fetch('https://celestrak.com/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE')
			.then((response) => response.text())
			.then((data) => console.log(data));
	}, []);

	return (
		<Viewer full>
			<CzmlDataSource data={satellites} />
		</Viewer>
	);
}

export default App;
