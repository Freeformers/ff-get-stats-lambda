const google = require('googleapis');
const promisify = require('promisify-node');
const moment = require('moment');
const numeral = require('numeral');
const fetch = require('node-fetch');

const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];

const jwtClient = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY,
  scopes,
  null
);

function getReports(reportRequests) {
  return new Promise(done => {
    jwtClient.authorize(() => {
      const analyticsReporting = google.analyticsreporting('v4');

      const batchGet = promisify(analyticsReporting.reports.batchGet);

      done(batchGet({
        auth: jwtClient,
        resource: {
          reportRequests: reportRequests,
        },
      }));
    });
  })
}

function sessionReport(viewId, periodLength, segmentId) {
  const yesterday = moment().subtract(1, 'day');

  const startPoint = yesterday.clone().subtract(periodLength - 1, 'days');

  const previousEnd = startPoint.clone().subtract(1, 'day');
  const previousStart = previousEnd.clone().subtract(periodLength - 1, 'days');

  return getReports([
    {
      viewId: viewId,
      dimensions: [{name: 'ga:segment'}],
      segments: [{segmentId: segmentId}],
      dateRanges: [
        {
          startDate: startPoint.format('YYYY-MM-DD'),
          endDate: yesterday.format('YYYY-MM-DD'),
        },
        {
          startDate: previousStart.format('YYYY-MM-DD'),
          endDate: previousEnd.format('YYYY-MM-DD'),
        }
      ],
    },
  ]).then(res => {
    const totals = res.reports[0].data.totals;


    const thisPeriod = Number(totals[0].values[0]);
    const previousPeriod = Number(totals[1].values[0]);

    const diffRatio = numeral(
      (thisPeriod - previousPeriod) / previousPeriod
    ).format('0.00%');

    return {
      thisPeriod: thisPeriod,
      previousPeriod: previousPeriod,
      diffRatio: diffRatio,
    };
  });
}


exports.handler = function (event, context, callback) {
  switch (event.fn) {
    case "sessions":
      const periodLength = event.opts.periodLength;
      const viewId = event.opts.viewId;
      const segmentId = event.opts.segmentId;

      const webhookUrl = event.opts.webhookUrl;

      sessionReport(viewId, periodLength, segmentId).then(r => {
        const res = Object.assign({
          context: event.opts.context,
          periodLength: periodLength,
        }, r);

        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(res)
          }).then(() => callback(null, res));
        } else {
          console.log('Skipping Webhook');
          callback(null, res);
        }

      });
      return;
    default:
      callback("No matching function found");
  }

};
