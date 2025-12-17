"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSortingPlugin = createSortingPlugin;
exports.createMultiLevelSorting = createMultiLevelSorting;
/**
 * 树节点排序插件
 */
function createSortingPlugin(sortFn, options = {}) {
    const config = {
        scope: 'all',
        recursive: true,
        timing: 'after',
        ...options
    };
    const plugin = {
        name: 'sorting',
        priority: 50,
        onTreeBuilt(tree) {
            if (config.timing === 'after') {
                return sortTree(tree, sortFn, config);
            }
            return tree;
        },
        onNodeLinked(parent, child) {
            if (config.timing === 'during' && config.scope !== 'root') {
                // 在链接时排序子节点
                if (parent.children && Array.isArray(parent.children)) {
                    try {
                        parent.children.sort(sortFn);
                    }
                    catch (error) {
                        console.warn('节点排序失败:', error);
                    }
                }
            }
        }
    };
    return plugin;
}
/**
 * 排序整棵树
 */
function sortTree(tree, sortFn, config) {
    if (!tree || !Array.isArray(tree) || tree.length === 0) {
        return tree;
    }
    let result = [...tree];
    try {
        // 排序根节点
        if (config.scope === 'all' || config.scope === 'root') {
            result.sort(sortFn);
        }
        // 递归排序子节点
        if (config.recursive && (config.scope === 'all' || config.scope === 'children')) {
            for (const node of result) {
                if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                    node.children = sortTree(node.children, sortFn, config);
                }
            }
        }
    }
    catch (error) {
        console.error('树排序失败:', error);
    }
    return result;
}
/**
 * 创建多级排序插件
 */
function createMultiLevelSorting(sortRules) {
    const sortFn = createMultiLevelSortFn(sortRules);
    return createSortingPlugin(sortFn, {
        scope: 'all',
        recursive: true,
        timing: 'after'
    });
}
/**
 * 创建多级排序函数
 */
function createMultiLevelSortFn(sortRules) {
    return (a, b) => {
        for (const rule of sortRules) {
            const aValue = a[rule.key];
            const bValue = b[rule.key];
            let comparison = 0;
            // 根据类型进行比较
            if (rule.type === 'number') {
                const aNum = Number(aValue) || 0;
                const bNum = Number(bValue) || 0;
                comparison = aNum - bNum;
            }
            else if (rule.type === 'date') {
                const aDate = aValue ? new Date(aValue).getTime() : 0;
                const bDate = bValue ? new Date(bValue).getTime() : 0;
                comparison = aDate - bDate;
            }
            else {
                // 字符串比较
                const aStr = String(aValue || '');
                const bStr = String(bValue || '');
                comparison = aStr.localeCompare(bStr);
            }
            // 应用排序方向
            if (rule.order === 'desc') {
                comparison = -comparison;
            }
            if (comparison !== 0) {
                return comparison;
            }
        }
        return 0;
    };
}
