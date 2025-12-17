import { TreePlugin, NodeContext } from '../core/types';

/**
 * 循环引用检测插件
 */
export function createCycleDetectionPlugin(options: {
  /** 是否抛出错误，默认 false */
  throwOnCycle?: boolean;
  /** 修复循环引用的策略，默认 'remove' */
  fixStrategy?: 'remove' | 'break' | 'ignore';
} = {}): TreePlugin {
  const config = {
    throwOnCycle: false,
    fixStrategy: 'remove' as const,
    ...options
  };
  
  const visited = new Set<string | number>();
  const recursionStack = new Set<string | number>();
  const cycles: (string | number)[][] = [];
  
  const removeCycles = (tree: any[]) => {
    const nodesToRemove = new Set<string | number>();
    
    cycles.forEach(cycle => {
      // 移除循环中的最后一个节点（通常是问题节点）
      const nodeToRemove = cycle[cycle.length - 1];
      nodesToRemove.add(nodeToRemove);
    });
    
    removeNodes(tree, nodesToRemove);
  };
  
  const breakCycles = (tree: any[]) => {
    cycles.forEach(cycle => {
      // 断开循环中的最后一条边
      const parentId = cycle[cycle.length - 2];
      const childId = cycle[cycle.length - 1];
      
      breakLink(tree, parentId, childId);
    });
  };
  
  const removeNodes = (tree: any[], nodesToRemove: Set<string | number>) => {
    function removeFromTree(nodes: any[]): any[] {
      return nodes.filter(node => {
        if (nodesToRemove.has(node.id)) {
          return false;
        }
        
        if (node.children && node.children.length > 0) {
          node.children = removeFromTree(node.children);
        }
        
        return true;
      });
    }
    
    const filteredTree = removeFromTree(tree);
    tree.length = 0;
    tree.push(...filteredTree);
  };
  
  const breakLink = (tree: any[], parentId: string | number, childId: string | number) => {
    function findAndBreak(nodes: any[]): boolean {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        if (node.id === parentId) {
          // 找到父节点，移除子节点
          if (node.children) {
            const childIndex = node.children.findIndex((child: any) => child.id === childId);
            if (childIndex !== -1) {
              node.children.splice(childIndex, 1);
              console.log(`已断开链接: ${parentId} -> ${childId}`);
              return true;
            }
          }
        }
        
        if (node.children && node.children.length > 0) {
          if (findAndBreak(node.children)) {
            return true;
          }
        }
      }
      
      return false;
    }
    
    findAndBreak(tree);
  };
  
  return {
    name: 'cycle-detection',
    priority: 10, // 高优先级，最先执行
    
    onNodeLinked(parent: any, child: any, context: NodeContext): boolean {
      const parentId = parent.id;
      const childId = child.id;
      
      // 检查直接循环引用
      if (parentId === childId) {
        console.error(`发现自循环引用: ${parentId} -> ${childId}`);
        
        if (config.throwOnCycle) {
          throw new Error(`循环引用: ${parentId} -> ${childId}`);
        }
        
        cycles.push([parentId, childId]);
        return config.fixStrategy === 'remove';
      }
      
      // 检查间接循环引用
      recursionStack.add(parentId);
      
      if (recursionStack.has(childId)) {
        // 发现循环引用
        const cyclePath = Array.from(recursionStack);
        const cycleStart = cyclePath.indexOf(childId);
        const cycle = cyclePath.slice(cycleStart);
        cycle.push(childId);
        
        console.error(`发现循环引用: ${cycle.join(' -> ')}`);
        cycles.push(cycle);
        
        if (config.throwOnCycle) {
          throw new Error(`循环引用: ${cycle.join(' -> ')}`);
        }
        
        recursionStack.delete(parentId);
        return config.fixStrategy === 'remove';
      }
      
      recursionStack.delete(parentId);
      return true;
    },
    
    onTreeBuilt(tree: any[]): void {
      if (cycles.length > 0) {
        console.warn(`检测到 ${cycles.length} 个循环引用`);
        
        if (config.fixStrategy === 'remove') {
          removeCycles(tree);
        } else if (config.fixStrategy === 'break') {
          breakCycles(tree);
        }
      }
      
      // 清理状态
      visited.clear();
      recursionStack.clear();
    }
  };
}

/**
 * 创建拓扑排序检测器（更高效的循环检测）
 */
export function createTopologicalDetector(): TreePlugin {
  const adjacency = new Map<string | number, Set<string | number>>();
  const inDegree = new Map<string | number, number>();
  
  return {
    name: 'topological-detector',
    priority: 5,
    
    onNodeLinked(parent: any, child: any): void {
      const parentId = parent.id;
      const childId = child.id;
      
      // 初始化数据结构
      if (!adjacency.has(parentId)) {
        adjacency.set(parentId, new Set());
      }
      if (!inDegree.has(childId)) {
        inDegree.set(childId, 0);
      }
      if (!inDegree.has(parentId)) {
        inDegree.set(parentId, 0);
      }
      
      // 添加边
      adjacency.get(parentId)!.add(childId);
      inDegree.set(childId, (inDegree.get(childId) || 0) + 1);
    },
    
    onTreeBuilt(): void {
      // 使用Kahn算法检测环
      const queue: (string | number)[] = [];
      const result: (string | number)[] = [];
      
      // 入度为0的节点入队
      inDegree.forEach((degree, id) => {
        if (degree === 0) {
          queue.push(id);
        }
      });
      
      // 处理队列
      while (queue.length > 0) {
        const current = queue.shift()!;
        result.push(current);
        
        const neighbors = adjacency.get(current);
        if (neighbors) {
          neighbors.forEach(neighbor => {
            const newDegree = (inDegree.get(neighbor) || 1) - 1;
            inDegree.set(neighbor, newDegree);
            
            if (newDegree === 0) {
              queue.push(neighbor);
            }
          });
        }
      }
      
      // 检查是否有环
      if (result.length !== adjacency.size) {
        console.error(`检测到循环引用，拓扑排序失败，共有 ${adjacency.size} 个节点，排序了 ${result.length} 个`);
        
        // 找出环中的节点
        const inCycle = new Set<string | number>();
        inDegree.forEach((degree, id) => {
          if (degree > 0) {
            inCycle.add(id);
          }
        });
        
        console.error(`环中的节点: ${Array.from(inCycle).join(', ')}`);
      }
      
      // 清理状态
      adjacency.clear();
      inDegree.clear();
    }
  };
}