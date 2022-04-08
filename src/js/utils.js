import {
	Cartesian3,
	Cartographic,
	SampledPositionProperty,
	JulianDate,
	ReferenceFrame,
	ExtrapolationType,
	LagrangePolynomialApproximation,
	Math,
} from 'cesium';
import * as satellite from 'satellite.js';

export const fetchTLE = async (id) => {
	let data = await fetch(
		`https://celestrak.com/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`
	)
		.then((response) => response.text())
		.then((data) => {
			return data;
		});
	return data;
};

export const getISSOrbit = async () => {
	const data = await fetchTLE(25544);

	let [tleLine0, tleLine1, tleLine2] = data.split('\n');
	tleLine0 = tleLine0.trim();

	const ISSOrbitData = computeOrbitInertial(tleLine1, tleLine2);

	return {
		orbit: ISSOrbitData[0],
		name: tleLine0,
		orbitalPeriod: ISSOrbitData[1],
		selected: false,
	};
};

export const computeOrbitInertial = (tleLine1, tleLine2) => {
	const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

	const orbitalPeriod = getOrbitalPeriod(satrec);

	const totalSeconds = 700000;
	const timeStepInSeconds = 50;
	const start = JulianDate.fromDate(new Date());

	const sampledPositionInertial = new SampledPositionProperty(ReferenceFrame.INERTIAL);
	sampledPositionInertial.backwardExtrapolationType = ExtrapolationType.HOLD;
	sampledPositionInertial.forwardExtrapolationType = ExtrapolationType.HOLD;
	sampledPositionInertial.setInterpolationOptions({
		interpolationDegree: 5,
		interpolationAlgorithm: LagrangePolynomialApproximation,
	});

	for (let i = 0; i < totalSeconds; i += timeStepInSeconds) {
		const time = JulianDate.addSeconds(start, i, new JulianDate());
		const jsDate = JulianDate.toDate(time);

		const eci = satellite.propagate(satrec, jsDate);
		const gmst = satellite.gstime(jsDate);
		const pos = new Cartesian3(
			eci.position.x * 1000,
			eci.position.y * 1000,
			eci.position.z * 1000
		);

		sampledPositionInertial.addSample(time, pos);
	}

	return [sampledPositionInertial, orbitalPeriod];
};

const getOrbitalPeriod = (satrec) => {
	const meanMotionRad = satrec.no;
	const period = (2 * Math.PI) / meanMotionRad;
	return period;
};

export const setOrbits = async (collisionObjects) => {
	let orbitsArr = [];
	let tleArr = [];

	let satIDs = collisionObjects.map((idx) => ({
		one: idx.NORAD_CAT_ID_1,
		two: idx.NORAD_CAT_ID_2,
	}));

	satIDs.forEach(async (id) => {
		let promise1 = fetchTLE(id.one);
		let promise2 = fetchTLE(id.two);
		tleArr.push(promise1);
		tleArr.push(promise2);
	});

	const orbits = await Promise.all(tleArr).then((results) => {
		results.forEach((tle) => {
			let [tleLine0, tleLine1, tleLine2] = tle.split('\n');
			tleLine0 = tleLine0.trim();

			let orbitData = computeOrbitInertial(tleLine1, tleLine2);

			orbitsArr.push({
				orbit: orbitData[0],
				name: tleLine0,
				orbitalPeriod: orbitData[1],
				selected: false,
			});
		});
		// console.log(orbitsArr);
		return orbitsArr;
	});

	return orbits;
};

/**
 * Uses the start time of a collision event, computes the cartographic position of the collision
 * and adds it as a property to the orbit data. This is so it can be displayed in the description
 * of a selected entity.
 */
export const setCartographic = (orbitData, collisionObjsArr) => {
	const collisions = [...collisionObjsArr];

	let targetTimes = [];

	collisions.forEach((idx) => {
		const start = new Date(idx.START_UTC);
		const isoDate = new Date(
			start.getTime() - start.getTimezoneOffset() * 60000
		).toISOString();

		const targetTime = JulianDate.fromIso8601(isoDate);

		targetTimes.push(targetTime);
	});

	for (let i = 0, j = 0; i < targetTimes.length; i++, j += 2) {
		const targetCart3Val1 = orbitData[j].orbit.getValue(targetTimes[i], new Cartesian3());

		const targetCart3Val2 = orbitData[j + 1].orbit.getValue(
			targetTimes[i],
			new Cartesian3()
		);

		let cartoVal1 = new Cartographic.fromCartesian(targetCart3Val1);
		let cartoVal2 = new Cartographic.fromCartesian(targetCart3Val2);

		cartoVal1.longitude = Math.toDegrees(cartoVal1.longitude);
		cartoVal1.latitude = Math.toDegrees(cartoVal1.latitude);
		cartoVal2.longitude = Math.toDegrees(cartoVal2.longitude);
		cartoVal2.latitude = Math.toDegrees(cartoVal2.latitude);

		orbitData[j].collisionCarto = cartoVal1;
		orbitData[j + 1].collisionCarto = cartoVal2;
	}

	const orbitsWithCarto = orbitData;
	return orbitsWithCarto;
};

export const mapCollisionDataToObjects = async (collisionData) => {
	let collisionsArr = [];

	for (let i = 0, j = 0; i < collisionData.length; i += 14, j++) {
		let newArr = collisionData.slice(i, i + 14);

		let probPercent = eNotationToPercent(newArr[4]);

		collisionsArr.push({
			COLLISION_RANKING: j,
			NORAD_CAT_ID_1: newArr[1],
			NAME_1: newArr[2],
			DAYS_SINCE_EPOCH_1: newArr[3],
			MAX_PROBABILITY: probPercent,
			DILUTION_THRESHOLD_KM: newArr[5],
			MIN_RANGE_KM: newArr[6],
			REL_VELOCITY_KM_SEC: newArr[7],
			NORAD_CAT_ID_2: newArr[8],
			NAME_2: newArr[9],
			DAYS_SINCE_EPOCH_2: newArr[10],
			START_UTC: newArr[11],
			CLOSEST_APPROACH_UTC: newArr[12],
			STOP_UTC: newArr[13],
		});
	}

	// console.log(collisionsArr);
	return collisionsArr;
};

const eNotationToPercent = (maxProbability) => {
	let num = Number(maxProbability);
	let string = (num * 100).toFixed(2).toString();
	return (string += '%');
};

export const renderDescription = (cartoData) => {
	const description = `
		<div class="description-container" style="text-align:center;">
		<h3 class="description-heading">Collision Location</h3>
		<table style="text-align:center; margin-left:auto; margin-right:auto;">
			<thead>
				<tr>
					<th style="padding:6px; border: 1px solid gray; font-size:14px">Latitude</th>
					<th style="padding:6px; border: 1px solid gray; font-size:14px">Longitude</th>
					<th style="padding:6px; border: 1px solid gray; font-size:14px">Altitude</th>
				</tr>
			</thead>
			<tbody>
				<tr >
					<td style="padding:6px; border: 1px solid gray">${cartoData.latitude.toFixed(2)}&deg</td>
					<td style="padding:6px; border: 1px solid gray">${cartoData.longitude.toFixed(2)}&deg</td>
					<td style="padding:6px; border: 1px solid gray">${(cartoData.height / 1000).toFixed(
						2
					)} km</td>
				</tr>
			</tbody>
		</table>
	</div>
		`;

	return description;
};
