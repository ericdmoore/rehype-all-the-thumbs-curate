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

const { localResolve } = require('../src/index')
const curate = require('../src/index').default

// fixtures
const ex1 = require('./fixtures/ex1.html.js').html
const ex2 = require('./fixtures/ex2.html.js').html
const ex3 = require('./fixtures/ex3.html.js').html
// const nailsPic = require('./fixtures/nails-jpg-b64.js').img
// const thumbPic = require('./fixtures/nails-jpg-b64.js').img

const jsonDiff = require('json-diff')
const printDiffs = (a,b) => console.log(jsonDiff.diffString(a, b))

// #region helpers
const {isArray} = Array
const ArrayOf = (checkElemƒ) => arr => arr.every(checkElemƒ)
const isPropertyInAll = arr => propName => arr.every(v => new Boolean(get(propName)(v)) )
const isPropTypedForEvery = arr => (propName, typeTest) => arr.every( v => typeTest(get(propName)(v))  )
const isString = s => typeof s === 'string' || s instanceof String
const isBool = s => typeof s === 'boolean' || s instanceof Boolean
const isNumber = n => typeof n === 'number' || n instanceof Number
const isFunction = f => typeof f === 'function' || f instanceof Function
const isaStringerFunc = f => isFunction(f) && isString(f())
const isNotNull = o => o !== null
const isObject = o => o && isNotNull(o) && !isArray(o) && !isString(o) && !isNumber(o) && !isBool(o)
// const or = (t1, t2) => t1() || t2()
// const and = (t1, t2) => t1() && t2()

const checkAllProps = (t, props2Msg, arr = []) => {
    const hasProp = isPropertyInAll(arr)

    // console.log('type arr:', isArray(arr))
    // console.log({ props2Msg })

    return Object.entries(props2Msg)
        .map(([propName, msg]) => {
            return () => t.ok( hasProp(propName), msg )
        })
}

const checkAllPropTypes = (t, props2Msg, arr = []) => {
    const checkProp = isPropTypedForEvery(arr)

    // console.log('type arr:', isArray(arr))
    // console.log({ props2Msg })

    return Object.entries(props2Msg)
        .map(([propName, {msg, test}]) => {
            return () => t.ok( checkProp(propName, test), msg )
        })
}
// #endregion helpers

// #region configure shorthand definitions
const propDefs = {
    // prop: ErrorMsg
    'selectedBy':       '∀ vfile.srcs; ∃ .selectedBy',
    'addclassnames':    '∀ vfile.srcs; ∃ .addclassnames',
    'getReadPath':      '∀ vfile.srcs; ∃ .getReadPath',
    'getWritePath':     '∀ vfile.srcs; ∃ .getWritePath',
    'input':            '∀ vfile.srcs; ∃ .input',
    'input.pathPrefix': '∀ vfile.srcs; ∃ .input.pathPrefix',
    'input.fileName':   '∀ vfile.srcs; ∃ .input.fileName',
    'input.ext':        '∀ vfile.srcs; ∃ .input.ext',
    'output':           '∀ vfile.srcs; ∃ .output',
    'output.width':     '∀ vfile.srcs; ∃ .output.width',
    'output.hashlen':   '∀ vfile.srcs; ∃ .ouput.hashlen',
    'output.format':    '∀ vfile.srcs; ∃ .ouput.format',
    'output.hash':      '∀ vfile.srcs; ∃ .output.hash',
    'partOfSet':        '∀ vfile.srcs; ∃ .partOfSet',
    'partOfSet.widths': '∀ vfile.srcs; ∃ .partOfSet.widths',
    'partOfSet.breaks': '∀ vfile.srcs; ∃ .partOfSet.breaks',
    'partOfSet.types':  '∀ vfile.srcs; ∃ .partOfSet.types',
}

const typeAsserts =  {
    // prop : {test: testFn , msg: Type validateion Message }
    'selectedBy' : {test: isString, msg:'`suffix` should always be a string'},
    'getReadPath' : {test: isaStringerFunc, msg:'`getReadPath` should always be a stringer Func'},
    'getWritePath' : {test: isaStringerFunc, msg:'`getWritePath` should always be a stringer Func'},
    'input' : {test: isObject, msg: '`input` should always be an object'},
    'input.pathPrefix' : {test: isString, msg: '`input.pathPrefix` should always be a string'},
    'input.fileName' : {test: isString, msg: '`input.fileName` should always be a string'},
    'input.ext': {test: isString, msg: '`input.ext` should always be a string'},
    'output' : {test: isObject, msg: '`output` should always be an object '},
    'output.width' : {test: isNumber, msg: '`ouput.width` should always be a number'},
    'output.hash' : {test: isFunction, msg: '`ouput.hash` should always be a function'},
    'output.hashlen' : {test: isNumber, msg:'`output.hashLen` should always be a number'},
    'output.format' : {test: isObject, msg: '`ouput.format` should always be an object '},
    'partOfSet' : {test: isObject, msg: '`partOfSet` should always be an object'},
    'partOfSet.types' : {test: isObject, msg: '`partOfSet` should always be an object'},
    'partOfSet.widths' : {test: ArrayOf(isNumber), msg: '`partOfSet` should always be a number[] '},
    'partOfSet.breaks' : {test: ArrayOf(isNumber), msg: '`partOfSet` should always be a number[] '},
    'addclassnames' :{test: ArrayOf(isString), msg: '`addclassnames` should always be a string[] '},
}


