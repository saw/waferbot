import Slackbot from './lib/slackbot';
let token = process.env.TOKEN;

function start() {
	console.log('Starting slackbot.');
	var bot = new Slackbot(token);
	bot.listen();
}

export { start }