import { TreeBuilderConfig, TreePlugin, BuildStats } from '../core/types';
/**
 * 智能树形构建器
 * 根据数据特征自动选择最优构建策略
 */
export declare class SmartTreeBuilder<T = any> {
    private plugins;
    private config;
    private cache;
    private stats;
    constructor(config?: TreeBuilderConfig<T>);
    /**
     * 注册插件
     */
    use(plugin: TreePlugin<T>): this;
    /**
     * 构建树形结构
     */
    build(list: T[]): any[];
    /**
     * 获取构建统计信息
     */
    getStats(): BuildStats[];
    /**
     * 清除缓存
     */
    clearCache(): void;
    /**
     * 重置构建器状态
     */
    reset(): void;
    /**
     * 生成缓存键
     */
    private generateCacheKey;
    /**
     * 根据数据特征选择构建策略
     */
    private selectStrategy;
    /**
     * 应用前置插件
     */
    private applyBeforeBuild;
    /**
     * 应用后置插件
     */
    private applyAfterBuild;
    /**
     * 增量构建（简化版）
     */
    private buildIncremental;
    /**
     * 优化树结构
     */
    private optimizeTreeStructure;
    /**
     * 扁平化深度嵌套
     */
    private flattenDeepNesting;
    /**
     * 计算树的最大深度
     */
    private calculateMaxDepth;
    /**
     * 获取内存使用情况
     */
    private getMemoryUsage;
}
