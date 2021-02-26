var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
// tape bolerplate
var tape = require('tape');
var tapePromises = require('tape-promise')["default"];
var test = tapePromises(tape);
// basics of test setup
var unified = require('unified');
var parse = require('rehype-parse');
var stringer = require('rehype-stringify');
var vfile = require('vfile');
// const prettyReporter = require('vfile-reporter-pretty')
var reporter = require('vfile-reporter');
var LodashGet = require('lodash.get');
var get = function (p) { return function (object) { return LodashGet(object, p); }; };
var localResolve = require('../src/index').localResolve;
var curate = require('../src/index')["default"];
// fixtures
var ex1 = require('./fixtures/ex1.html.js').html;
var ex2 = require('./fixtures/ex2.html.js').html;
var ex3 = require('./fixtures/ex3.html.js').html;
// const nailsPic = require('./fixtures/nails-jpg-b64.js').img
// const thumbPic = require('./fixtures/nails-jpg-b64.js').img
var jsonDiff = require('json-diff');
var printDiffs = function (a, b) { return console.log(jsonDiff.diffString(a, b)); };
// #region helpers
var isArray = Array.isArray;
var ArrayOf = function (checkElemƒ) { return function (arr) { return arr.every(checkElemƒ); }; };
var isPropertyInAll = function (arr) { return function (propName) { return arr.every(function (v) { return new Boolean(get(propName)(v)); }); }; };
var isPropTypedForEvery = function (arr) { return function (propName, typeTest) { return arr.every(function (v) { return typeTest(get(propName)(v)); }); }; };
var isString = function (s) { return typeof s === 'string' || s instanceof String; };
var isBool = function (s) { return typeof s === 'boolean' || s instanceof Boolean; };
var isNumber = function (n) { return typeof n === 'number' || n instanceof Number; };
var isFunction = function (f) { return typeof f === 'function' || f instanceof Function; };
var isaStringerFunc = function (f) { return isFunction(f) && isString(f()); };
var isNotNull = function (o) { return o !== null; };
var isObject = function (o) { return o && isNotNull(o) && !isArray(o) && !isString(o) && !isNumber(o) && !isBool(o); };
// const or = (t1, t2) => t1() || t2()
// const and = (t1, t2) => t1() && t2()
var checkAllProps = function (t, props2Msg, arr) {
    if (arr === void 0) { arr = []; }
    var hasProp = isPropertyInAll(arr);
    // console.log('type arr:', isArray(arr))
    // console.log({ props2Msg })
    return Object.entries(props2Msg)
        .map(function (_a) {
        var propName = _a[0], msg = _a[1];
        return function () { return t.ok(hasProp(propName), msg); };
    });
};
var checkAllPropTypes = function (t, props2Msg, arr) {
    if (arr === void 0) { arr = []; }
    var checkProp = isPropTypedForEvery(arr);
    // console.log('type arr:', isArray(arr))
    // console.log({ props2Msg })
    return Object.entries(props2Msg)
        .map(function (_a) {
        var propName = _a[0], _b = _a[1], msg = _b.msg, test = _b.test;
        return function () { return t.ok(checkProp(propName, test), msg); };
    });
};
// #endregion helpers
// #region configure shorthand definitions
var propDefs = {
    // prop: ErrorMsg
    'selectedBy': '∀ vfile.srcs; ∃ .selectedBy',
    'addclassnames': '∀ vfile.srcs; ∃ .addclassnames',
    'getReadPath': '∀ vfile.srcs; ∃ .getReadPath',
    'getWritePath': '∀ vfile.srcs; ∃ .getWritePath',
    'input': '∀ vfile.srcs; ∃ .input',
    'input.pathPrefix': '∀ vfile.srcs; ∃ .input.pathPrefix',
    'input.fileName': '∀ vfile.srcs; ∃ .input.fileName',
    'input.ext': '∀ vfile.srcs; ∃ .input.ext',
    'output': '∀ vfile.srcs; ∃ .output',
    'output.width': '∀ vfile.srcs; ∃ .output.width',
    'output.hashlen': '∀ vfile.srcs; ∃ .ouput.hashlen',
    'output.format': '∀ vfile.srcs; ∃ .ouput.format',
    'output.hash': '∀ vfile.srcs; ∃ .output.hash',
    'partOfSet': '∀ vfile.srcs; ∃ .partOfSet',
    'partOfSet.widths': '∀ vfile.srcs; ∃ .partOfSet.widths',
    'partOfSet.breaks': '∀ vfile.srcs; ∃ .partOfSet.breaks',
    'partOfSet.types': '∀ vfile.srcs; ∃ .partOfSet.types'
};
var typeAsserts = {
    // prop : {test: testFn , msg: Type validateion Message }
    'selectedBy': { test: isString, msg: '`suffix` should always be a string' },
    'getReadPath': { test: isaStringerFunc, msg: '`getReadPath` should always be a stringer Func' },
    'getWritePath': { test: isaStringerFunc, msg: '`getWritePath` should always be a stringer Func' },
    'input': { test: isObject, msg: '`input` should always be an object' },
    'input.pathPrefix': { test: isString, msg: '`input.pathPrefix` should always be a string' },
    'input.fileName': { test: isString, msg: '`input.fileName` should always be a string' },
    'input.ext': { test: isString, msg: '`input.ext` should always be a string' },
    'output': { test: isObject, msg: '`output` should always be an object ' },
    'output.width': { test: isNumber, msg: '`ouput.width` should always be a number' },
    'output.hash': { test: isFunction, msg: '`ouput.hash` should always be a function' },
    'output.hashlen': { test: isNumber, msg: '`output.hashLen` should always be a number' },
    'output.format': { test: isObject, msg: '`ouput.format` should always be an object ' },
    'partOfSet': { test: isObject, msg: '`partOfSet` should always be an object' },
    'partOfSet.types': { test: isObject, msg: '`partOfSet` should always be an object' },
    'partOfSet.widths': { test: ArrayOf(isNumber), msg: '`partOfSet` should always be a number[] ' },
    'partOfSet.breaks': { test: ArrayOf(isNumber), msg: '`partOfSet` should always be a number[] ' },
    'addclassnames': { test: ArrayOf(isString), msg: '`addclassnames` should always be a string[] ' }
};
var stripFunsFromObj = function (d) { return JSON.parse(JSON.stringify(d)); };
// #endregion configure shorthand definitions
// console.log({curate})
test('Resolve Paths', function (t) {
    t.assert(localResolve('./a', 'b/', 'c/', '../d'), 'a/b/d');
    t.assert(localResolve('a', '..b/', 'c/', '../d'), 'b/d');
    t.assert(localResolve('a', '..b/', './c/', '../d'), 'b/d');
    t.assert(localResolve('a', '..b/', './c/', 'd'), 'b/c/d');
    t.end();
});
test('Zero Config', function (t) {
    var vf = new vfile({
        path: './fixtures/ex1.html',
        contents: ex1
    });
    unified()
        .use(parse)
        .use(curate)
        .use(stringer)
        .process(vf, function (err, vfile) {
        // reporter([err || vfile])
        //
        // console.log(0, vfile )
        // console.log(1, vfile.srcs || 'nothing' )
        // assertions for vfile sidecars
        var allTests = __spreadArray([
            function () { return t.ok('data' in vfile, 'data in vfile'); },
            function () { return t.ok('path' in vfile, 'path in vfile'); },
            function () { return t.ok('contents' in vfile, 'contents in vfile'); },
            function () { return t.ok('srcs' in vfile, 'contents in vfile'); }
        ], ('srcs' in vfile
            // avoids run-time error if the above assertion is failing
            ? [
                function () { return t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'); },
                function () { return t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty'); }
            ]
            : [])).concat(checkAllPropTypes(t, typeAsserts, vfile.srcs)).concat(checkAllProps(t, propDefs, vfile.srcs));
        // console.log('allTests.length',allTests.length)
        // allTests.forEach((v,i) => console.log(i+1, v.toString()))
        t.plan(allTests.length);
        allTests.forEach(function (testAssert) { return testAssert(); });
        t.end();
    });
});
test('String Config', function (t) {
    var vf = new vfile({
        path: './fixtures/ex1.html',
        cwd: __dirname,
        contents: ex1
    });
    unified()
        .use(parse)
        .use(curate, { select: 'picture[thumbnails="true"]>img' })
        .use(stringer)
        .process(vf, function (err, vfile) {
        reporter([err || vfile]);
        // console.log( vfile.srcs )
        //
        // assertions for vfile sidecars
        var allTests = __spreadArray([
            function () { return t.ok('data' in vfile, 'data in vfile'); },
            function () { return t.ok('path' in vfile, 'path in vfile'); },
            function () { return t.ok('contents' in vfile, 'contents in vfile'); },
            function () { return t.ok('srcs' in vfile, 'contents in vfile'); }
        ], ('srcs' in vfile
            // avoids run-time error if the above assertion is failing
            ? [
                function () { return t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'); },
                function () { return t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty'); }
            ]
            : [])).concat(checkAllProps(t, propDefs, vfile.srcs)).concat(checkAllPropTypes(t, typeAsserts, vfile.srcs));
        // vfile.srcs.forEach(v => console.log(v.output, v.output.width))
        // start the tests
        t.plan(allTests.length);
        allTests.forEach(function (testAssert) { return testAssert(); });
        t.end();
    });
});
test('StringThunk Config', function (t) {
    var vf = new vfile({
        path: './fixtures/ex2.html',
        cwd: __dirname,
        contents: ex2
    });
    unified()
        .use(parse)
        .use(curate, { select: function () { return 'picture[thumbnails="true"]>img'; } })
        .use(stringer)
        .process(vf, function (err, vfile) {
        reporter([err || vfile]);
        // console.log( vfile.srcs )
        //
        // assertions for vfile sidecars
        var propTests = checkAllProps(t, propDefs, vfile.srcs);
        var typeTests = checkAllPropTypes(t, typeAsserts, vfile.srcs);
        var allTests = propTests.concat(typeTests).concat([
            function () { return t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'); },
            function () { return t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty'); }
        ]);
        // start the tests
        t.plan(allTests.length);
        allTests.forEach(function (testAssert) { return testAssert(); });
    });
});
test('Extraneous Config Is Ignored', function (t) {
    var vf = new vfile({
        path: './fixtures/ex2.html',
        cwd: __dirname,
        contents: ex2
    });
    unified()
        .use(parse)
        .use(curate, { unusedKey: 1, otherKey: 'str' })
        .use(stringer)
        .process(vf, function (err, vfile) {
        reporter([err || vfile]);
        //
        // assertions for vfile sidecars
        var propTests = checkAllProps(t, propDefs, vfile.srcs);
        var typeTests = checkAllPropTypes(t, typeAsserts, vfile.srcs);
        var allTests = propTests.concat(typeTests).concat([
            function () { return t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'); },
            function () { return t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty'); }
        ]);
        // start the tests
        t.plan(allTests.length);
        allTests.forEach(function (testAssert) { return testAssert(); });
    });
});
test('SRCS Shape is unchanged when leveraging data-attribs form the DOM', function (t) {
    var filepath = './fixtures/ex3.html';
    var vf = new vfile({
        path: filepath,
        cwd: __dirname,
        contents: ex3
    });
    unified()
        .use(parse)
        .use(curate, {
        select: 'picture>img[data-thumbnails="true"]',
        breaks: '[601, 901, 1021]',
        widths: '[101, 251, 451, 601]',
        types: '{"jpg":{"progressive":true}}'
    })
        .use(stringer)
        .process(vf, function (err, vfile) {
        // assertions for vfile sidecars
        var allTests = [
            function () { return t.ok('data' in vfile, 'data in vfile'); },
            function () { return t.ok('path' in vfile, 'path in vfile'); },
            function () { return t.ok('srcs' in vfile, 'srcs in vfile'); },
            function () { return t.ok('contents' in vfile, 'contents in vfile'); },
            function () { return t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'); },
            function () { return t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty'); }
        ].concat(checkAllProps(t, propDefs, vfile.srcs))
            .concat(checkAllPropTypes(t, typeAsserts, vfile.srcs));
        t.plan(allTests.length);
        allTests.forEach(function (testAssert) { return testAssert(); });
    });
});
test('existing srcs stay intact .srcs[] <based on ex3 fixture>', function (t) {
    var filepath = './fixtures/ex3.html';
    var vf = new vfile({
        path: filepath,
        cwd: __dirname,
        contents: ex3
    });
    var outputSet = [
        { width: 101, format: { jpg: { progressive: true } }, hashlen: 8, hash: function () { return null; } },
        { width: 251, format: { jpg: { progressive: true } }, hashlen: 8, hash: function () { return null; } },
        { width: 451, format: { jpg: { progressive: true } }, hashlen: 8, hash: function () { return null; } },
        { width: 601, format: { jpg: { progressive: true } }, hashlen: 8, hash: function () { return null; } }
    ];
    var sharedObjPart = {
        selectedBy: 'picture[thumbnails="true"]>img',
        addclassnames: ['all-thumbed'],
        input: { ext: 'jpg', fileName: 'thumb', pathPrefix: '/' },
        getReadPath: function () { return null; },
        getWritePath: function () { return null; },
        partOfSet: {
            breaks: [601, 901, 1021],
            types: { jpg: { progressive: true } },
            widths: [101, 251, 451, 601]
        }
    };
    unified()
        .use(parse)
        .use(curate, {
        select: 'picture>img[data-thumbnails="true"]',
        breaks: '[601, 901, 1021]',
        widths: '[101, 251, 451, 601]',
        types: '{"jpg":{"progressive":true}}'
    })
        .use(curate, {
        select: 'picture[thumbnails="true"]>img'
        // the rest should be the default config
    })
        .use(stringer)
        .process(vf, function (err, vfile) {
        // vfile.srcs.forEach(v => console.log(v))
        var recombined = outputSet.map(function (output) { return (__assign({ output: output }, sharedObjPart)); });
        printDiffs(stripFunsFromObj(recombined), stripFunsFromObj(vfile.srcs));
        t.deepEqual(stripFunsFromObj(vfile.srcs), stripFunsFromObj(recombined));
        t.end();
    });
});
