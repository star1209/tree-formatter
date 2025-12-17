"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncrementalTreeBuilder = void 0;
/**
 * 增量树形构建器
 * 支持增量添加、删除和更新节点
 */
class IncrementalTreeBuilder {
    constructor(config = {}) {
        this.tree = [];
        this.nodeMap = new Map();
        this.config = {
            idKey: 'id',
            parentKey: 'parentId',
            childrenKey: 'children',
            rootParentId: 0,
            enableGhostNodes: false,
            validateNodes: true,
            maxDepth: 1000,
            enableCache: false,
            ...config
        };
    }
    /**
     * 增量添加节点
     */
    addNode(nodeData) {
        const id = nodeData[this.config.idKey];
        const parentId = nodeData[this.config.parentKey] ?? null;
        if (this.nodeMap.has(id)) {
            console.warn(`节点 ${id} 已存在，将更新该节点`);
            return this.updateNode(id, nodeData);
        }
        // 创建节点
        const newNode = {
            ...nodeData,
            [this.config.childrenKey]: []
        };
        this.nodeMap.set(id, newNode);
        // 判断是否为根节点
        const isRoot = parentId === null ||
            parentId === undefined ||
            parentId === this.config.rootParentId ||
            !this.nodeMap.has(parentId);
        if (isRoot) {
            this.tree.push(newNode);
        }
        else {
            const parentNode = this.nodeMap.get(parentId);
            if (parentNode) {
                parentNode[this.config.childrenKey].push(newNode);
            }
            else if (this.config.enableGhostNodes) {
                // 创建幽灵节点
                const ghostNode = {
                    [this.config.idKey]: parentId,
                    [this.config.childrenKey]: [newNode],
                    __isGhost: true
                };
                this.nodeMap.set(parentId, ghostNode);
                this.tree.push(ghostNode);
            }
            else {
                // 父节点不存在，作为根节点
                this.tree.push(newNode);
            }
        }
        return this;
    }
    /**
     * 批量添加节点
     */
    addNodes(nodes) {
        nodes.forEach(node => this.addNode(node));
        return this;
    }
    /**
     * 删除节点
     */
    removeNode(id) {
        const node = this.nodeMap.get(id);
        if (!node) {
            console.warn(`节点 ${id} 不存在`);
            return this;
        }
        // 从父节点中移除
        const parentId = node.__parentId;
        if (parentId) {
            const parentNode = this.nodeMap.get(parentId);
            if (parentNode && parentNode[this.config.childrenKey]) {
                const index = parentNode[this.config.childrenKey].findIndex((child) => child[this.config.idKey] === id);
                if (index !== -1) {
                    parentNode[this.config.childrenKey].splice(index, 1);
                }
            }
        }
        else {
            // 从根节点中移除
            const index = this.tree.findIndex((rootNode) => rootNode[this.config.idKey] === id);
            if (index !== -1) {
                this.tree.splice(index, 1);
            }
        }
        // 递归删除子节点
        const removeChildren = (node) => {
            if (node[this.config.childrenKey]) {
                node[this.config.childrenKey].forEach((child) => {
                    const childId = child[this.config.idKey];
                    this.nodeMap.delete(childId);
                    removeChildren(child);
                });
            }
        };
        removeChildren(node);
        this.nodeMap.delete(id);
        return this;
    }
    /**
     * 更新节点
     */
    updateNode(id, updates) {
        const node = this.nodeMap.get(id);
        if (!node) {
            console.warn(`节点 ${id} 不存在，将尝试添加`);
            return this.addNode({ [this.config.idKey]: id, ...updates });
        }
        Object.assign(node, updates);
        // 如果更新了父节点，需要重新挂载
        const newParentId = updates[this.config.parentKey];
        if (newParentId !== undefined && newParentId !== node.__parentId) {
            this.removeNode(id);
            return this.addNode({ ...node, ...updates });
        }
        return this;
    }
    /**
     * 查找节点
     */
    findNode(id) {
        return this.nodeMap.get(id);
    }
    /**
     * 获取完整树
     */
    getTree() {
        return this.tree;
    }
    /**
     * 重置构建器
     */
    reset() {
        this.tree = [];
        this.nodeMap.clear();
        return this;
    }
    /**
     * 获取节点数量
     */
    getNodeCount() {
        return this.nodeMap.size;
    }
    /**
     * 获取根节点数量
     */
    getRootCount() {
        return this.tree.length;
    }
}
exports.IncrementalTreeBuilder = IncrementalTreeBuilder;
