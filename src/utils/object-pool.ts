/**
 * 对象池实现（减少内存分配和GC压力）
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  
  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void = () => {}
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
  }
  
  /**
   * 从池中获取对象
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }
  
  /**
   * 归还对象到池中
   */
  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
  
  /**
   * 预创建对象
   */
  preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createFn());
    }
  }
  
  /**
   * 清空对象池
   */
  clear(): void {
    this.pool = [];
  }
  
  /**
   * 获取池大小
   */
  get size(): number {
    return this.pool.length;
  }
  
  /**
   * 获取总创建数量
   */
  get totalCreated(): number {
    return this.pool.length;
  }
}

/**
 * 节点对象池（专门用于树节点）
 */
export class NodeObjectPool {
  private static instance: NodeObjectPool;
  private pool: ObjectPool<any>;
  
  private constructor() {
    this.pool = new ObjectPool(
      () => ({
        id: null,
        parentId: null,
        children: [],
        data: null,
        __pooled: true
      }),
      (node) => {
        node.id = null;
        node.parentId = null;
        node.children.length = 0;
        node.data = null;
      }
    );
    
    // 预分配1000个对象
    this.pool.preallocate(1000);
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(): NodeObjectPool {
    if (!NodeObjectPool.instance) {
      NodeObjectPool.instance = new NodeObjectPool();
    }
    return NodeObjectPool.instance;
  }
  
  /**
   * 获取节点对象
   */
  acquireNode(data?: any): any {
    const node = this.pool.acquire();
    if (data) {
      Object.assign(node, data);
    }
    return node;
  }
  
  /**
   * 归还节点对象
   */
  releaseNode(node: any): void {
    if (node.__pooled) {
      this.pool.release(node);
    }
  }
  
  /**
   * 批量获取节点对象
   */
  acquireNodes(count: number, dataList?: any[]): any[] {
    const nodes: any[] = [];
    for (let i = 0; i < count; i++) {
      const node = this.acquireNode(dataList?.[i]);
      nodes.push(node);
    }
    return nodes;
  }
  
  /**
   * 批量归还节点对象
   */
  releaseNodes(nodes: any[]): void {
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