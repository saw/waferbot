import { get } from 'https';
import Promise from 'bluebird';
import fs from 'fs';

const APP_ID = process.env.APP_ID;
const SUBSCRIPTION_KEY = process.env.SUBSCRIPTION_KEY;
const URL = `https://api.projectoxford.ai/luis/v1/application/preview?id=${APP_ID}&subscription-key=${SUBSCRIPTION_KEY}&timezoneOffset=10.0`;
const intents = ['insult', 'opinion', 'command', 'query', 'introspection', 'Yes or no', 'greeting'];
let likesData = fs.readFileSync(__dirname + '/../data/likes.txt', {encoding: 'utf8'});
let likes = likesData.split(/\n/);

function randomItem(items) {
	return items[Math.floor(Math.random()*items.length)];
}

const positiveOpinions = [
	'Yeah!',
	'❤️',
	'Woo!',
	'👍',
	'👌',
	'Yes',
	'😄',
	'👍👌👏',
	'I love it',
	'Good, innit?',
	'My favourite',
	'👍👍👍'
];

const greeting = [
	'hey',
	'Hey',
	'Hey!',
	'Hello',
	'Hello!',
	'why, hello!',
	"g'day"
];

const thankYou = [
	'thanks!',
	'😄',
	'❤️'
];

const positivePrefixes = [
	'❤️',
	'👍',
	'I love',
	'I like'
];

const negativeOpinions = [
	'It\'s shit',
	'fuck',
	'nope',
	'😭',
	'😞',
	'I *will* cut you.',
	'NOPE.',
	'😒🔫'

];

const negativePrefixes = [
	'Fuck',
	'I hate',
	'I don\'t really like',
	'😒'
];

const queryResponses = [
	'no idea',
	'no fucking idea',
	'no clue',
	'😕',
	'🤔'
];

const yesOrNo = [
	'no',
	'No,',
	'NO',
	'YES!',
	'NOPE',
	'fuck no',
	'uh huh',
	'yes',
	'sure?'
];

const intentHandlers = {

	'Yes or no' : function(text, intent) {
		return randomItem(yesOrNo);
	},


	'insult'	: function(text, intent) {
		return 'ur mum';
	},

	'opinion' 	: function(text, intent) {
		if(!intent.entities || intent.entities.length < 1) {
			return randomItem(negativeOpinions);
		} else if (likes.indexOf(intent.entities[0].entity) !== -1) {
			return randomItem(positiveOpinions);
		} else {
			return randomItem(negativePrefixes) + ' ' + intent.entities[0].entity;
		}
		
	},

	'command'	: function(text, intent) {
		return 'I will not'
	},

	'query'		: function(text, intent) {
		return 'no idea'

	},

	'introspection': function(text, intent) {
		return "I'm a robot."
	},

	'Greeting': function(text, intent) {
		return randomItem(greeting);
	},

	'compliment': function(text, intent) {
		return randomItem(thankYou);
	}

}



function handleIntent(text, intent) {
	if(intentHandlers[intent.intent.intent]) {
		return intentHandlers[intent.intent.intent](text, intent)
	} else {
		return 'no idea, sorry'
	}
}

function getIntent(text) {
	
	let data = '';
	text = encodeURIComponent(text);

	return new Promise((resolve, reject) => {
		get(`${URL}&q=${text}`, (res) => {
			let ret;
			res.on('data', (d) => {
				data += d;
			});

			res.on('end', () => {
				try {
					ret = JSON.parse(data);
				} catch (e) {
					console.error('Bad response', data);
					return reject(e);
				}
				console.log('\n\n\n/////////////////////////////////////\n');
				console.log('intent', JSON.stringify(ret, null, 2));
				return resolve({intent:ret.topScoringIntent, entities: ret.entities}	);
			});
		}).on('error', (e) => {
			reject(e);
		})
	})


}

export {intents, getIntent, handleIntent}