import { TreeBuilderConfig } from './types';
/**
 * 最小化树形构建器（对标 row-to-tree）
 * 时间复杂度: O(n)，空间复杂度: O(n)
 */
export declare function buildMinimalTree<T = any>(list: T[], options?: TreeBuilderConfig<T>): any[];
/**
 * 验证最小树的有效性
 */
export declare function validateMinimalTree(tree: any[], config?: TreeBuilderConfig): boolean;
