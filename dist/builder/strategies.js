"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyFactory = exports.RecursiveStrategy = exports.EnhancedStrategy = exports.MinimalStrategy = void 0;
const minimal_1 = require("../core/minimal");
const enhanced_1 = require("../core/enhanced");
/**
 * 最小化构建策略
 */
class MinimalStrategy {
    constructor() {
        this.name = 'minimal';
        this.description = '最小化构建策略（对标 row-to-tree）';
    }
    build(list, config) {
        return (0, minimal_1.buildMinimalTree)(list, config);
    }
}
exports.MinimalStrategy = MinimalStrategy;
/**
 * 增强构建策略
 */
class EnhancedStrategy {
    constructor() {
        this.name = 'enhanced';
        this.description = '增强构建策略（支持循环检测、排序等）';
    }
    build(list, config) {
        return (0, enhanced_1.buildEnhancedTree)(list, config);
    }
}
exports.EnhancedStrategy = EnhancedStrategy;
/**
 * 递归构建策略
 */
class RecursiveStrategy {
    constructor() {
        this.name = 'recursive';
        this.description = '递归构建策略（适合深度嵌套）';
    }
    build(list, config) {
        const idKey = config.idKey || 'id';
        const parentKey = config.parentKey || 'parentId';
        const childrenKey = config.childrenKey || 'children';
        const rootParentId = config.rootParentId ?? 0;
        const nodeMap = new Map();
        const roots = [];
        // 创建所有节点
        list.forEach(item => {
            const id = item[idKey];
            if (id !== undefined && id !== null) {
                nodeMap.set(id, {
                    ...item,
                    [childrenKey]: []
                });
            }
        });
        // 递归构建
        const buildTree = (parentId = rootParentId) => {
            const children = [];
            list.forEach(item => {
                const id = item[idKey];
                const itemParentId = item[parentKey];
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
exports.RecursiveStrategy = RecursiveStrategy;
/**
 * 策略工厂
 */
class StrategyFactory {
    /**
     * 根据数据特征选择构建策略
     */
    static selectStrategy(list, config = {}) {
        const dataSize = list.length;
        const needsAdvanced = config.enableGhostNodes ||
            config.detectCycles ||
            config.sortChildren;
        // 小数据量使用最小策略
        if (dataSize < 1000 && !needsAdvanced) {
            return new MinimalStrategy();
        }
        // 需要高级功能或大数据量使用增强策略
        if (dataSize >= 1000 || needsAdvanced) {
            return new EnhancedStrategy();
        }
        // 默认使用最小策略
        return new MinimalStrategy();
    }
    /**
     * 获取所有可用策略
     */
    static getAllStrategies() {
        return [
            new MinimalStrategy(),
            new EnhancedStrategy(),
            new RecursiveStrategy()
        ];
    }
}
exports.StrategyFactory = StrategyFactory;
