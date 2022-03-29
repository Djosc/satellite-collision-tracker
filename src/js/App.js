import React, { useState, useEffect, useRef } from 'react';

import * as cesium from 'cesium';

import { CzmlDataSource, Entity, Scene, Viewer } from 'resium';

import { fetchTLE, computePosition, computeOrbit, computeOrbitInertial } from './utils';
import { scrapeCollisions, mapCollisionDataToObjects } from './scrape';

import { satellites } from '../data/czml';

// import satData from '../data/sats.json';
import satData from '../data/collision.json';

function App() {
	// const [satPositionData, setSatPositionData] = useState(null);
	const [collisionData, setCollisionData] = useState(null);
	const [positionsOverTime, setPositionsOverTime] = useState(null);

	const evt = new cesium.Event();

	const viewerRef = useRef(null);
	const sceneRef = useRef(null);
	const cameraRef = useRef(null);

	let isMounted = false;

	useEffect(() => {
		isMounted = true;

		if (isMounted) {
			scrapeCollisions()
				.then((collisionData) => {
					var collisionObjects = mapCollisionDataToObjects(collisionData);
					return collisionObjects;
				})
				.then((collisionObjects) => {
					setCollisionData(collisionObjects);
					// setOrbits();
				});
		}

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		// testMap();
		setOrbits();
	}, [collisionData]);

	const testMap = () => {
		// var satIDs = collisionData.map((idx) => idx.NORAD_CAT_ID_1);
		var satIDs = collisionData.map((idx) => ({
			one: idx.NORAD_CAT_ID_1,
			two: idx.NORAD_CAT_ID_2,
		}));
		console.log(satIDs);
	};

	const setOrbits = async () => {
		var orbitsArr = [];
		var tleArr = [];
		// var satIDs = satData.map((idx) => idx.NORAD_CAT_ID);
		var satIDs = collisionData.map((idx) => ({
			one: idx.NORAD_CAT_ID_1,
			two: idx.NORAD_CAT_ID_2,
		}));

		satIDs.forEach(async (id) => {
			let promise1 = fetchTLE(id.one);
			let promise2 = fetchTLE(id.two);
			tleArr.push(promise1);
			tleArr.push(promise2);
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

	const setICRF = () => {
		if (sceneRef.current && sceneRef.current.cesiumElement) {
			// viewerRef.current.cesiumElement.camera.flyHome(0);
			// sceneRef.current.cesiumElement.postUpdate.addEventListener(icrf);
		}
	};

	const icrf = (scene, time) => {
		if (scene.mode !== cesium.SceneMode.SCENE3D) {
			return;
		}

		const icrfToFixed = cesium.Transforms.computeIcrfToFixedMatrix(time);

		if (cesium.defined(icrfToFixed)) {
			var offset = cesium.Cartesian3.clone(
				sceneRef.current.cesiumElement.camera.position
			);
			var transform = cesium.Matrix4.fromRotationTranslation(icrfToFixed);

			sceneRef.current.cesiumElement.camera.lookAtTransform(transform, offset);
		}
	};

	return (
		<>
			{positionsOverTime !== null ? (
				<Viewer full ref={viewerRef}>
					<Scene onPostRender={() => setICRF()} ref={sceneRef} />
					{positionsOverTime.map((orbit, idx) => (
						<Entity
							key={idx}
							position={orbit.orbit}
							path={
								orbit.selected
									? {
											leadTime: orbit.orbitalPeriod * 60,
											trailTime: 0,
											// trailTime: (orbit.orbitalPeriod * 65) / 2 + 5,
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
				</Viewer>
			) : (
				<>
					<h1
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						Loading Satellites...
					</h1>
				</>
			)}
		</>
	);
}

export default App;
