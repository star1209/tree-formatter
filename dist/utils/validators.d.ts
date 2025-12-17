import { TreeBuilderConfig } from '../core/types';
/**
 * 验证树形结构
 */
export declare function validateTreeStructure(tree: any[], config?: TreeBuilderConfig): {
    isValid: boolean;
    errors: string[];
};
/**
 * 验证扁平数据
 */
export declare function validateFlatData<T = any>(list: T[], config?: TreeBuilderConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * 检查树中是否存在特定节点
 */
export declare function findNodeInTree(tree: any[], predicate: (node: any) => boolean, config?: TreeBuilderConfig): any | null;
/**
 * 获取树的高度
 */
export declare function getTreeHeight(tree: any[], config?: TreeBuilderConfig): number;
/**
 * 获取树的节点数量
 */
export declare function getTreeNodeCount(tree: any[], config?: TreeBuilderConfig): number;
/**
 * 扁平化树
 */
export declare function flattenTree(tree: any[], config?: TreeBuilderConfig): any[];
