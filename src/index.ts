/* eslint-disable no-use-before-define, camelcase */

/**
 * @title rehype-all-the-thumbs-curate
 * @author Eric Moore
 * @summary Select DOM nodes that have images availble for thumbnailing
 * @description Pluck out Images, and tag the file with instructions for
 * other thumbnailing plugins to use.
 * @see https://unifiedjs.com/explore/package/hast-util-select/#support
 *
 * # Inpput/Output
 *
 * ## Implied Input (Required):
 *
 *   + HTML file with a DOM tree (can be decorate with instructions)
 *
 * ## Input Config (Optional)
 *
 *   - css selctor string
 *   - instructions for thumbnailing images
 *
 * ## Config Preference
 *
 *   HTML > Options
 *
 * ## Output
 *
 * -an unchanged tree (aka: vfile.contents)
 */

import type { Node } from 'unist'
import type { VFile } from 'vfile'
import type { PngOptions, JpegOptions, WebpOptions } from 'sharp'
import path from 'path'
import { createHash } from 'crypto'
import { selectAll } from 'hast-util-select'
const { isArray } = Array

/**
 * Resolve
 * @summary Merge path segments together
 * @description Take in path segments,
 * intelligibly  merge them together to form one path.
 * @todo the up path
 */
export const localResolve = (...paths: string[]):string => {
    const withDotsButNoSlashes = paths.map((c, i, a) => {
        c = c.startsWith('/') ? c.slice(1) : c
        c = c.endsWith('/') ? c.slice(0, -1) : c
        return c
    })
    const noDotDotnoSlashes = withDotsButNoSlashes.reduce((p, c) => {
        if (c === '' || c === ' ') {
            return p
        }
        if (c.startsWith('..')) {
            return localResolve(...[...p.slice(0, -1), c.slice(2)]).split('/')
        } else {
            return [...p, c]
        }
    }, [] as string[])
    return noDotDotnoSlashes.join('/')
}

/**
 * Trimmed Hash
 * @private
 * @description Take in a Buffer and return a sting with length specified via N
 * @param n - length of the hash to return
 */
const trimmedHash = (n:number) => (b:Buffer) => ():string => createHash('sha256').update(b).digest('hex').slice(0, n)

/**
 * Merge
 * @private
 */
const merge = (paths: MapppedMergeStringOrObjValFunc, fallback:ConfigMap, obj:ConfigMap) =>
    Object.entries(paths)
        .reduce((acc, [prop, prepFn]) =>
            prop in obj
                ? prepFn(acc, obj[prop])
                : prop in fallback
                    ? { ...acc, [prop]: fallback[prop] }
                    : acc
        , {} as ConfigMap)

/**
 * Map Builder: Parse String And Swap Path
 * @private
 * @description A builder function returning a key to ƒ.transform map.
 * The 'look-up-key'º is mapped to a merge function.
 * The ƒ.merge returns a new merged object,
 * where the 'look-up-key'º is replaced with the writePath during merge, and the val is parsed
*/
const parseStringsAndSwapPath = (readPath:string, writePath:string) => ({ [readPath]: (a:ObjectOrStringDict, s:string) => ({ ...a, [writePath]: JSON.parse(s) }) })

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
const noChangeJustSwapPath = (readPath:string, writePath:string) => ({ [readPath]: (a:StringDict, s:string) => ({ ...a, [writePath]: s }) }) as MappedMergeFuncs

/**
 * Map Builder: Indetity
 * @private
 * @description A builder function returning a key to ƒ.transform map.
 * The look-up-key maps to a ƒ.merge.
 * The ƒ.merge (inputs: (accum obj, val)) returns a merged object where the 'look-up-key'º maps to the unchanged val
 */
const noChange = (spath:string) => ({ [spath]: (a:StringDict, s:string) => ({ ...a, [spath]: s }) }) as MappedMergeFuncs

/**
 * Map Builder: Parse The Val
 * @private
 * @description  A builder function returning a key to ƒ.transform map.
 * The returned object is merged into a configuration object used for merging objects.
 * The `lookup-key` maps to a ƒ.merge.
 */
