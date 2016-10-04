import Twit from 'twit';
import {intents, getIntent, handleIntent, randomItem} from './intents'
import Promise from 'bluebird';
import Slackbot from './slackbot'
import fs from 'fs';
const RAW_TWEETS = fs.readFileSync('./data/tweets.txt', {encoding:'utf8'});
const TWEET_INTERVAL = 10000;




export default class Twitterbot {

	constructor(creds) {
		this.sinceTweet = '';
		this.t = new Twit(creds);
		this.tweetQueue = [];
		this.mentionQueue = [];
		this.tweets = Slackbot.prepareTweets(RAW_TWEETS, 140);
		this.handledMentions = {};
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
			t.post('statuses/update', config, (err, data, response) => {
				if(err) {
					reject(err);
				} else {
					resolve(data);
				}
			})
		})

	}

	drainMentionQueue() {

	}

	drainQueue() {
		console.log('draining queue', this.tweetQueue);
		let tweet = this.tweet.bind(this);
		let tweetQueue = this.tweetQueue;
		let drainQueue = this.drainQueue.bind(this);
		if(tweetQueue.length < 1) {
			return setTimeout(drainQueue, TWEET_INTERVAL);
		}
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
		let text = message.text.replace(/^@[@\w]+\s/ig, '');
		let from = message.user.screen_name;
		let replyId = message.id_str;
		let reply = this.reply.bind(this);
		let tweets = this.tweets;
		let getTweet = function() {
			return randomItem(tweets);
		};
		getIntent(text).then((o) => {
			if(o.intent.intent !== 'None') {
				reply(replyId, from, handleIntent(text, o));
			} else if(o.entities.length > 0) {
				reply(replyId, from, randomItem([
					o.entities[0].entity + '?',
					`I've seriously never heard of ${o.entities[0].entity}`,
					`${o.entities[0].entity}? ${getTweet()}`,
					`${o.entities[0].entity} is a very important thing that I definitely know what it is. Should we get coffee now?`,
					`${o.entities[0].entity}! ${getTweet()}`
				]));
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