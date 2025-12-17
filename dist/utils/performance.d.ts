/**
 * 性能监控工具
 */
export declare class PerformanceMonitor {
    private measurements;
    /**
     * 开始测量
     */
    start(label: string): void;
    /**
     * 结束测量
     */
    end(label: string): number;
    /**
     * 获取测量结果
     */
    getResults(label?: string): {
        label: string;
        totalTime: number;
        count: number;
        averageTime: number;
        minTime: number;
        maxTime: number;
    }[] | {
        label: string;
        totalTime: number;
        count: number;
        averageTime: number;
        minTime: number;
        maxTime: number;
    } | null;
    /**
     * 重置测量
     */
    reset(label?: string): void;
    /**
     * 打印测量结果
     */
    printResults(label?: string): void;
}
/**
 * 内存使用监控
 */
export declare class MemoryMonitor {
    /**
     * 获取当前内存使用情况
     */
    static getMemoryUsage(): NodeJS.MemoryUsage | null;
    /**
     * 获取内存使用统计
     */
    static getMemoryStats(): {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
        heapUsedMB: number;
        heapTotalMB: number;
        externalMB: number;
        rssMB: number;
    } | null;
    /**
     * 打印内存使用情况
     */
    static printMemoryUsage(): void;
    /**
     * 测量函数的内存使用
     */
    static measureMemoryUsage<T>(fn: () => T, iterations?: number): {
        result: T;
        memoryDiff: number;
        memoryDiffMB: number;
    };
}
