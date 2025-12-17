"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFormattingPlugin = createFormattingPlugin;
exports.createFieldMapperPlugin = createFieldMapperPlugin;
/**
 * 节点格式化插件
 */
function createFormattingPlugin(formatFn, options = {}) {
    const config = {
        timing: 'both',
        formatChildren: true,
        ...options
    };
    return {
        name: 'formatting',
        priority: 30,
        onNodeCreated(node, context) {
            if (config.timing === 'before' || config.timing === 'both') {
                const formatted = formatFn(node, context);
                Object.assign(node, formatted);
            }
        },
        onTreeBuilt(tree, context) {
            if (config.timing === 'after' || config.timing === 'both') {
                return formatTree(tree, formatFn, config);
            }
            return tree;
        }
    };
}
/**
 * 格式化整棵树
 */
function formatTree(tree, formatFn, config) {
    const formatNodeRecursive = (node, level = 1, path = []) => {
        const nodePath = [...path, node.id || ''];
        const isLeaf = !node.children || node.children.length === 0;
        const context = {
            level,
            path: nodePath,
            isLeaf,
            parent: undefined,
            childCount: node.children ? node.children.length : 0
        };
        const formattedNode = formatFn(node, context);
        const result = {
            ...formattedNode,
            children: node.children || []
        };
        // 递归格式化子节点
        if (config.formatChildren && result.children && result.children.length > 0) {
            result.children = result.children.map((child) => formatNodeRecursive(child, level + 1, nodePath));
        }
        return result;
    };
    return tree.map(node => formatNodeRecursive(node));
}
/**
 * 创建字段映射插件
 */
function createFieldMapperPlugin(fieldMappings, options = {}) {
    const config = {
        deleteOriginalFields: false,
        ...options
    };
    const formatFn = (node) => {
        const result = { ...node };
        Object.entries(fieldMappings).forEach(([newField, oldFieldOrFn]) => {
            if (typeof oldFieldOrFn === 'function') {
                result[newField] = oldFieldOrFn(node);
            }
            else {
                result[newField] = node[oldFieldOrFn];
                if (config.deleteOriginalFields && newField !== oldFieldOrFn) {
                    delete result[oldFieldOrFn];
                }
            }
        });
        return result;
    };
    return createFormattingPlugin(formatFn, { timing: 'both', formatChildren: true });
}
