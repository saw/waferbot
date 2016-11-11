import { get } from 'https';
import Promise from 'bluebird';
import fs from 'fs';

const APP_ID = process.env.APP_ID;
const SUBSCRIPTION_KEY = process.env.SUBSCRIPTION_KEY;
const URL = `https://api.projectoxford.ai/luis/v2.0/apps/${APP_ID}?subscription-key=${SUBSCRIPTION_KEY}&timezoneOffset=10.0`;
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

const insultResponses = [
	'ur mum',
	'Your face is stupid.',
	'YOU ARE',
	'fuck off',
	'😠',
	'🖕',
	'😭'
];

const intentHandlers = {

	'Yes or no' : function(text, intent) {
		return randomItem(yesOrNo);
	},


	'insult'	: function(text, intent) {
		return randomItem(insultResponses);
	},

	'opinion' 	: function(text, intent) {
		if(!intent.entities || intent.entities.length < 1) {
			return randomItem(negativeOpinions);
		} else if (likes.indexOf(intent.entities[0].entity) !== -1) {
			return randomItem(positiveOpinions);
		} else {
			return randomItem([
				randomItem(negativePrefixes) + ' ' + intent.entities[0].entity,
				randomItem(yesOrNo),
				handleEntity(text, intent.entities)]);
		}
		
	},

	'command'	: function(text, intent) {
		return 'I will not'
	},

	'query'		: function(text, intent) {
		
		if(intent.entities.length > 0) {
			let entity = intent.entities[0].entity;
			let substr = entity;
			if(text.match(/U2DAPD9NZ/i || entity.type === 'waferbot')) {
				substr = 'me'
				return randomItem([
					`${substr}? hmmm`,
					`Why are you asking about me?`,
					`I am very awesome. Agreed.`,
					`It me`,
					]);
			}
			return randomItem([
				`${substr}? hmmm`,
				`Why are you asking me about ${substr}?`,
				`Oh..._${substr}_.`,
				`I could not be bothered to even think about ${substr}`,
				`Try this: http://www.google.com/search?q=${substr}`
			])
		} else if (text.match(/\<\@U2DAPD9NZ\>/)) {
			return randomItem([
					`Who, me?`,
					`Why are you asking about me?`,
					`I am very awesome. Agreed.`,
					`I could not be bothered to even think about...uh...myself`,
					]);
		}
		return randomItem(queryResponses);

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

function handleEntity(text, entities) {
	let substr = text.substring(entities[0].startIndex,entities[0].endIndex+1);
	let retMessage = randomItem([`lol ${substr}`, `nice`, `${substr}...oh`, '...', '😐', 'nope'])
	let spoon = false;
	let knife = false;
	
	entities.forEach((entity) => {
		if(entity.type === 'builtin.encyclopedia.people.person') {
			retMessage = randomItem([`Oh yeah, I've known ${entity.entity} for years. Total jerk.`, 'huh', randomItem(queryResponses)]);
		} 

		if(entity.type === 'waferbot') {
			retMessage = 'It me!';
		}

		if(entity.type.match(/builtin\.geography/)) {
			if(entity.entity.match(/australia/i)) {
				retMessage = 'I live in Australia!';
			}else if(entity.entity.match(/san\sfrancisco/i)) {
				retMessage = "So glad I don't live there anymore";
			}else if(entity.entity.match(/zealand/)) {
				retMessage = "I'd rather die in a fire than live in NZ";
			} else {
				retMessage = `I've never been to ${substr}`;
			}
		}

		if(text.match(/knife/)) {
			knife = true;
		}

		if(text.match(/spoon/)) {
			spoon = true;
		}


	});

	if (knife && !spoon) {
		retMessage = "That's not a knife. THIS is a knife!";
	} else if (knife && spoon) {
		retMessage = "Ah, I see you've played Knifey-Spoony before!";
	}
	return retMessage;
}

function handleIntent(text, intent) {
	console.log(intent.intent.intent);
	if(intentHandlers[intent.intent.intent]) {
		return intentHandlers[intent.intent.intent](text, intent)
	} else {
		return 'no idea, sorry'
	}
}

function getIntent(text) {
	
	let data = '';
	text = encodeURIComponent(text.replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"'));

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

export {intents, getIntent, handleIntent, randomItem, handleEntity }

