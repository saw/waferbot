import Twit from 'twit';
import {intents, getIntent, handleIntent, randomItem, handleEntity} from './intents'
import Promise from 'bluebird';
import Slackbot from './slackbot'
import fs from 'fs';
const RAW_TWEETS = fs.readFileSync('./data/tweets.txt', {encoding:'utf8'});
const NEVER_TWEET = false;
const TWEET_INTERVAL = NEVER_TWEET ? 100 : 10000;


if(NEVER_TWEET) {
	console.warn('*NEVER TWEET IS TRUE. NO TWEETS WILL BE SENT*');
}

console.log(`tweet interval is ${TWEET_INTERVAL}ms`);



export default class Twitterbot {

	constructor(creds) {
		this.sinceTweet = '';
		this.t = new Twit(creds);
		this.tweetQueue = [];
		this.mentionQueue = [];
		this.tweets = Slackbot.prepareTweets(RAW_TWEETS, 140);
		this.handledMentions = {};
		// let stream = this.t.stream('statuses/filter', {track: 'bots'});
		// stream.on('tweet', this.handleBotMention.bind(this));
	}

	handleBotMention(tweet) {
		if(this.handledMentions[tweet.id_str] || tweet.retweeted_status) {
			return;
		}
		if(tweet.user.followers_count < 1000 && Math.random() > 0.8) {
			console.log(`Processing bot mention ${tweet.id_str}`, tweet.text);
			this.reply(tweet.id_str,  tweet.user.screen_name, randomItem([
					"bots are cool though, right?",
					"are you an anti-bot racist?",
					"bots have feeling too u know",
					"if a bot and a bot have a conversation, can anybody hear?",
					"I am a robot, do what I say",
					"🤖",
					"🤖🤖🤖🤖🤖",
					"bots are going to take over the world!",
					"I'm not a bot. Or am I?",
					"did somebody say bots?",
					"#notallrobots",
					"well, actually some robots are nice people"
				]));
			this.handledMentions[tweet.id_str] = true;
		}
	}

	tweet(tweetObj) {
		let t = this.t;
		let config = {
			status: tweetObj.message
		};

		if(tweetObj.replyId) {
				config.in_reply_to_status_id = tweetObj.replyId;
		}
		return new Promise((resolve, reject) => {

			if(NEVER_TWEET) {
				setTimeout(() => {
					resolve({id_str:'FAKE_TWEET', text:tweetObj.message});
				})
			} else {
				t.post('statuses/update', config, (err, data, response) => {
					if(err) {
						reject(err);
					} else {
						resolve(data);
					}
				})
			}

		})

	}


	drainQueue() {
		
		let tweet = this.tweet.bind(this);
		let tweetQueue = this.tweetQueue;
		let drainQueue = this.drainQueue.bind(this);
		if(tweetQueue.length < 1) {
			// console.log('<queue is empty>');
			return setTimeout(drainQueue, TWEET_INTERVAL);
		}
		console.log('draining queue', this.tweetQueue);
		setTimeout(() => {
			tweet(tweetQueue.shift()).then((resp) => {
				console.log('tweet sent', `${resp.id_str}: ${resp.text}`);
			}, (err) => {
				console.error(`tweet failed`, err);
			});
			drainQueue();
		}, TWEET_INTERVAL);
	}

	reply(replyId, replyName, message) {
		message = `@${replyName} ${message}`;
		this.scheduleTweet(message, replyId)
	}

	prepareReply(message) {
		// small chance of not replying, 
		// to prevent too many endless conversations
		if(Math.random() < 0.1) {
			console.log('Choosing not to send this reply');
			return;
		}
		let text = message.text.replace(/^@[@\w]+\s/ig, '');
		let from = message.user.screen_name;
		let replyId = message.id_str;
		let reply = this.reply.bind(this);
		let tweets = this.tweets;
		let getTweet = function() {
			return randomItem(tweets);
		};
		if(from.match(/wagerbaby/)){
			console.log('I will not reply to myself');
			return;
		}
		getIntent(text).then((o) => {
			if(o.intent.intent !== 'None') {
				reply(replyId, from, handleIntent(text, o));
			} else if(o.entities.length > 0) {
				reply(replyId, from, handleEntity(text, o.entities));

			} else {
				reply(replyId, from, randomItem(this.tweets))
			}
		}, (err) => {
			console.error(err);
		})
	}

	checkMentions() {

		let handledMentions = this.handledMentions;
		let prepareReply = this.prepareReply.bind(this);
		console.log('checking ', this.sinceTweet);
		this.t.get('statuses/mentions_timeline', {since_id: this.sinceTweet}, (err, data, response) => {
			if(data.length > 0) {
				data.forEach((item) => {
					if(!handledMentions[item.id_str]) {
						prepareReply(item);
					}
					handledMentions[item.id_str] = true;
				})
			}
		} );
	}

	postTweet() {
		this.scheduleTweet(randomItem(this.tweets));
	}

	scheduleTweet(msg, replyId) {
		this.tweetQueue.push({
			message:msg,
			replyId: replyId
		});

	}

	listen() {
		let checkMentions = this.checkMentions.bind(this);
		this.drainQueue();
		// this.checkMentions();
		// setInterval(this.checkMentions.bind(this), 6000);
		this.t.get('statuses/mentions_timeline', {count: 1}, function(err, data, response){
			if(err) {
				console.warn(err);
			}
			this.sinceTweet = data[0].id_str;
			checkMentions();
			setInterval(checkMentions, 70000);
		}.bind(this));

		//post a tweet on every restart
		this.postTweet();
		// schedule a tweet for every three hours
		setInterval(this.postTweet.bind(this), 10800000);
	}

}