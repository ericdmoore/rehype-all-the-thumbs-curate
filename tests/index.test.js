const fs = require('fs')
const path = require('path')

// tape bolerplate
const tape = require('tape')
const tapePromises = require('tape-promise').default
const test = tapePromises(tape)

// basics of test setup
const unified = require('unified')
const parse = require('rehype-parse')
const curate = require('../src/index')
const stringer = require('rehype-stringify')
const vfile = require('vfile')
// const prettyReporter = require('vfile-reporter-pretty')
const reporter = require('vfile-reporter')

// #region helpers
const isPropertyInAll = arr => propName => arr.reduce((p,cofA)=>p && propName in cofA, true)
const isPropAlways = arr => (propName, typeTest) => arr.reduce((p,cofA)=> p && typeTest(cofA[propName]), true)
const isString = (s)=> typeof s === 'string' || s instanceof String
const isNumber = (n)=> typeof n === 'number' || n instanceof Number
const {isArray} = Array

const checkAllProps = (t, arr, props2Msg)=>{
    const hasProp = isPropertyInAll(arr)
    return Object.entries(props2Msg)
        .map(([propName, msg]) => {
            return () => t.ok(hasProp(propName), msg )
        })   
}

const checkAllPropTypes = (t, arr, props2Msg)=>{
    const checkProp = isPropAlways(arr)
    return Object.entries(props2Msg)
        .map(([propName, {msg, test}]) => {return () => t.ok( checkProp(propName, test), msg ) } )   
}
// #endregion helpers

// #region configure shorthand definitions
const propDefs = {
    widths:       '∀ vfile.srcs; ∃ .widths',
    breaks:       '∀ vfile.srcs; ∃ .breaks',
    types:        '∀ vfile.srcs; ∃ .types',
    prefix:       '∀ vfile.srcs; ∃ .prefix',
    suffix:       '∀ vfile.srcs; ∃ .suffix',
    hashlen:      '∀ vfile.srcs; ∃ .hashlen',
    selectedBy:   '∀ vfile.srcs; ∃ .selectedBy',
    sourcePrefix: '∀ vfile.srcs; ∃ .sourcePrefix',
    destBasePath: '∀ vfile.srcs; ∃ .destBasePath',
    addclassnames:   '∀ vfile.srcs; ∃ .classNames',
}

const typeAsserts =  {
    widths: {test:  isArray, msg:'`width` should always be an array in the srcs array' },
    breaks: {test: isArray, msg:'`breaks` should always be an array in the srcs array'},
    prefix: {test: isString, msg:'`prefix` should always be a string'},
    suffix: {test: isString, msg:'`suffix` should always be a string'},
    hashlen: {test: isNumber, msg:'`hashLen` should always be a number'},
    selectedBy: {test: isString, msg:'`selectedBy` should always be a string'},
    addclassnames: {test: isArray, msg:'`addclassnames` should always be an array'},
    sourcePrefix: {test: isString, msg:'`sourcePrefix` should always be a string'},
    destBasePath: {test: isString, msg:'`destBasePath` should always be a string'},
}

// #endregion configure shorthand definitions

test('Zero Config', (t) => {
    const filepath = './fixtures/ex1.html'
    const loadPath = path.resolve(__dirname, filepath)
    fs.readFile(loadPath, (err, fileB)=>{
        if(err){throw new Error(err)}
        const vf = new vfile({
            path: filepath,
            contents: fileB.toString()
        })

        unified()
            .use(parse)
            .use(curate)
            .use(stringer)
            .process(vf, (err, vfile)=>{
                reporter([err || vfile])
                // console.log( vfile.srcs )
                //
                // assertions for vfile sidecars
                const propTests = checkAllProps(t, vfile.srcs, propDefs)
                const typeTests = checkAllPropTypes(t, vfile.srcs, typeAsserts)
                const allTests = propTests.concat(typeTests).concat([
                    () => t.ok('data' in vfile, 'data in vfile'),
                    () => t.ok('path' in vfile, 'path in vfile'),
                    () => t.ok('srcs' in vfile, 'srcs in vfile'),
                    () => t.ok('contents' in vfile, 'contents in vfile'),
                    () => t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' ),
                    () => t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' ),
                ])
                t.plan(allTests.length)
                // run the tests
                allTests.forEach(testAssert => testAssert())
            })
    })
})

test('String Config', (t) => {
    const filepath = './fixtures/ex1.html'
    const loadPath = path.resolve(__dirname, filepath)
    fs.readFile(loadPath, (err, fileB)=>{
        if(err){throw new Error(err)}
        const vf = new vfile({
            path: filepath,
            cwd: __dirname,     
            contents: fileB.toString()
        })

        unified()
            .use(parse)
            .use(curate, {select:'picture[thumbnails="true"]>img'})
            .use(stringer)
            .process(vf, (err, vfile)=>{
                reporter([err || vfile])
                // console.log( vfile.srcs )
                //
                // assertions for vfile sidecars
                const propTests = checkAllProps(t, vfile.srcs, propDefs)
                const typeTests = checkAllPropTypes(t, vfile.srcs, typeAsserts)
                const allTests = propTests.concat(typeTests)
                t.plan(allTests.length + 2)
            
                // start the tests
                t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' )
                t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' )
                allTests.forEach(testAssert => testAssert())
            })
    })
})

