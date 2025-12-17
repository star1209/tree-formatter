/**
 * 对象池实现（减少内存分配和GC压力）
 */
export declare class ObjectPool<T> {
    private pool;
    private createFn;
    private resetFn;
    constructor(createFn: () => T, resetFn?: (obj: T) => void);
    /**
     * 从池中获取对象
     */
    acquire(): T;
    /**
     * 归还对象到池中
     */
    release(obj: T): void;
    /**
     * 预创建对象
     */
    preallocate(count: number): void;
    /**
     * 清空对象池
     */
    clear(): void;
    /**
     * 获取池大小
     */
    get size(): number;
    /**
     * 获取总创建数量
     */
    get totalCreated(): number;
}
/**
 * 节点对象池（专门用于树节点）
 */
export declare class NodeObjectPool {
    private static instance;
    private pool;
    private constructor();
    /**
     * 获取单例实例
     */
    static getInstance(): NodeObjectPool;
    /**
     * 获取节点对象
     */
    acquireNode(data?: any): any;
    /**
     * 归还节点对象
     */
    releaseNode(node: any): void;
    /**
     * 批量获取节点对象
     */
    acquireNodes(count: number, dataList?: any[]): any[];
    /**
     * 批量归还节点对象
     */
    releaseNodes(nodes: any[]): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        poolSize: number;
        totalCreated: number;
    };
}
