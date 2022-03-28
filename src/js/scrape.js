import cheerio from 'cheerio';
import axios from 'axios';

export const scrapeCollisions = async () => {
	const url =
		'https://celestrak.com/SOCRATES/search-results.php?IDENT=NAME&NAME_TEXT1=&NAME_TEXT2=&ORDER=MAXPROB&MAX=10';

	const data = await axios({ method: 'get', url: url });

	const $ = cheerio.load(data.data);

	var testArr = [];

	$('.outline > tbody > tr > td').each((idx, el) => {
		const test = $(el).text();

		testArr.push(test);
	});

	return testArr;
};

export const mapCollisionDataToObjects = (collisionData) => {
	var collisionsArr = [];

	for (let i = 0; i < collisionData.length; i += 14) {
		let newArr = collisionData.slice(i, i + 14);

		collisionsArr.push({
			NORAD_CAT_ID_1: newArr[1],
			NAME_1: newArr[2],
			DAYS_SINCE_EPOCH_1: newArr[3],
			MAX_PROBABILITY: newArr[4],
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
