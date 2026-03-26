import config from "./config.js";

/**
 * Authenticated HTTP client for the X API v2.
 * Uses the native fetch API (Node 18+).
 */
class XApiClient {
  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.headers = {
      Authorization: `Bearer ${config.bearerToken}`,
      "Content-Type": "application/json",
    };
  }

  async request(method, path, { body, params } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const options = {
      method,
      headers: this.headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`X API error ${response.status}: ${errorBody}`);
      error.status = response.status;
      error.body = errorBody;
      throw error;
    }

    return response.json();
  }

  async get(path, params) {
    return this.request("GET", path, { params });
  }

  async post(path, body) {
    return this.request("POST", path, { body });
  }

  /**
   * Open a streaming connection. Returns the raw Response object
   * so the caller can read from the body stream.
   */
  async stream(path, params) {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${config.bearerToken}` },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`X API stream error ${response.status}: ${errorBody}`);
      error.status = response.status;
      error.body = errorBody;
      throw error;
    }

    return response;
  }
}

export default new XApiClient();
