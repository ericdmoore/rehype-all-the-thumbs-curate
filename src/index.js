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
 * @param {{[s:string]:Function}} paths - list of depth:1 property strings that 
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

const parseStringsAndSwapPath = (readPath, writePath)=>({[readPath]: (a,s)=>({...a, [writePath]:JSON5.parse(s)}) })
const noChangeJustSwapPath = (readPath, writePath)=>({[readPath]: (a,s)=>({...a, [writePath]:s}) })
const noChange = (spath)=>({[spath]: (a,s)=>({...a, [spath]:s})})
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
 * @description the attacher leaves the process alone. It only parses configs.
 * @param { PartialResizerConfig } [config] - Instructions for a Resizer Algorithm to understand the types of thumbnails desired.
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

/**
 * @typedef StringThunk
 * @type {Function}
 * @returns {string}
 */

/**
 *
 * @typedef PartialResizerConfig
 * @type {object}
 * @property {string} [select] - a CSS selector string for how to find the DOM nodes that have the data of interest.
 * @property {string} [sourcePrefix] -  the path string that provides the required folder context to load a src file from the fs
 * @property {string} [destBasePath] -  the path string that provides folder context for where to put the string 
 * @property {number[]} [widths] - breakpoints + 1 for larger than last break
 * @property {number[]} [breaks] - where are the image breakpoints - defined by max applicable 769, 1088, 1280
 * @property {FormatOptions} [types] - jpg:{} | webp:{} | heif:{}
 * @property {number} [hashlen] - default = 8;
 * @property {string} [classNames] -  mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 * @property {string} [prefix] - mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 * @property {string} [suffix] - mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 */

/**
 *
 * @typedef ResizerConfig
 * @type {object}
 * @property {string} sourcePrefix - the path string that provides the required folder context to load a src file from the fs
 * @property {string} destBasePath - the path string that provides folder context for where to put the string 
 * @property {number[]} widths - breakpoints + 1 for larger than last break
 * @property {number[]} breaks - where are the image breakpoints - defined by max applicable 769, 1088, 1280
 * @property {FormatOptions} types - jpg:{} | webp:{} | heif:{}
 * @property {number} hashlen - default = 8;
 * @property {string} classNames -  mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 * @property {string} prefix - mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
 * @property {string} suffix - mustache-style template string - opts:[classNames, width, ext, epochTime, imgHash]"
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