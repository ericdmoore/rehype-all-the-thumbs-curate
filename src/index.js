/* eslint-disable no-use-before-define, camelcase */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
    exports.attacher = exports.localResolve = void 0;
    var path_1 = __importDefault(require("path"));
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
    var localResolve = function () {
        var paths = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            paths[_i] = arguments[_i];
        }
        var withDotsButNoSlashes = paths.map(function (c, i, a) {
            c = c.startsWith('/') ? c.slice(1) : c;
            c = c.endsWith('/') ? c.slice(0, -1) : c;
            return c;
        });
        var noDotDotnoSlashes = withDotsButNoSlashes.reduce(function (p, c) {
            if (c === '' || c === ' ') {
                return p;
            }
            if (c.startsWith('..')) {
                return exports.localResolve.apply(void 0, __spreadArray(__spreadArray([], p.slice(0, -1)), [c.slice(2)])).split('/');
            }
            else {
                return __spreadArray(__spreadArray([], p), [c]);
            }
        }, []);
        return noDotDotnoSlashes.join('/');
    };
    exports.localResolve = localResolve;
    /**
     * Trimmed Hash
     * @private
     * @description Take in a Buffer and return a sting with length specified via N
     * @param n - length of the hash to return
     */
    var trimmedHash = function (n) { return function (b) { return function () { return crypto_1.createHash('sha256').update(b).digest('hex').slice(0, n); }; }; };
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
                var _a, _b;
                return typeof maybeS === 'string'
                    ? __assign(__assign({}, a), (_a = {}, _a[spath] = JSON.parse(maybeS), _a))
                    : __assign(__assign({}, a), (_b = {}, _b[spath] = maybeS, _b));
            },
            _a);
    };
    var HASTpaths = __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, noChange('selectedBy')), noChangeJustSwapPath('dataSourceprefix', 'sourcePrefix')), noChangeJustSwapPath('dataDestbasepath', 'destBasePath')), noChangeJustSwapPath('dataPrefix', 'prefix')), noChangeJustSwapPath('dataSuffix', 'suffix')), parseStringsAndSwapPath('dataHashlen', 'hashlen')), parseStringsAndSwapPath('dataClean', 'clean')), parseStringsAndSwapPath('dataWidths', 'widths')), parseStringsAndSwapPath('dataBreaks', 'breaks')), { dataAddclassnames: function (a, sa) { return (__assign(__assign({}, a), { addclassnames: sa.split(' ') })); } }), { dataTypes: function (a, s) { return (__assign(__assign({}, a), { types: s.split(',').reduce(function (p, c) {
                var _a;
                return (__assign(__assign({}, p), (_a = {}, _a[c] = {}, _a)));
            }, {}) })); } });
    var NORMpaths = __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, noChange('selectedBy')), noChange('sourcePrefix')), noChange('destBasePath')), noChange('prefix')), noChange('suffix')), noChange('hashlen')), noChange('clean')), noChange('addclassnames')), parseIfString('widths')), parseIfString('breaks')), parseIfString('types'));
    /**
     *
     * @param fallback - ConfigMap
     * @param ob - object with a `properties` key with a ConfigMap type
     */
    var mergeNode = function (fallback, ob) { return merge(HASTpaths, fallback, ob.properties); };
    /**
     *
     * @param fallback - a config map
     * @param ob - also a config map
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
            prefix: 'optim/',
            suffix: '-{{width}}w-{{hash}}.{{ext}}'
        };
        var cfg = mergeConfig(defaults, config);
        // console.log({select})
        // console.log(0, {cfg})
        // transformer
        return function (tree, vfile, next) {
            // console.log(1,  JSON.stringify({ vfile1: vfile }, null, 2))
            // console.log(2,  JSON.stringify({ cfg }, null, 2))
            var selected = hast_util_select_1.selectAll(select, tree);
            // console.log( JSON.stringify({ selected }, null, 2))
            var srcsCompact = selected
                .map(function (node) { return ({ node: node, src: node.properties.src }); })
                .map(function (_a) {
                var src = _a.src, node = _a.node;
                return (__assign({ 
                    // makes a compact config
                    src: src }, mergeConfig(cfg, mergeNode(cfg, node))));
            });
            // console.log('plugin:curate--', {srcsCompact})
            var srcs = srcsCompact.reduce(function (p, _s) {
                var s = _s;
                var partOfSet = {
                    breaks: s.breaks,
                    types: s.types,
                    widths: s.widths
                };
                var accSimpleConfig = [];
                Object.entries(s.types).forEach(function (_a) {
                    var format = _a[0], opts = _a[1];
                    s.widths.forEach(function (width) {
                        var _a;
                        var ext = path_1.default.extname(s.src).slice(1); // no dot prefix
                        var fileName = path_1.default.basename(s.src, "." + ext);
                        accSimpleConfig.push({
                            selectedBy: s.selectedBy,
                            addclassnames: s.addclassnames,
                            input: {
                                ext: ext,
                                fileName: fileName,
                                pathPrefix: s.sourcePrefix
                            },
                            output: {
                                width: width,
                                format: (_a = {}, _a[format] = opts, _a),
                                hashlen: s.hashlen,
                                hash: trimmedHash(s.hashlen)
                            },
                            getReadPath: function (i) { return !i
                                ? exports.localResolve(s.sourcePrefix, fileName + "." + ext)
                                : i.render(path_1.default.resolve(s.sourcePrefix, s.src), i.data); },
                            getWritePath: function (i) { return !i
                                ? exports.localResolve(s.destBasePath, "" + s.prefix + fileName + s.suffix)
                                : i.render(path_1.default.resolve(s.destBasePath, "" + s.prefix + fileName + s.suffix), i.data); },
                            partOfSet: partOfSet
                        });
                    });
                });
                return __spreadArray(__spreadArray([], p), accSimpleConfig);
            }, []);
            // prettyPrint(0, 'plugin:curate--', {srcs})
            var vfile_srcs = isArray(vfile.srcs) ? __spreadArray(__spreadArray([], vfile.srcs), srcs) : srcs;
            // prettyPrint(1, 'plugin:curate--', {vfile})
            vfile.srcs = vfile_srcs;
            // return vfile
            next(null, tree, vfile);
        };
    };
    exports.attacher = attacher;
    exports.default = exports.attacher;
});
// #endregion interfaces
