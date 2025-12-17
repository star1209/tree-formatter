import { buildMinimalTree, validateMinimalTree } from '../src/core/minimal';

describe('buildMinimalTree', () => {
  test('should build tree from flat list', () => {
    const flatData = [
      { id: 1, parentId: null, name: 'Root' },
      { id: 2, parentId: 1, name: 'Child 1' },
      { id: 3, parentId: 1, name: 'Child 2' },
      { id: 4, parentId: 2, name: 'Grandchild' }
    ];

    const tree = buildMinimalTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId',
      childrenKey: 'children'
    });

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(1);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].id).toBe(2);
    expect(tree[0].children[1].id).toBe(3);
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe(4);
  });

  test('should handle empty list', () => {
    const tree = buildMinimalTree([], {});
    expect(tree).toHaveLength(0);
  });

  test('should handle ghost nodes when enabled', () => {
    const flatData = [
      { id: 2, parentId: 1, name: 'Child' }
    ];

    const tree = buildMinimalTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId',
      // childrenKey: 'children',
      enableGhostNodes: true
    });

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(1); // 期望：幽灵节点id=1
    expect(tree[0].__isGhost).toBe(true);
    expect(tree[0].children).toHaveLength(1);
  });

  test('should handle duplicate ids by overwriting', () => {
    const flatData = [
      { id: 1, parentId: null, name: 'First' },
      { id: 1, parentId: null, name: 'Second' }
    ];

    const tree = buildMinimalTree(flatData, {
      idKey: 'id',
      parentKey: 'parentId'
    });

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('Second');
  });
});

describe('validateMinimalTree', () => {
  test('should validate a valid tree', () => {
    const tree = [
      {
        id: 1,
        children: [
          { id: 2, children: [] }
        ]
      }
    ];

    const isValid = validateMinimalTree(tree, { idKey: 'id', childrenKey: 'children' });
    expect(isValid).toBe(true);
  });

  test('should invalidate a tree with cycles', () => {
    const tree = [
      {
        id: 1,
        children: [
          { id: 2, children: [] }
        ]
      }
    ];
    // 制造循环引用
    (tree[0].children[0] as any).children = tree;

    const isValid = validateMinimalTree(tree, { idKey: 'id', childrenKey: 'children' });
    expect(isValid).toBe(false);
  });
});