"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMinimalTree = buildMinimalTree;
exports.validateMinimalTree = validateMinimalTree;
/**
 * 最小化树形构建器（对标 row-to-tree）
 * 时间复杂度: O(n)，空间复杂度: O(n)
 */
function buildMinimalTree(list, options = {}) {
    // 合并配置
    const config = {
        idKey: 'id',
        parentKey: 'parentId',
        childrenKey: 'children',
        rootParentId: 0,
        enableGhostNodes: false,
        validateNodes: true,
        maxDepth: 1000,
        enableCache: false,
        ...options
    };
    // 空列表检查
    if (!Array.isArray(list) || list.length === 0) {
        return [];
    }
    const map = new Map();
    const roots = [];
    // 第一遍：创建所有节点
    for (const item of list) {
        const id = item[config.idKey];
        // 验证节点ID
        if (config.validateNodes && (id === undefined || id === null)) {
            console.warn(`节点缺少ID字段 "${config.idKey}"，将被忽略:`, item);
            continue;
        }
        // 检查重复ID
        if (map.has(id)) {
            console.warn(`发现重复ID "${id}"，后一个节点将覆盖前一个`);
        }
        map.set(id, {
            ...item,
            [config.childrenKey]: []
        });
    }
    // 第二遍：建立父子关系
    const processedIds = new Set();
    for (const item of list) {
        const id = item[config.idKey];
        const parentId = item[config.parentKey];
        const node = map.get(id);
        if (!node)
            continue;
        // 如果这个ID已经处理过，跳过（避免重复ID被多次处理）
        if (processedIds.has(id)) {
            continue;
        }
        processedIds.add(id);
        // 判断是否为根节点
        const isRoot = parentId === null ||
            parentId === undefined ||
            parentId === config.rootParentId;
        if (isRoot) {
            roots.push(node);
        }
        else {
            const parent = map.get(parentId);
            if (parent) {
                // 正常父子关系
                parent[config.childrenKey].push(node);
            }
            else if (config.enableGhostNodes) {
                // 创建幽灵节点
                const ghostNode = {
                    [config.idKey]: parentId,
                    [config.childrenKey]: [node],
                    __isGhost: true
                };
                map.set(parentId, ghostNode);
                roots.push(ghostNode);
            }
            else {
                // 父节点不存在，作为根节点
                console.warn(`父节点 "${parentId}" 不存在，节点 "${id}" 将被作为根节点`);
                roots.push(node);
            }
        }
    }
    // 删除空的 children 属性
    function removeEmptyChildren(nodes) {
        for (const node of nodes) {
            if (Array.isArray(node[config.childrenKey]) && node[config.childrenKey].length === 0) {
                delete node[config.childrenKey];
            }
            else {
                removeEmptyChildren(node[config.childrenKey]);
            }
        }
    }
    removeEmptyChildren(roots);
    return roots;
}
/**
 * 验证最小树的有效性
 */
function validateMinimalTree(tree, config = {}) {
    const visited = new Set();
    const childrenKey = config.childrenKey || 'children';
    function validateNode(node, depth) {
        const id = node[config.idKey || 'id'];
        // 检查循环引用
        if (visited.has(id)) {
            console.error(`发现循环引用，节点ID: ${id}`);
            return false;
        }
        visited.add(id);
        // 检查深度限制
        if (depth > (config.maxDepth || 1000)) {
            console.error(`树深度超过限制: ${depth}`);
            return false;
        }
        // 递归检查子节点
        const children = node[childrenKey];
        if (Array.isArray(children)) {
            for (const child of children) {
                if (!validateNode(child, depth + 1)) {
                    return false;
                }
            }
        }
        visited.delete(id);
        return true;
    }
    try {
        for (const node of tree) {
            if (!validateNode(node, 1)) {
                return false;
            }
        }
        return true;
    }
    catch (error) {
        console.error('树验证失败:', error);
        return false;
    }
}
