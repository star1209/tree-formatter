import { TreePlugin } from '../core/types';

/**
 * 幽灵节点处理插件
 */
export function createGhostNodesPlugin(options: {
  /** 是否创建幽灵节点，默认 true */
  createGhostNodes?: boolean;
  /** 幽灵节点标记字段，默认 '__isGhost' */
  ghostField?: string;
} = {}): TreePlugin {
  const config = {
    createGhostNodes: true,
    ghostField: '__isGhost',
    ...options
  };
  
  return {
    name: 'ghost-nodes',
    priority: 20,
    
    onNodeLinked(parent: any, child: any): boolean {
      // 如果父节点不存在且启用了幽灵节点，允许链接
      return config.createGhostNodes;
    }
  };
}