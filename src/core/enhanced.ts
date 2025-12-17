import { EnhancedTreeConfig, NodeContext, BuildStats } from './types';

/**
 * 增强树形构建器
 * 支持循环引用检测、节点排序、格式化等高级功能
 */
export function buildEnhancedTree<T = any, R = T>(
  list: T[],
  options: EnhancedTreeConfig<T> = {},
  formatCallback?: (node: T, context: NodeContext) => R
): R[] {
  // 提取配置，分别处理每个属性
  const idKey = options.idKey || 'id';
  const parentKey = options.parentKey || 'parentId';
  const childrenKey = options.childrenKey || 'children';
  const rootParentId = options.rootParentId ?? 0;
  const enableGhostNodes = options.enableGhostNodes || false;
  const validateNodes = options.validateNodes !== false; // 默认为true
  const maxDepth = options.maxDepth || 1000;
  const detectCycles = options.detectCycles || false;
  const onCycleDetected = options.onCycleDetected || ((node: T, path: (string | number)[]) => {
    console.warn(`发现循环引用，路径: ${path.join(' -> ')}`);
  });
  const sortChildren = options.sortChildren;
  const formatNode = options.formatNode;
  const isRootNode = options.isRootNode;

  // 性能监控
  const startTime = performance.now();
  const startMemory = process.memoryUsage?.()?.heapUsed || 0;
  const stats: BuildStats = {
    totalNodes: 0,
    rootNodes: 0,
    maxDepth: 0,
    buildTime: 0,
    memoryUsed: 0,
    cyclesDetected: 0,
    ghostNodesCreated: 0
  };

  // 空列表检查
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }

  // 节点映射表
  const nodeMap = new Map<string | number, {
    original: T;
    formatted: any;
    parentId: string | number | null;
    children: any[];
    depth: number;
    isGhost?: boolean;
  }>();

  // 根节点列表
  const roots: any[] = [];

  // 第一步：收集所有节点
  for (const item of list) {
    const id = (item as any)[idKey];
    const parentId = (item as any)[parentKey] ?? null;

    // 验证节点
    if (validateNodes && (id === undefined || id === null)) {
      console.warn(`节点缺少ID字段 "${idKey}"，将被忽略:`, item);
      continue;
    }

    // 检查自引用
    if (id === parentId) {
      if (detectCycles) {
        onCycleDetected(item, [id]);
        stats.cyclesDetected++;
      }
      continue;
    }

    // 创建格式化节点（如果需要）
    const initialContext: NodeContext = {
      level: 0,
      path: [id],
      isLeaf: true,
      childCount: 0
    };

    let formattedNode: any;
    if (formatCallback) {
      formattedNode = formatCallback(item, initialContext);
      formattedNode[childrenKey] = [];
    } else if (formatNode) {
      formattedNode = formatNode(item, initialContext);
      formattedNode[childrenKey] = [];
    } else {
      formattedNode = {
        ...item,
        [childrenKey]: []
      };
    }

    nodeMap.set(id, {
      original: item,
      formatted: formattedNode,
      parentId,
      children: [],
      depth: 0
    });
  }

  stats.totalNodes = nodeMap.size;

  // 第二步：检测循环引用（如果需要）
  if (detectCycles && nodeMap.size > 0) {
    // 只处理自引用节点（parentId === id），其他情况交给后续处理
    const nodesToDelete: Set<string | number> = new Set();
    
    for (const [id, nodeInfo] of nodeMap) {
      if (nodeInfo.parentId === id) {
        stats.cyclesDetected++;
        onCycleDetected(nodeInfo.original, [id]);
        nodesToDelete.add(id); // 标记自引用节点待删除
      }
    }
    
    // 执行删除操作
    nodesToDelete.forEach(id => {
      nodeMap.delete(id);
    });
  }

  // 第三步：建立父子关系
  for (const [id, nodeInfo] of nodeMap) {
    // 跳过幽灵节点，因为它们已经作为根节点添加了
    if (nodeInfo.isGhost) {
      continue;
    }
    const { parentId } = nodeInfo;

    // 判断是否为根节点
    const isRoot = isRootNode ? 
      isRootNode(nodeInfo.original) : 
      (parentId === null || 
       parentId === undefined || 
       parentId === rootParentId);

    if (isRoot) {
      roots.push(nodeInfo.formatted);
      nodeInfo.depth = 1;
      stats.rootNodes++;
    } else {
      const parentInfo = nodeMap.get(parentId!);
      if (parentInfo) {
        // 父节点存在，正常挂载
        parentInfo.children.push(nodeInfo);
        nodeInfo.formatted.__parentId = parentId;
      } else {
        // 父节点不存在
        if (enableGhostNodes) {
          // 检查是否已经存在这个幽灵节点（在 nodeMap 或 roots 中）
          const existingGhostNode = nodeMap.get(parentId!);
          if (existingGhostNode) {
            // 幽灵节点已存在，直接将当前节点添加到其子节点
            existingGhostNode.children.push(nodeInfo);
            nodeInfo.formatted.__parentId = parentId;
            nodeInfo.depth = existingGhostNode.depth + 1;
          } else {
            // 创建新的幽灵节点
            const ghostNode = {
              [idKey]: parentId,
              [childrenKey]: [nodeInfo.formatted],
              __isGhost: true,
              __parentId: null
            };
            
            const ghostInfo = {
              original: { [idKey]: parentId } as T,
              formatted: ghostNode,
              parentId: null,
              children: [nodeInfo],
              depth: 1,
              isGhost: true
            };
            
            nodeMap.set(parentId!, ghostInfo);
            roots.push(ghostNode);
            nodeInfo.formatted.__parentId = parentId;
            nodeInfo.depth = 2;
            stats.ghostNodesCreated++;
            stats.rootNodes++;
          }
          /* // 创建幽灵节点
          const ghostNode = {
            [idKey]: parentId,
            [childrenKey]: [nodeInfo.formatted],
            __isGhost: true,
            __parentId: null
          };
          
          const ghostInfo = {
            original: { [idKey]: parentId } as T,
            formatted: ghostNode,
            parentId: null,
            children: [nodeInfo],
            depth: 1
          };
          
          nodeMap.set(parentId!, ghostInfo);
          roots.push(ghostNode); // 幽灵节点作为根节点
          nodeInfo.formatted.__parentId = parentId;
          nodeInfo.depth = 2;
          stats.ghostNodesCreated++;
          stats.rootNodes++; */
        } else {
          // 不启用幽灵节点，将当前节点作为根节点
          roots.push(nodeInfo.formatted);
          nodeInfo.depth = 1;
          stats.rootNodes++;
        }
      }
    }
  }

  // 第四步：深度优先计算层级和路径
  const stack: Array<{
    nodeInfo: any;
    formattedNode: any;
    depth: number;
    path: (string | number)[];
  }> = [];

  // 初始化栈
  roots.forEach(rootNode => {
    // 从nodeInfo中获取根节点ID，而不是从formattedNode中
    // 遍历nodeMap，找到对应的nodeInfo
    for (const [id, nodeInfo] of nodeMap) {
      if (nodeInfo.formatted === rootNode) {
        stack.push({
          nodeInfo,
          formattedNode: rootNode,
          depth: 1,
          path: [id]
        });
        break;
      }
    }
  });

  while (stack.length > 0) {
    const { nodeInfo, formattedNode, depth, path } = stack.pop()!;
    
    // 更新最大深度
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    
    // 检查深度限制
    if (depth > maxDepth) {
      console.warn(`节点 "${path.join(' -> ')}" 深度超过限制: ${depth}`);
      continue;
    }

    // 处理子节点
    const childrenInfos = nodeInfo.children;
    
    // 子节点排序
    if (sortChildren && childrenInfos.length > 0) {
      try {
        childrenInfos.sort((a: any, b: any) => 
          sortChildren(a.original, b.original)
        );
      } catch (error) {
        console.warn('子节点排序失败:', error);
      }
    }

    // 构建子节点
    const children: any[] = [];
    for (const childInfo of childrenInfos) {
      const childId = childInfo.original[idKey];
      const childPath = [...path, childId];
      const childDepth = depth + 1;
      
      // 更新子节点深度
      childInfo.depth = childDepth;
      
      // 创建或获取格式化节点
      let childFormatted = childInfo.formatted;
      
      // 计算子节点上下文
      const childContext: NodeContext = {
        level: childDepth,
        path: childPath,
        isLeaf: childInfo.children.length === 0,
        parent: formattedNode,
        childCount: childInfo.children.length
      };
      
      // 应用格式化回调
      if (formatCallback) {
        childFormatted = {
          ...formatCallback(childInfo.original, childContext),
          [childrenKey]: []
        };
      } else if (formatNode) {
        childFormatted = {
          ...formatNode(childInfo.original, childContext),
          [childrenKey]: []
        };
      }
      
      // 设置父ID引用
      childFormatted.__parentId = nodeInfo.original[idKey];
      
      children.push(childFormatted);
      childInfo.formatted = childFormatted;
      
      // 继续处理子节点的子节点
      stack.push({
        nodeInfo: childInfo,
        formattedNode: childFormatted,
        depth: childDepth,
        path: childPath
      });
    }
    
    // 更新当前节点的子节点列表
    formattedNode[childrenKey] = children;
    
    // 更新当前节点的上下文信息
    const currentContext: NodeContext = {
      level: depth,
      path,
      isLeaf: children.length === 0,
      childCount: children.length
    };
    
    // 重新格式化当前节点（如果需要）
    if (formatCallback) {
      Object.assign(formattedNode, formatCallback(nodeInfo.original, currentContext));
      formattedNode[childrenKey] = children; // 保持子节点引用
    } else if (formatNode) {
      Object.assign(formattedNode, formatNode(nodeInfo.original, currentContext));
      formattedNode[childrenKey] = children;
    }
  }

  // 第五步：根节点排序
  if (sortChildren && roots.length > 1) {
    try {
      roots.sort((a, b) => {
        const aId = a[idKey];
        const bId = b[idKey];
        const aInfo = nodeMap.get(aId);
        const bInfo = nodeMap.get(bId);
        
        if (aInfo && bInfo) {
          return sortChildren(aInfo.original, bInfo.original);
        }
        return 0;
      });
    } catch (error) {
      console.warn('根节点排序失败:', error);
    }
  }

  // 计算性能统计
  const endTime = performance.now();
  const endMemory = process.memoryUsage?.()?.heapUsed || 0;
  
  stats.buildTime = endTime - startTime;
  stats.memoryUsed = (endMemory - startMemory) / (1024 * 1024); // 转换为MB

  // 添加统计信息到根节点
  if (roots.length > 0) {
    (roots as any).__stats = stats;
  }

  return roots;
}

