/* eslint-disable new-cap */
/* eslint-disable no-new-wrappers */
// tape bolerplate
const tape = require('tape')
const tapePromises = require('tape-promise').default
const test = tapePromises(tape)

// basics of test setup
const unified = require('unified')
const parse = require('rehype-parse')
const stringer = require('rehype-stringify')
const vfile = require('vfile')

// const prettyReporter = require('vfile-reporter-pretty')
const reporter = require('vfile-reporter')
const LodashGet = require('lodash.get')
const get = (p) => (object) => LodashGet(object, p)

const { pathJoin } = require('../src/index')
const curate = require('../src/index').default

// fixtures
const ex1 = require('./fixtures/ex1.html.js').html
const ex2 = require('./fixtures/ex2.html.js').html
const ex3 = require('./fixtures/ex3.html.js').html
// const nailsPic = require('./fixtures/nails-jpg-b64.js').img
// const thumbPic = require('./fixtures/nails-jpg-b64.js').img

const jsonDiff = require('json-diff')
const printDiffs = (a, b) => console.log(jsonDiff.diffString(a, b))

// #region helpers
const { isArray } = Array
const ArrayOf = (checkElemƒ) => arr => arr.every(checkElemƒ)
const isPropertyInAll = arr => propName => {
    const ret = arr.every(v => {
        const ret = new Boolean(get(propName)(v))
        if (!ret) {
            console.error('missing property`')
            console.error({ propName, v })
        }
        return ret
    })
    return ret
}
// const optionalValue = (ifPresentTest, absentTest) => o =>
const isPllainOptional = o => true
const isBool = s => { return typeof s === 'boolean' || s instanceof Boolean }
const isString = s => {
    const ret = typeof s === 'string' || s instanceof String
    if (!ret) {
        // console.error('isString: ', { s })
    }
    return ret
}
const isNumber = n => { return typeof n === 'number' || n instanceof Number }
const isFunction = f => { return typeof f === 'function' || f instanceof Function }
// const isaStringerFunc = f => isFunction(f) && isString(f())
/**
 *
 * @param {Object[]} arr
 * @returns {(propName:string, typeTest: Function, testMissing:Function)=>boolean}
 */
const isPropTypedForEvery = arr => (propName, typeTest, testForMissingProps = () => false) => arr.every(v => {
    const x = get(propName)(v)
    if (x) {
        // console.log(`property: ${propName} is present in ${v}`)
        return typeTest(x)
    } else {
        // console.log(`property: ${propName} was misssing from ${JSON.stringify(v, null, 2)}`)
        return testForMissingProps(v)
    }
})
const isNotNull = o => { return o !== null }
const isObject = o => { return o && isNotNull(o) && !isArray(o) && !isString(o) && !isNumber(o) && !isBool(o) }
// const and = (t1, t2) => t1() && t2()

/**
 *
 * @param {Function} t - tape test object
 * @param {{[prop:string]:string}} props2Msg -
 * @param {Object[]} arr - array of objects to test
 * @returns {Function[]} thunks for tape tests
 */
const checkAllProps = (t, props2Msg, arr = []) => {
    const hasProp = isPropertyInAll(arr)

    // console.log('type arr:', isArray(arr))
    // console.log({ props2Msg })

    return Object.entries(props2Msg)
        .map(([propName, msg]) => {
            return () => t.ok(hasProp(propName), msg)
        })
}

/**
 *
 * @param {Function} t - tape test object
 * @param {{[prop:string]:{test:Function, msg:string}}} props2Msg -
 * @param {Object[]} arr - array of objects to test
 * @returns {Function[]} thunks for tape tests
 */
const checkAllPropTypes = (t, props2Msg, arr = []) => {
    const checkProp = isPropTypedForEvery(arr)

    // console.log('type arr:', isArray(arr))
    // console.log({ props2Msg })

    return Object.entries(props2Msg)
        .map(([propName, { msg, test, missingTest }]) => {
            const check = checkProp(propName, test, missingTest)
            if (!check) {
                const firstPart = propName.includes('.') ? propName.split('.')[0] : propName
                console.error({ propName, arr: arr.map(v => get(propName)(v)) })
                console.error({ propName: firstPart, arr: arr.map(v => get(firstPart)(v)) })
            }
            return () => t.ok(check, msg)
        })
}
// #endregion helpers

