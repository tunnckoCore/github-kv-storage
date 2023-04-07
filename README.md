# github-storage

> StorageArea implementation for GitHub, using the REST v4 API. Because everything else sucks and I need a basic, centralized, and reliable database

Should work as "adapter" everwhere`@worker-tools/kv-storage` is used.

While work on the [`StorageArea` specification](https://wicg.github.io/kv-storage/) has stopped, KV Storage is still a good interface for asynchronous data access that feels native to JavaScript.

It create commits on every event - eg. when calling `set`, `delete`, `clear` and `remove`.
It **DOES NOT** do that for the other methods like `get`, `keys`, `values`.

## Install

```
yarn add github-kv-storage
```

Implements the following

```ts
export type AllowedKey = string | number | Date | BufferSource | AllowedKey[];
export type Key = string | number | Date | ArrayBuffer | Key[];

export type Options = Record<string, any>;

declare const StorageArea: {
  prototype: StorageArea;
  new (name: string, opts?: Options): StorageArea;
};

/**
 * Main differences to the working draft:
 * - Unknown backing store.
 * - Added unspecified options paramter to all methods.
 *   This way users can provide extra data to the underlying implementation without type casting.
 */
export interface StorageArea {
  set<T>(key: AllowedKey, value: T, opts?: Options): Promise<void>;
  get<T>(key: AllowedKey, opts?: Options): Promise<T | undefined>;
  delete(key: AllowedKey, opts?: Options): Promise<void>;
  clear(opts?: Options): Promise<void>;

  keys(opts?: Options): AsyncIterableIterator<Key>;
  values<T>(opts?: Options): AsyncIterableIterator<T>;
  entries<T>(opts?: Options): AsyncIterableIterator<[Key, T]>;

  backingStore(): unknown;
}
```

## Usage

The constructor accepts `(name, options)`

### name

The `name` is optional and can be replaced with `options`. We can get the name of the
database in few ways:

- the `name` param
- through `options.name`
- as last part of the url
- if not found anywhere, it defaults to `db` which means a file named `db.json` should exist
  in the repository, or call `await storage._create()` to initialize it.

For example, in the `github://tunnckoCore/foobar/mydb.js` the `mydb` is the name.

### options

- `token` **{string}** - the required Github Access token
- `url` **{string}** - url like `github://tunnckoCore/kv-github-storage/package.json`
- `repo` **{string}** - Github repository
- `owner` **{string}** - Github username; not needed `url` passed
- `pretty` **{boolean}** - disabled by default; the written to be indented with 2 spaces

### Example

```js
import GithubStorage from "kv-github-storage";

const store = new GithubStorage({
  token: "<your github access token>",
  url: "github://<username>/<repo>/<dbname>",
});

await store.set("foo", "bar");

// all places where `key` is accepted support dot notation
await store.set("bar.qux", { zazzy: 123, barry: 456 });

// setting value to `undefined`
// works like the `store.remove('bar.qux.barry')`
await store.set("bar.qux.barry", undefined);
```
