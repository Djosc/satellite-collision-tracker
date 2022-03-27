import React, { useState, useEffect } from 'react';

import * as cesium from 'cesium';

import { CameraFlyHome, CzmlDataSource, Entity, Viewer } from 'resium';

import { fetchTLE, computePosition, computeOrbit, computeOrbitInertial } from './utils';

import { satellites } from '../data/czml';

import satData from '../data/sats.json';
// import satData from '../data/collision.json';

function App() {
	const [satPositionData, setSatPositionData] = useState(null);
	const [positionsOverTime, setPositionsOverTime] = useState(null);
	// const [selected, setSelected] = useState(false);

	let isMounted = false;

	useEffect(() => {
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

					// var orbitData = computeOrbit(tleLine1, tleLine2);
					var orbitData = computeOrbitInertial(tleLine1, tleLine2);

					orbitsArr.push({
						orbit: orbitData[0],
						name: tleLine0,
						orbitalPeriod: orbitData[1],
						selected: false,
					});
				});
				// console.log(orbitsArr);
				return orbitsArr;
			})
			.then((orbits) => {
				setPositionsOverTime(orbits);
			});
	};

	const toggleSelected = (idx) => {
		let orbits = [...positionsOverTime];
		let newOrbit = { ...orbits[idx] };

		newOrbit.selected = !newOrbit.selected;

		orbits[idx] = newOrbit;

		setPositionsOverTime(orbits);
	};

	return (
		<>
			{positionsOverTime !== null ? (
				<Viewer full>
					<CameraFlyHome once={false} />
					{positionsOverTime.map((orbit, idx) => (
						<Entity
							key={idx}
							position={orbit.orbit}
							path={
								orbit.selected
									? {
											leadTime: (orbit.orbitalPeriod * 65) / 2 + 5,
											trailTime: (orbit.orbitalPeriod * 65) / 2 + 5,
											material: cesium.Color.AQUA,
											resolution: 600,
											width: 1,
									  }
									: {}
							}
							name={orbit.name}
							label={{
								text: orbit.name,
								scale: 0.5,
								pixelOffset: new cesium.Cartesian2(-25, 17),
							}}
							point={{ pixelSize: 5, color: cesium.Color.RED }}
							onClick={() => toggleSelected(idx)}
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
