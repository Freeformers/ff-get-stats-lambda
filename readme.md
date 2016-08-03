# Google Analytics stats over AWS Lambda

Provides an AWS Lambda function that can be used for pulling in stats from Google Analytics. We use it for getting 7-day session stats, comparing them to the previous 7 days.

If provided, the function will pass these stats on to a webhook of your choice. It works well with Zapier.

Use https://github.com/motdotla/node-lambda for controlling deployment

## Configuration

You need to have a `GOOGLE_CLIENT_EMAIL` and a `GOOGLE_PRIVATE_KEY` environment variable set. You can get these by setting up a service account and downloading the `.json` credentials.

For deployment there's a bunch of AWS stuff. It's a pretty bog-standard node-lambda project. Don't forget to put your `GOOGLE*` variables in a `deploy.env` file.

## Usage

As mentioned, it's normal node-lambda, so everything from their docs applies.

```
# Test locally
node-lambda run
 
# Deploy
node-lambda deploy --configFile deploy.json
```

## Sample `event.json`

```json
{
  "fn": "sessions",
  "opts": {
    "periodLength": 7,
    "viewId": "1234567",
    "segmentId": "gaid::-1",
    "context": "All my web sessions",
    "webhookUrl": "https://hooks.zapier.com/hooks/catch/1234567890/qwerty"
  }
}
```
