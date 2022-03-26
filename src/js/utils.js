import { Cartesian3, SampledPositionProperty, JulianDate } from 'cesium';
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

export const computeOrbit = (tleData) => {
	const [tleLine0, tleLine1, tleLine2] = tleData.split('\n');
	const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

	const totalSeconds = 100000;
	const timeStepInSeconds = 10;
	const start = JulianDate.fromDate(new Date());

	const positionsOverTime = new SampledPositionProperty();

	for (let i = 0; i < totalSeconds; i += timeStepInSeconds) {
		const time = JulianDate.addSeconds(start, i, new JulianDate());
		const jsDate = JulianDate.toDate(time);

		const positionAndVelocity = satellite.propagate(satrec, jsDate);
		const gmst = satellite.gstime(jsDate);
		const pos = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

		const position = Cartesian3.fromRadians(
			pos.longitude,
			pos.latitude,
			pos.height * 1000
		);

		positionsOverTime.addSample(time, position);
	}

	return positionsOverTime;
};
