import React, { useState, useEffect } from 'react';

import * as cesium from 'cesium';

import { CzmlDataSource, Entity, Viewer } from 'resium';

import { fetchTLE, computePosition, computeOrbit } from './utils';

import { satellites } from '../data/czml';

import satData from '../data/sats.json';

function App() {
	const [satPositionData, setSatPositionData] = useState(null);
	const [positionsOverTime, setPositionsOverTime] = useState(null);

	let isMounted = false;

	useEffect(async () => {
		isMounted = true;

		// var orbitsArr = [];
		// var promisesArr = [];
		// var satIDs = satData.map((idx) => idx.NORAD_CAT_ID);
		// console.log(satIDs);

		if (isMounted) {
			setOrbits();
			// console.log(orbits);
			// setPositionsOverTime(orbits);

			// setSatPositionData(cartesian3Data);
		}

		return () => {
			isMounted = false;
			// setSatData({});
		};
	}, []);

	const setOrbits = async () => {
		var orbitsArr = [];
		var tleArr = [];
		var satIDs = satData.map((idx) => idx.NORAD_CAT_ID);

		satIDs.forEach(async (id) => {
			let promise = fetchTLE(id);
			tleArr.push(promise);
			// console.log(tle);
		});

		Promise.all(tleArr)
			.then((results) => {
				results.forEach((tle) => {
					// var cartesian3Data = computePosition(tle);
					// console.log('satPosition ' + cartesian3Data);

					var orbit = computeOrbit(tle);

					orbitsArr.push(orbit);
				});
				return orbitsArr;
			})
			.then((orbits) => {
				setPositionsOverTime(orbits);
			});
	};

	return (
		<>
			{positionsOverTime !== null ? (
				<Viewer full>
					{positionsOverTime.map((orbit, idx) => (
						<Entity
							key={idx}
							position={orbit}
							point={{ pixelSize: 10, color: cesium.Color.RED }}
						/>
					))}
					{/* <CzmlDataSource data={satellites} /> */}
				</Viewer>
			) : (
				<></>
			)}
		</>
	);
}

export default App;
