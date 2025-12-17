# Tree Formatter 🌳

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)
[![Tree-Shaking](https://img.shields.io/badge/Tree--Shaking-支持-green.svg)](https://webpack.js.org/guides/tree-shaking/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**高性能、模块化的树形结构构建库**，支持多种构建策略、插件系统和完整TypeScript类型定义。

## ✨ 特性

- 🚀 **极致性能**：优化的算法，支持10万+节点快速构建
- 🧩 **模块化设计**：按需导入，Tree-Shaking友好，打包体积最小化
- 🔌 **插件系统**：可扩展的插件架构，灵活定制功能
- 🧠 **智能策略**：根据数据特征自动选择最优构建算法
- 📊 **性能监控**：内置性能统计和内存使用分析
- 🛡️ **类型安全**：完整的TypeScript支持，完整的IDE提示
- 🔄 **多种构建模式**：支持最小化、增强型、插件化等多种构建方式

## 📦 安装

```bash
# 使用 npm
npm install tree-formatter

# 使用 yarn
yarn add tree-formatter

# 使用 pnpm
pnpm add tree-formatter
```

## 🚀 快速开始

### 简单项目：快速构建树形结构

```typescript
import { createTree } from 'tree-formatter';

const flatData = [
  { id: 1, parentId: null, name: 'Root', order: 1 },
  { id: 2, parentId: 1, name: 'Child 1', order: 2 },
  { id: 3, parentId: 1, name: 'Child 2', order: 3 },
  { id: 4, parentId: 2, name: 'Grandchild', order: 4 }
];

// 简单快速地构建树
const tree = createTree(flatData, {
  idKey: 'id',
  parentKey: 'parentId',
  childrenKey: 'children'
});

console.log(JSON.stringify(tree, null, 2));
// 输出：
// [
//   {
//     "id": 1,
//     "parentId": null,
//     "name": "Root",
//     "order": 1,
//     "children": [
//       {
//         "id": 2,
//         "parentId": 1,
//         "name": "Child 1",
//         "order": 2,
//         "children": [
//           {
//             "id": 4,
//             "parentId": 2,
//             "name": "Grandchild",
//             "order": 4,
//             "children": []
//           }
//         ]
//       },
//       {
//         "id": 3,
//         "parentId": 1,
//         "name": "Child 2",
//         "order": 3,
//         "children": []
//       }
//     ]
//   }
// ]
```

### 大型项目：按需导入优化打包体积

```typescript
// 只导入需要的核心模块，最小化打包体积
import { buildMinimalTree } from 'tree-formatter/core';
import { buildEnhancedTree } from 'tree-formatter/core';

// 最小化构建（对标 row-to-tree，性能最优）
const minimalTree = buildMinimalTree(flatData, {
  idKey: 'id',
  parentKey: 'parentId',
  childrenKey: 'children',
  enableGhostNodes: false
});

// 增强构建（支持循环检测、排序等高级功能）
const enhancedTree = buildEnhancedTree(flatData, {
  idKey: 'id',
  parentKey: 'parentId',
  detectCycles: true, // 启用循环引用检测
  sortChildren: (a, b) => a.order - b.order // 子节点排序
});
```

### 插件化构建：使用构建器模式

```typescript
import { SmartTreeBuilder } from 'tree-formatter/builder';
import { 
  createCycleDetectionPlugin,
  createSortingPlugin,
  createFormattingPlugin
} from 'tree-formatter/plugins';

// 创建智能构建器
const builder = new SmartTreeBuilder({
  idKey: 'id',
  parentKey: 'parentId',
  enableCache: true, // 启用缓存提升性能
  maxDepth: 100 // 限制最大深度
});

// 添加插件链
builder
  .use(createCycleDetectionPlugin({ 
    fixStrategy: 'remove' // 检测到循环引用时移除问题节点
  }))
  .use(createSortingPlugin((a, b) => a.order - b.order, {
    scope: 'all', // 排序所有节点
    recursive: true // 递归排序子节点
  }))
  .use(createFormattingPlugin((node, context) => ({
    ...node,
    level: context.level,
    path: context.path,
    isLeaf: context.isLeaf,
    hasChildren: !context.isLeaf
  })));

// 构建树
const tree = builder.build(flatData);

// 获取构建统计信息
const stats = builder.getStats();
console.log(`构建耗时：${stats[0].buildTime.toFixed(2)}ms`);
console.log(`节点数量：${stats[0].totalNodes}`);
console.log(`最大深度：${stats[0].maxDepth}`);
```

### 完整类型导出：TypeScript友好

```typescript
import { 
  // 核心构建函数
  buildMinimalTree,
  buildEnhancedTree,
  
  // 智能构建器
  SmartTreeBuilder,
  
  // 插件
  createCycleDetectionPlugin,
  createSortingPlugin,
  createFormattingPlugin,
  
  // 类型定义
  TreeBuilderConfig,
  EnhancedTreeConfig,
  NodeContext,
  BuildStats,
  TreePlugin
} from 'tree-formatter';

// 使用完整类型提示
const config: EnhancedTreeConfig = {
  idKey: 'id',
  parentKey: 'parentId',
  detectCycles: true,
  sortChildren: (a, b) => a.order - b.order
};

const tree = buildEnhancedTree(flatData, config);
```

## 📚 详细使用指南

### 1. 核心构建函数

#### `buildMinimalTree` - 最小化构建（对标 row-to-tree）

```typescript
import { buildMinimalTree } from 'tree-formatter/core';

const tree = buildMinimalTree(flatData, {
  idKey: 'id',           // 节点ID字段，默认 'id'
  parentKey: 'parentId', // 父节点ID字段，默认 'parentId'
  childrenKey: 'children', // 子节点字段，默认 'children'
  rootParentId: 0,       // 根节点的父ID值，默认 0
  enableGhostNodes: false, // 是否允许幽灵节点，默认 false
  validateNodes: true,   // 是否验证节点数据，默认 true
  maxDepth: 1000         // 最大树深度，默认 1000
});
```

#### `buildEnhancedTree` - 增强构建（支持高级功能）

```typescript
import { buildEnhancedTree } from 'tree-formatter/core';

const tree = buildEnhancedTree(flatData, {
  // 基础配置
  idKey: 'id',
  parentKey: 'parentId',
  childrenKey: 'children',
  
  // 高级功能
  detectCycles: true, // 循环引用检测
  onCycleDetected: (node, path) => {
    console.warn(`检测到循环引用：${path.join(' -> ')}`);
  },
  sortChildren: (a, b) => a.order - b.order, // 子节点排序
  formatNode: (node, context) => ({
    ...node,
    level: context.level,
    path: context.path
  }), // 节点格式化
  isRootNode: (node) => node.type === 'root', // 自定义根节点判断
  maxDepth: 50 // 限制深度
}, 
// 可选：格式化回调（优先级高于formatNode）
(node, context) => ({
  ...node,
  customField: `Level ${context.level}`
}));
```

### 2. 智能构建器（SmartTreeBuilder）

```typescript
import { SmartTreeBuilder } from 'tree-formatter/builder';

const builder = new SmartTreeBuilder({
  // 基础配置
  idKey: 'id',
  parentKey: 'parentId',
  childrenKey: 'children',
  
  // 性能优化
  enableCache: true, // 启用缓存
  maxDepth: 100,
  
  // 构建策略
  enableGhostNodes: false
});

// 构建树
const tree = builder.build(flatData);

// 获取统计信息
const stats = builder.getStats();

// 清除缓存
builder.clearCache();

// 重置构建器状态
builder.reset();
```

### 3. 插件系统

#### 循环引用检测插件

```typescript
import { createCycleDetectionPlugin } from 'tree-formatter/plugins';

const cyclePlugin = createCycleDetectionPlugin({
  throwOnCycle: false, // 是否抛出错误，默认 false
  fixStrategy: 'remove' // 修复策略：'remove' | 'break' | 'ignore'
});
```

#### 排序插件

```typescript
import { createSortingPlugin, createMultiLevelSorting } from 'tree-formatter/plugins';

// 简单排序
const simpleSortPlugin = createSortingPlugin(
  (a, b) => a.order - b.order,
  {
    scope: 'all', // 'all' | 'root' | 'children'
    recursive: true,
    timing: 'after' // 'during' | 'after'
  }
);

// 多级排序
const multiSortPlugin = createMultiLevelSorting([
  { key: 'type', order: 'asc', type: 'string' },
  { key: 'order', order: 'asc', type: 'number' },
  { key: 'createdAt', order: 'desc', type: 'date' }
]);
```

#### 格式化插件

```typescript
import { createFormattingPlugin, createFieldMapperPlugin } from 'tree-formatter/plugins';

// 自定义格式化
const formatPlugin = createFormattingPlugin(
  (node, context) => ({
    ...node,
    level: context.level,
    isLeaf: context.isLeaf,
    childCount: context.childCount
  }),
  {
    timing: 'both', // 'before' | 'after' | 'both'
    formatChildren: true
  }
);

// 字段映射
const fieldMapperPlugin = createFieldMapperPlugin(
  {
    title: 'name', // 将 name 字段映射为 title
    value: 'id',   // 将 id 字段映射为 value
    fullPath: (node) => node.path?.join('/') // 自定义计算字段
  },
  {
    deleteOriginalFields: false // 是否删除原始字段
  }
);
```

### 4. 工具函数

```typescript
import { 
  validateTreeStructure,
  validateFlatData,
  findNodeInTree,
  flattenTree,
  getTreeHeight,
  getTreeNodeCount
} from 'tree-formatter/utils';

// 验证树结构
const validation = validateTreeStructure(tree, {
  idKey: 'id',
  childrenKey: 'children',
  maxDepth: 100
});

if (validation.isValid) {
  console.log('树结构验证通过');
} else {
  console.error('验证错误:', validation.errors);
}

// 验证扁平数据
const flatValidation = validateFlatData(flatData, {
  idKey: 'id',
  parentKey: 'parentId',
  enableGhostNodes: false
});

// 在树中查找节点
const foundNode = findNodeInTree(tree, 
  node => node.id === 2,
  { childrenKey: 'children' }
);

// 扁平化树
const flattened = flattenTree(tree, {
  idKey: 'id',
  parentKey: 'parentId',
  childrenKey: 'children'
});

// 获取树的高度和节点数
const height = getTreeHeight(tree);
const nodeCount = getTreeNodeCount(tree);
```

### 5. 性能优化

#### 对象池（减少内存分配）

```typescript
import { NodeObjectPool } from 'tree-formatter/utils';

const pool = NodeObjectPool.getInstance();

// 从池中获取节点对象
const node = pool.acquireNode({ id: 1, name: 'Node' });

// 使用后归还
pool.releaseNode(node);

// 获取统计信息
const poolStats = pool.getStats();
```

#### 缓存机制

```typescript
import { SimpleCache, LRUCache } from 'tree-formatter/utils';

// 简单缓存
const simpleCache = new SimpleCache<string, any>(5000); // 5秒TTL
simpleCache.set('key1', tree);
const cachedTree = simpleCache.get('key1');

// LRU缓存（固定大小）
const lruCache = new LRUCache<string, any>(100); // 最多100条
lruCache.set('key2', tree);
```

## 📊 性能对比

| 场景 | 节点数 | 最小化构建 | 增强构建 | 插件化构建 |
|------|--------|------------|----------|------------|
| 小数据 | 100 | ~0.1ms | ~0.3ms | ~0.5ms |
| 中等数据 | 1,000 | ~1ms | ~3ms | ~5ms |
| 大数据 | 10,000 | ~10ms | ~30ms | ~50ms |
| 超大数据 | 100,000 | ~100ms | ~300ms | ~500ms |

## 🔧 配置选项

### TreeBuilderConfig（基础配置）

```typescript
interface TreeBuilderConfig {
  idKey?: string;                    // 节点ID字段，默认 'id'
  parentKey?: string;                // 父节点ID字段，默认 'parentId'
  childrenKey?: string;              // 子节点字段，默认 'children'
  rootParentId?: string | number | null; // 根节点的父ID值，默认 0
  enableGhostNodes?: boolean;        // 是否允许幽灵节点，默认 false
  validateNodes?: boolean;           // 是否验证节点数据，默认 true
  maxDepth?: number;                 // 最大树深度，默认 1000
  enableCache?: boolean;             // 是否缓存结果，默认 false
}
```

### EnhancedTreeConfig（增强配置）

```typescript
interface EnhancedTreeConfig extends TreeBuilderConfig {
  detectCycles?: boolean;            // 是否检测循环引用，默认 false
  onCycleDetected?: (node: any, cyclePath: (string | number)[]) => void;
  sortChildren?: (a: any, b: any) => number; // 子节点排序函数
  formatNode?: (node: any, context: NodeContext) => any; // 节点格式化函数
  isRootNode?: (node: any) => boolean; // 自定义根节点判断函数
}
```

## 🎯 使用场景示例

### 场景1：后端API数据转换

```typescript
// 将数据库查询的扁平数据转换为树形结构
import { buildMinimalTree } from 'tree-formatter/core';

async function getMenuTree() {
  // 从数据库获取扁平数据
  const flatData = await db.query(`
    SELECT id, parent_id as parentId, name, icon, route
    FROM menus
    ORDER BY sort_order
  `);
  
  // 转换为树形结构
  return buildMinimalTree(flatData, {
    idKey: 'id',
    parentKey: 'parentId',
    childrenKey: 'children'
  });
}
```

### 场景2：前端组件树渲染

```typescript
// React/Vue组件树渲染
import { buildEnhancedTree } from 'tree-formatter/core';
import { validateTreeStructure } from 'tree-formatter/utils';

function ComponentTree({ data }) {
  // 构建并验证树
  const tree = buildEnhancedTree(data, {
    idKey: 'id',
    parentKey: 'parentId',
    detectCycles: true,
    sortChildren: (a, b) => a.order - b.order
  });
  
  const validation = validateTreeStructure(tree);
  if (!validation.isValid) {
    return <ErrorComponent errors={validation.errors} />;
  }
  
  return <TreeView data={tree} />;
}
```

### 场景3：大型数据可视化

```typescript
// 处理大量数据的树形可视化
import { SmartTreeBuilder } from 'tree-formatter/builder';
import { createCycleDetectionPlugin } from 'tree-formatter/plugins';

async function renderLargeTree(flatData) {
  const builder = new SmartTreeBuilder({
    idKey: 'id',
    parentKey: 'parentId',
    enableCache: true,
    maxDepth: 50
  });
  
  builder.use(createCycleDetectionPlugin());
  
  // 使用Web Worker处理大数据
  if (flatData.length > 10000) {
    return await processInWorker(flatData, builder);
  }
  
  return builder.build(flatData);
}
```

## 🚨 注意事项

1. **ID字段必须唯一**：确保每个节点的ID字段值是唯一的
2. **循环引用处理**：启用循环引用检测以避免无限递归
3. **内存使用**：处理超大数据时考虑使用增量构建或分页
4. **性能优化**：根据数据量选择合适的构建策略
5. **类型安全**：使用TypeScript以获得完整的类型提示

## 📖 API文档

完整API文档可通过TypeScript类型定义查看，或运行：

```bash
# 生成API文档
npx typedoc --out docs src/
```

## 🤝 贡献

欢迎提交Issue和Pull Request。在提交之前，请确保：

1. 代码通过所有测试：`pnpm test`
2. 代码符合TypeScript规范：`pnpm lint`
3. 添加或更新相关测试用例

## 📄 许可证

MIT License © 2025 Tree Formatter

## 🌟 支持

如果你觉得这个库有用，请：

1. ⭐ Star 这个项目
2. 📢 分享给其他开发者
3. 🐛 报告问题
4. 💡 提出新功能建议

---

**Tree Formatter** - 让树形数据处理变得简单高效！