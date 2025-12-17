import { SmartTreeBuilder } from './builder/smart';
import { buildEnhancedTree } from './core/enhanced';
import { buildMinimalTree } from './core/minimal';
import { EnhancedTreeConfig, NodeContext, TreeBuilderConfig, TreePlugin } from './core/types';

// 导出核心功能
export { buildMinimalTree } from './core/minimal';
export { buildEnhancedTree } from './core/enhanced';
export { validateMinimalTree } from './core/minimal';

// 导出构建器
export { SmartTreeBuilder } from './builder/smart';

// 导出插件
export { PluginManager } from './plugins';
export { createCycleDetectionPlugin, createTopologicalDetector } from './plugins/cycle-detection';
export { createSortingPlugin, createMultiLevelSorting } from './plugins/sorting';

// 导出类型
export type {
  TreeBuilderConfig,
  EnhancedTreeConfig,
  NodeContext,
  TreePlugin,
  BuildStats
} from './core/types';

/**
 * 快捷函数：创建树形结构（自动选择策略）
 */
export function createTree<T = any>(
  list: T[],
  options: TreeBuilderConfig<T> = {}
): any[] {
  // 简单策略：根据数据量选择算法
  if (list.length < 1000) {
    return buildMinimalTree(list, options);
  }
  
  // 大数据量使用增强构建
  return buildEnhancedTree(list, options as any);
}

/**
 * 创建高级树形构建器
 */
export function createAdvancedTree<T = any, R = T>(
  list: T[],
  options: EnhancedTreeConfig<T> = {},
  formatCallback?: (node: T, context: NodeContext) => R
): R[] {
  return buildEnhancedTree(list, options, formatCallback);
}

/**
 * 创建带插件的树形构建器
 */
export function createPluginTreeBuilder<T = any>(
  plugins: TreePlugin<T>[] = [],
  config: TreeBuilderConfig<T> = {}
): SmartTreeBuilder<T> {
  const builder = new SmartTreeBuilder<T>(config);
  
  plugins.forEach(plugin => {
    builder.use(plugin);
  });
  
  return builder;
}

// 版本信息
export const VERSION = '1.0.0';
export const AUTHOR = 'Tree Formatter Library';
export const DESCRIPTION = '高性能、模块化的树形结构构建库';