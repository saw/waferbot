var cfg = {
    consumer_key:         'qC1qFtAJB13DP3ToBLjBzY9bc'
  , consumer_secret:      '3OpFYEVNldMb6hS2soHPCvjNpaEivWdYRWz2A5mV0uUMfbeG6U'
  , access_token:         '782439520226582528-CAA6jWIetglAVSPl5OLGWs3rNHUBUMI'
  , access_token_secret:  'TkBcXLBiGr3MXgbb0PZybYGceC960tjfRLBTxdguzos3o'
};

var Twit = require('twit')

var T = new Twit(cfg);

T.post('statuses/update', { status: 'hello world!' }, function(err, data, response) {
  // console.log(data)
})

T.get('statuses/mentions_timeline', function(err, data, response) {
	console.log(data.length);
})