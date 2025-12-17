import { TreeBuilderConfig, TreePlugin, BuildStats } from '../core/types';
import { buildMinimalTree } from '../core/minimal';
import { buildEnhancedTree } from '../core/enhanced';

/**
 * 智能树形构建器
 * 根据数据特征自动选择最优构建策略
 */
export class SmartTreeBuilder<T = any> {
  private plugins: TreePlugin<T>[] = [];
  private config: TreeBuilderConfig<T>;
  private cache = new Map<string, any>();
  private stats: BuildStats[] = [];

  constructor(config: TreeBuilderConfig<T> = {}) {
    this.config = {
      idKey: 'id',
      parentKey: 'parentId',
      childrenKey: 'children',
      rootParentId: 0,
      enableGhostNodes: false,
      validateNodes: true,
      maxDepth: 1000,
      enableCache: false,
      ...config
    };
  }

  /**
   * 注册插件
   */
  use(plugin: TreePlugin<T>): this {
    this.plugins.push(plugin);
    // 按优先级排序
    this.plugins.sort((a, b) => (a.priority || 100) - (b.priority || 100));
    return this;
  }

  /**
   * 构建树形结构
   */
  build(list: T[]): any[] {
    // 处理空输入
    if (!list) {
      return [];
    }
    const startTime = performance.now();
    
    // 生成缓存键
    const cacheKey = this.generateCacheKey(list);
    
    // 检查缓存
    if (this.config.enableCache && this.cache.has(cacheKey)) {
      console.log('使用缓存结果');
      const cached = this.cache.get(cacheKey);
  
      // 为缓存命中记录统计信息
      const cacheStats: BuildStats = {
        totalNodes: list.length,
        rootNodes: cached?.length || 0,
        maxDepth: this.calculateMaxDepth(cached || []),
        buildTime: 0, // 缓存命中，构建时间为0
        memoryUsed: 0,
        cyclesDetected: 0,
        ghostNodesCreated: 0,
        cacheHit: true // 添加缓存命中标记
      };
      
      this.stats.push(cacheStats);
      return cached;
    }

    // 选择构建策略
    const strategy = this.selectStrategy(list);
    console.log(`选择构建策略: ${strategy.name}`);
    
    let tree: any[];
    
    // 应用前置插件
    const beforeResult = this.applyBeforeBuild(list);
    const processedList = beforeResult ? beforeResult : list;
    
    // 执行构建
    switch (strategy.name) {
      case 'minimal':
        tree = buildMinimalTree(processedList, this.config);
        break;
      case 'enhanced':
        tree = buildEnhancedTree(processedList, this.config as any);
        break;
      case 'incremental':
        tree = this.buildIncremental(processedList);
        break;
      default:
        tree = buildMinimalTree(processedList, this.config);
    }
    
    // 应用后置插件
    tree = this.applyAfterBuild(tree, list);
    
    // 更新统计信息
    const endTime = performance.now();
    const buildStats: BuildStats = {
      totalNodes: list.length,
      rootNodes: tree.length,
      maxDepth: this.calculateMaxDepth(tree),
      buildTime: endTime - startTime,
      memoryUsed: this.getMemoryUsage(),
      cyclesDetected: 0,
      ghostNodesCreated: 0
    };
    
    this.stats.push(buildStats);
    
    // 缓存结果
    if (this.config.enableCache) {
      this.cache.set(cacheKey, tree);
    }
    
    // 添加统计信息
    (tree as any).__stats = buildStats;
    
    return tree;
  }