// #region configure shorthand definitions
const propDefs = {
    // prop: ErrorMsg
    selectedBy: '∀ vfile.srcs; ∃ .selectedBy',
    addclassnames: '∀ vfile.srcs; ∃ .addclassnames',
    input: '∀ vfile.srcs; ∃ .input',
    'input.filepathPrefix:': '∀ vfile.srcs; ∃ .input.filepathPrefix',
    'input.fileName': '∀ vfile.srcs; ∃ .input.fileName',
    'input.ext': '∀ vfile.srcs; ∃ .input.ext',
    'input.rawFilePath': '∀ vfile.srcs; ∃ .input.rawFilePath',
    output: '∀ vfile.srcs; ∃ .output',
    'output.width': '∀ vfile.srcs; ∃ .output.width',
    'output.format': '∀ vfile.srcs; ∃ .ouput.format',
    'output.hash': '∀ vfile.srcs; ∃ .output.hash',
    'output.pathTmpl': '∀ vfile.srcs; ∃ .output.pathTmpl',
    // 'output.widthRatio': '∀ vfile.srcs; ∃ .output.widthRatio', // optional
    partOfSet: '∀ vfile.srcs; ∃ .partOfSet',
    'partOfSet.widths': '∀ vfile.srcs; ∃ .partOfSet.widths',
    'partOfSet.breaks': '∀ vfile.srcs; ∃ .partOfSet.breaks',
    'partOfSet.types': '∀ vfile.srcs; ∃ .partOfSet.types'
}

const typeAsserts = {
    // prop : {test: testFn , msg: Type validateion Message }
    selectedBy: { test: isString, msg: '`suffix` should always be a string' },
    input: { test: isObject, msg: '`input` should always be an object' },
    'input.fileName': { test: isString, msg: '`input.fileName` should always be a string' },
    'input.filepathPrefix': { test: isString, mes: '`input.filepathPrefix` should always be a String' },
    'input.ext': { test: isString, msg: '`input.ext` should always be a string' },
    'input.rawFilePath': { test: isString, msg: '`input.ext` should always be a string' },
    output: { test: isObject, msg: '`output` should always be an object ' },
    'output.width': { test: isNumber, msg: '`ouput.width` should always be a number' },
    'output.format': { test: isObject, msg: '`ouput.format` should always be an object ' },
    'output.hash': { test: isFunction, msg: '`ouput.hash` should always be a function' },
    'output.pathTmpl': { test: isString, msg: '`output.pathTmpl` should always be a string' },
    'output.widthratio': { test: isNumber, missingTest: isPllainOptional, msg: '`output.widthRatio` should always be a number' },
    partOfSet: { test: isObject, msg: '`partOfSet` should always be an object' },
    'partOfSet.types': { test: isObject, msg: '`partOfSet` should always be an object' },
    'partOfSet.widths': { test: ArrayOf(isNumber), msg: '`partOfSet` should always be a number[] ' },
    'partOfSet.breaks': { test: ArrayOf(isNumber), msg: '`partOfSet` should always be a number[] ' },
    addclassnames: { test: ArrayOf(isString), msg: '`addclassnames` should always be a string[] ' }
}

const stripFunsFromObj = d => JSON.parse(JSON.stringify(d))
// #endregion configure shorthand definitions

// console.log({curate})

test('Resolve Paths', (t) => {
    t.assert(pathJoin('./a', 'b/', 'c/', '../d'), 'a/b/d')
    t.assert(pathJoin('a', '..b/', 'c/', '../d'), 'b/d')
    t.assert(pathJoin('a', '..b/', './c/', '../d'), 'b/d')
    t.assert(pathJoin('.', 'a', '../b/', './c/', '../d'), 'b/d')
    t.assert(pathJoin('../a', '../b/', './c/', '../d'), '../b/d')
    t.assert(pathJoin('..a', '../b/', './c/', '../d'), '../b/d')
    t.assert(pathJoin('a', '..b/', './c/', 'd'), 'b/c/d')
    t.assert(pathJoin(...'a/ /..b/.c/d'.split('/')), 'b/c/d')
    // t.assert(pathJoin('a/..b/.c/d'.split('/')), 'b/c/d')
    t.end()
})

