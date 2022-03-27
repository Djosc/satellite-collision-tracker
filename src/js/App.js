import React, { useState, useEffect } from 'react';

import * as cesium from 'cesium';

import { CzmlDataSource, Entity, Viewer } from 'resium';

import { fetchTLE, computePosition, computeOrbit } from './utils';

import { satellites } from '../data/czml';

import satData from '../data/sats.json';
// import satData from '../data/collision.json';

function App() {
	const [satPositionData, setSatPositionData] = useState(null);
	const [positionsOverTime, setPositionsOverTime] = useState(null);

	let isMounted = false;

	useEffect(async () => {
		isMounted = true;

		if (isMounted) {
			setOrbits();
		}

		return () => {
			isMounted = false;
		};
	}, []);

	const setOrbits = async () => {
		var orbitsArr = [];
		var tleArr = [];
		var satIDs = satData.map((idx) => idx.NORAD_CAT_ID);

		satIDs.forEach(async (id) => {
			let promise = fetchTLE(id);
			tleArr.push(promise);
		});

		Promise.all(tleArr)
			.then((results) => {
				results.forEach((tle) => {
					var [tleLine0, tleLine1, tleLine2] = tle.split('\n');
					tleLine0 = tleLine0.trim();

					var orbit = computeOrbit(tleLine1, tleLine2);

					orbitsArr.push({
						orbit: orbit,
						name: tleLine0,
					});
				});
				console.log(orbitsArr);
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
							position={orbit.orbit}
							name={orbit.name}
							label={{
								text: orbit.name,
								scale: 0.5,
								pixelOffset: new cesium.Cartesian2(-25, 17),
							}}
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
