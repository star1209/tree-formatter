import { TreePlugin, NodeContext } from '../core/types';

/**
 * 节点格式化插件
 */
export function createFormattingPlugin(
  formatFn: (node: any, context: NodeContext) => any,
  options: {
    /** 格式化时机：'before' | 'after' | 'both'，默认 'both' */
    timing?: 'before' | 'after' | 'both';
    /** 是否格式化子节点，默认 true */
    formatChildren?: boolean;
  } = {}
): TreePlugin {
  const config = {
    timing: 'both' as const,
    formatChildren: true,
    ...options
  };
  
  return {
    name: 'formatting',
    priority: 30,
    
    onNodeCreated(node: any, context: NodeContext): void {
      if (config.timing === 'before' || config.timing === 'both') {
        const formatted = formatFn(node, context);
        Object.assign(node, formatted);
      }
    },
    
    onTreeBuilt(tree: any[], context: { originalList: any[] }): any[] {
      if (config.timing === 'after' || config.timing === 'both') {
        return formatTree(tree, formatFn, config);
      }
      return tree;
    }
  };
}

/**
 * 格式化整棵树
 */
function formatTree(
  tree: any[],
  formatFn: (node: any, context: NodeContext) => any,
  config: { formatChildren: boolean }
): any[] {
  const formatNodeRecursive = (node: any, level: number = 1, path: (string | number)[] = []): any => {
    const nodePath = [...path, node.id || ''];
    const isLeaf = !node.children || node.children.length === 0;
    
    const context: NodeContext = {
      level,
      path: nodePath,
      isLeaf,
      parent: undefined,
      childCount: node.children ? node.children.length : 0
    };
    
    const formattedNode = formatFn(node, context);
    
    const result = {
      ...formattedNode,
      children: node.children || []
    };
    
    // 递归格式化子节点
    if (config.formatChildren && result.children && result.children.length > 0) {
      result.children = result.children.map((child: any) => 
        formatNodeRecursive(child, level + 1, nodePath)
      );
    }
    
    return result;
  };
  
  return tree.map(node => formatNodeRecursive(node));
}

/**
 * 创建字段映射插件
 */
export function createFieldMapperPlugin(
  fieldMappings: Record<string, string | ((node: any) => any)>,
  options: {
    /** 是否删除原始字段，默认 false */
    deleteOriginalFields?: boolean;
  } = {}
): TreePlugin {
  const config = {
    deleteOriginalFields: false,
    ...options
  };
  
  const formatFn = (node: any) => {
    const result = { ...node };
    
    Object.entries(fieldMappings).forEach(([newField, oldFieldOrFn]) => {
      if (typeof oldFieldOrFn === 'function') {
        result[newField] = oldFieldOrFn(node);
      } else {
        result[newField] = node[oldFieldOrFn];
        if (config.deleteOriginalFields && newField !== oldFieldOrFn) {
          delete result[oldFieldOrFn];
        }
      }
    });
    
    return result;
  };
  
  return createFormattingPlugin(formatFn, { timing: 'both', formatChildren: true });
}