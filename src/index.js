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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path", "crypto", "hast-util-select"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.attacher = exports.pathJoin = void 0;
    var path_1 = require("path"); // no dot prefix
    var crypto_1 = require("crypto");
    var hast_util_select_1 = require("hast-util-select");
    var isArray = Array.isArray;
    /**
     * Resolve
     * @summary Merge path segments together
     * @description Take in path segments,
     * intelligibly  merge them together to form one path.
     * @todo the up path
     */
    var pathJoin = function () {
        var paths = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            paths[_i] = arguments[_i];
        }
        var pathsNoSlashes = paths.map(function (c, i, a) {
            c = c.startsWith('./') ? c.slice(2) : c;
            c = c.startsWith('/') ? c.slice(1) : c;
            c = c.endsWith('/') ? c.slice(0, -1) : c;
            return c;
        });
        return pathsNoSlashes.reduce(function (p, c) {
            if (c === '' || c === ' ') {
                return p;
            }
            return c.startsWith('..')
                ? exports.pathJoin.apply(void 0, __spreadArray(__spreadArray([], p.slice(0, -1)), [c.slice(2)])).split('/')
                : __spreadArray(__spreadArray([], p), [c]);
        }, []).join('/');
    };
    exports.pathJoin = pathJoin;
    /**
     * Trimmed Hash
     * @private
     * @description Take in a Buffer and return a sting with length specified via N
     * @param n - length of the hash to return
     */
    var trimmedHash = function (n) { return function (b) { return crypto_1.createHash('sha256').update(b).digest('hex').slice(0, n); }; };
    /**
      * Merge
      * @private
      */
    var merge = function (paths, fallback, obj) {
        return Object.entries(paths)
            .reduce(function (acc, _a) {
            var _b;
            var prop = _a[0], prepFn = _a[1];
            return prop in obj
                ? prepFn(acc, obj[prop])
                : prop in fallback
                    ? __assign(__assign({}, acc), (_b = {}, _b[prop] = fallback[prop], _b)) : acc;
        }, {});
    };
    /**
     * Map Builder: Parse String And Swap Path
     * @private
     * @description A builder function returning a key to ƒ.transform map.
     * The 'look-up-key'º is mapped to a merge function.
     * The ƒ.merge returns a new merged object,
     * where the 'look-up-key'º is replaced with the writePath during merge, and the val is parsed
    */
    var parseStringsAndSwapPath = function (readPath, writePath) {
        var _a;
        return (_a = {}, _a[readPath] = function (a, s) {
            var _a;
            return (__assign(__assign({}, a), (_a = {}, _a[writePath] = JSON.parse(s), _a)));
        }, _a);
    };
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
    var noChangeJustSwapPath = function (readPath, writePath) {
        var _a;
        return (_a = {}, _a[readPath] = function (a, s) {
            var _a;
            return (__assign(__assign({}, a), (_a = {}, _a[writePath] = s, _a)));
        }, _a);
    };
    /**
     * Map Builder: Indetity
     * @private
     * @description A builder function returning a key to ƒ.transform map.
     * The look-up-key maps to a ƒ.merge.
     * The ƒ.merge (inputs: (accum obj, val)) returns a merged object where the 'look-up-key'º maps to the unchanged val
     */
    var noChange = function (spath) {
        var _a;
        return (_a = {}, _a[spath] = function (a, s) {
            var _a;
            return (__assign(__assign({}, a), (_a = {}, _a[spath] = s, _a)));
        }, _a);
    };
    /**
     * Map Builder: Parse The Val
     * @private
     * @description  A builder function returning a key to ƒ.transform map.
     * The returned object is merged into a configuration object used for merging objects.
     * The `lookup-key` maps to a ƒ.merge.
     */
    var parseIfString = function (spath) {
        var _a;
        return (_a = {},
            _a[spath] = function (a, maybeS) {
                var _a;
                // typeof maybeS === 'string'
                //   ? { ...a, [spath]: JSON.parse(maybeS) } as ObjectOrStringDict
                //   :
                return (__assign(__assign({}, a), (_a = {}, _a[spath] = maybeS, _a)));
            },
            _a);
    };
    var HASTpaths = __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, noChange('selectedBy')), noChangeJustSwapPath('dataSourceprefix', 'sourcePrefix')), noChangeJustSwapPath('dataDestbasepath', 'destBasePath')), noChangeJustSwapPath('dataPathTmpl', 'pathTmpl')), parseStringsAndSwapPath('dataHashlen', 'hashlen')), parseStringsAndSwapPath('dataClean', 'clean')), parseStringsAndSwapPath('dataWidths', 'widths')), parseStringsAndSwapPath('dataWidthratio', 'widthratio')), parseStringsAndSwapPath('dataBreaks', 'breaks')), { dataAddclassnames: function (a, sa) { return (__assign(__assign({}, a), { addclassnames: sa.split(' ') })); } }), { dataTypes: function (a, s) { return (__assign(__assign({}, a), { types: s.split(',').reduce(function (p, c) {
                var _a;
                return (__assign(__assign({}, p), (_a = {}, _a[c] = {}, _a)));
            }, {}) })); } });
    var NORMpaths = __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, noChange('selectedBy')), noChange('sourcePrefix')), noChange('destBasePath')), noChange('filepathPrefix')), noChange('pathTmpl')), noChange('hashlen')), noChange('clean')), noChange('addclassnames')), parseIfString('widths')), parseIfString('widthatio')), parseIfString('breaks')), parseIfString('types'));
    /**
     * @private
     * @param fallback - ConfigMap
     * @param ob - object with a `properties` key with a ConfigMap type
     * @description Config sometimes has a data property prefixed in the Dict if its from the DOM
     */
    var mergeNode = function (fallback, ob) { return merge(HASTpaths, fallback, ob.properties); };
    /**
     * @private
     * @param fallback - a config map
     * @param ob - also a config map
     * @description merge the config objects via the paths, target and fallback
     */
    var mergeConfig = function (fallback, ob) {
        if (ob === void 0) { ob = {}; }
        return merge(NORMpaths, fallback, ob);
    };
    /**
     * @exports rehype-all-the-thumbs-curate
     * @description the `rehype-all-the-thumbs-curate` plugin adds a transformer to the pipeline.
     * @param { InboundConfig } [config] - Instructions for a Resizer Algorithm to understand the types of thumbnails desired.
     */
    var attacher = function (config) {
        var select = !config || !config.select
            ? 'picture[thumbnails="true"]>img'
            : typeof config.select === 'function'
                ? config.select()
                : config.select;
        var defaults = {
            selectedBy: select,
            sourcePrefix: '/',
            destBasePath: '/',
            hashlen: 8,
            clean: true,
            types: { webp: {}, jpg: {} },
            breaks: [640, 980, 1020],
            widths: [100, 250, 450, 600],
            addclassnames: ['all-thumbed'],
            widthratio: 1.7778,
            pathTmpl: '/optim/{{filename}}-{{width}}w-{{hash}}.{{ext}}'
        };
        var cfg = mergeConfig(defaults, config);
        // transformer
        return function (tree, vfile, next) {
            var selected = hast_util_select_1.selectAll(select, tree);
            var srcsCompact = selected
                .map(function (node) { return ({ node: node, src: node.properties.src }); })
                .map(function (_a) {
                var src = _a.src, node = _a.node;
                return (__assign({ 
                    // makes a compact config
                    src: src }, mergeConfig(cfg, mergeNode(cfg, node) // node config goes 2nd to overrite if needed
                )));
            });
            // console.log('A.', 'srcsCompact', { srcsCompact })
            var srcs = srcsCompact.reduce(function (p, _s) {
                var s = _s;
                var partOfSet = {
                    breaks: s.breaks,
                    types: s.types,
                    widths: s.widths
                };
                Object.entries(s.types).forEach(function (_a) {
                    var format = _a[0], opts = _a[1];
                    s.widths.forEach(function (width) {
                        var _a;
                        var _b, _c;
                        var ext = path_1.extname(s.src).slice(1); // no dot prefix
                        ext = ext === '' ? 'Buffer' : ext;
                        // if we can't  match up src to a set of generatyed pics via postiion
                        // then perhaps we could set an ID of the src
                        s.data = __assign(__assign({}, s.data), { _id: s.src });
                        p.push({
                            selectedBy: s.selectedBy,
                            addclassnames: s.addclassnames,
                            input: {
                                ext: ext,
                                fileName: path_1.basename(s.src, "." + ext),
                                filepathPrefix: path_1.dirname(s.src),
                                rawFilePath: s.src
                                // domPath: ''
                            },
                            output: __assign({ width: width, format: (_a = {}, _a[format] = opts, _a), pathTmpl: (_c = (_b = s.pathTmpl) !== null && _b !== void 0 ? _b : cfg.pathTmpl) !== null && _c !== void 0 ? _c : defaults.pathTmpl, hash: trimmedHash(s.hashlen) }, ((s === null || s === void 0 ? void 0 : s.widthRatio) ? { widthRatio: s.widthRatio } : {})),
                            partOfSet: partOfSet
                        });
                    });
                });
                return p;
            }, []);
            // console.log('B.', 'srcs', { srcs })
            var vfile_srcs = isArray(vfile.srcs) ? __spreadArray(__spreadArray([], vfile.srcs), srcs) : srcs;
            // console.log('C.', 'vfile_srcs', { vfile_srcs })
            vfile.srcs = vfile_srcs;
            // return vfile
            next(null, tree, vfile);
        };
    };
    exports.attacher = attacher;
    exports.default = exports.attacher;
});
// #endregion interfaces
