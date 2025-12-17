"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEnhancedTree = buildEnhancedTree;
/**
 * 增强树形构建器
 * 支持循环引用检测、节点排序、格式化等高级功能
 */
function buildEnhancedTree(list, options = {}, formatCallback) {
    // 提取配置，分别处理每个属性
    const idKey = options.idKey || 'id';
    const parentKey = options.parentKey || 'parentId';
    const childrenKey = options.childrenKey || 'children';
    const rootParentId = options.rootParentId ?? 0;
    const enableGhostNodes = options.enableGhostNodes || false;
    const validateNodes = options.validateNodes !== false; // 默认为true
    const maxDepth = options.maxDepth || 1000;
    const detectCycles = options.detectCycles || false;
    const onCycleDetected = options.onCycleDetected || ((node, path) => {
        console.warn(`发现循环引用，路径: ${path.join(' -> ')}`);
    });
    const sortChildren = options.sortChildren;
    const formatNode = options.formatNode;
    const isRootNode = options.isRootNode;
    // 性能监控
    const startTime = performance.now();
    const startMemory = process.memoryUsage?.()?.heapUsed || 0;
    const stats = {
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
    const nodeMap = new Map();
    // 根节点列表
    const roots = [];
    // 第一步：收集所有节点
    for (const item of list) {
        const id = item[idKey];
        const parentId = item[parentKey] ?? null;
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
        const initialContext = {
            level: 0,
            path: [id],
            isLeaf: true,
            childCount: 0
        };
        let formattedNode;
        if (formatCallback) {
            formattedNode = formatCallback(item, initialContext);
            formattedNode[childrenKey] = [];
        }
        else if (formatNode) {
            formattedNode = formatNode(item, initialContext);
            formattedNode[childrenKey] = [];
        }
        else {
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
        const cycles = detectCyclesInMap(nodeMap, idKey);
        cycles.forEach((cycle) => {
            stats.cyclesDetected++;
            const cycleNode = nodeMap.get(cycle[0]);
            if (cycleNode) {
                onCycleDetected(cycleNode.original, cycle);
                nodeMap.delete(cycle[0]); // 移除环中的节点
            }
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
        const isRoot = parentId === null ||
            parentId === undefined ||
            parentId === rootParentId;
        if (isRoot) {
            roots.push(nodeInfo.formatted);
            nodeInfo.depth = 1;
            stats.rootNodes++;
        }
        else {
            const parentInfo = nodeMap.get(parentId);
            if (parentInfo) {
                // 父节点存在，正常挂载
                parentInfo.children.push(nodeInfo);
                nodeInfo.formatted.__parentId = parentId;
            }
            else {
                // 父节点不存在
                if (enableGhostNodes) {
                    // 检查是否已经存在这个幽灵节点（在 nodeMap 或 roots 中）
                    const existingGhostNode = nodeMap.get(parentId);
                    if (existingGhostNode) {
                        // 幽灵节点已存在，直接将当前节点添加到其子节点
                        existingGhostNode.children.push(nodeInfo);
                        nodeInfo.formatted.__parentId = parentId;
                        nodeInfo.depth = existingGhostNode.depth + 1;
                    }
                    else {
                        // 创建新的幽灵节点
                        const ghostNode = {
                            [idKey]: parentId,
                            [childrenKey]: [nodeInfo.formatted],
                            __isGhost: true,
                            __parentId: null
                        };
                        const ghostInfo = {
                            original: { [idKey]: parentId },
                            formatted: ghostNode,
                            parentId: null,
                            children: [nodeInfo],
                            depth: 1,
                            isGhost: true
                        };
                        nodeMap.set(parentId, ghostInfo);
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
                }
                else {
                    // 不启用幽灵节点，将当前节点作为根节点
                    roots.push(nodeInfo.formatted);
                    nodeInfo.depth = 1;
                    stats.rootNodes++;
                }
            }
        }
    }
    // 第四步：深度优先计算层级和路径
    const stack = [];
    // 初始化栈
    roots.forEach(rootNode => {
        const rootId = rootNode[idKey];
        const nodeInfo = nodeMap.get(rootId);
        if (nodeInfo) {
            stack.push({
                nodeInfo,
                formattedNode: rootNode,
                depth: 1,
                path: [rootId]
            });
        }
    });
    while (stack.length > 0) {
        const { nodeInfo, formattedNode, depth, path } = stack.pop();
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
                childrenInfos.sort((a, b) => sortChildren(a.original, b.original));
            }
            catch (error) {
                console.warn('子节点排序失败:', error);
            }
        }
        // 构建子节点
        const children = [];
        for (const childInfo of childrenInfos) {
            const childId = childInfo.original[idKey];
            const childPath = [...path, childId];
            const childDepth = depth + 1;
            // 更新子节点深度
            childInfo.depth = childDepth;
            // 创建或获取格式化节点
            let childFormatted = childInfo.formatted;
            // 计算子节点上下文
            const childContext = {
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
            }
            else if (formatNode) {
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
        const currentContext = {
            level: depth,
            path,
            isLeaf: children.length === 0,
            childCount: children.length
        };
        // 重新格式化当前节点（如果需要）
        if (formatCallback) {
            Object.assign(formattedNode, formatCallback(nodeInfo.original, currentContext));
            formattedNode[childrenKey] = children; // 保持子节点引用
        }
        else if (formatNode) {
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
        }
        catch (error) {
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
        roots.__stats = stats;
    }
    return roots;
}
/**
 * 循环引用检测函数
 */
function detectCyclesInMap(nodeMap, idKey) {
    const adjacency = new Map();
    const inDegree = new Map();
    // 初始化图
    nodeMap.forEach((nodeInfo, id) => {
        adjacency.set(id, new Set());
        inDegree.set(id, 0);
    });
    // 构建边
    nodeMap.forEach((nodeInfo, id) => {
        const parentId = nodeInfo.parentId;
        if (parentId !== null && nodeMap.has(parentId) && id !== parentId) {
            adjacency.get(parentId).add(id);
            inDegree.set(id, (inDegree.get(id) || 0) + 1);
        }
    });
    // Kahn算法检测环
    const queue = [];
    const cycles = [];
    // 入度为0的节点入队
    inDegree.forEach((degree, id) => {
        if (degree === 0) {
            queue.push(id);
        }
    });
    // 处理队列
    while (queue.length > 0) {
        const current = queue.shift();
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
    // 找出环中的节点
    const visited = new Set();
    inDegree.forEach((degree, id) => {
        if (degree > 0 && !visited.has(id)) {
            const cycle = [];
            let current = id;
            while (!visited.has(current)) {
                visited.add(current);
                cycle.push(current);
                // 找到下一个在环中的节点
                const neighbors = Array.from(adjacency.get(current) || []);
                for (const neighbor of neighbors) {
                    if (inDegree.get(neighbor) > 0 && !visited.has(neighbor)) {
                        current = neighbor;
                        break;
                    }
                }
            }
            if (cycle.length > 0) {
                cycles.push(cycle);
            }
        }
    });
    return cycles;
}
