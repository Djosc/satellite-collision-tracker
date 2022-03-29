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
