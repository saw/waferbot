
import botkit from 'botkit';
import {intents, getIntent, handleIntent} from './intents'
import Promise from 'bluebird';
import fs from 'fs';
const RAW_TWEETS = fs.readFileSync('./data/tweets.txt', {encoding:'utf8'});

export default class Slackbot {

	static prepareTweets(tweets) {
		let list = tweets.split(/\n/);
		return list.filter((val) => {
			return val.length < 60;
		});
	}

	constructor(token) {
		
		this.tweets = Slackbot.prepareTweets(RAW_TWEETS);
		this.controller = botkit.slackbot({json_file_store: 'data.json'});
		this.bot = this.controller.spawn({
			token:token
		}).startRTM();

	}

	getTweet() {
		return this.tweets[Math.round(Math.random() * (this.tweets.length -1))];
	}

	reply(bot, message, text) {
		 bot.reply(message, `<@${message.user}> ${text}`);
		 // bot.reply(message, this.getTweet());
	}

	checkForInsults(bot, message) {
		getIntent(message.text).then((o) => {
			if(o.intent.intent === 'insult') {
				bot.api.reactions.add({
			        timestamp: message.ts,
			        channel: message.channel,
			        name: 'fire',
			    }, function(err, res) {
			        if (err) {
			            bot.botkit.log('Failed to add emoji reaction :(', err);
			        }
			    });
			}
		}, (err) => {
			console.error(err);
		});
	}

	handleMessage(bot, message) {
		let reply = this.reply.bind(this);
		getIntent(message.text).then((o) => {
			if(o.intent.intent !== 'None') {
				reply(bot, message, handleIntent(message.text, o));
			} else {
				reply(bot, message, this.getTweet())
			}
		}, (err) => {
			console.error(err);
			reply(bot, message, '😐');
		})
	}

	listen() {
		let handleMessage = this.handleMessage.bind(this);
		this.controller.hears([''], 'direct_message,direct_mention,mention', handleMessage);
		this.controller.hears(['you','their','them','they','he','she'], 'ambient', this.checkForInsults);
	}

}