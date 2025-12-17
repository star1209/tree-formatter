import { TreePlugin } from '../core/types';
/**
 * 循环引用检测插件
 */
export declare function createCycleDetectionPlugin(options?: {
    /** 是否抛出错误，默认 false */
    throwOnCycle?: boolean;
    /** 修复循环引用的策略，默认 'remove' */
    fixStrategy?: 'remove' | 'break' | 'ignore';
}): TreePlugin;
/**
 * 创建拓扑排序检测器（更高效的循环检测）
 */
export declare function createTopologicalDetector(): TreePlugin;
