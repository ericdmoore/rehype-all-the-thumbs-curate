/**
 * @title rehype-all-the-thumbs-curate
 * @author Eric Moore
 * @summary Select DOM nodes that have images availble for thumbnailing
 * @description Pluck out Images, and tag the file with instructions for
 * other thumbnailing plugins to use.
 *
 * Input
 *   css selctor string + Instruction Information for thumbnailing images
 * Output
 *   an unchanged tree (aka: vfile.contents)
 * @see https://unifiedjs.com/explore/package/hast-util-select/#support
 */

// import type {Node} from 'unist'
// import type {VFile} from 'vfile'
// import type {PngOptions, JpegOptions, WebpOptions} from 'sharp'

const path = require('path')
const selectAll = require('hast-util-select')
const createHash = require('crypto')
const { isArray } = Array

// import Mustache from 'mustache'
// const makePrettyPrinter = (indent=2) => (...a) => a.length === 1
//     ? console.log(JSON.stringify( a[0], null, indent))
//     : console.log(...a.slice(0,-1), JSON.stringify(a.slice(-1)[0], null, indent))

// const prettyPrint = makePrettyPrinter()

/**
 * Resolve
 * @summary Merge path segments together
 * @description Take in path segments,
 * intelligibly  merge them together to form one path.
 * @todo why not use path.join('') ???
 * @todo the up path
 * @param {...string} paths - path segments
 * @returns {string}
 */
exports.localResolve = (...paths) => {
    const withDotsButNoSlashes = paths.map((c) => {
        c = c.startsWith('/') ? c.slice(1) : c
        c = c.endsWith('/') ? c.slice(0,-1) : c
        return c
    })
    const nodDotDotnoSlashes = withDotsButNoSlashes.reduce((p,c) => {
        if(c ==='' || c ===' '){
            return p
        }
        if(c.startsWith('..')){
            return exports.localResolve(...[...p.slice(0,-1), c.slice(2)]).split('/')
        }else{
            return [...p, c]
        }
    },[])
    return nodDotDotnoSlashes.join('/')
}

exports.trimmedHash = (n) => (b) => () => createHash('sha256').update(b).digest('hex').slice(0,n)

/**
 * Merge
 * @private
 */
exports.merge = (paths, fallback, obj) =>
    Object.entries(paths)
        .reduce((acc,[prop, prepFn]) =>
            prop in obj
                ? prepFn(acc, obj[prop])
                : prop in fallback
                    ? {...acc, [prop]: fallback[prop]}
                    : acc
        ,{})

/**
 * Map Builder: Parse String And Swap Path
 * @private
 * @description A builder function returning a key to ƒ.transform map.
 * The 'look-up-key'º is mapped to a merge function.
 * The ƒ.merge returns a new merged object,
 * where the 'look-up-key'º is replaced with the writePath during merge, and the val is parsed
*/
exports.parseStringsAndSwapPath = (readPath, writePath) => ({ [readPath]: (a,s) => ({...a, [writePath]:JSON.parse(s)}) })

/**
 * Map Builder: Swap Path
 * @private
 * @description A builder function returning a key to ƒ.transform map.
 * The 'look-up-key'º (aka: readPath) is mapped to a merge function.
 * The ƒ.merge function is given an accumulating merge object, and a value from one of 2 target objects depending on if its found.
 * The ƒ.merge returns a merged object, and all it does it replce the look-up-keyº with the writePath
 * and the val stays unchanged
 * @example
 * const mergeMeIn = noChange('lookForThis', 'butEventuallyMakeItThis')
 * console.log(mergeMeIn) // { lookForThis: (all, val) => ({...all, butEventuallyMakeItThis: val}) }
 */
exports.noChangeJustSwapPath = (readPath, writePath) => ({ [readPath]: (a,s) => ({...a, [writePath]:s}) })

/**
 * Map Builder: Indetity
 * @private
 * @description A builder function returning a key to ƒ.transform map.
 * The look-up-key maps to a ƒ.merge.
 * The ƒ.merge (inputs: (accum obj, val)) returns a merged object where the 'look-up-key'º maps to the unchanged val
 */
exports.noChange = (spath) => ({ [spath]: (a,s) => ({...a, [spath]:s}) })

/**
 * Map Builder: Parse The Val
 * @private
 * @description  A builder function returning a key to ƒ.transform map.
 * The returned object is merged into a configuration object used for merging objects.
 * The `lookup-key` maps to a ƒ.merge.
 */
exports.parseIfString = (spath) => ({
    [spath]: (a,maybeS) =>
        typeof maybeS ==='string'
            ? {...a, [spath]:JSON.parse(maybeS)}
            : {...a, [spath]:maybeS }
})