test('Zero Config', (t) => {
    const vf = new vfile({
        path: './fixtures/ex1.html',
        contents: ex1
    })

    unified()
        .use(parse)
        .use(curate)
        .use(stringer)
        .process(vf, (err, vfile) => {
            reporter(err || vfile)
            //
            // console.log(0, vfile)
            // console.log(1, vfile.srcs || 'nothing')

            // assertions for vfile sidecars
            const allTests = [
                () => t.ok('data' in vfile, 'data in vfile'),
                () => t.ok('path' in vfile, 'path in vfile'),
                () => t.ok('contents' in vfile, 'contents in vfile'),
                () => t.ok('srcs' in vfile, 'contents in vfile'),
                ...('srcs' in vfile
                // avoids run-time error if the above assertion is failing
                    ? [
                        () => t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'),
                        () => t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty')
                    ]
                    : []
                )
            ].concat(
                checkAllPropTypes(t, typeAsserts, vfile.srcs)
            ).concat(
                checkAllProps(t, propDefs, vfile.srcs)
            )

            // console.log('allTests.length',allTests.length)
            // allTests.forEach((v,i) => console.log(i+1, v.toString()))
            // console.log('0cfg.0, ', JSON.stringify(vfile.srcs, null, 2))

            t.plan(allTests.length)
            allTests.forEach(testAssert => testAssert())
            t.end()
        })
})

test('String Config', t => {
    const vf = new vfile({
        path: './fixtures/ex1.html',
        cwd: __dirname,
        contents: ex1
    })

    unified()
        .use(parse)
        .use(curate, { select: 'picture[thumbnails="true"]>img' })
        .use(stringer)
        .process(vf, (err, vfile) => {
            reporter([err || vfile])
            // console.log( vfile.srcs )
            //
            // assertions for vfile sidecars
            const allTests = [
                () => t.ok('data' in vfile, 'data in vfile'),
                () => t.ok('path' in vfile, 'path in vfile'),
                () => t.ok('contents' in vfile, 'contents in vfile'),
                () => t.ok('srcs' in vfile, 'contents in vfile'),
                ...('srcs' in vfile
                // avoids run-time error if the above assertion is failing
                    ? [
                        () => t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'),
                        () => t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty')
                    ]
                    : []
                )
            ].concat(
                checkAllProps(t, propDefs, vfile.srcs)
            ).concat(
                checkAllPropTypes(t, typeAsserts, vfile.srcs)
            )

            // vfile.srcs.forEach(v => console.log(v.output, v.output.width))
            // start the tests
            t.plan(allTests.length)
            allTests.forEach(testAssert => testAssert())
            t.end()
        })
})

test('StringThunk Config', (t) => {
    const vf = new vfile({
        path: './fixtures/ex2.html',
        cwd: __dirname,
        contents: ex2
    })
    unified()
        .use(parse)
        .use(curate, { select: () => 'picture[thumbnails="true"]>img' })
        .use(stringer)
        .process(vf, (err, vfile) => {
            reporter([err || vfile])
            // console.log( vfile.srcs )
            //
            // assertions for vfile sidecars
            const propTests = checkAllProps(t, propDefs, vfile.srcs)
            const typeTests = checkAllPropTypes(t, typeAsserts, vfile.srcs)
            const allTests = propTests.concat(typeTests).concat([
                () => t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'),
                () => t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty')
            ])

            // start the tests
            t.plan(allTests.length)
            allTests.forEach(testAssert => testAssert())
        })
})

