
import botkit from 'botkit';
import {intents, getIntent, handleIntent, randomItem, handleEntity} from './intents'
import Promise from 'bluebird';
import fs from 'fs';
const RAW_TWEETS = fs.readFileSync('./data/tweets.txt', {encoding:'utf8'});

export default class Slackbot {

	static prepareTweets(tweets, maxLength=60) {
		let list = tweets.split(/\n/);
		return list.filter((val) => {
			return val.length < maxLength;
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

	checkForJcohen(bot, message) {
		if(message.user == 'U04FR28C2') {
			bot.api.reactions.add({
				timestamp: message.ts,
				channel: message.channel,
				name: 'hi-matt',
			}, function(err, res) {
				if (err) {
					bot.botkit.log('Failed to add emoji reaction :(', err);
				} else {
					console.log('Party parrot added to message');
				}
			});
		}
		
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
			console.log('to handle', o.intent.intent);
			if(o.intent.intent !== 'None') {
				console.log('handling intent');
				reply(bot, message, handleIntent(message.text, o));
			} else if(o.entities.length > 0) {
				reply(bot, message, randomItem([handleEntity(message.text, o.entities), this.getTweet()]));
				// reply(bot, message, randomItem([
				// 	o.entities[0].entity + '?',
				// 	`I've seriously never heard of ${o.entities[0].entity}`,
				// 	`${o.entities[0].entity}? ${this.getTweet()}`,
				// 	`${o.entities[0].entity} is a very important thing that I definitely know what it is. Should we get coffee now?`,
				// 	`${o.entities[0].entity}! ${this.getTweet()}`
				// ]));
			} else {
				reply(bot, message, this.getTweet())
			}
		}, (err) => {
			console.error(err);
			reply(bot, message, '😐');
		})
	}

	handleKnife(bot, message) {
		this.reply(bot, message, "That's not a knife. This is a knife: :knife:");
	}

	listen() {
		console.log('listening');
		let handleMessage = this.handleMessage.bind(this);
		let handleKnife = this.handleKnife.bind(this);
		this.controller.hears(['fuck','jerk','ass','dumb','stupid','awful','shit','horrible','face','mum','suck'], 'ambient', this.checkForInsults);
		this.controller.hears([''], 'direct_message,direct_mention,mention', handleMessage);
		this.controller.hears([''], 'direct_message,direct_mention,mention', this.checkForInsults);
		this.controller.hears(['knife'], 'ambient', handleKnife);
		this.controller.hears([''], 'ambient', this.checkForJcohen);
		
	}

}