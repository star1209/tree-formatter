import { TreePlugin } from '../core/types';
/**
 * 幽灵节点处理插件
 */
export declare function createGhostNodesPlugin(options?: {
    /** 是否创建幽灵节点，默认 true */
    createGhostNodes?: boolean;
    /** 幽灵节点标记字段，默认 '__isGhost' */
    ghostField?: string;
}): TreePlugin;