test('Extraneous Config Is Ignored', (t) => {
    const vf = new vfile({
        path: './fixtures/ex2.html',
        cwd: __dirname,
        contents: ex2
    })
    unified()
        .use(parse)
        .use(curate, { unusedKey: 1, otherKey: 'str' })
        .use(stringer)
        .process(vf, (err, vfile) => {
            reporter([err || vfile])
            //
            // assertions for vfile sidecars
            const propTests = checkAllProps(t, propDefs, vfile.srcs)
            const typeTests = checkAllPropTypes(t, typeAsserts, vfile.srcs)
            const allTests = propTests.concat(typeTests).concat([
                () => t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'),
                () => t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty')
            ])

            // start the tests
            t.plan(allTests.length)
            allTests.forEach(testAssert => testAssert())
        })
})

test.skip('SRCS Shape is unchanged when leveraging data-attribs form the DOM', (t) => {
    const filepath = './fixtures/ex3.html'
    const vf = new vfile({
        path: filepath,
        cwd: __dirname,
        contents: ex3
    })
    unified()
        .use(parse)
        .use(curate, {
            select: 'picture>img[data-thumbnails="true"]',
            breaks: '[601, 901, 1021]',
            widths: '[101, 251, 451, 601]',
            types: '{"jpg":{"progressive":true}}'
        })
        .use(stringer)
        .process(vf, (err, vfile) => {
            // assertions for vfile sidecars
            reporter([err || vfile])

            const allTests = [
                () => t.ok('data' in vfile, 'data in vfile'),
                () => t.ok('path' in vfile, 'path in vfile'),
                () => t.ok('srcs' in vfile, 'srcs in vfile'),
                () => t.ok('contents' in vfile, 'contents in vfile'),
                () => t.ok(isArray(vfile.srcs), 'vfile.srcs must be an array'),
                () => t.ok(vfile.srcs.length > 0, 'vfile.srcs must be not be empty')
            ].concat(checkAllProps(t, propDefs, vfile.srcs))
                .concat(checkAllPropTypes(t, typeAsserts, vfile.srcs))

            t.plan(allTests.length)
            allTests.forEach(testAssert => testAssert())
        })
})

test.skip('existing srcs stay intact .srcs[] <based on ex3 fixture>', (t) => {
    const filepath = './fixtures/ex3.html'
    const vf = new vfile({
        path: filepath,
        cwd: __dirname,
        contents: ex3
    })

    const outputSet = [
        { width: 101, format: { jpg: { progressive: true } }, hash: () => null, pathTmpl: '/optim/{{filename}}-{{width}}w-{{hash}}.{{ext}}' },
        { width: 251, format: { jpg: { progressive: true } }, hash: () => null, pathTmpl: '/optim/{{filename}}-{{width}}w-{{hash}}.{{ext}}' },
        { width: 451, format: { jpg: { progressive: true } }, hash: () => null, pathTmpl: '/optim/{{filename}}-{{width}}w-{{hash}}.{{ext}}' },
        { width: 601, format: { jpg: { progressive: true } }, hash: () => null, pathTmpl: '/optim/{{filename}}-{{width}}w-{{hash}}.{{ext}}' }
    ]
    const sharedObjPart = {
        selectedBy: 'picture[thumbnails="true"]>img',
        addclassnames: ['all-thumbed'],
        input: {
            ext: 'jpg',
            fileName: 'thumb',
            filepathPrefix: '.',
            rawFilePath: 'thumb.jpg',
            domPath: ''
        },
        getReadPath: () => null,
        getWritePath: () => null,
        partOfSet: {
            breaks: [601, 901, 1021],
            types: { jpg: { progressive: true } },
            widths: [101, 251, 451, 601]
        }
    }

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
        .process(vf, (err, vfile) => {
            reporter([err || vfile])
            // vfile.srcs.forEach(v => console.log(v))

            const recombined = outputSet.map(
                output => ({
                    ...sharedObjPart,
                    output
                }))

            printDiffs(
                stripFunsFromObj(vfile.srcs),
                stripFunsFromObj(recombined)
            )

            t.deepEqual(
                stripFunsFromObj(vfile.srcs),
                stripFunsFromObj(recombined)
            )
            t.end()
        })
})

// interface propMsgMap {
//   [propName:string]:{msg:string, test: Function}
// }
