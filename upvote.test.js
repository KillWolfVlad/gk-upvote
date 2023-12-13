import assert from "node:assert";
import { describe, it } from "node:test";

import suggestionUrls from "./suggestionUrls.json" assert { type: "json" };

describe("Upvote", () => {
  for (const suggestionUrl of suggestionUrls) {
    it(suggestionUrl, async () => {
      const suggestionId = suggestionUrl.match(/\/suggestions\/(\d+)\//)[1];

      const getSuggestionHtmlResponse = await fetch(suggestionUrl, {
        signal: AbortSignal.timeout(60_000),
      });

      assert.strictEqual(
        getSuggestionHtmlResponse.status,
        200,
        `${suggestionUrl} must be available`
      );

      const suggestionHtml = await getSuggestionHtmlResponse.text();

      const csrfToken = suggestionHtml.match(
        /<input type="hidden" name="csrf_token" value="(.*)">/
      )[1];

      const voteFormData = new FormData();

      voteFormData.append("csrf_token", csrfToken);
      voteFormData.append("showVotingOptions", "true");

      const voteCookies = getSuggestionHtmlResponse.headers
        .getSetCookie()
        .map((setCookie) => {
          const [cookie] = setCookie
            .split(";")
            .map((x) => x.trim())
            .filter((x) => !!x);

          return cookie;
        })
        .join("; ");

      const voteHeaders = {
        cookie: voteCookies,
        "hx-request": "true",
        referer: suggestionUrl,
      };

      const voteResponse = await fetch(
        `https://feedback.gitkraken.com/s/${encodeURIComponent(
          suggestionId
        )}/vote`,
        {
          method: "POST",
          body: voteFormData,
          headers: voteHeaders,
          signal: AbortSignal.timeout(60_000),
        }
      );

      assert.strictEqual(
        voteResponse.status,
        200,
        `voting for ${suggestionUrl} must be successfully`
      );
    });
  }
});
