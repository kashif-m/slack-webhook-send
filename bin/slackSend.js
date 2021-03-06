#!/usr/bin/env node

// USAGE
// $ slack-webhook-send < success | fail | skip > header < list of heading, value > --webhook <SLACK_WEBHOOK_URL>
// eg: $ slack-webhook-send success "Release Scope" beta Version 2.0rc1 --webhook https://hooks.slack.com...

(async () => {
  const lib = require("../lib/index.js");
  const { decideOperation, parseSlackReadArguments, parseSlackWriteArguments, log } = require("../lib/util.js");

  try {
    const args = process.argv.slice(2);
    const readOrWriteOperation = decideOperation(args);

    if (readOrWriteOperation == "read") {
      const payload = parseSlackReadArguments(args);
      const response = await lib.slackRead(payload, payload.readMethod);
      const util = require('util')
      console.log(util.inspect(response, {showHidden: false, depth: null}));

    } else {
      const {
        shortFields,
        longFields,
        buttons,
        reply,
        update,
        _delete,
      } = parseSlackWriteArguments(args);

      const payload = await lib.getPayload(
        shortFields ? shortFields : [],
        longFields ? longFields : [],
        buttons ? buttons : []
      );
      if (reply) payload.thread_ts = reply;
      if (update) payload.ts = update;
      if (_delete) payload.ts = _delete;

      const sendMethod = update ? "chatUpdate"
        : _delete ? "deleteMessage"
        : "postMessage";

      const response = await lib.slackSend(payload, sendMethod);
      log(`Timestamp: ${response.ts}`);
    }
    if (args.includes("--debug")) console.log(response);
  } catch (err) {
    log("Message not sent.\nResponse:");
    console.log(err);
  }
})();
