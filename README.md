# rehype-all-the-thumbs-curate
> rehype-👍🏿👍🏼👍🏽👍🏻👍🏾 (Selecting Inputs)

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Size][size-badge]][size]
<!-- [![Downloads][downloads-badge]][downloads] -->
<!-- [![Sponsors][sponsors-badge]][collective] -->
<!-- [![Backers][backers-badge]][collective] -->
<!-- [![Chat][chat-badge]][chat] -->

Supporting [`rehype-all-the-thumbs`](https://github.com/ericdmoore/rehype-all-the-thumbs) by finding the elements to be processed

## Install

`npm i rehype-all-the-thumbs-curate` 

or 

`yarn add rehype-all-the-thumbs-curate`

## Overview

So you looked at the ["easy option"](https://github.com/ericdmoore/rehype-all-the-thumbs), and needed more flexibilty. So down the rabbit trail we go, but now you can compose your own pipeline together tailor made to your needs, 🤘🏼 Rock On.

If that sketch does not sound like the adventure you are on, you might want to try the "easy button" first. Head to the parent project [`rehype-all-the-thumbs` ](https://github.com/ericdmoore/rehype-all-the-thumbs)

_Configuration_:
- a SelectAll string
- a default ResizerConfig

_Input_:
- a HAST tree

_Output_:
- unchanged HAST tree
- vfile with added `srcs` key added to the object

## Usage

### Simple

```js
const unified = require('unified')
const parse = require('rehype-parse')
const curate = require('rehype-all-the-thumbs-curate')
const stringer = require('rehype-stringify')

unified()
.use(parse)
.use(curate)
.use(stringer)
.process(vf, (err, vfile)=>{
    // srcs is an array,
    // where the length is based on img srcs found in picture tags 
    // which is the default CSS selector
    // the other attributes are populated based on the defaults, and all are configurable
    
    // vfile has new sidecar data called srcs - an array of declarative instructions from which other plugins can make thumbnails.
    console.log( vfile.srcs )
})
```


### Basic

```js
const unified = require('unified')
const parse = require('rehype-parse')
const curate = require('rehype-all-the-thumbs-curate')
const stringer = require('rehype-stringify')

unified()
.use(parse)
.use(curate)
.use(stringer)
.process(vf, (err, vfile)=>{
    console.log( vfile.srcs )
})
```

### Advanced

```js
const unified = require('unified')
const parse = require('rehype-parse')
const curate = require('rehype-all-the-thumbs-curate')
const stringer = require('rehype-stringify')

unified()
.use(parse)
.use(curate)
.use(stringer)
.process(vf, (err, vfile)=>{
    console.log( vfile.srcs )
})
```



## Srcs

`srcs` is a `ResizerConfig[]`

```js

/**
 *
 * @typedef InboundConfig
 * @type {object}
 * @property {string | StringThunk } [select] - a CSS selector string for how to find the DOM nodes that have the data of interest.
 * @property {string} [sourcePrefix] -  the path string that provides the required folder context to load a src file from the fs
 * @property {string} [destBasePath] -  the path string that provides folder context for where to put the string 
 * @property {number[]} [widths] - breakpoints + 1 for larger than last break
 * @property {number[]} [breaks] - where are the image breakpoints - defined by max applicable 769, 1088, 1280
 * @property {FormatOptions} [types] - jpg:{} | webp:{} | heif:{}
 * @property {number} [hashlen] - default = 8;
 * @property {string} [addclassnames] -  mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 * @property {string} [prefix] - mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 * @property {string} [suffix] - mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 */

/**
 *
 * @typedef ResizerConfig
 * @type {object}
 * @property {string} selectedBy - the CSS selctor used to get to this node
 * @property {string} sourcePrefix - the path string that provides the required folder context to load a src file from the fs
 * @property {string} destBasePath - the path string that provides folder context for where to put the string 
 * @property {number[]} widths - breakpoints + 1 for larger than last break
 * @property {number[]} breaks - where are the image breakpoints - defined by max applicable 769, 1088, 1280
 * @property {FormatOptions} types - jpg:{} | webp:{} | heif:{}
 * @property {number} hashlen - default = 8;
 * @property {string} addclassnames -  mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 * @property {string} prefix - mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 * @property {string} suffix - mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 */

/**
 * @typedef StringThunk
 * @type {Function}
 * @returns {string}
 */

/**
 * @typedef FormatOption
 * @type { (JPEG | WEBP | HEIF ) }
 */

/**
 * @typedef FormatOptions
 * @type { FormatOption[] }
 */

/**
 * @typedef JPEG
 * @type {Object}
 * @property {JPEGopts} jpg - breakpoints + 1 for larger than last break
 */

/**
 * @typedef JPEGopts
 * @type {Object}
 * @property {number} [quality] - integer 1-100 (optional, default 80)
 * @property {boolean} [progresive] - use progressive (interlace) scan (optional, default true)
 */

/**
 * @typedef WEBP
 * @type {Object}
 * @property {WEBPopts} webp - breakpoints + 1 for larger than last break
 */

/**
 * @typedef WEBPopts
 * @type {Object}
 * @property {number} [quality] - integer 1-100 (optional, default 80)
 * @property {boolean} [lossless] - use lossless compression mode (optional, default false)
 */

/**
 * @typedef HEIF
 * @type {Object}
 * @property {HEIFopts} heif - breakpoints + 1 for larger than last break
 */

/**
 * @typedef HEIFopts
 * @type {Object}
 * @property {number} [quality] - quality, integer 1-100 (optional, default 80)
 * @property {HEIFoptsCompression | false} [compression] - compression format: hevc, avc, jpeg, av1 (optional, default 'hevc')
 * @property {boolean} [lossless] - use lossless compression (optional, default false)
 */

/**
 * @typedef HEIFoptsCompression
 * @type {'hevc' | 'avc' | 'jpeg' | 'av1' }
 */

```

## Pairs Well With:

- [rehype-all-the-thumbs](https://github.com/ericdmoore/rehype-all-the-thumbs) ...like putting on velcro shoes
- [rehype-all-the-thumbs-curate](https://github.com/ericdmoore/rehype-all-the-thumbs-curate) (DOM -> data.srcs)
- [rehype-all-the-thumbs-create](https://github.com/ericdmoore/rehype-all-the-thumbs-create) (data.srcs -> data.newAssets)
- [rehype-all-the-thumbs-manipulate](https://github.com/ericdmoore/rehype-all-the-thumbs-manipulate) (data.newAssets -> DOM)
- [rehype-all-the-thumbs-obviate](https://github.com/ericdmoore/rehype-all-the-thumbs-obviate) (data.newAssets.filter -> data.newAssets)
- [vfile-newAssets-generate](https://github.com/ericdmoore/vfile-newAssets-generate) (data.newAssets -> Side Effect Funtion to create the file)

## License

[MIT][license] © [Eric D Moore][author]

<!-- Definitions -->

[license]: LICENSE

[author]: https://im.ericdmoore.com

[build]:https://github.com/ericdmoore/rehype-all-the-thumbs-curate/actions?query=workflow%3A%22Build+%26+Tests%22
[build-badge]:https://github.com/ericdmoore/rehype-all-the-thumbs-curate/workflows/Build%20&%20Tests/badge.svg
[coverage]: https://codecov.io/gh/ericdmoore/rehype-all-the-thumbs-curate
[coverage-badge]: https://img.shields.io/codecov/c/gh/ericdmoore/rehype-all-the-thumbs-curate
[size]:https://bundlephobia.com/result?p=rehype-all-the-thumbs-curate
[size-badge]:https://img.shields.io/bundlephobia/minzip/rehype-all-the-thumbs-curate?style=flat-square
<!-- [downloads] -->
<!-- [downloads-badge] -->