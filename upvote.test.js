import assert from "node:assert";
import { describe, it } from "node:test";

import suggestions from "./suggestions.json" assert { type: "json" };

describe("Upvote", () => {
  for (const suggestion of suggestions) {
    it(suggestion, async () => {
      const feedbackId = suggestion.match(/\/suggestions\/(\d+)\//)[1];

      const htmlResponse = await fetch(
        `https://feedback.gitkraken.com/suggestions/${encodeURIComponent(
          feedbackId
        )}`,
        {
          signal: AbortSignal.timeout(60_000),
        }
      );

      assert.strictEqual(htmlResponse.status, 200, "site must be available");

      const html = await htmlResponse.text();

      const csrfToken = html.match(
        /<input type="hidden" name="csrf_token" value="(.*)">/
      )[1];

      const formData = new FormData();

      formData.append("csrf_token", csrfToken);
      formData.append("ts", new Date().getTime());

      const toggleUpvoteResult = await fetch(
        `https://feedback.gitkraken.com/s/${encodeURIComponent(
          feedbackId
        )}/toggleupvote`,
        {
          method: "POST",
          body: formData,
          headers: {
            cookie: htmlResponse.headers.getSetCookie().join(";"),
          },
          signal: AbortSignal.timeout(60_000),
        }
      ).then((response) => response.text());

      assert.strictEqual(toggleUpvoteResult, "OK");
    });
  }
});
