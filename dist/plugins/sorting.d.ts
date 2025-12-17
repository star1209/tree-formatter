import { TreePlugin } from '../core/types';
/**
 * 树节点排序插件
 */
export declare function createSortingPlugin(sortFn: (a: any, b: any) => number, options?: {
    /** 排序范围：'all' | 'root' | 'children'，默认 'all' */
    scope?: 'all' | 'root' | 'children';
    /** 是否递归排序子节点，默认 true */
    recursive?: boolean;
    /** 排序时机：'during' | 'after'，默认 'after' */
    timing?: 'during' | 'after';
}): TreePlugin;
/**
 * 创建多级排序插件
 */
export declare function createMultiLevelSorting(sortRules: Array<{
    key: string;
    order: 'asc' | 'desc';
    type?: 'string' | 'number' | 'date';
}>): TreePlugin;
