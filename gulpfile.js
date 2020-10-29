const {src} = require('gulp')
// const { writeFile, readFileSync } = require('fs')
const jsdoc = require('gulp-jsdoc3')

// const unified = require('unified')
// const parse = require('remark-parse')
// const embed = require('remark-embed-images')
// const inlineSVG = require('@jsdevtools/rehype-inline-svg')
// const MDstringify = require('remark-stringify')
// const htmlStringify = require('rehype-stringify')
// const vfile = require('vfile')
// const toVfile = require('to-vfile')
// const vfileReporter = require('vfile-reporter')
// const formatHTML = require('rehype-format')
// const styleGuide = require('remark-preset-lint-markdown-style-guide')

exports.doc = function (cb) {
    const config = require('./.jsdoc.json')
    src(['README.md', './src/**/*.js'], {read: false}).pipe(jsdoc(config, cb))
}