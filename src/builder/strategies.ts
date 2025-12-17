import { TreeBuilderConfig } from '../core/types';
import { buildMinimalTree } from '../core/minimal';
import { buildEnhancedTree } from '../core/enhanced';

/**
 * 构建策略接口
 */
export interface TreeBuilderStrategy<T = any> {
  name: string;
  description: string;
  build(list: T[], config: TreeBuilderConfig<T>): any[];
}

/**
 * 最小化构建策略
 */
export class MinimalStrategy<T = any> implements TreeBuilderStrategy<T> {
  readonly name = 'minimal';
  readonly description = '最小化构建策略（对标 row-to-tree）';
  
  build(list: T[], config: TreeBuilderConfig<T>): any[] {
    return buildMinimalTree(list, config);
  }
}

/**
 * 增强构建策略
 */
export class EnhancedStrategy<T = any> implements TreeBuilderStrategy<T> {
  readonly name = 'enhanced';
  readonly description = '增强构建策略（支持循环检测、排序等）';
  
  build(list: T[], config: TreeBuilderConfig<T>): any[] {
    return buildEnhancedTree(list, config as any);
  }
}

/**
 * 递归构建策略
 */
export class RecursiveStrategy<T = any> implements TreeBuilderStrategy<T> {
  readonly name = 'recursive';
  readonly description = '递归构建策略（适合深度嵌套）';
  
  build(list: T[], config: TreeBuilderConfig<T>): any[] {
    const idKey = config.idKey || 'id';
    const parentKey = config.parentKey || 'parentId';
    const childrenKey = config.childrenKey || 'children';
    const rootParentId = config.rootParentId ?? 0;
    
    const nodeMap = new Map<string | number, any>();
    const roots: any[] = [];
    
    // 创建所有节点
    list.forEach(item => {
      const id = (item as any)[idKey];
      if (id !== undefined && id !== null) {
        nodeMap.set(id, {
          ...item,
          [childrenKey]: []
        });
      }
    });
    
    // 递归构建
    const buildTree = (parentId: string | number | null = rootParentId): any[] => {
      const children: any[] = [];
      
      list.forEach(item => {
        const id = (item as any)[idKey];
        const itemParentId = (item as any)[parentKey];
        
        if (itemParentId === parentId) {
          const node = nodeMap.get(id);
          if (node) {
            const childNodes = buildTree(id);
            node[childrenKey] = childNodes;
            children.push(node);
          }
        }
      });
      
      return children;
    };
    
    return buildTree();
  }
}

/**
 * 策略工厂
 */
export class StrategyFactory {
  /**
   * 根据数据特征选择构建策略
   */
  static selectStrategy<T>(
    list: T[],
    config: TreeBuilderConfig<T> = {}
  ): TreeBuilderStrategy<T> {
    const dataSize = list.length;
    const needsAdvanced = config.enableGhostNodes || 
                         (config as any).detectCycles ||
                         (config as any).sortChildren;
    
    // 小数据量使用最小策略
    if (dataSize < 1000 && !needsAdvanced) {
      return new MinimalStrategy<T>();
    }
    
    // 需要高级功能或大数据量使用增强策略
    if (dataSize >= 1000 || needsAdvanced) {
      return new EnhancedStrategy<T>();
    }
    
    // 默认使用最小策略
    return new MinimalStrategy<T>();
  }
  
  /**
   * 获取所有可用策略
   */
  static getAllStrategies<T>(): TreeBuilderStrategy<T>[] {
    return [
      new MinimalStrategy<T>(),
      new EnhancedStrategy<T>(),
      new RecursiveStrategy<T>()
    ];
  }
}