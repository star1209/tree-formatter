import { TreeBuilderConfig } from '../core/types';
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
export declare class MinimalStrategy<T = any> implements TreeBuilderStrategy<T> {
    readonly name = "minimal";
    readonly description = "\u6700\u5C0F\u5316\u6784\u5EFA\u7B56\u7565\uFF08\u5BF9\u6807 row-to-tree\uFF09";
    build(list: T[], config: TreeBuilderConfig<T>): any[];
}
/**
 * 增强构建策略
 */
export declare class EnhancedStrategy<T = any> implements TreeBuilderStrategy<T> {
    readonly name = "enhanced";
    readonly description = "\u589E\u5F3A\u6784\u5EFA\u7B56\u7565\uFF08\u652F\u6301\u5FAA\u73AF\u68C0\u6D4B\u3001\u6392\u5E8F\u7B49\uFF09";
    build(list: T[], config: TreeBuilderConfig<T>): any[];
}
/**
 * 递归构建策略
 */
export declare class RecursiveStrategy<T = any> implements TreeBuilderStrategy<T> {
    readonly name = "recursive";
    readonly description = "\u9012\u5F52\u6784\u5EFA\u7B56\u7565\uFF08\u9002\u5408\u6DF1\u5EA6\u5D4C\u5957\uFF09";
    build(list: T[], config: TreeBuilderConfig<T>): any[];
}
/**
 * 策略工厂
 */
export declare class StrategyFactory {
    /**
     * 根据数据特征选择构建策略
     */
    static selectStrategy<T>(list: T[], config?: TreeBuilderConfig<T>): TreeBuilderStrategy<T>;
    /**
     * 获取所有可用策略
     */
    static getAllStrategies<T>(): TreeBuilderStrategy<T>[];
}
