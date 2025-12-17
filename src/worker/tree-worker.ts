// Web Worker 实现，用于在后台线程中处理大数据量的树形构建

// 避免复杂的类型声明，使用简单类型
interface WorkerMessage {
  id: string;
  type: string;
  payload: {
    data: any[];
    options?: any;
    config?: any;
  };
}

// 树构建函数（简单版本，避免动态导入问题）
function buildSimpleTree(data: any[], options: any = {}): any[] {
  const idKey = options.idKey || 'id';
  const parentKey = options.parentKey || 'parentId';
  const childrenKey = options.childrenKey || 'children';
  const rootParentId = options.rootParentId ?? 0;
  
  const map = new Map<string | number, any>();
  const roots: any[] = [];

  // 创建所有节点
  for (const item of data) {
    const id = item[idKey];
    if (id === undefined || id === null) continue;
    
    map.set(id, {
      ...item,
      [childrenKey]: []
    });
  }

  // 建立父子关系
  for (const item of data) {
    const id = item[idKey];
    const parentId = item[parentKey] ?? null;
    
    const node = map.get(id);
    if (!node) continue;

    if (parentId === null || parentId === rootParentId) {
      roots.push(node);
    } else {
      const parent = map.get(parentId);
      if (parent) {
        parent[childrenKey].push(node);
      } else {
        // 父节点不存在，作为根节点
        roots.push(node);
      }
    }
  }

  return roots;
}

// 验证树结构
function validateTreeStructure(tree: any[], config: any = {}): any {
  const startTime = Date.now();
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const visitedIds = new Set<string | number>();
  
  const idKey = config.idKey || 'id';
  const childrenKey = config.childrenKey || 'children';
  const maxDepth = config.maxDepth || 1000;
  
  function validateNode(node: any, depth: number, path: string[]): void {
    const nodeId = node[idKey];
    
    if (nodeId === undefined || nodeId === null) {
      errors.push(`节点缺少ID字段 "${idKey}"，路径: ${path.join(' -> ')}`);
      return;
    }
    
    if (visitedIds.has(nodeId)) {
      errors.push(`发现循环引用，节点ID: ${nodeId}，路径: ${path.join(' -> ')}`);
      return;
    }
    
    visitedIds.add(nodeId);
    
    if (depth > maxDepth) {
      warnings.push(`节点深度超过限制: ${depth}，节点ID: ${nodeId}，路径: ${path.join(' -> ')}`);
    }
    
    const children = node[childrenKey];
    if (children && Array.isArray(children)) {
      for (const child of children) {
        validateNode(child, depth + 1, [...path, String(nodeId)]);
      }
    }
    
    visitedIds.delete(nodeId);
  }
  
  try {
    for (let i = 0; i < tree.length; i++) {
      validateNode(tree[i], 1, [`根节点${i}`]);
    }
  } catch (error) {
    errors.push(`验证过程中发生错误: ${error}`);
  }
  
  const endTime = Date.now();
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    processingTime: endTime - startTime
  };
}

// 扁平化树
function flattenTree(tree: any[], config: any = {}): any[] {
  const startTime = Date.now();
  
  const result: any[] = [];
  const childrenKey = config.childrenKey || 'children';
  const idKey = config.idKey || 'id';
  const parentKey = config.parentKey || 'parentId';
  
  function traverse(node: any, parentId: string | number | null = null): void {
    const nodeCopy = { ...node };
    const children = nodeCopy[childrenKey];
    
    delete nodeCopy[childrenKey];
    
    if (parentId !== null) {
      nodeCopy[parentKey] = parentId;
    }
    
    result.push(nodeCopy);
    
    if (children && children.length > 0) {
      for (const child of children) {
        traverse(child, node[idKey]);
      }
    }
  }
  
  for (const node of tree) {
    traverse(node);
  }
  
  const endTime = Date.now();
  
  return result;
}

// 处理消息
addEventListener('message', async function(event: MessageEvent) {
  const message = event.data as WorkerMessage;
  
  try {
    let result: any;
    let stats: any;
    
    switch (message.type) {
      case 'build':
        const startTime = Date.now();
        result = buildSimpleTree(message.payload.data, message.payload.options);
        const endTime = Date.now();
        stats = {
          processingTime: endTime - startTime,
          dataSize: message.payload.data.length
        };
        break;
        
      case 'validate':
        result = validateTreeStructure(message.payload.data, message.payload.config);
        break;
        
      case 'flatten':
        result = flattenTree(message.payload.data, message.payload.config);
        break;
        
      default:
        throw new Error(`未知的消息类型: ${message.type}`);
    }
    
    const response = {
      id: message.id,
      type: message.type,
      success: true,
      result,
      stats
    };
    
    postMessage(response);
    
  } catch (error) {
    const response = {
      id: message.id,
      type: message.type,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    postMessage(response);
  }
});

// 发送初始化完成消息
postMessage({
  id: 'init',
  type: 'init',
  success: true,
  result: { message: 'Tree Worker 已初始化' }
});