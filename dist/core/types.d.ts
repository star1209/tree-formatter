/**
 * 基础树形构建配置
 */
export interface TreeBuilderConfig<T = any> {
    /** 节点ID字段名，默认 'id' */
    idKey?: string;
    /** 父节点ID字段名，默认 'parentId' */
    parentKey?: string;
    /** 子节点字段名，默认 'children' */
    childrenKey?: string;
    /** 根节点的父ID值，默认 0 */
    rootParentId?: string | number | null;
    /** 是否允许幽灵节点（不存在的父节点），默认 false */
    enableGhostNodes?: boolean;
    /** 是否验证节点数据，默认 true */
    validateNodes?: boolean;
    /** 最大树深度，默认 1000 */
    maxDepth?: number;
    /** 是否缓存结果，默认 false */
    enableCache?: boolean;
}
/**
 * 增强树形构建配置
 */
export interface EnhancedTreeConfig<T = any> extends TreeBuilderConfig<T> {
    /** 是否检测循环引用，默认 false */
    detectCycles?: boolean;
    /** 循环引用检测回调 */
    onCycleDetected?: (node: T, cyclePath: (string | number)[]) => void;
    /** 子节点排序函数 */
    sortChildren?: ((a: T, b: T) => number);
    /** 节点格式化函数 */
    formatNode?: ((node: T, context: NodeContext) => any);
    /** 是否为根节点的自定义判断函数 */
    isRootNode?: (node: T) => boolean;
}
/**
 * 节点上下文信息
 */
export interface NodeContext {
    /** 节点层级（从1开始） */
    level: number;
    /** 从根节点到当前节点的ID路径 */
    path: (string | number)[];
    /** 是否为叶子节点 */
    isLeaf: boolean;
    /** 父节点（如果存在） */
    parent?: any;
    /** 子节点数量 */
    childCount: number;
}
/**
 * 插件接口
 */
export interface TreePlugin<T = any> {
    /** 插件名称 */
    name: string;
    /** 执行优先级（数字越小越先执行） */
    priority?: number;
    /** 节点创建时调用 */
    onNodeCreated?: (node: T, context: NodeContext) => void;
    /** 节点链接到父节点时调用 */
    onNodeLinked?: (parent: T, child: T, context: NodeContext) => boolean | void;
    /** 树构建完成后调用 */
    onTreeBuilt?: (tree: T[], context: {
        originalList: T[];
    }) => T[] | void;
}
/**
 * 构建统计信息
 */
export interface BuildStats {
    /** 总节点数 */
    totalNodes: number;
    /** 根节点数 */
    rootNodes: number;
    /** 最大深度 */
    maxDepth: number;
    /** 构建耗时（毫秒） */
    buildTime: number;
    /** 内存使用（MB） */
    memoryUsed: number;
    /** 循环引用数量 */
    cyclesDetected: number;
    /** 幽灵节点数量 */
    ghostNodesCreated: number;
    /** 是否缓存命中 */
    cacheHit?: boolean;
}
