"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGhostNodesPlugin = createGhostNodesPlugin;
/**
 * 幽灵节点处理插件
 */
function createGhostNodesPlugin(options = {}) {
    const config = {
        createGhostNodes: true,
        ghostField: '__isGhost',
        ...options
    };
    return {
        name: 'ghost-nodes',
        priority: 20,
        onNodeLinked(parent, child) {
            // 如果父节点不存在且启用了幽灵节点，允许链接
            return config.createGhostNodes;
        }
    };
}
