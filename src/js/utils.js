import {
	Cartesian3,
	SampledPositionProperty,
	JulianDate,
	ReferenceFrame,
	ExtrapolationType,
	LagrangePolynomialApproximation,
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

export const computePosition = (tleData) => {
	var [tleLine0, tleLine1, tleLine2] = tleData.split('\n');

	var satrec = satellite.twoline2satrec(tleLine1, tleLine2);

	var date = new Date();

	var positionAndVelocity = satellite.propagate(satrec, date);

	var gmst = satellite.gstime(date);

	var position = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

	// console.log('tleLine1 ' + tleLine1);
	// console.log('tleLine2 ' + tleLine2);
	console.log(position);

	var cartesian3Data = Cartesian3.fromRadians(
		position.longitude,
		position.latitude,
		position.height * 1000
	);

	return cartesian3Data;
};

// export const computeOrbit = (tleLine1, tleLine2) => {
// 	const cart3Arr = [];

// 	const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

// 	const orbitalPeriod = getOrbitalPeriod(satrec);

// 	const totalSeconds = 700000;
// 	const timeStepInSeconds = 20;
// 	const start = JulianDate.fromDate(new Date());

// 	const positionsOverTime = new SampledPositionProperty();

// 	for (let i = 0; i < totalSeconds; i += timeStepInSeconds) {
// 		const time = JulianDate.addSeconds(start, i, new JulianDate());
// 		const jsDate = JulianDate.toDate(time);

// 		const positionAndVelocity = satellite.propagate(satrec, jsDate);
// 		const gmst = satellite.gstime(jsDate);
// 		const pos = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

// 		const position = Cartesian3.fromRadians(
// 			pos.longitude,
// 			pos.latitude,
// 			pos.height * 1000
// 		);

// 		positionsOverTime.addSample(time, position);
// 	}

// 	return [positionsOverTime, orbitalPeriod];
// };

export const computeOrbitInertial = (tleLine1, tleLine2) => {
	const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

	const orbitalPeriod = getOrbitalPeriod(satrec);

	const totalSeconds = 700000;
	const timeStepInSeconds = 100;
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
	var orbitsArr = [];
	var tleArr = [];
	// var satIDs = satData.map((idx) => idx.NORAD_CAT_ID);
	var satIDs = collisionObjects.map((idx) => ({
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
	});

	return orbits;
};

export const mapCollisionDataToObjects = async (collisionData) => {
	var collisionsArr = [];

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
