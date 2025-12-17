/**
 * 简单缓存实现
 */
export declare class SimpleCache<K = string, V = any> {
    private defaultTTL?;
    private cache;
    constructor(defaultTTL?: number | undefined);
    /**
     * 设置缓存
     */
    set(key: K, value: V, ttl?: number): void;
    /**
     * 获取缓存
     */
    get(key: K): V | undefined;
    /**
     * 删除缓存
     */
    delete(key: K): boolean;
    /**
     * 清空缓存
     */
    clear(): void;
    /**
     * 检查缓存是否存在
     */
    has(key: K): boolean;
    /**
     * 清理过期缓存
     */
    cleanup(): number;
    /**
     * 获取缓存大小
     */
    get size(): number;
    /**
     * 获取所有缓存键
     */
    keys(): K[];
    /**
     * 获取所有缓存值
     */
    values(): V[];
}
/**
 * LRU缓存实现
 */
export declare class LRUCache<K = string, V = any> {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    /**
     * 设置缓存
     */
    set(key: K, value: V): void;
    /**
     * 获取缓存
     */
    get(key: K): V | undefined;
    /**
     * 删除缓存
     */
    delete(key: K): boolean;
    /**
     * 清空缓存
     */
    clear(): void;
    /**
     * 检查缓存是否存在
     */
    has(key: K): boolean;
    /**
     * 获取缓存大小
     */
    get size(): number;
    /**
     * 获取所有缓存键
     */
    keys(): K[];
    /**
     * 获取所有缓存值
     */
    values(): V[];
    /**
     * 获取缓存统计
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate?: number;
    };
}
