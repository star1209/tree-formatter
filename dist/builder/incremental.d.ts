import { TreeBuilderConfig } from '../core/types';
/**
 * 增量树形构建器
 * 支持增量添加、删除和更新节点
 */
export declare class IncrementalTreeBuilder<T = any> {
    private tree;
    private nodeMap;
    private config;
    constructor(config?: TreeBuilderConfig<T>);
    /**
     * 增量添加节点
     */
    addNode(nodeData: T): this;
    /**
     * 批量添加节点
     */
    addNodes(nodes: T[]): this;
    /**
     * 删除节点
     */
    removeNode(id: string | number): this;
    /**
     * 更新节点
     */
    updateNode(id: string | number, updates: Partial<T>): this;
    /**
     * 查找节点
     */
    findNode(id: string | number): any | undefined;
    /**
     * 获取完整树
     */
    getTree(): any[];
    /**
     * 重置构建器
     */
    reset(): this;
    /**
     * 获取节点数量
     */
    getNodeCount(): number;
    /**
     * 获取根节点数量
     */
    getRootCount(): number;
}
