"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryMonitor = exports.PerformanceMonitor = void 0;
/**
 * 性能监控工具
 */
class PerformanceMonitor {
    constructor() {
        this.measurements = new Map();
    }
    /**
     * 开始测量
     */
    start(label) {
        this.measurements.set(label, {
            startTime: performance.now(),
            totalTime: 0,
            count: 0,
            minTime: Infinity,
            maxTime: 0
        });
    }
    /**
     * 结束测量
     */
    end(label) {
        const measurement = this.measurements.get(label);
        if (!measurement) {
            console.warn(`未找到测量标签: ${label}`);
            return 0;
        }
        const duration = performance.now() - measurement.startTime;
        measurement.totalTime += duration;
        measurement.count++;
        measurement.minTime = Math.min(measurement.minTime, duration);
        measurement.maxTime = Math.max(measurement.maxTime, duration);
        return duration;
    }
    /**
     * 获取测量结果
     */
    getResults(label) {
        if (label) {
            const measurement = this.measurements.get(label);
            if (!measurement) {
                return null;
            }
            return {
                label,
                totalTime: measurement.totalTime,
                count: measurement.count,
                averageTime: measurement.totalTime / measurement.count,
                minTime: measurement.minTime,
                maxTime: measurement.maxTime
            };
        }
        return Array.from(this.measurements.entries()).map(([label, measurement]) => ({
            label,
            totalTime: measurement.totalTime,
            count: measurement.count,
            averageTime: measurement.totalTime / measurement.count,
            minTime: measurement.minTime,
            maxTime: measurement.maxTime
        }));
    }
    /**
     * 重置测量
     */
    reset(label) {
        if (label) {
            this.measurements.delete(label);
        }
        else {
            this.measurements.clear();
        }
    }
    /**
     * 打印测量结果
     */
    printResults(label) {
        const results = this.getResults(label);
        if (!results) {
            console.log('没有测量结果');
            return;
        }
        if (Array.isArray(results)) {
            console.table(results);
        }
        else {
            console.log(`${results.label}:`);
            console.log(`  总时间: ${results.totalTime.toFixed(2)}ms`);
            console.log(`  调用次数: ${results.count}`);
            console.log(`  平均时间: ${results.averageTime.toFixed(2)}ms`);
            console.log(`  最小时: ${results.minTime.toFixed(2)}ms`);
            console.log(`  最大时间: ${results.maxTime.toFixed(2)}ms`);
        }
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
/**
 * 内存使用监控
 */
class MemoryMonitor {
    /**
     * 获取当前内存使用情况
     */
    static getMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage();
        }
        return null;
    }
    /**
     * 获取内存使用统计
     */
    static getMemoryStats() {
        const usage = this.getMemoryUsage();
        if (!usage) {
            return null;
        }
        const MB = 1024 * 1024;
        return {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            rss: usage.rss,
            heapUsedMB: usage.heapUsed / MB,
            heapTotalMB: usage.heapTotal / MB,
            externalMB: usage.external / MB,
            rssMB: usage.rss / MB
        };
    }
    /**
     * 打印内存使用情况
     */
    static printMemoryUsage() {
        const stats = this.getMemoryStats();
        if (!stats) {
            console.log('无法获取内存使用情况');
            return;
        }
        console.log('内存使用情况:');
        console.log(`  堆使用: ${stats.heapUsedMB.toFixed(2)}MB / ${stats.heapTotalMB.toFixed(2)}MB`);
        console.log(`  外部内存: ${stats.externalMB.toFixed(2)}MB`);
        console.log(`  RSS: ${stats.rssMB.toFixed(2)}MB`);
    }
    /**
     * 测量函数的内存使用
     */
    static measureMemoryUsage(fn, iterations = 1) {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const startMemory = process.memoryUsage().heapUsed;
            let result;
            for (let i = 0; i < iterations; i++) {
                result = fn();
            }
            const endMemory = process.memoryUsage().heapUsed;
            const memoryDiff = endMemory - startMemory;
            return {
                result: result,
                memoryDiff,
                memoryDiffMB: memoryDiff / (1024 * 1024)
            };
        }
        // 在浏览器环境中，执行函数但不测量内存
        const result = fn();
        return {
            result,
            memoryDiff: 0,
            memoryDiffMB: 0
        };
    }
}
exports.MemoryMonitor = MemoryMonitor;
