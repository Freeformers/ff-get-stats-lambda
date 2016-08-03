const sessionReport = require('./utils').sessionReport;

exports.handler = function (event, context, callback) {
  switch (event.fn) {
    case "sessions":
      const periodLength = event.opts.periodLength;
      const viewId = event.opts.viewId;
      const segmentId = event.opts.segmentId;

      const webhookUrl = event.opts.webhookUrl;

      // Optional
      const metrics = event.opts.metrics;
      const dimensions = event.opts.dimensions;

      sessionReport(viewId, periodLength, segmentId, metrics, dimensions).then(r => {
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
