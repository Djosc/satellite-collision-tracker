import React, { useState, useEffect } from 'react';

import * as cesium from 'cesium';

import { CzmlDataSource, Entity, Viewer } from 'resium';

import { fetchTLE, computePosition, computeOrbit } from './utils';

import { satellites } from '../data/czml';

function App() {
	const [satPositionData, setSatPositionData] = useState(null);
	const [positionsOverTime, setPositionsOverTime] = useState(null);

	let isMounted = false;

	useEffect(async () => {
		isMounted = true;

		if (isMounted) {
			var tle = await fetchTLE();
			// console.log(tle);

			var cartesian3Data = computePosition(tle);
			console.log('satPosition ' + cartesian3Data);

			var orbit = computeOrbit(tle);

			setSatPositionData(cartesian3Data);
			setPositionsOverTime(orbit);
		}

		return () => {
			isMounted = false;
			// setSatData({});
		};
	}, []);

	return (
		<>
			{positionsOverTime !== null ? (
				<Viewer full>
					<Entity
						position={positionsOverTime}
						point={{ pixelSize: 10, color: cesium.Color.RED }}
					/>
					{/* <CzmlDataSource data={satellites} /> */}
				</Viewer>
			) : (
				<></>
			)}
		</>
	);
}

export default App;
