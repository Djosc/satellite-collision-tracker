import React, { useState, useEffect, useRef } from 'react';
import CustomToolbar from './Components/CustomToolbar';

import * as cesium from 'cesium';

import { CzmlDataSource, Entity, Scene, Viewer } from 'resium';

import {
	fetchTLE,
	computePosition,
	computeOrbit,
	computeOrbitInertial,
	mapCollisionDataToObjects,
	setOrbits,
} from './utils';
import { scrapeCollisions } from './scrape';

import { satellites } from '../data/czml';

// import satData from '../data/sats.json';
import satData from '../data/collision.json';

function App() {
	// const [satPositionData, setSatPositionData] = useState(null);
	const [collisionObjectsArr, setCollisionObjectsArr] = useState(null);
	const [positionsOverTime, setPositionsOverTime] = useState(null);

	const viewerRef = useRef(null);
	const sceneRef = useRef(null);

	let isMounted = false;

	useEffect(() => {
		isMounted = true;

		if (isMounted) {
			scrapeCollisions()
				.then((collisionData) => {
					const collisionObjects = mapCollisionDataToObjects(collisionData);
					return collisionObjects;
				})
				.then((collisionObjects) => {
					setCollisionObjectsArr(collisionObjects);
				});
		}

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (collisionObjectsArr !== null) {
			setOrbits(collisionObjectsArr).then((orbitData) => {
				setPositionsOverTime(orbitData);
			});
		}

		return () => {};
	}, [collisionObjectsArr]);

	const goToCollisionTime = (collisionTime, satName1) => {
		let start = new Date(collisionTime);
		let isoDate = new Date(
			start.getTime() - start.getTimezoneOffset() * 60000
		).toISOString();

		let targetTime = cesium.JulianDate.fromIso8601(isoDate);
		let endTime = cesium.JulianDate.addDays(targetTime, 2, new cesium.JulianDate());
		let tenMinuteOffset = cesium.JulianDate.addSeconds(
			targetTime,
			-300,
			new cesium.JulianDate()
		);

		let clock = viewerRef.current.cesiumElement.clock;
		let camera = viewerRef.current.cesiumElement.camera;

		clock._currentTime = tenMinuteOffset;
		viewerRef.current.cesiumElement.timeline.zoomTo(tenMinuteOffset, endTime);
	};

	const toggleSelected = (idx) => {
		// this is an ugly way of doing it, but it toggles both orbits for
		// one collision event
		let orbits = [...positionsOverTime];
		let newOrbit = { ...orbits[idx] };
		let newOrbit2 = { ...orbits[idx + 1] };

		newOrbit.selected = !newOrbit.selected;
		newOrbit2.selected = !newOrbit2.selected;

		orbits[idx] = newOrbit;
		orbits[idx + 1] = newOrbit2;

		setPositionsOverTime(orbits);
	};

	const setICRF = () => {
		if (sceneRef.current && sceneRef.current.cesiumElement) {
			let sceneUpdate = sceneRef.current.cesiumElement.postUpdate;
			console.log(sceneRef);

			if (sceneUpdate._listeners[1] && sceneUpdate._listeners[1].name === 'icrf') {
				sceneUpdate.removeEventListener(icrf);
				console.log('if ', sceneUpdate._listeners);
			} else {
				sceneUpdate.addEventListener(icrf);
				console.log('else ', sceneUpdate._listeners);
			}
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
				<Viewer
					full
					ref={viewerRef}
					geocoder={false}
					navigationHelpButton={false}
					shouldAnimate={false}
				>
					<CustomToolbar
						setICRF={setICRF}
						collisionObjects={collisionObjectsArr}
						toggleSelected={toggleSelected}
						goToCollisionTime={goToCollisionTime}
					/>
					<Scene ref={sceneRef} />
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
							point={{ pixelSize: 7, color: cesium.Color.RED }}
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
