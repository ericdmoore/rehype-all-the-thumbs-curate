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

const { selectAll } = require('hast-util-select')
const JSON5 = require('json5')

/**
 * Merge
 * @private
 * @param {Object.<string, Function>} paths - list of depth:1 property strings that 
 * @param {object} fallback - a fallback back object that has the property (hopefully)
 * @param {object} obj - the target object that might have the path of interest
 * @return {object}
 */
const merge = (paths, fallback, obj) =>
    Object.entries(paths)
        .reduce((p,[prop, prepFn])=>
            prop in obj 
                ? prepFn(p, obj[prop])
                : prop in fallback 
                    ? {...p, [prop]: fallback[prop]}
                    : p
        ,{})


/** 
 * Map Builder: Parse String And Swap Path
 * @private
 * @description A builder function returning a key to ƒ.transform map.
 * The 'look-up-key'º is mapped to a merge function.
 * The ƒ.merge returns a new merged object, 
 * where the 'look-up-key'º is replaced with the writePath during merge, and the val is parsed
 * @param {string} readPath - keys to look for in an object
 * @param {string} writePath - if you find the key, run the function on the whole object + the value,
 * and add this reaplcer key into the closure that generates the new result.
 * @returns {Object.<string, mergeFunc_ValToObj>}
*/
const parseStringsAndSwapPath = (readPath, writePath)=>({ [readPath]: (a,s)=>({...a, [writePath]:JSON5.parse(s)}) })

/**
 * Map Builder: Swap Path
 * @private
 * @description A builder function returning a key to ƒ.transform map.
 * The 'look-up-key'º (aka: readPath) is mapped to a merge function.
 * The ƒ.merge function is given an accumulating merge object, and a value from one of 2 target objects depending on if its found.
 * The ƒ.merge returns a merged object, and all it does it replce the look-up-keyº with the writePath
 * and the val stays unchanged.
 * @param {string} readPath - keys to look for in an object
 * @param {string} writePath - if the key is found, the merge fucntion replaces
 * the lookup-key with a writePath key which is baked into the
 * @returns {Object.<string, mergeFunc_stringVal>}
 * @example
 * const mergeMeIn = noChange('lookForThis', 'butEventuallyMakeItThis')
 * console.log(mergeMeIn) // { lookForThis: (all, val) => ({...all, butEventuallyMakeItThis: val}) }
 */
const noChangeJustSwapPath = (readPath, writePath)=>({ [readPath]: (a,s)=>({...a, [writePath]:s}) })

/**
 * Map Builder: Indetity
 * @private
 * @description A builder function returning a key to ƒ.transform map.
 * The look-up-key maps to a ƒ.merge.
 * The ƒ.merge (inputs: (accum obj, val)) returns a merged object where the 'look-up-key'º maps to the unchanged val
 * @param {string} spath - look-up-key string path
 * @returns {Object.<string, mergeFunc_stringVal>}
 * @example
 * const mergeMeIn = noChange('findTheKey')
 * console.log(mergeMeIn) // { findTheKey: (all, val) => ({...all, findTheKey: val}) }
 */
const noChange = spath => ({ [spath]: (a,s)=>({...a, [spath]:s}) })

/**
 * Map Builder: Parse The Val
 * @private
 * @description  A builder function returning a key to ƒ.transform map.
 * The returned object is merged into a configuration object used for merging objects.
 * The `lookup-key` maps to a ƒ.merge.
 * @param {string} spath - string path
 * @returns {Object.<strng, mergeFunc_ValToObj>}
 */
const parseIfString = (spath)=>({[spath]: (a,maybeS) => typeof maybeS ==='string' ? {...a, [spath]:JSON5.parse(maybeS)} : {...a, [spath]:maybeS }})

const HASTpaths = {
    ...noChange('selectedBy'),
    ...noChangeJustSwapPath('dataSourceprefix','sourcePrefix'),
    ...noChangeJustSwapPath('dataDestbasepath','destBasePath'),
    ...noChangeJustSwapPath('dataPrefix','prefix'),
    ...noChangeJustSwapPath('dataSuffix','suffix'),
    ...parseStringsAndSwapPath('dataHashlen','hashlen'),
    ...parseStringsAndSwapPath('dataClean','clean'),
    ...parseStringsAndSwapPath('dataWidths','widths'),
    ...parseStringsAndSwapPath('dataBreaks','breaks'),
    dataAddclassnames: (a,sa)=>({...a, addclassnames: sa.split(' ')}),
    dataTypes: (a,s)=>({...a, types: s.split(',').reduce((p,c)=>({...p,[c]:{}}),{}) })
}
const NORMpaths = {
    ...noChange('selectedBy'),
    ...noChange('sourcePrefix'),
    ...noChange('destBasePath'),
    ...noChange('prefix'),
    ...noChange('suffix'),
    ...noChange('hashlen'),
    ...noChange('clean'),
    ...noChange('addclassnames'),
    ...parseIfString('widths'),
    ...parseIfString('breaks'),
    ...parseIfString('types'),
}

const mergeNode =  (fallback, ob) => merge(HASTpaths, fallback, ob.properties)
const mergeConfig = (fallback, ob = {}) => merge(NORMpaths, fallback, ob)

/**
 * @exports rehype-all-the-thumbs-curate
 * @description the `rehype-all-the-thumbs-curate` plugin adds a transformer to the pipeline.
 * @param { InboundConfig } [config] - Instructions for a Resizer Algorithm to understand the types of thumbnails desired.
 */
const attacher = (config)=>{
    const select = !config || !config.select 
        ? 'picture[thumbnails="true"]>img' 
        : typeof config.select ==='function' 
            ? config.select() 
            : config.select

    const defaults = {
        selectedBy: select,
        sourcePrefix:'',
        destBasePath:'',
        hashlen: 8,
        clean: true,
        types: {webp:{}, jpg:{}}, // where the empty object implies use the default for the format
        breaks: [640, 980, 1020],
        widths: [100, 250, 450, 600],
        addclassnames: ['all-thumbed'],
        prefix: 'optim/',
        suffix: '-{{width}}w-{{hash}}.{{ext}}' 
    }
    // fallback to inlined defaults
    /** @const ResizerConfig */
    const cfg = mergeConfig(defaults, config)
    
    // console.log({select})
    // console.log(0, {cfg})

    // transformer
    return (tree, vfile, next)=>{
        // console.log(1,  JSON.stringify({ vfile1: vfile }, null, 2))
        // console.log(2,  JSON.stringify({ cfg }, null, 2))
        
        const selected = selectAll(select, tree)
        // console.log( JSON.stringify({ selected }, null, 2))
        
        const srcs = selected
            .map(node => ({ node, src: node.properties.src }))
            .map(({ src, node }) => ({ 
                ...mergeConfig(cfg, mergeNode(cfg, node)), 
                src
            })
            )
        // console.log(3, JSON.stringify({ srcs }, null, 2))
        vfile.srcs = srcs
        next(null, tree, vfile)
    }
}

exports = attacher
module.exports = attacher

// #region interfaces

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

/**
 * @typedef mergeFunc_ValToObj
 * @type {Function}
 * @param {object} all - the whole object that is being merged into 
 * @param {string} val - the value to parsed and turned into a js object
 * @returns {Object.<string,object>}
 */

/**
 * @typedef mergeFunc_stringVal
 * @type {Function}
 * @param {object} all - the whole object that is being merged into 
 * @param {string} val - the value to parsed and turned into a js object
 * @returns {Object.<string,string>}
 */


// #endregion interfaces