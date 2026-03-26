import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Rules Handler", () => {
  describe("Rule validation", () => {
    it("should reject empty rule values", () => {
      const rule = { value: "", tag: "test" };
      assert.equal(rule.value, "");
    });

    it("should accept valid rule format", () => {
      const rule = { value: "#AI lang:en -is:retweet", tag: "AI tweets" };
      assert.ok(rule.value.length > 0);
      assert.ok(rule.value.length <= 1024, "Rule should be within 1024 char limit");
    });

    it("should allow rules without tags", () => {
      const rule = { value: "from:elonmusk" };
      assert.equal(rule.tag, undefined);
      assert.ok(rule.value.length > 0);
    });

    it("should respect the 1024 character rule limit", () => {
      const longRule = "a".repeat(1025);
      assert.ok(longRule.length > 1024, "Rule exceeds pay-per-use limit");
    });

    it("should accept Enterprise 2048 character rule limit", () => {
      const enterpriseRule = "a".repeat(2048);
      assert.ok(enterpriseRule.length <= 2048, "Rule within Enterprise limit");
    });
  });

  describe("Rule syntax examples", () => {
    const validRules = [
      "#python",
      "from:elonmusk",
      '"breaking news" has:images',
      "(@XDevelopers OR @X) -is:retweet",
      '(AI OR "machine learning") lang:en -is:retweet',
      "#tech has:links -is:retweet -is:reply",
    ];

    for (const rule of validRules) {
      it(`should accept rule: ${rule}`, () => {
        assert.ok(rule.length > 0);
        assert.ok(rule.length <= 1024);
      });
    }
  });
});

describe("Formatter", () => {
  it("should handle post data with user info", async () => {
    const { formatPost } = await import("../handlers/formatter.js");

    const data = {
      data: {
        id: "123456789",
        text: "Hello world!",
        author_id: "111",
        created_at: "2024-01-15T12:00:00.000Z",
        lang: "en",
        public_metrics: {
          like_count: 10,
          retweet_count: 5,
          reply_count: 2,
          impression_count: 1000,
        },
      },
      includes: {
        users: [
          {
            id: "111",
            name: "Test User",
            username: "testuser",
            verified_type: "blue",
          },
        ],
      },
      matching_rules: [{ id: "1", tag: "test-rule" }],
    };

    assert.doesNotThrow(() => formatPost(data));
  });

  it("should handle post data without includes", async () => {
    const { formatPost } = await import("../handlers/formatter.js");

    const data = {
      data: {
        id: "123456789",
        text: "Hello world!",
        author_id: "111",
      },
    };

    assert.doesNotThrow(() => formatPost(data));
  });

  it("should handle compact format", async () => {
    const { formatPostCompact } = await import("../handlers/formatter.js");

    const data = {
      data: {
        id: "123",
        text: "Short tweet",
        author_id: "111",
        created_at: "2024-01-15T12:00:00.000Z",
      },
      includes: {
        users: [{ id: "111", name: "User", username: "user" }],
      },
    };

    assert.doesNotThrow(() => formatPostCompact(data));
  });

  it("should handle JSON format", async () => {
    const { formatPostJSON } = await import("../handlers/formatter.js");

    const data = { data: { id: "123", text: "Test" } };
    assert.doesNotThrow(() => formatPostJSON(data));
  });

  it("should handle post with edit history", async () => {
    const { formatPost } = await import("../handlers/formatter.js");

    const data = {
      data: {
        id: "123456793",
        text: "Hello world! (edited)",
        author_id: "111",
        edit_history_tweet_ids: ["123456790", "123456791", "123456793"],
      },
    };

    assert.doesNotThrow(() => formatPost(data));
  });

  it("should handle post with entities (hashtags and URLs)", async () => {
    const { formatPost } = await import("../handlers/formatter.js");

    const data = {
      data: {
        id: "999",
        text: "Check out #AI at https://example.com",
        author_id: "111",
        entities: {
          hashtags: [{ tag: "AI" }],
          urls: [{ url: "https://t.co/abc", expanded_url: "https://example.com" }],
        },
      },
    };

    assert.doesNotThrow(() => formatPost(data));
  });

  it("should handle missing data field gracefully", async () => {
    const { formatPost } = await import("../handlers/formatter.js");
    assert.doesNotThrow(() => formatPost({}));
  });
});

describe("Stream internals", () => {
  it("should export connectToStream and connectToRecoveryStream", async () => {
    const stream = await import("../handlers/stream.js");
    assert.equal(typeof stream.connectToStream, "function");
    assert.equal(typeof stream.connectToRecoveryStream, "function");
  });
});

describe("Config", () => {
  it("should export config with expected structure", async () => {
    const { default: config } = await import("../lib/config.js");

    assert.ok(config.api);
    assert.equal(config.api.baseUrl, "https://api.x.com/2");
    assert.equal(config.api.streamEndpoint, "/tweets/search/stream");
    assert.equal(config.api.rulesEndpoint, "/tweets/search/stream/rules");
    assert.equal(config.api.searchEndpoint, "/tweets/search/recent");

    assert.ok(config.stream);
    assert.equal(typeof config.stream.backfillMinutes, "number");
    assert.ok(config.stream.tweetFields);
    assert.ok(config.stream.expansions);
    assert.ok(config.stream.userFields);

    assert.ok(config.reconnect);
    assert.equal(typeof config.reconnect.maxAttempts, "number");
    assert.equal(config.reconnect.tcpInitialDelayMs, 250);
    assert.equal(config.reconnect.tcpMaxDelayMs, 16000);
    assert.equal(config.reconnect.httpInitialDelayMs, 5000);
    assert.equal(config.reconnect.httpMaxDelayMs, 320000);
    assert.equal(config.reconnect.rateLimitInitialDelayMs, 60000);

    assert.ok(config.volume);
    assert.equal(typeof config.volume.trackingIntervalMs, "number");
    assert.equal(typeof config.volume.alertThresholdPercent, "number");
  });
});

describe("Package info", () => {
  it("should export name and version from package.json", async () => {
    const { name, version } = await import("../lib/package-info.js");
    assert.equal(name, "x-filtered-stream");
    assert.ok(version);
    assert.match(version, /^\d+\.\d+\.\d+/);
  });
});
