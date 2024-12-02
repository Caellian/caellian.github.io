import { urlAppend } from "./path.js";

test("urlAppend - can append simple path to url", () => {
  let base = new URL("https://example.com/a/b");
  let path = "./c/d";
  let result = urlAppend(base, path);
  expect(result.toString()).toEqual("https://example.com/a/b/c/d");
});

test("urlAppend - can rebase simple path", () => {
  let base = new URL("https://example.com/a/b");
  let path = "/c/d";
  let result = urlAppend(base, path);
  expect(result.toString()).toEqual("https://example.com/c/d");
});

test("urlAppend - can resolve escaping path", () => {
  let base = new URL("https://example.com/a/b");
  let path = "../c/d";
  let result = urlAppend(base, path);
  expect(result.toString()).toEqual("https://example.com/a/c/d");
});

test("urlAppend - works when base has a port", () => {
  let base = new URL("https://localhost:1234/a/b");
  let path = "./c/d";
  let result = urlAppend(base, path);
  expect(result.toString()).toEqual("https://localhost:1234/a/b/c/d");
});

test("urlAppend - works when base is a string", () => {
  let base = "https://localhost:1234/a/b";
  let path = "./c/d";
  let result = urlAppend(base, path);
  expect(result.toString()).toEqual("https://localhost:1234/a/b/c/d");
});

test("urlAppend - works when base is absolute path", () => {
  let base = "/a/b";
  let path = "./c/d";
  let result = urlAppend(base, path);
  expect(result.toString()).toEqual("/a/b/c/d");
});

test("urlAppend - absolute path can rebase base", () => {
  let base = "./a/b";
  let path = "/c/d";
  let result = urlAppend(base, path);
  expect(result.toString()).toEqual("/c/d");
});

test("urlAppend - ignores base on absolute URL path", () => {
  let base = new URL("https://example.com/a/b");
  let path = new URL("https://example2.com/c/d");
  let result = urlAppend(base, path);
  expect(result).toEqual(path);
});

test("urlAppend - ignores base on absolute string path", () => {
  let base = new URL("https://example.com/a/b");
  let path = "https://example2.com/c/d";
  let result = urlAppend(base, path);
  expect(result.toString()).toEqual(path);
});

test("urlAppend - handles null values well", () => {
  let base = null;
  let path = /** @type {string | URL} */ ("./a/b/c/d");
  let result = urlAppend(base, path);
  expect(result.toString()).toEqual("./a/b/c/d");

  base = new URL("https://example.com/a/b");
  path = null;
  result = urlAppend(base, path);
  expect(result.toString()).toEqual("https://example.com/a/b");

  base = null;
  path = new URL("https://example.com/c/d");
  result = urlAppend(base, path);
  expect(result.toString()).toEqual("https://example.com/c/d");
});
