"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTreeStructure = validateTreeStructure;
exports.validateFlatData = validateFlatData;
exports.findNodeInTree = findNodeInTree;
exports.getTreeHeight = getTreeHeight;
exports.getTreeNodeCount = getTreeNodeCount;
exports.flattenTree = flattenTree;
/**
 * 验证树形结构
 */
function validateTreeStructure(tree, config = {}) {
    const errors = [];
    const visitedIds = new Set();
    const idKey = config.idKey || 'id';
    const childrenKey = config.childrenKey || 'children';
    const maxDepth = config.maxDepth || 1000;
    function validateNode(node, depth, path) {
        // 检查节点ID
        const nodeId = node[idKey];
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
            errors.push(`节点深度超过限制: ${depth}，节点ID: ${nodeId}，路径: ${path.join(' -> ')}`);
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
        errors
    };
}
/**
 * 验证扁平数据
 */
function validateFlatData(list, config = {}) {
    const errors = [];
    const warnings = [];
    const idSet = new Set();
    const idKey = config.idKey || 'id';
    const parentKey = config.parentKey || 'parentId';
    // 检查数据是否为数组
    if (!Array.isArray(list)) {
        errors.push('数据必须是数组');
        return { isValid: false, errors, warnings };
    }
    // 检查每个节点
    list.forEach((item, index) => {
        const id = item[idKey];
        const parentId = item[parentKey];
        // 检查ID
        if (id === undefined || id === null) {
            errors.push(`第 ${index} 个节点缺少ID字段 "${idKey}"`);
            return;
        }
        // 检查重复ID
        if (idSet.has(id)) {
            warnings.push(`发现重复ID: ${id}，位于第 ${index} 个节点`);
        }
        else {
            idSet.add(id);
        }
        // 检查自引用
        if (id === parentId) {
            warnings.push(`节点 ${id} 存在自引用（父ID等于自身ID）`);
        }
        // 检查父ID是否存在（除根节点外）
        if (parentId !== null && parentId !== undefined) {
            const parentExists = list.some(item => item[idKey] === parentId);
            if (!parentExists && !config.enableGhostNodes) {
                warnings.push(`节点 ${id} 的父节点 ${parentId} 不存在`);
            }
        }
    });
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * 检查树中是否存在特定节点
 */
function findNodeInTree(tree, predicate, config = {}) {
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
    return search(tree);
}
/**
 * 获取树的高度
 */
function getTreeHeight(tree, config = {}) {
    const childrenKey = config.childrenKey || 'children';
    function getMaxDepth(node) {
        if (!node[childrenKey] || node[childrenKey].length === 0) {
            return 1;
        }
        let maxChildDepth = 0;
        for (const child of node[childrenKey]) {
            maxChildDepth = Math.max(maxChildDepth, getMaxDepth(child));
        }
        return maxChildDepth + 1;
    }
    let maxHeight = 0;
    for (const node of tree) {
        maxHeight = Math.max(maxHeight, getMaxDepth(node));
    }
    return maxHeight;
}
/**
 * 获取树的节点数量
 */
function getTreeNodeCount(tree, config = {}) {
    const childrenKey = config.childrenKey || 'children';
    function countNodes(node) {
        let count = 1;
        if (node[childrenKey] && node[childrenKey].length > 0) {
            for (const child of node[childrenKey]) {
                count += countNodes(child);
            }
        }
        return count;
    }
    let totalCount = 0;
    for (const node of tree) {
        totalCount += countNodes(node);
    }
    return totalCount;
}
/**
 * 扁平化树
 */
function flattenTree(tree, config = {}) {
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
    return result;
}