test('StringThunk Config', (t) => {
    const filepath = './fixtures/ex2.html'
    const loadPath = path.resolve(__dirname, filepath)
    fs.readFile(loadPath, (err, fileB)=>{
        if(err){throw new Error(err)}
        const vf = new vfile({
            path: filepath,
            cwd: __dirname, 
            contents: fileB.toString()
        })
        unified()
            .use(parse)
            .use(curate, {select: ()=>'picture[thumbnails="true"]>img' })
            .use(stringer)
            .process(vf, (err, vfile)=>{
                reporter([err || vfile])
                // console.log( vfile.srcs )
                //
                // assertions for vfile sidecars
                const propTests = checkAllProps(t, vfile.srcs, propDefs)
                const typeTests = checkAllPropTypes(t, vfile.srcs, typeAsserts)
                const allTests = propTests.concat(typeTests)
                t.plan(allTests.length + 2)
            
                // start the tests
                t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' )
                t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' )
                allTests.forEach(testAssert => testAssert())
            })
    })
})

test('Extraneous Config Is Ignored', (t) => {
    const filepath = './fixtures/ex2.html'
    const loadPath = path.resolve(__dirname, filepath)
    fs.readFile(loadPath, (err, fileB)=>{
        if(err){throw new Error(err)}
        const vf = new vfile({
            path: filepath,
            cwd: __dirname, 
            contents: fileB.toString()
        })
        unified()
            .use(parse)
            .use(curate, {unusedKey:1, otherKey:'str'})
            .use(stringer )
            .process(vf, (err, vfile)=>{
                reporter([err || vfile])
                //
                // assertions for vfile sidecars
                const propTests = checkAllProps(t, vfile.srcs, propDefs)
                const typeTests = checkAllPropTypes(t, vfile.srcs, typeAsserts)
                const allTests = propTests.concat(typeTests)
                t.plan(allTests.length + 2)
            
                // start the tests
                t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' )
                t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' )
                allTests.forEach(testAssert => testAssert())
            })
    })
})

test('SRCS Shape is unchanged when leveraging data-attribs form the DOM', (t) => {
    const filepath = './fixtures/ex3.html'
    const loadPath = path.resolve(__dirname, filepath)
    fs.readFile(loadPath, (err, fileB)=>{
        if(err){throw new Error(err)}
        const vf = new vfile({
            path: filepath,
            cwd: __dirname, 
            contents: fileB.toString()
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
            .process(vf, (err, vfile)=>{

                // console.log('t1',JSON.stringify( { err } , null, 2))
                // console.log('t2',JSON.stringify( {vfileFin: vfile} , null, 2))
                // console.log(JSON.stringify(vfile.srcs, null, 2))
                // reporter(vfile)
                //
                // assertions for vfile sidecars
                const propTests = checkAllProps(t, vfile.srcs || [], propDefs)
                const typeTests = checkAllPropTypes(t, vfile.srcs || [], typeAsserts)
                const allTests = propTests.concat(typeTests).concat([
                    () => t.ok('data' in vfile, 'data in vfile'),
                    () => t.ok('path' in vfile, 'path in vfile'),
                    () => t.ok('srcs' in vfile, 'srcs in vfile'),
                    () => t.ok('contents' in vfile, 'contents in vfile'),
                    () => t.ok( isArray(vfile.srcs), 'vfile.srcs must be an array' ),
                    () => t.ok( vfile.srcs.length > 0, 'vfile.srcs must be not be empty' )
                ])

                t.plan(allTests.length)                
                allTests.forEach(testAssert => testAssert())
            })
    })
})

test('Check the values of .srcs[] based on ex3 fixture', (t) => {
    const filepath = './fixtures/ex3.html'
    const loadPath = path.resolve(__dirname, filepath)
    const exp = [{
        selectedBy: 'picture>img[data-thumbnails="true"]',
        sourcePrefix: '',
        destBasePath: '',
        prefix: 'optim',
        suffix: '---{{width}}w--{{hash}}.{{ext}}',
        hashlen: 8,
        clean: true,
        addclassnames: [ 'newClass1', 'newClass2' ],
        widths: [ 207, 307, 507, 807 ],
        breaks: [ 707, 1007, 1107 ],
        types: { jpg: {}, webp: {} },
        src: 'nails.jpg'
    }]

    fs.readFile(loadPath, (err, fileB)=>{
        if(err){throw new Error(err)}
        const vf = new vfile({
            path: filepath,
            cwd: __dirname, 
            contents: fileB.toString()
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
            .process(vf, (err, vfile)=>{
                t.deepEqual(vfile.srcs, exp)
                t.end()
            })
    })
})

test.skip('existing srcs stay intact .srcs[] <based on ex3 fixture>', (t) => {
    const filepath = './fixtures/ex3.html'
    const loadPath = path.resolve(__dirname, filepath)

    fs.readFile(loadPath, (err, fileB)=>{
        if(err){throw new Error(err)}
        const vf = new vfile({
            path: filepath,
            cwd: __dirname, 
            contents: fileB.toString()
        })
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
            })
            .use(stringer)
            .process(vf, (err, vfile)=>{
                console.log({srcs: vfile.srcs})
                // t.deepEqual(vfile.srcs, exp)
                t.end()
            })
    })
})