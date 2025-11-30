# Web portfolio

Personal web portfolio & blog ([posts](https://github.com/Caellian/blog/)).

## Build

Requirements:

- Node
- Rust (for [builder](./blog-builder) module)

Clone with `--recurse-submodules` to also get blog posts.

```sh
npm install
npm run build:pre # build submodules & generate post content
npm run build
```

## License

Components of the portfolio are licensed under GPL license, version 3.0. A copy
of the GPL license is located in the [LICENSE](./LICENSE) file.

Blog post content is licensed under
[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) license.
