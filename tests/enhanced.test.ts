import { buildEnhancedTree } from '../src/core/enhanced';

// 定义测试专用的树节点接口
interface TestTreeNode {
  id: number;
  parentId?: number | null;
  name: string;
  order?: number;
  type?: string;
  level?: number;
  path?: (string | number)[];
  isLeaf?: boolean;
  fullPath?: string;
  __isGhost?: boolean;
  __parentId?: number | null;
  __stats?: any; // 用于存放统计信息
  // 最重要的是，声明 children 属性
  children?: TestTreeNode[];
}

describe('buildEnhancedTree', () => {
  test('should build tree with cycle detection', () => {
    const flatData = [
      { id: 1, parentId: 3, name: 'Node 1' },
      { id: 2, parentId: 1, name: 'Node 2' },
      { id: 3, parentId: 2, name: 'Node 3' } // 形成循环: 1 -> 2 -> 3 -> 1
    ];

    const onCycleDetected = jest.fn();

    const tree = buildEnhancedTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId',
      detectCycles: true,
      onCycleDetected
    })as TestTreeNode[];

    expect(onCycleDetected).toHaveBeenCalled();
    // 循环节点应该被移除，树可能为空或只包含非循环节点
    expect(tree).toBeDefined();
  });

  test('should sort children correctly', () => {
    const flatData = [
      { id: 1, parentId: null, order: 2, name: 'Root' },
      { id: 2, parentId: 1, order: 3, name: 'Child 1' },
      { id: 3, parentId: 1, order: 1, name: 'Child 2' },
      { id: 4, parentId: 1, order: 2, name: 'Child 3' }
    ];

    const tree = buildEnhancedTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId',
      sortChildren: (a, b) => a.order - b.order
    })as TestTreeNode[];

    expect(tree).toHaveLength(1);
    expect((tree[0] as any).children).toHaveLength(3);
    expect((tree[0] as any).children[0].id).toBe(3); // order: 1
    expect((tree[0] as any).children[1].id).toBe(4); // order: 2
    expect((tree[0] as any).children[2].id).toBe(2); // order: 3
  });

  test('should format nodes with context', () => {
    const flatData = [
      { id: 1, parentId: null, name: 'Root' },
      { id: 2, parentId: 1, name: 'Child' },
      { id: 3, parentId: 2, name: 'Grandchild' }
    ];

    const tree = buildEnhancedTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId'
    }, (node, context) => ({
      ...node,
      level: context.level,
      path: context.path,
      isLeaf: context.isLeaf,
      fullPath: context.path.join(' -> ')
    }))as TestTreeNode[];

    expect(tree[0].level).toBe(1);
    expect(tree[0].isLeaf).toBe(false);
    expect(tree[0].path).toEqual([1]);
    expect(tree[0].fullPath).toBe('1');
    
    expect((tree[0] as any).children[0].level).toBe(2);
    expect((tree[0] as any).children[0].isLeaf).toBe(false);
    expect((tree[0] as any).children[0].path).toEqual([1, 2]);
    
    expect((tree[0] as any).children[0].children[0].level).toBe(3);
    expect((tree[0] as any).children[0].children[0].isLeaf).toBe(true);
    expect((tree[0] as any).children[0].children[0].path).toEqual([1, 2, 3]);
  });

  test('should handle custom root parent ID', () => {
    const flatData = [
      { id: 1, parentId: -1, name: 'Root' },
      { id: 2, parentId: 1, name: 'Child' }
    ];

    const tree = buildEnhancedTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId',
      rootParentId: -1
    })as TestTreeNode[];

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(1);
    expect(tree[0].children).toHaveLength(1);
  });

  test('should handle ghost nodes when enabled', () => {
    const flatData = [
      { id: 2, parentId: 1, name: 'Child' }
    ];

    const tree = buildEnhancedTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId',
      enableGhostNodes: true
    }) as TestTreeNode[];

    console.log('构建的树结构:', JSON.stringify(tree, null, 2));
    console.log('树长度:', tree.length);
    console.log('第一个节点id:', tree[0]?.id);
    console.log('第一个节点是否有__isGhost属性:', tree[0]?.__isGhost);
    console.log('第一个节点的children:', tree[0]?.children);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(1);
    expect(tree[0].__isGhost).toBe(true);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children![0].id).toBe(2);
  });

  test('should handle isRootNode function', () => {
    const flatData = [
      { id: 1, type: 'root', name: 'Root 1' },
      { id: 2, type: 'child', parentId: 1, name: 'Child 1' },
      { id: 3, type: 'root', name: 'Root 2' }
    ];

    const tree = buildEnhancedTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId',
      isRootNode: (node: any) => node.type === 'root'
    })as TestTreeNode[];

    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe(1);
    expect(tree[1].id).toBe(3);
    expect(tree[0].children).toHaveLength(1);
    // 空的 children 属性应该被删除
    expect(tree[1].children).toBeUndefined();
  });

  test('should include build statistics', () => {
    const flatData = [
      { id: 1, parentId: null, name: 'Root' },
      { id: 2, parentId: 1, name: 'Child 1' },
      { id: 3, parentId: 1, name: 'Child 2' }
    ];

    const tree = buildEnhancedTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId'
    })as TestTreeNode[];

    expect((tree as any).__stats).toBeDefined();
    const stats = (tree as any).__stats;
    expect(stats.totalNodes).toBe(3);
    expect(stats.rootNodes).toBe(1);
    expect(stats.maxDepth).toBe(2);
    expect(stats.buildTime).toBeGreaterThan(0);
  });

  test('should handle deep nesting', () => {
    const flatData = [];
    const depth = 10;
    
    // 创建深度嵌套的数据
    for (let i = 1; i <= depth; i++) {
      flatData.push({
        id: i,
        parentId: i === 1 ? null : i - 1,
        name: `Level ${i}`
      });
    }

    const tree = buildEnhancedTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId',
      maxDepth: 15
    })as TestTreeNode[];

    expect(tree).toHaveLength(1);
    
    // 检查深度
    let currentNode = tree[0];
    let actualDepth = 1;
    
    while (currentNode.children && currentNode.children.length > 0) {
      currentNode = currentNode.children[0];
      actualDepth++;
    }
    
    expect(actualDepth).toBe(depth);
  });

  test('should handle self-referencing nodes', () => {
    const flatData = [
      { id: 1, parentId: 1, name: 'Self referencing' } // 自引用
    ];

    const onCycleDetected = jest.fn();

    const tree = buildEnhancedTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId',
      detectCycles: true,
      onCycleDetected
    })as TestTreeNode[];

    expect(onCycleDetected).toHaveBeenCalled();
    // 自引用节点应该被移除
    expect(tree).toHaveLength(0);
  });
});

describe('Performance tests for enhanced builder', () => {
  test('should handle large datasets with cycles detection', () => {
    const largeData = [];
    const nodeCount = 5000;
    
    for (let i = 1; i <= nodeCount; i++) {
      largeData.push({
        id: i,
        parentId: i === 1 ? null : Math.floor(Math.random() * (i - 1)) + 1,
        name: `Node ${i}`,
        order: Math.floor(Math.random() * 1000)
      });
    }

    const startTime = performance.now();
    const tree = buildEnhancedTree(largeData, {
      idKey: 'id',
      parentKey: 'parentId',
      detectCycles: true,
      sortChildren: (a, b) => a.order - b.order
    })as TestTreeNode[];
    const endTime = performance.now();

    expect(tree).toBeDefined();
    
    const buildTime = endTime - startTime;
    console.log(`增强构建 ${nodeCount} 个节点耗时: ${buildTime.toFixed(2)}ms`);
    
    // 增强构建可能更慢，但应该在合理范围内
    expect(buildTime).toBeLessThan(2000);
  });
});