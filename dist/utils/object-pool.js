"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeObjectPool = exports.ObjectPool = void 0;
/**
 * 对象池实现（减少内存分配和GC压力）
 */
class ObjectPool {
    constructor(createFn, resetFn = () => { }) {
        this.pool = [];
        this.createFn = createFn;
        this.resetFn = resetFn;
    }
    /**
     * 从池中获取对象
     */
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.createFn();
    }
    /**
     * 归还对象到池中
     */
    release(obj) {
        this.resetFn(obj);
        this.pool.push(obj);
    }
    /**
     * 预创建对象
     */
    preallocate(count) {
        for (let i = 0; i < count; i++) {
            this.pool.push(this.createFn());
        }
    }
    /**
     * 清空对象池
     */
    clear() {
        this.pool = [];
    }
    /**
     * 获取池大小
     */
    get size() {
        return this.pool.length;
    }
    /**
     * 获取总创建数量
     */
    get totalCreated() {
        return this.pool.length;
    }
}
exports.ObjectPool = ObjectPool;
/**
 * 节点对象池（专门用于树节点）
 */
class NodeObjectPool {
    constructor() {
        this.pool = new ObjectPool(() => ({
            id: null,
            parentId: null,
            children: [],
            data: null,
            __pooled: true
        }), (node) => {
            node.id = null;
            node.parentId = null;
            node.children.length = 0;
            node.data = null;
        });
        // 预分配1000个对象
        this.pool.preallocate(1000);
    }
    /**
     * 获取单例实例
     */
    static getInstance() {
        if (!NodeObjectPool.instance) {
            NodeObjectPool.instance = new NodeObjectPool();
        }
        return NodeObjectPool.instance;
    }
    /**
     * 获取节点对象
     */
    acquireNode(data) {
        const node = this.pool.acquire();
        if (data) {
            Object.assign(node, data);
        }
        return node;
    }
    /**
     * 归还节点对象
     */
    releaseNode(node) {
        if (node.__pooled) {
            this.pool.release(node);
        }
    }
    /**
     * 批量获取节点对象
     */
    acquireNodes(count, dataList) {
        const nodes = [];
        for (let i = 0; i < count; i++) {
            const node = this.acquireNode(dataList?.[i]);
            nodes.push(node);
        }
        return nodes;
    }
    /**
     * 批量归还节点对象
     */
    releaseNodes(nodes) {
        nodes.forEach(node => this.releaseNode(node));
    }
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            poolSize: this.pool.size,
            totalCreated: this.pool.totalCreated
        };
    }
}
exports.NodeObjectPool = NodeObjectPool;
