/**
 * 简单缓存实现
 */
export class SimpleCache<K = string, V = any> {
  private cache = new Map<K, { value: V; timestamp: number; ttl?: number }>();
  
  constructor(private defaultTTL?: number) {}
  
  /**
   * 设置缓存
   */
  set(key: K, value: V, ttl?: number): void {
    const cacheTTL = ttl ?? this.defaultTTL;
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: cacheTTL
    });
  }
  
  /**
   * 获取缓存
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // 检查是否过期
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * 删除缓存
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 检查缓存是否存在
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // 检查是否过期
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * 清理过期缓存
   */
  cleanup(): number {
    const now = Date.now();
    let deletedCount = 0;
    
    this.cache.forEach((entry, key) => {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    });
    
    return deletedCount;
  }
  
  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * 获取所有缓存键
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * 获取所有缓存值
   */
  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }
}

/**
 * LRU缓存实现
 */
export class LRUCache<K = string, V = any> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  /**
   * 设置缓存
   */
  set(key: K, value: V): void {
    // 如果达到最大容量，删除最久未使用的
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  /**
   * 获取缓存
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // 更新使用时间（移动到最近使用的位置）
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }
  
  /**
   * 删除缓存
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 检查缓存是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * 获取所有缓存键
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * 获取所有缓存值
   */
  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }
  
  /**
   * 获取缓存统计
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}