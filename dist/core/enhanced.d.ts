import { EnhancedTreeConfig, NodeContext } from './types';
/**
 * 增强树形构建器
 * 支持循环引用检测、节点排序、格式化等高级功能
 */
export declare function buildEnhancedTree<T = any, R = T>(list: T[], options?: EnhancedTreeConfig<T>, formatCallback?: (node: T, context: NodeContext) => R): R[];
