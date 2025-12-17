import { SmartTreeBuilder } from './builder/smart';
import { EnhancedTreeConfig, NodeContext, TreeBuilderConfig, TreePlugin } from './core/types';
export { buildMinimalTree } from './core/minimal';
export { buildEnhancedTree } from './core/enhanced';
export { validateMinimalTree } from './core/minimal';
export { SmartTreeBuilder } from './builder/smart';
export { PluginManager } from './plugins';
export { createCycleDetectionPlugin, createTopologicalDetector } from './plugins/cycle-detection';
export { createSortingPlugin, createMultiLevelSorting } from './plugins/sorting';
export type { TreeBuilderConfig, EnhancedTreeConfig, NodeContext, TreePlugin, BuildStats } from './core/types';
/**
 * 快捷函数：创建树形结构（自动选择策略）
 */
export declare function createTree<T = any>(list: T[], options?: TreeBuilderConfig<T>): any[];
/**
 * 创建高级树形构建器
 */
export declare function createAdvancedTree<T = any, R = T>(list: T[], options?: EnhancedTreeConfig<T>, formatCallback?: (node: T, context: NodeContext) => R): R[];
/**
 * 创建带插件的树形构建器
 */
export declare function createPluginTreeBuilder<T = any>(plugins?: TreePlugin<T>[], config?: TreeBuilderConfig<T>): SmartTreeBuilder<T>;
export declare const VERSION = "1.0.0";
export declare const AUTHOR = "Tree Formatter Library";
export declare const DESCRIPTION = "\u9AD8\u6027\u80FD\u3001\u6A21\u5757\u5316\u7684\u6811\u5F62\u7ED3\u6784\u6784\u5EFA\u5E93";
