import { TreePlugin, NodeContext } from '../core/types';
/**
 * 节点格式化插件
 */
export declare function createFormattingPlugin(formatFn: (node: any, context: NodeContext) => any, options?: {
    /** 格式化时机：'before' | 'after' | 'both'，默认 'both' */
    timing?: 'before' | 'after' | 'both';
    /** 是否格式化子节点，默认 true */
    formatChildren?: boolean;
}): TreePlugin;
/**
 * 创建字段映射插件
 */
export declare function createFieldMapperPlugin(fieldMappings: Record<string, string | ((node: any) => any)>, options?: {
    /** 是否删除原始字段，默认 false */
    deleteOriginalFields?: boolean;
}): TreePlugin;
