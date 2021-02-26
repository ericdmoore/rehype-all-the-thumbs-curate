// Type definitions for `hast-util-select` 4.0.1
// Project: https://github.com/syntax-tree/hast-util-select#readme
// Definitions by: ericdmoore <https://github.com/ericdmoore>
// TypeScript Version: 4.0
//

declare module 'hast-util-select'{
  import type {Node} from 'unist'
  export interface HastNode extends Node{
    properties: {[key:string]:any}
  }
  export function matches (selector:string, node:Node, space?: 'svg' |'html'): boolean
  export function select (selector:string, node:Node, space?: 'svg' |'html'): HastNode
  export function selectAll (selector:string, node:Node, space?: 'svg' |'html'): HastNode[]
}
