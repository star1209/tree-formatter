"use strict";
// Web Worker 实现，用于在后台线程中处理大数据量的树形构建
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// 导入构建函数（通过动态导入避免主线程依赖）
let treeBuilder;
// 初始化函数
async function initializeBuilder() {
    if (!treeBuilder) {
        // 动态导入构建函数
        const module = await Promise.resolve().then(() => __importStar(require('../core/enhanced')));
        treeBuilder = module.buildEnhancedTree;
    }
}
// 处理构建请求
async function handleBuildRequest(data, options) {
    await initializeBuilder();
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    try {
        const result = treeBuilder(data, options);
        const endTime = performance.now();
        const endMemory = performance.memory?.usedJSHeapSize || 0;
        return {
            result,
            stats: {
                processingTime: endTime - startTime,
                memoryUsed: (endMemory - startMemory) / (1024 * 1024), // MB
                dataSize: data.length
            }
        };
    }
    catch (error) {
        throw new Error(`构建失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}
// 处理验证请求
function handleValidateRequest(tree, config) {
    const startTime = performance.now();
    // 验证函数
    function validateTreeStructure(tree, config = {}) {
        const errors = [];
        const warnings = [];
        const visitedIds = new Set();
        const idKey = config.idKey || 'id';
        const childrenKey = config.childrenKey || 'children';
        const maxDepth = config.maxDepth || 1000;
        function validateNode(node, depth, path) {
            const nodeId = node[idKey];
            // 检查节点ID
            if (nodeId === undefined || nodeId === null) {
                errors.push(`节点缺少ID字段 "${idKey}"，路径: ${path.join(' -> ')}`);
                return;
            }
            // 检查循环引用
            if (visitedIds.has(nodeId)) {
                errors.push(`发现循环引用，节点ID: ${nodeId}，路径: ${path.join(' -> ')}`);
                return;
            }
            visitedIds.add(nodeId);
            // 检查深度限制
            if (depth > maxDepth) {
                warnings.push(`节点深度超过限制: ${depth}，节点ID: ${nodeId}，路径: ${path.join(' -> ')}`);
            }
            // 递归检查子节点
            const children = node[childrenKey];
            if (children && Array.isArray(children)) {
                for (const child of children) {
                    validateNode(child, depth + 1, [...path, nodeId]);
                }
            }
            visitedIds.delete(nodeId);
        }
        try {
            for (let i = 0; i < tree.length; i++) {
                validateNode(tree[i], 1, [`根节点${i}`]);
            }
        }
        catch (error) {
            errors.push(`验证过程中发生错误: ${error}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    const result = validateTreeStructure(tree, config);
    const endTime = performance.now();
    return {
        ...result,
        processingTime: endTime - startTime
    };
}
// 处理扁平化请求
function handleFlattenRequest(tree, config = {}) {
    const startTime = performance.now();
    const result = [];
    const childrenKey = config.childrenKey || 'children';
    const idKey = config.idKey || 'id';
    const parentKey = config.parentKey || 'parentId';
    function traverse(node, parentId = null) {
        const nodeCopy = { ...node };
        const children = nodeCopy[childrenKey];
        // 移除children属性
        delete nodeCopy[childrenKey];
        // 添加父ID
        if (parentId !== null) {
            nodeCopy[parentKey] = parentId;
        }
        result.push(nodeCopy);
        // 递归处理子节点
        if (children && children.length > 0) {
            for (const child of children) {
                traverse(child, node[idKey]);
            }
        }
    }
    for (const node of tree) {
        traverse(node);
    }
    const endTime = performance.now();
    // 添加元数据
    result.__metadata = {
        processingTime: endTime - startTime,
        originalTreeSize: tree.length,
        flattenedSize: result.length
    };
    return result;
}
// 处理查找请求
function handleFindRequest(tree, config) {
    const startTime = performance.now();
    const predicate = config.predicate || ((node) => true);
    const childrenKey = config.childrenKey || 'children';
    function search(nodes) {
        for (const node of nodes) {
            if (predicate(node)) {
                return node;
            }
            if (node[childrenKey] && node[childrenKey].length > 0) {
                const found = search(node[childrenKey]);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    const result = search(tree);
    const endTime = performance.now();
    return {
        node: result,
        found: result !== null,
        processingTime: endTime - startTime
    };
}
// 处理统计请求
function handleStatsRequest(tree) {
    const startTime = performance.now();
    const childrenKey = 'children';
    function analyzeNode(node, depth) {
        let nodeCount = 1;
        let leafCount = 0;
        let totalChildren = 0;
        let maxDepth = depth;
        const children = node[childrenKey];
        if (children && children.length > 0) {
            totalChildren = children.length;
            for (const child of children) {
                const childStats = analyzeNode(child, depth + 1);
                nodeCount += childStats.nodeCount;
                leafCount += childStats.leafCount;
                maxDepth = Math.max(maxDepth, childStats.maxDepth);
                totalChildren += childStats.totalChildren;
            }
        }
        else {
            leafCount = 1;
        }
        return {
            nodeCount,
            maxDepth,
            leafCount,
            totalChildren
        };
    }
    let totalNodeCount = 0;
    let totalLeafCount = 0;
    let maxTreeDepth = 0;
    let totalChildren = 0;
    let rootCount = tree.length;
    for (const node of tree) {
        const stats = analyzeNode(node, 1);
        totalNodeCount += stats.nodeCount;
        totalLeafCount += stats.leafCount;
        maxTreeDepth = Math.max(maxTreeDepth, stats.maxDepth);
        totalChildren += stats.totalChildren;
    }
    const endTime = performance.now();
    return {
        stats: {
            totalNodeCount,
            rootCount,
            totalLeafCount,
            maxTreeDepth,
            totalChildren,
            averageChildrenPerNode: totalNodeCount > 0 ? totalChildren / totalNodeCount : 0,
            leafPercentage: totalNodeCount > 0 ? (totalLeafCount / totalNodeCount) * 100 : 0
        },
        processingTime: endTime - startTime
    };
}
// Worker 消息处理器
self.onmessage = async function (event) {
    const message = event.data;
    try {
        let result;
        let stats;
        switch (message.type) {
            case 'build':
                const buildResult = await handleBuildRequest(message.payload.data, message.payload.options);
                result = buildResult.result;
                stats = buildResult.stats;
                break;
            case 'validate':
                result = handleValidateRequest(message.payload.data, message.payload.config);
                break;
            case 'flatten':
                result = handleFlattenRequest(message.payload.data, message.payload.config);
                break;
            case 'find':
                result = handleFindRequest(message.payload.data, message.payload.config);
                break;
            case 'stats':
                result = handleStatsRequest(message.payload.data);
                break;
            default:
                throw new Error(`未知的消息类型: ${message.type}`);
        }
        const response = {
            id: message.id,
            type: message.type,
            success: true,
            result,
            stats
        };
        self.postMessage(response);
    }
    catch (error) {
        const response = {
            id: message.id,
            type: message.type,
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
        self.postMessage(response);
    }
};
// 向主线程发送初始化完成消息
self.postMessage({
    id: 'init',
    type: 'init',
    success: true,
    result: { message: 'Tree Worker 已初始化' }
});
