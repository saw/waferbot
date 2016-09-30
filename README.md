# A bot

A bot. Like waferbaby, but NOT waferbay.

Responses are NSFW and use colorful language.

Useage
------

You need to get an app on luis.ai. Train it with the following intents:
```
	'Yes or no' 
	'insult'
	'opinion'
	'command'
	'query'
	'introspection'
	'Greeting'
	'compliment'
```

Also be sure to train with the built-in "encylopedia" entities.

Once you have that ready get your *appid* and *subscription key* and add them to your environment as 
```APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
SUBSCRIPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx```

Then get an app token from your slack team and add *that* to your environment
`TOKEN=xoxb-blahblahblah`

```npm install
npm start```