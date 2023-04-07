import GithubStorage from "./index.mjs";

const store = new GithubStorage({
  token: process.env.GITHUB_TOKEN ?? "<your github access token>",
  url: "github://tunnckoCore/github-kv-storage/demo-db.json",
  pretty: true,
  autoCreate: true,
});

// await store.delete("foo");
// await store.delete("bar");
await store.set("foo", "bar");

// all places where `key` is accepted support dot notation
await store.set("bar.qux", { zazzy: 123, barry: 456 });

// setting value to `undefined`
// works like the `store.remove('bar.qux.barry')`
await store.set("bar.qux.barry", undefined);

// no arguments, returns the whole store
await store.get();

// all methods support dot notation
await store.get("bar.qux");

await store.set("bar.zaz", 123);

// similar to set(key, undefined)
await store.delete("bar.zazzy");
