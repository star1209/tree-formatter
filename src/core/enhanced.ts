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

    // 存储原始节点信息
    nodeMap.set(id, {
      original: item,
      formatted: null,
      parentId,
      children: [],
      depth: 0
    });
  }

  stats.totalNodes = nodeMap.size;

  // 第二步：检测循环引用（如果需要）
  if (detectCycles && nodeMap.size > 0) {
    // 使用深度优先搜索检测循环引用
    const visited = new Set<string | number>();
    const recursionStack = new Set<string | number>();
    const path: (string | number)[] = [];
    
    // 深度优先搜索函数
    function dfs(id: string | number) {
      // 如果节点正在递归栈中，说明找到了循环
      if (recursionStack.has(id)) {
        const cycleStartIndex = path.indexOf(id);
        if (cycleStartIndex !== -1) {
          const cyclePath = path.slice(cycleStartIndex);
          onCycleDetected(nodeMap.get(id)!.original, cyclePath);
          stats.cyclesDetected++;
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
      
      // 获取节点的父节点
      const nodeInfo = nodeMap.get(id);
      if (nodeInfo && nodeInfo.parentId !== null) {
        const parentId = nodeInfo.parentId;
        if (nodeMap.has(parentId) && id !== parentId) {
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
  }

  // 第三步：建立父子关系映射
  const childrenMap = new Map<string | number, any[]>();
  for (const [id, nodeInfo] of nodeMap) {
    const { parentId } = nodeInfo;
    
    // 跳过自引用节点
    if (id === parentId) {
      continue;
    }
    
    // 非根节点，寻找父节点
    if (parentId !== null && parentId !== undefined) {
      const parentInfo = nodeMap.get(parentId);
      if (parentInfo) {
        // 父节点存在，建立关系映射
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(nodeInfo);
      } else if (enableGhostNodes) {
        // 父节点不存在，创建幽灵节点
        const ghostId = parentId;
        const ghostInfo = {
          original: { [idKey]: ghostId } as T,
          formatted: null,
          parentId: null,
          children: [],
          depth: 0,
          isGhost: true
        };
        
        nodeMap.set(ghostId, ghostInfo);
        
        // 建立幽灵节点与子节点的关系映射
        if (!childrenMap.has(ghostId)) {
          childrenMap.set(ghostId, []);
        }
        childrenMap.get(ghostId)!.push(nodeInfo);
        
        stats.ghostNodesCreated++;
      }
    }
  }

  // 第四步：深度优先遍历构建树结构并格式化节点
  const roots: R[] = [];
  const stack: Array<{
    nodeInfo: any;
    parentFormatted: any | null;
    depth: number;
    path: (string | number)[];
  }> = [];
  
  // 收集所有根节点 - 确保每个节点只被处理一次
  const processedNodeIds = new Set<string | number>();
  
  // 识别真正的根节点
  const rootNodes: any[] = [];
  
  // 只将真正的根节点添加到栈中
  // 根节点的定义：
  // 1. 使用自定义根节点判断函数返回true的节点
  // 2. 父节点为rootParentId的节点
  // 3. 没有父节点的节点
  nodeMap.forEach((nodeInfo, id) => {
    const { parentId, isGhost } = nodeInfo;
    
    let isRoot = false;
    if (isRootNode) {
      // 使用自定义根节点判断函数
      isRoot = isRootNode(nodeInfo.original);
    } else {
      // 只有当节点的父节点为rootParentId或不存在时，才是根节点
      isRoot = (parentId === null || parentId === undefined || parentId === rootParentId);
    }
    
    if (isRoot) {
      rootNodes.push({ nodeInfo, id });
      stats.rootNodes++;
    }
  });
  
  // 按照 ID 排序根节点
  rootNodes.sort((a, b) => {
    return (a.id as number) - (b.id as number);
  });
  
  // 初始化栈，处理所有根节点
  // 反转根节点顺序，确保弹出顺序正确
  for (let i = rootNodes.length - 1; i >= 0; i--) {
    const { nodeInfo, id } = rootNodes[i];
    stack.push({
      nodeInfo,
      parentFormatted: null,
      depth: 1,
      path: [id]
    });
  }
  
  // 深度优先遍历
  while (stack.length > 0) {
    const { nodeInfo, parentFormatted, depth, path } = stack.pop()!;
    
    // 更新最大深度
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    
    // 检查深度限制
    if (depth > maxDepth) {
      console.warn(`节点 "${path.join(' -> ')}" 深度超过限制: ${depth}`);
      continue;
    }

    // 获取节点ID
    const nodeId = nodeInfo.original[idKey];
    
    // 如果节点已经处理过，跳过
    if (processedNodeIds.has(nodeId)) {
      continue;
    }
    
    // 标记节点为已处理
    processedNodeIds.add(nodeId);

    // 计算节点上下文 - 确保父节点不包含子节点，避免循环引用
    let safeParent: any = null;
    if (parentFormatted) {
      // 创建父节点的安全副本，移除子节点引用，避免循环引用
      safeParent = { ...parentFormatted };
      // 移除子节点引用，避免循环引用
      if (safeParent[childrenKey]) {
        delete safeParent[childrenKey];
      }
    }
    
    // 使用childrenMap获取子节点列表
    const children = childrenMap.get(nodeId) || [];
    
    const context: NodeContext = {
      level: depth,
      path: path,
      isLeaf: children.length === 0,
      parent: safeParent,
      childCount: children.length
    };
    
    // 格式化节点 - 只格式化一次
    let formattedNode: any;
    if (formatCallback) {
      formattedNode = formatCallback(nodeInfo.original, context);
    } else if (formatNode) {
      formattedNode = formatNode(nodeInfo.original, context);
    } else {
      formattedNode = { ...nodeInfo.original };
    }
    
    // 设置幽灵节点标记
    if (nodeInfo.isGhost) {
      formattedNode.__isGhost = true;
    }
    
    // 设置父ID引用
    if (nodeInfo.parentId) {
      formattedNode.__parentId = nodeInfo.parentId;
    } else {
      formattedNode.__parentId = null;
    }
    
    // 初始化子节点数组
    formattedNode[childrenKey] = [];
    
    // 更新nodeMap中的格式化节点
    nodeInfo.formatted = formattedNode;
    
    // 如果是根节点，添加到结果列表
    if (!parentFormatted) {
      roots.push(formattedNode as R);
    }
    
    // 子节点排序
    if (sortChildren && children.length > 0) {
      try {
        children.sort((a: any, b: any) => 
          sortChildren(a.original, b.original)
        );
      } catch (error) {
        console.warn('子节点排序失败:', error);
      }
    }
    
    // 处理子节点 - 逆序压入栈，保证顺序正确
    for (let i = children.length - 1; i >= 0; i--) {
      const childInfo = children[i];
      const childId = childInfo.original[idKey];
      const childPath = [...path, childId];
      const childDepth = depth + 1;
      
      stack.push({
        nodeInfo: childInfo,
        parentFormatted: formattedNode,
        depth: childDepth,
        path: childPath
      });
    }
  }
  
  // 第五步：二次遍历，构建完整的子节点关系
  // 注意：这里不需要重新格式化节点，只需要构建子节点列表
  
  // 创建一个映射，将formattedNode映射到原始ID，因为childrenMap使用原始ID作为键
  const formattedNodeToOriginalIdMap = new Map();
  nodeMap.forEach((nodeInfo, originalId) => {
    if (nodeInfo.formatted) {
      formattedNodeToOriginalIdMap.set(nodeInfo.formatted, originalId);
    }
  });
  
  const stack2: any[] = [...roots];
  while (stack2.length > 0) {
    const formattedNode = stack2.pop();
    
    // 获取当前节点的原始ID
    const originalId = formattedNodeToOriginalIdMap.get(formattedNode);
    
    // 构建子节点列表，使用childrenMap获取子节点
    const children: any[] = [];
    const childInfos = childrenMap.get(originalId) || [];
    for (const childInfo of childInfos) {
      if (childInfo.formatted) {
        children.push(childInfo.formatted);
        stack2.push(childInfo.formatted);
      }
    }
    
    // 更新当前节点的子节点列表
    formattedNode[childrenKey] = children;
  }

  // 计算性能统计
  const endTime = performance.now();
  const endMemory = process.memoryUsage?.()?.heapUsed || 0;
  
  stats.buildTime = endTime - startTime;
  stats.memoryUsed = (endMemory - startMemory) / (1024 * 1024); // 转换为MB

  // 将统计信息添加到结果树中
  (roots as any).__stats = stats;

  // 返回结果
  return roots;
}