const stripFunsFromObj = d => JSON.parse(JSON.stringify(d))
// #endregion configure shorthand definitions

// console.log({curate})

test('Resolve Paths',(t) => {
    t.assert(localResolve('./a','b/','c/','../d'), 'a/b/d')
    t.assert(localResolve('a','..b/','c/','../d'), 'b/d')
    t.assert(localResolve('a','..b/','./c/','../d'), 'b/d')
    t.assert(localResolve('a','..b/','./c/','d'), 'b/c/d')
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
            // reporter([err || vfile])
            //
            // console.log(0, vfile )
            // console.log(1, vfile.srcs || 'nothing' )

            // assertions for vfile sidecars
            const allTests = [
                () => t.ok('data' in vfile, 'data in vfile'),
                () => t.ok('path' in vfile, 'path in vfile'),
                () => t.ok('contents' in vfile, 'contents in vfile'),
                () => t.ok('srcs' in vfile, 'contents in vfile'),
                ...('srcs' in vfile
                // avoids run-time error if the above assertion is failing
                    ? [
                        () => t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' ),
                        () => t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' )
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
        .use(curate, {select:'picture[thumbnails="true"]>img'})
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
                        () => t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' ),
                        () => t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' )
                    ]
                    : []
                )
            ].concat(
                checkAllProps(t, propDefs,vfile.srcs)
            ).concat(
                checkAllPropTypes(t, typeAsserts,vfile.srcs)
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
        .use(curate, {select: () => 'picture[thumbnails="true"]>img' })
        .use(stringer)
        .process(vf, (err, vfile) => {
            reporter([err || vfile])
            // console.log( vfile.srcs )
            //
            // assertions for vfile sidecars
            const propTests = checkAllProps(t, propDefs,vfile.srcs)
            const typeTests = checkAllPropTypes(t, typeAsserts,vfile.srcs)
            const allTests = propTests.concat(typeTests).concat([
                () => t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' ),
                () => t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' )
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
        .use(curate, {unusedKey:1, otherKey:'str'})
        .use(stringer )
        .process(vf, (err, vfile) => {
            reporter([err || vfile])
            //
            // assertions for vfile sidecars
            const propTests = checkAllProps(t, propDefs,vfile.srcs)
            const typeTests = checkAllPropTypes(t, typeAsserts,vfile.srcs)
            const allTests = propTests.concat(typeTests).concat([
                () => t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' ),
                () => t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' )
            ])

            // start the tests
            t.plan(allTests.length)
            allTests.forEach(testAssert => testAssert())
        })

})

test('SRCS Shape is unchanged when leveraging data-attribs form the DOM', (t) => {
    const filepath = './fixtures/ex3.html'
    const vf = new vfile({
        path: filepath,
        cwd: __dirname,
        contents: ex3
    })
    unified()
        .use(parse)
        .use(curate, {
            select:'picture>img[data-thumbnails="true"]',
            breaks:'[601, 901, 1021]',
            widths:'[101, 251, 451, 601]',
            types:'{"jpg":{"progressive":true}}'
        })
        .use(stringer)
        .process(vf, (err, vfile) => {
            // assertions for vfile sidecars

            const allTests = [
                () => t.ok('data' in vfile, 'data in vfile'),
                () => t.ok('path' in vfile, 'path in vfile'),
                () => t.ok('srcs' in vfile, 'srcs in vfile'),
                () => t.ok('contents' in vfile, 'contents in vfile'),
                () => t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' ),
                () => t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' )
            ].concat(checkAllProps(t, propDefs, vfile.srcs))
                .concat(checkAllPropTypes(t, typeAsserts, vfile.srcs))

            t.plan(allTests.length)
            allTests.forEach(testAssert => testAssert())
        })
})

test('existing srcs stay intact .srcs[] <based on ex3 fixture>', (t) => {
    const filepath = './fixtures/ex3.html'
    const vf = new vfile({
        path: filepath,
        cwd: __dirname,
        contents: ex3
    })

    const outputSet = [
        {width: 101, format: {jpg:{ progressive: true } }, hashlen: 8, hash: () => null },
        {width: 251, format: {jpg:{ progressive: true } }, hashlen: 8, hash: () => null },
        {width: 451, format: {jpg:{ progressive: true } }, hashlen: 8, hash: () => null },
        {width: 601, format: {jpg:{ progressive: true } }, hashlen: 8, hash: () => null }
    ]
    const sharedObjPart ={
        selectedBy: 'picture[thumbnails="true"]>img',
        addclassnames: [ 'all-thumbed' ],
        input: { ext: 'jpg', fileName: 'thumb', pathPrefix: '/' },
        getReadPath: () => null,
        getWritePath: () => null,
        partOfSet: {
            breaks: [ 601, 901, 1021 ],
            types: { jpg: { progressive: true } },
            widths: [ 101, 251, 451, 601 ]
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
            select:'picture[thumbnails="true"]>img'
            // the rest should be the default config
        })
        .use(stringer)
        .process(vf, (err, vfile) => {

            // vfile.srcs.forEach(v => console.log(v))

            const recombined = outputSet.map(
                output => ({
                    output,
                    ...sharedObjPart
                }))

            printDiffs(
                stripFunsFromObj(recombined),
                stripFunsFromObj(vfile.srcs)
            )

            t.deepEqual(
                stripFunsFromObj(vfile.srcs),
                stripFunsFromObj(recombined)
            )
            t.end()
        })

})
