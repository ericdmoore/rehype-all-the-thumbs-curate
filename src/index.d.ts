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
/// <reference types="node" />
/**
 * @todo rewrite with no "string path getting"
 * Config For what to do with a node will come from:
 * - Selection String = DOM Node > plugin config > package.json > code default
 *    - defaults for:
 *      - DOM Node Lo
 * c: `html .rehype-thumbs-curate-select`
 *      - select str: 'picture[thumbnails="true"]>img'
 * - Config Values = DOM Node > plugin config > package.json > code default
 * -
 */
import type { Node } from 'unist';
import type { VFile } from 'vfile';
import type { PngOptions, JpegOptions, WebpOptions } from 'sharp';
/**
 * Resolve
 * @summary Merge path segments together
 * @description Take in path segments,
 * intelligibly  merge them together to form one path.
 * @todo the up path
 */
export declare const pathJoin: (...paths: string[]) => string;
/**
 * @exports rehype-all-the-thumbs-curate
 * @description the `rehype-all-the-thumbs-curate` plugin adds a transformer to the pipeline.
 * @param { InboundConfig } [config] - Instructions for a Resizer Algorithm to understand the types of thumbnails desired.
 */
export declare const attacher: (config?: InputConfig | undefined) => (tree: Node, vfile: VFile, next: UnifiedPluginCallback) => void;
export default attacher;
export interface HastNode extends Node {
    properties: Dict<ConfigValueTypes>;
}
export interface Config extends BaseConfig {
    selectedBy: string;
    src: string;
}
export declare type InputConfig = Partial<BaseConfig> & {
    select?: string | (() => string);
};
export interface SimpleConfig {
    selectedBy: string;
    addclassnames: string[];
    input: {
        filepathPrefix: string;
        fileName: string;
        ext: string;
        rawFilePath: string;
    };
    output: {
        width: number;
        format: ImageFormat;
        hash: (b: Buffer) => string;
        pathTmpl: string;
        widthratio?: number;
    };
    partOfSet: {
        widths: number[];
        breaks: number[];
        types: ImageFormat;
    };
}
export declare type ImageFormat = {
    jpg: JpegOptions;
} | {
    webp: WebpOptions;
} | {
    png: PngOptions;
};
export declare type UnifiedPluginCallback = (err: Error | null | undefined, tree: Node, vfile: VFile) => void;
interface BaseConfig {
    widths: number[];
    breaks: number[];
    types: ImageFormat;
    hashlen: number;
    addclassnames: string[];
    widthRatio?: number;
    pathTmpl?: string;
}
interface Dict<T> {
    [key: string]: T;
}
declare type ConfigValueTypes = (boolean | null | string | string[] | number | number[]);
