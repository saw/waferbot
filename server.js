import Slackbot from './lib/slackbot';
import Twitterbot from './lib/twitterbot';
let token = process.env.TOKEN;
let credVar = process.env.TWITTER_CREDS;
var creds;
try {
	creds = JSON.parse(credVar);
} catch(e) {

}


function start() {
	
	if(token) {
		console.log('Starting slackbot.');
		new Slackbot(token).listen();
	}
	// if(creds) {
	// 	console.log('Starting twitterbot');
	// 	new Twitterbot(creds).listen();
	// }
	
}

export { start }