import setValue from "set-value";
import getValue from "get-value";

// function base64encode(val) {
//   return btoa(unescape(encodeURIComponent(val)));
// }

// function base64decode(val) {
//   return decodeURIComponent(escape(atob(val)));
// }

export default class GithubStorage {
  constructor(name, options) {
    if (name && typeof name !== "string") {
      options = name;
      name = options.name || options?.url.split("/").pop() || "db";
    }
    let { token, url, repo, owner, pretty, autoCreate } = options || {};

    if (!token) {
      throw new Error("Missing GitHub token");
    }

    if (url) {
      // github://tunnckoCore/0xneko-ordinals/deno.json
      const [protocol, pathname] = url.split("://");
      const rest = pathname.split("/");

      this.protocol = protocol;
      this.owner = rest[0];
      this.repo = rest[1];
    } else {
      this.owner = owner;
      this.repo = repo;
    }
    this.name = name || rest[2];
    this.name = this.name.replace(/\.json$/, "");
    this.key = `${this.name}.json`;

    this.autoCreate = autoCreate;
    this.pretty = pretty;
    this.token = token;

    this.url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.key}`;
  }

  async get(key) {
    if (!this.json) {
      console.log("the get() opened db cuz it wasn't opened");
      await this._open();
    }
    return key ? getValue(this.json, key) : this.json;
  }

  async set(key, value) {
    if (!this.json) {
      console.log("the set() opened db cuz it wasn't opened");
      await this._open();
    }

    const content = setValue(this.json, key, value);
    const contentString = this._jsonToString(content);

    const response = await fetch(this.url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        message: `chore: set value ${key} in ${this.key} db`,
        content: btoa(contentString),
        sha: await this._getContentSha(),
      }),
    });

    const data = await response.json();
    return { key, value, data, content };
  }

  async delete(key) {
    if (!this.json) {
      console.log("the delete() opened db cuz it wasn't opened");
      await this._open();
    }

    const content = setValue(this.json, key, undefined);
    const contentString = this._jsonToString(content);

    const response = await fetch(this.url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        message: `chore: delete ${key} key from ${this.key} db`,
        content: btoa(contentString),
        sha: await this._getContentSha(),
      }),
    });

    const data = await response.json();
    return { key, data, content };
  }

  async remove(...args) {
    return this.delete(...args);
  }

  async clear() {
    const response = await fetch(this.url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        message: `Delete the ${this.key} database`,
        sha: await this._getContentSha(),
      }),
    });

    return response.json();
  }

  async *keys() {
    if (!this.json) {
      console.log("the keys() opened db cuz it wasn't opened");
      await this._open();
    }

    for (const [key] of Object.keys(this.json)) {
      yield key;
    }
  }

  async *values() {
    if (!this.json) {
      console.log("the values() opened db cuz it wasn't opened");
      await this._open();
    }

    for (const [value] of Object.values(this.json)) {
      yield value;
    }
  }

  async *entries() {
    if (!this.json) {
      console.log("the entries() opened db cuz it wasn't opened");
      await this._open();
    }

    for (const [key, value] of Object.entries(this.json)) {
      yield [key, value];
    }
  }

  backingStore() {
    return this.store ?? this._create().store;
  }

  async _create() {
    const initialContent = btoa("{}");

    const resp = await fetch(this.url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        message: `chore: create ${this.key} database`,
        content: initialContent,
      }),
    });

    this.store = await resp.json();
    this.store.content = initialContent;
    this._updateStore(this.store);

    return { store: this.store, json: {} };
  }

  async _open() {
    let resp = null;

    try {
      resp = await fetch(this.url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
    } catch (err) {
      throw new Error(`Fail to open database "${this.key}"`);
    }

    if (resp.status === 404) {
      if (this.autoCreate) {
        await this._create();
        return { store: this.store, json: this.json };
      } else {
        throw new Error(`Cannot open database "${this.key}"`);
      }
    }

    this.store = await resp.json();
    this._updateStore(this.store);

    return { store: this.store, json: this.json };
  }

  _updateStore(store) {
    const _store = store || this.store;
    this.store.content = atob(_store.content);
    this.json = JSON.parse(_store.content);
  }

  _jsonToString(content) {
    return this.pretty
      ? JSON.stringify(content, null, 2)
      : JSON.stringify(content);
  }

  async _getContentSha() {
    const response = await fetch(this.url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    const data = await response.json();
    return data.sha;
  }

  /**
   * localStorage/sessionStorage-like methods
   */

  async getItem(key) {
    return this.get(key);
  }

  async setItem(key, value) {
    return this.set(key, value);
  }

  async removeItem(key) {
    return this.delete(key);
  }
  async deleteItem(key) {
    return this.delete(key);
  }
}

export { GithubStorage };
export const GitHubStorage = GithubStorage;