const HASTpaths = {
    ...exports.noChange('selectedBy'),
    ...exports.noChangeJustSwapPath('dataSourceprefix','sourcePrefix'),
    ...exports.noChangeJustSwapPath('dataDestbasepath','destBasePath'),
    ...exports.noChangeJustSwapPath('dataPrefix','prefix'),
    ...exports.noChangeJustSwapPath('dataSuffix','suffix'),
    ...exports.parseStringsAndSwapPath('dataHashlen','hashlen'),
    ...exports.parseStringsAndSwapPath('dataClean','clean'),
    ...exports.parseStringsAndSwapPath('dataWidths','widths'),
    ...exports.parseStringsAndSwapPath('dataBreaks','breaks'),
    ...({ dataAddclassnames: (a, sa) => ({...a, addclassnames: sa.split(' ')})}),
    ...({ dataTypes: (a,s) => ({...a, types: s.split(',').reduce((p,c) => ({...p,[c]:{}}),{}) })})
}

const NORMpaths = {
    ...exports.noChange('selectedBy'),
    ...exports.noChange('sourcePrefix'),
    ...exports.noChange('destBasePath'),
    ...exports.noChange('prefix'),
    ...exports.noChange('suffix'),
    ...exports.noChange('hashlen'),
    ...exports.noChange('clean'),
    ...exports.noChange('addclassnames'),
    ...exports.parseIfString('widths'),
    ...exports.parseIfString('breaks'),
    ...exports.parseIfString('types'),
}

const mergeNode =  (fallback, ob) => exports.merge(HASTpaths, fallback, ob.properties)
const mergeConfig = (fallback, ob = {}) => exports.merge(NORMpaths, fallback, ob)

/**
 * @exports rehype-all-the-thumbs-curate
 * @description the `rehype-all-the-thumbs-curate` plugin adds a transformer to the pipeline.
 * @param { InboundConfig } [config] - Instructions for a Resizer Algorithm to understand the types of thumbnails desired.
 */
exports.curate = (config) => {
    // user input
    // expects { .select :: string or ()=>string} ; otherwise defaults
    const select = !config || !config.select
        ? 'picture[thumbnails="true"]>img'
        : typeof config.select ==='function'
            ? config.select()
            : config.select

    // the normalized defaults
    const defaults = {
        selectedBy: select,
        sourcePrefix:'',
        destBasePath:'',
        hashlen: 8,
        clean: true,
        types: ({webp:{}, jpg:{}}), // where the empty object implies use the default for the format
        breaks: [640, 980, 1020],
        widths: [100, 250, 450, 600],
        addclassnames: ['all-thumbed'],
        prefix: 'optim/',
        suffix: '-{{width}}w-{{hash}}.{{ext}}'
    }

    // merge the inputs + defaults
    const cfg = mergeConfig(defaults, config)

    // transformer
    return (tree, vfile /* ,next */ ) => {

        const selected = selectAll(select, tree)

        // [{ src, ...mergedConfigs }]
        const srcsCompact = selected
            .map(node => ({ node, src: (node).properties.src }))
            .map(({ src, node }) => ({
                ...mergeConfig(cfg, mergeNode(cfg, node)),
                src
            }))

        const srcs = srcsCompact.reduce((p,s) => {
            const accSimpleConfig = []
            const partOfSet = {
                breaks: s.breaks,
                types: s.types,
                widths:s.widths,
            }

            Object.entries(s.types).forEach(([format, opts]) => {
                s.widths.forEach(width => {
                    // width, format, opts
                    const ext = path.extname(s.src).slice(1) // no dot prefix
                    const fileName = path.basename(s.src, `.${ext}`)

                    accSimpleConfig.push({
                        selectedBy: s.selectedBy,
                        addclassnames: s.addclassnames,
                        input:{
                            ext,
                            fileName,
                            pathPrefix: s.sourcePrefix
                        },
                        output:{
                            width,
                            format: {[format]:opts},
                            hashlen: s.hashlen,
                            hash: exports.trimmedHash(s.hashlen)
                        },
                        // i: {data: any, render:(t:string, data:any)=>string}
                        // ƒ-render is (template:string, view:any) => string
                        getReadPath: i => !i
                            ? exports.localResolve(s.sourcePrefix,`${fileName}.${ext}`)
                            : i.render(path.resolve(s.sourcePrefix,s.src), i.data),
                        getWritePath: i => !i
                            ? exports.localResolve(s.destBasePath,`${s.prefix}${fileName}${s.suffix}`)
                            : i.render(path.resolve(s.destBasePath,`${s.prefix}${fileName}${s.suffix}`), i.data),
                        partOfSet
                    })
                })
            })
            return [...p, ...accSimpleConfig]
        },[])

        // prettyPrint(0, 'plugin:curate--', {srcs})
        vfile.srcs = isArray(vfile.srcs) ? [...vfile.srcs, ...srcs] : srcs

        // prettyPrint(1, 'plugin:curate--', {vfile})
        return vfile
        // next(null, tree, vfile)
    }
}

exports.default = exports.curate