const parseIfString = (spath:string) => ({
    [spath]: (a:ObjectOrStringDict, maybeS:string|object) =>
        typeof maybeS === 'string'
            ? { ...a, [spath]: JSON.parse(maybeS) } as ObjectOrStringDict
            : { ...a, [spath]: maybeS }
}) as MapppedMergeStringOrObjValFunc

const HASTpaths = {
    ...noChange('selectedBy'),
    ...noChangeJustSwapPath('dataSourceprefix', 'sourcePrefix'),
    ...noChangeJustSwapPath('dataDestbasepath', 'destBasePath'),
    ...noChangeJustSwapPath('dataPrefix', 'prefix'),
    ...noChangeJustSwapPath('dataSuffix', 'suffix'),
    ...parseStringsAndSwapPath('dataHashlen', 'hashlen'),
    ...parseStringsAndSwapPath('dataClean', 'clean'),
    ...parseStringsAndSwapPath('dataWidths', 'widths'),
    ...parseStringsAndSwapPath('dataBreaks', 'breaks'),
    ...({ dataAddclassnames: (a, sa) => ({ ...a, addclassnames: sa.split(' ') }) } as MappedMergeFuncs),
    ...({ dataTypes: (a, s) => ({ ...a, types: s.split(',').reduce((p, c) => ({ ...p, [c]: {} }), {}) }) } as Dict<FuncMergeString2Obj>)
} as MapppedMergeStringOrObjValFunc

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
    ...parseIfString('types')
} as MapppedMergeStringOrObjValFunc

const mergeNode = (fallback:ConfigMap, ob:{properties:ConfigMap}) => merge(HASTpaths, fallback as ConfigMap, ob.properties)
const mergeConfig = (fallback:ConfigMap, ob:ConfigMap = {}) => merge(NORMpaths, fallback as ConfigMap, ob)

/**
 * @exports rehype-all-the-thumbs-curate
 * @description the `rehype-all-the-thumbs-curate` plugin adds a transformer to the pipeline.
 * @param { InboundConfig } [config] - Instructions for a Resizer Algorithm to understand the types of thumbnails desired.
 */
export const attacher = (config?:InputConfig) => {
    const select = !config || !config.select
        ? 'picture[thumbnails="true"]>img'
        : typeof config.select === 'function'
            ? config.select()
            : config.select

    const defaults = {
        selectedBy: select,
        sourcePrefix: '/',
        destBasePath: '/',
        hashlen: 8,
        clean: true,
        types: ({ webp: {}, jpg: {} } as object), // where the empty object implies use the default for the format
        breaks: [640, 980, 1020],
        widths: [100, 250, 450, 600],
        addclassnames: ['all-thumbed'],
        prefix: 'optim/',
        suffix: '-{{width}}w-{{hash}}.{{ext}}'
    } as ConfigMap

    const cfg: Config = mergeConfig(defaults, config as unknown as ConfigMap) as unknown as Config

    // console.log({select})
    // console.log(0, {cfg})

    // transformer
    return (tree:Node, vfile:VFile, next:UnifiedPluginCallback) => {
    // console.log(1,  JSON.stringify({ vfile1: vfile }, null, 2))
    // console.log(2,  JSON.stringify({ cfg }, null, 2))

        const selected = selectAll(select, tree) as HastNode[]
        // console.log( JSON.stringify({ selected }, null, 2))

        const srcsCompact = selected
            .map(node => ({ node, src: (node as HastNode).properties.src }))
            .map(({ src, node }) => ({
                // makes a compact config
                ...mergeConfig(cfg as unknown as ConfigMap, mergeNode(cfg as unknown as ConfigMap, node as HastNode)),
                src
            }))

        // console.log('plugin:curate--', {srcsCompact})

        const srcs = srcsCompact.reduce((p, _s) => {
            const s = _s as unknown as Config
            const partOfSet = {
                breaks: s.breaks,
                types: s.types,
                widths: s.widths
            }

            const accSimpleConfig = [] as SimpleConfig[]
            Object.entries(s.types).forEach(([format, opts]) => {
                s.widths.forEach(width => {
                    const ext = path.extname(s.src).slice(1) // no dot prefix
                    const fileName = path.basename(s.src, `.${ext}`)

                    accSimpleConfig.push({
                        selectedBy: s.selectedBy,
                        addclassnames: s.addclassnames,
                        input: {
                            ext,
                            fileName,
                            pathPrefix: s.sourcePrefix
                        },
                        output: {
                            width,
                            format: { [format]: opts } as ImageFormat,
                            hashlen: s.hashlen,
                            hash: trimmedHash(s.hashlen)
                        },
                        getReadPath: (i?: IPathData) => !i
                            ? localResolve(s.sourcePrefix, `${fileName}.${ext}`)
                            : i.render(path.resolve(s.sourcePrefix, s.src), i.data),
                        getWritePath: (i?: IPathData) => !i
                            ? localResolve(s.destBasePath, `${s.prefix}${fileName}${s.suffix}`)
                            : i.render(path.resolve(s.destBasePath, `${s.prefix}${fileName}${s.suffix}`), i.data),
                        partOfSet
                    })
                })
            })
            return [...p, ...accSimpleConfig]
        }, [] as SimpleConfig[])

        // prettyPrint(0, 'plugin:curate--', {srcs})
        const vfile_srcs = isArray(vfile.srcs) ? [...vfile.srcs as SimpleConfig[], ...srcs] : srcs

        // prettyPrint(1, 'plugin:curate--', {vfile})
        vfile.srcs = vfile_srcs
        // return vfile
        next(null, tree, vfile)
    }
}