  /**
   * 获取构建统计信息
   */
  getStats(): BuildStats[] {
    return this.stats;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 重置构建器状态
   */
  reset(): void {
    this.plugins = [];
    this.cache.clear();
    this.stats = [];
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(list: T[]): string {
    const configStr = JSON.stringify(this.config);
  
    // 处理 null 或 undefined 的情况
    if (!list) {
      return `${configStr}:null:0`;
    }
    
    const listStr = JSON.stringify(list.slice(0, Math.min(10, list.length)));
    return `${configStr}:${listStr}:${list.length}`;
  }

  /**
   * 根据数据特征选择构建策略
   */
  private selectStrategy(list: T[]): { name: string; description: string } {
    // 数据量小于1000，使用最小化构建
    if (list.length < 1000) {
      return { name: 'minimal', description: '最小化构建策略' };
    }
    
    // 检查是否需要高级功能
    const needsAdvanced = this.plugins.length > 0 || 
                         this.config.enableGhostNodes ||
                         this.config.maxDepth !== 1000;
    
    if (needsAdvanced) {
      return { name: 'enhanced', description: '增强构建策略' };
    }
    
    // 数据量很大且结构简单，使用最小化构建
    return { name: 'minimal', description: '最小化构建策略' };
  }

  /**
   * 应用前置插件
   */
  private applyBeforeBuild(list: T[]): T[] | void {
    let result: T[] = list;
    
    for (const plugin of this.plugins) {
      if (plugin.onNodeCreated) {
        // 创建节点时应用插件
        result = result.map((item, index) => {
          const context = {
            level: 0,
            path: [(item as any)[this.config.idKey || 'id']],
            isLeaf: true,
            childCount: 0
          };
          
          plugin.onNodeCreated?.(item, context);
          return item;
        });
      }
    }
    
    return result;
  }

  /**
   * 应用后置插件
   */
  private applyAfterBuild(tree: any[], originalList: T[]): any[] {
    let result = tree;
    
    for (const plugin of this.plugins) {
      if (plugin.onTreeBuilt) {
        const pluginResult = plugin.onTreeBuilt(result, { originalList });
        if (pluginResult) {
          result = pluginResult;
        }
      }
    }
    
    return result;
  }

  /**
   * 增量构建（简化版）
   */
  private buildIncremental(list: T[]): any[] {
    // 简化的增量构建实现
    const tree = buildMinimalTree(list, this.config);
    
    // 应用增量优化
    this.optimizeTreeStructure(tree);
    
    return tree;
  }

  /**
   * 优化树结构
   */
  private optimizeTreeStructure(tree: any[]): void {
    // 优化算法：扁平化深度嵌套
    this.flattenDeepNesting(tree, this.config.maxDepth || 1000);
  }

  /**
   * 扁平化深度嵌套
   */
  private flattenDeepNesting(tree: any[], maxDepth: number): void {
    const childrenKey = this.config.childrenKey || 'children';
    
    function flatten(node: any, depth: number): any {
      if (depth >= maxDepth && node[childrenKey]?.length > 0) {
        // 将深层子节点提升为兄弟节点
        const flattened = {
          ...node,
          [childrenKey]: []
        };
        
        // 递归处理子节点
        const processChildren = (children: any[], currentDepth: number) => {
          for (const child of children) {
            if (currentDepth >= maxDepth) {
              // 提升为兄弟节点
              tree.push(child);
            } else {
              flattened[childrenKey].push(child);
            }
            processChildren(child[childrenKey] || [], currentDepth + 1);
          }
        };
        
        processChildren(node[childrenKey] || [], depth);
        return flattened;
      }
      
      return node;
    }
    
    for (let i = 0; i < tree.length; i++) {
      tree[i] = flatten(tree[i], 1);
    }
  }

  /**
   * 计算树的最大深度
   */
  private calculateMaxDepth(tree: any[]): number {
    const childrenKey = this.config.childrenKey || 'children';
    let maxDepth = 0;
    
    function calculate(node: any, depth: number): void {
      maxDepth = Math.max(maxDepth, depth);
      
      const children = node[childrenKey];
      if (Array.isArray(children)) {
        for (const child of children) {
          calculate(child, depth + 1);
        }
      }
    }
    
    for (const node of tree) {
      calculate(node, 1);
    }
    
    return maxDepth;
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return usage.heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }
}