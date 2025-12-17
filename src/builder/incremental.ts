import { TreeBuilderConfig } from '../core/types';

/**
 * 增量树形构建器
 * 支持增量添加、删除和更新节点
 */
export class IncrementalTreeBuilder<T = any> {
  private tree: any[] = [];
  private nodeMap = new Map<string | number, any>();
  private config: Required<TreeBuilderConfig<T>>;
  
  constructor(config: TreeBuilderConfig<T> = {}) {
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
  addNode(nodeData: T): this {
    const id = (nodeData as any)[this.config.idKey];
    const parentId = (nodeData as any)[this.config.parentKey] ?? null;
    
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
    } else {
      const parentNode = this.nodeMap.get(parentId);
      if (parentNode) {
        parentNode[this.config.childrenKey].push(newNode);
      } else if (this.config.enableGhostNodes) {
        // 创建幽灵节点
        const ghostNode = {
          [this.config.idKey]: parentId,
          [this.config.childrenKey]: [newNode],
          __isGhost: true
        };
        this.nodeMap.set(parentId, ghostNode);
        this.tree.push(ghostNode);
      } else {
        // 父节点不存在，作为根节点
        this.tree.push(newNode);
      }
    }
    
    return this;
  }
  
  /**
   * 批量添加节点
   */
  addNodes(nodes: T[]): this {
    nodes.forEach(node => this.addNode(node));
    return this;
  }
  
  /**
   * 删除节点
   */
  removeNode(id: string | number): this {
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
        const index = parentNode[this.config.childrenKey].findIndex(
          (child: any) => child[this.config.idKey] === id
        );
        if (index !== -1) {
          parentNode[this.config.childrenKey].splice(index, 1);
        }
      }
    } else {
      // 从根节点中移除
      const index = this.tree.findIndex(
        (rootNode) => rootNode[this.config.idKey] === id
      );
      if (index !== -1) {
        this.tree.splice(index, 1);
      }
    }
    
    // 递归删除子节点
    const removeChildren = (node: any) => {
      if (node[this.config.childrenKey]) {
        node[this.config.childrenKey].forEach((child: any) => {
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
  updateNode(id: string | number, updates: Partial<T>): this {
    const node = this.nodeMap.get(id);
    if (!node) {
      console.warn(`节点 ${id} 不存在，将尝试添加`);
      return this.addNode({ [this.config.idKey]: id, ...updates } as T);
    }
    
    Object.assign(node, updates);
    
    // 如果更新了父节点，需要重新挂载
    const newParentId = (updates as any)[this.config.parentKey];
    if (newParentId !== undefined && newParentId !== node.__parentId) {
      this.removeNode(id);
      return this.addNode({ ...node, ...updates });
    }
    
    return this;
  }
  
  /**
   * 查找节点
   */
  findNode(id: string | number): any | undefined {
    return this.nodeMap.get(id);
  }
  
  /**
   * 获取完整树
   */
  getTree(): any[] {
    return this.tree;
  }
  
  /**
   * 重置构建器
   */
  reset(): this {
    this.tree = [];
    this.nodeMap.clear();
    return this;
  }
  
  /**
   * 获取节点数量
   */
  getNodeCount(): number {
    return this.nodeMap.size;
  }
  
  /**
   * 获取根节点数量
   */
  getRootCount(): number {
    return this.tree.length;
  }
}