export default attacher

// #region QUICK TEST

// const vfile = require('vfile')
// const h = require('hastscript')
// const vf = new vfile({contents:'<html>', path:'/test.html'})
// const tree = h('.foo#some-id', [
//   h('span', 'some text'),
//   h('picture', {thumbnails:"true"}, [h('img', {src:'/image.jpg'} )]),
//   h('input', {type: 'text', value: 'foo'}),
//   h('a.alpha', {class: 'bravo charlie', download: 'download'}, [])
// ])
// const a = attacher()(tree, vf, ()=>{})

// #endregion QUICK TEST

// #region interfaces

export interface HastNode extends Node {
  properties: Dict<ConfigValueTypes>
}

export interface Config extends BaseConfig{
  selectedBy:string
  src: string
}

export type InputConfig = Partial<BaseConfig> & {
  select?: string | (()=>string)
}

interface IPathData{
  render: (template:string, view:any) => string
  data: any,
}

export interface SimpleConfig{
  selectedBy: string
  addclassnames: string[]
  getReadPath: (i?: {data:any, render:(template:string, view:any)=>string})=> string
  getWritePath: (i?: {data:any, render:(template:string, view:any)=>string})=> string
  output:{
    width: number
    hashlen: number
    format: ImageFormat
    hash: (b:Buffer) => () => string
  }
  input:{
    pathPrefix: string
    fileName: string
    ext: string
  }
  partOfSet:{
    widths: number[]
    breaks: number[]
    types: ImageFormat
  }
}

export type ImageFormat = {jpg: JpegOptions} | {webp: WebpOptions} | {png: PngOptions}
export type UnifiedPluginCallback = (err: Error | null | undefined, tree: Node, vfile: VFile) => void

interface BaseConfig{
  sourcePrefix: string
  destBasePath : string
  widths: number[]
  breaks: number[]
  types: ImageFormat
  hashlen:number
  addclassnames: string[]
  prefix: string
  suffix: string
}

interface Dict<T>{[key:string]:T}
type ConfigValueTypes = (boolean | null | string | string [] | number | number[])
type ConfigMap = Dict<ConfigValueTypes>
type FuncMergeStringVal = (a:ConfigMap, s:string) => ConfigMap
type FuncMergeStrOrObjVal = (a:ConfigMap, s:ConfigValueTypes) => ConfigMap

type StringDict = Dict<string>
type ObjectOrStringDict = Dict<string | object >

type FuncMergeString2Obj = (a:StringDict, s:string) => ObjectOrStringDict
type MappedMergeFuncs = Dict<FuncMergeStringVal>
type MapppedMergeStringOrObjValFunc = Dict<FuncMergeStrOrObjVal>

// #endregion interfaces
