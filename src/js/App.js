import React, { useState, useEffect, useRef } from 'react';
import CustomToolbar from './Components/CustomToolbar';

import * as cesium from 'cesium';

import { Entity, Globe, ImageryLayer, Scene, Viewer } from 'resium';

import {
	getISSOrbit,
	mapCollisionDataToObjects,
	setOrbits,
	setCartographic,
	renderDescription,
} from './utils';
import { scrapeCollisions } from './scrape';

// Place these here so resium read-only props aren't changed
// (it causes the viewer to re-initialize)
const imageryProviderDay = new cesium.IonImageryProvider({ assetId: 3845 });
const imageryProviderNight = new cesium.IonImageryProvider({ assetId: 3812 });

function App() {
	const [collisionObjectsArr, setCollisionObjectsArr] = useState(null);
	const [positionsOverTime, setPositionsOverTime] = useState(null);
	const [ISSOrbit, setISSOrbit] = useState(null);

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

			getISSOrbit().then((data) => setISSOrbit(data));
		}

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (collisionObjectsArr !== null) {
			setOrbits(collisionObjectsArr).then((orbitData) => {
				const orbitDataWithCarto = setCartographic(orbitData, collisionObjectsArr);
				setPositionsOverTime(orbitDataWithCarto);
			});
		}

		return () => {};
	}, [collisionObjectsArr]);

	const goToCollisionTime = (collisionTime, satName1, satName2) => {
		const closestApproachTime = new Date(collisionTime);
		const isoDate = new Date(
			closestApproachTime.getTime() - closestApproachTime.getTimezoneOffset() * 60000
		).toISOString();

		const targetTime = cesium.JulianDate.fromIso8601(isoDate);
		const endTime = cesium.JulianDate.addDays(targetTime, 2, new cesium.JulianDate());
		const fiveMinuteOffset = cesium.JulianDate.addSeconds(
			targetTime,
			-300,
			new cesium.JulianDate()
		);

		const viewer = viewerRef.current.cesiumElement;
		const clock = viewerRef.current.cesiumElement.clock;

		clock._currentTime = fiveMinuteOffset;
		viewerRef.current.cesiumElement.timeline.zoomTo(fiveMinuteOffset, endTime);
		viewer.clockViewModel.shouldAnimate = false;

		const entities = viewerRef.current.cesiumElement.entities._entities._array;
		const matchedEntities = entities.filter(
			(idx) => satName1.includes(idx._name) || satName2.includes(idx._name)
		);

		const targetCart3Val = matchedEntities[0]._position.getValue(
			targetTime,
			new cesium.Cartesian3()
		);

		const cartoVal = new cesium.Cartographic.fromCartesian(targetCart3Val);

		viewer.camera.flyTo({
			destination: new cesium.Cartesian3.fromDegrees(
				cesium.Math.toDegrees(cartoVal.longitude),
				cesium.Math.toDegrees(cartoVal.latitude),
				cartoVal.height * 12
			),
		});

		viewer.selectedEntity = matchedEntities[0];
	};

	const toggleOrbitsOn = (satName1, satName2) => {
		// this is an ugly way of doing it, but it toggles both orbits for
		// one collision event
		let orbits = [...positionsOverTime];

		let newOrbitIDX = orbits.findIndex((idx) => satName1.includes(idx.name));
		let newOrbitIDX2 = orbits.findIndex((idx) => satName2.includes(idx.name));

		let newOrbit = { ...orbits[newOrbitIDX] };
		let newOrbit2 = { ...orbits[newOrbitIDX2] };

		newOrbit.selected = true;
		newOrbit2.selected = true;

		orbits[newOrbitIDX] = newOrbit;
		orbits[newOrbitIDX2] = newOrbit2;

		setPositionsOverTime(orbits);
	};

	const clearOrbits = () => {
		let orbits = [...positionsOverTime];

		let newOrbitArr = orbits.forEach((idx) => (idx.selected = false));

		setPositionsOverTime(newOrbitArr);
	};

	const setICRF = () => {
		if (sceneRef.current && sceneRef.current.cesiumElement) {
			let sceneUpdate = sceneRef.current.cesiumElement.postUpdate;
			console.log(sceneRef);

			if (sceneUpdate._listeners[1] && sceneUpdate._listeners[1].name === 'icrf') {
				sceneUpdate.removeEventListener(sceneUpdate._listeners[1]);
			} else {
				sceneUpdate.addEventListener(icrf);
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

	const logPosition = () => {
		console.log(viewerRef.current.cesiumElement.camera.position);
	};

	return (
		<>
			<Viewer
				full
				ref={viewerRef}
				geocoder={false}
				navigationHelpButton={false}
				shouldAnimate={false}
				baseLayerPicker={false}
				imageryProvider={false}
				onClick={() => logPosition()}
			>
				<CustomToolbar
					setICRF={setICRF}
					collisionObjects={collisionObjectsArr}
					toggleOrbitsOn={toggleOrbitsOn}
					clearOrbits={clearOrbits}
					goToCollisionTime={goToCollisionTime}
				/>
				<ImageryLayer imageryProvider={imageryProviderDay} show={true} />
				<ImageryLayer imageryProvider={imageryProviderNight} dayAlpha={0} />
				<Globe enableLighting={true} />
				<Scene ref={sceneRef} />
				{positionsOverTime !== null ? (
					<>
						{positionsOverTime.map((orbit, idx) => (
							<Entity
								key={idx}
								position={orbit.orbit}
								path={
									orbit.selected
										? {
												leadTime: orbit.orbitalPeriod * 60,
												trailTime: 0,
												material: cesium.Color.DARKCYAN,
												resolution: 600,
												width: 1,
										  }
										: {}
								}
								name={orbit.name}
								description={
									new cesium.CallbackProperty((time) => {
										const descr = renderDescription(time, orbit.orbit);
										return descr;
									}, false)
								}
								label={{
									text: orbit.name,
									scale: 0.5,
									pixelOffset: new cesium.Cartesian2(-25, 17),
								}}
								point={{ pixelSize: 9, color: cesium.Color.WHITE }}
							/>
						))}
						<Entity
							position={ISSOrbit.orbit}
							path={{
								leadTime: ISSOrbit.orbitalPeriod * 60,
								trailTime: 0,
								material: cesium.Color.WHITE,
								resolution: 600,
								width: 1,
							}}
							name={ISSOrbit.name}
							label={{
								text: ISSOrbit.name,
								scale: 0.5,
								pixelOffset: new cesium.Cartesian2(-25, 17),
							}}
							point={{ pixelSize: 11, color: cesium.Color.RED }}
						/>
					</>
				) : (
					<>
						<h1
							style={{
								position: 'absolute',
								left: '50%',
								top: '15px',
								color: '#fff',
								transform: 'translateX(-50%)',
							}}
						>
							Loading Satellites...
						</h1>
					</>
				)}
			</Viewer>
		</>
	);
}

export default App;