/**
 * 循环引用检测函数
 * 使用深度优先搜索检测有向图中的环
 */
function detectCyclesInMap(
  nodeMap: Map<string | number, any>,
  idKey: string
): (string | number)[][] {
  const cycles: (string | number)[][] = [];
  const visited = new Set<string | number>();
  const recursionStack = new Set<string | number>();
  const path: (string | number)[] = [];
  
  // 深度优先搜索检测环
  function dfs(id: string | number) {
    // 如果节点正在递归栈中，说明找到了环
    if (recursionStack.has(id)) {
      const cycleStartIndex = path.indexOf(id);
      if (cycleStartIndex !== -1) {
        cycles.push(path.slice(cycleStartIndex));
      }
      return;
    }
    
    // 如果节点已经访问过，跳过
    if (visited.has(id)) {
      return;
    }
    
    // 标记节点为已访问和在递归栈中
    visited.add(id);
    recursionStack.add(id);
    path.push(id);
    
    // 获取节点的子节点
    const nodeInfo = nodeMap.get(id);
    if (nodeInfo) {
      const parentId = nodeInfo.parentId;
      // 遍历父节点（因为树结构中每个节点只有一个父节点）
      if (parentId !== null && nodeMap.has(parentId) && id !== parentId) {
        dfs(parentId);
      }
    }
    
    // 从递归栈和路径中移除节点
    recursionStack.delete(id);
    path.pop();
  }
  
  // 遍历所有节点
  nodeMap.forEach((nodeInfo, id) => {
    if (!visited.has(id)) {
      dfs(id);
    }
  });
  
  return cycles;
}