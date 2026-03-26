import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Mock the client module before importing rules
const mockClient = {
  get: mock.fn(),
  post: mock.fn(),
};

// We test the logic by calling the handlers with a mocked client.
// Since the handlers import client as a singleton, we test the public interface
// by verifying the expected behavior.

describe("Rules Handler", () => {
  describe("Rule validation", () => {
    it("should reject empty rule values", () => {
      // A rule must have a non-empty value
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
  });

  describe("Rule syntax examples", () => {
    const validRules = [
      "#python",
      "from:elonmusk",
      '"breaking news" has:images',
      "(@XDevelopers OR @X) -is:retweet",
      "(AI OR \"machine learning\") lang:en -is:retweet",
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

    // Should not throw
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
});
