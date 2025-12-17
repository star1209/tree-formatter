import { TreePlugin, NodeContext } from '../core/types';
/**
 * 插件管理器
 */
export declare class PluginManager<T = any> {
    private plugins;
    /**
     * 注册插件
     */
    register(plugin: TreePlugin<T>): void;
    /**
     * 取消注册插件
     */
    unregister(pluginName: string): boolean;
    /**
     * 获取插件
     */
    getPlugin(pluginName: string): TreePlugin<T> | undefined;
    /**
     * 获取所有插件
     */
    getAllPlugins(): TreePlugin<T>[];
    /**
     * 应用节点创建钩子
     */
    applyNodeCreated(node: T, context: NodeContext): T;
    /**
     * 应用节点链接钩子
     */
    applyNodeLinked(parent: T, child: T, context: NodeContext): boolean;
    /**
     * 应用树构建完成钩子
     */
    applyTreeBuilt(tree: T[], context: {
        originalList: T[];
    }): T[];
    /**
     * 清除所有插件
     */
    clear(): void;
    /**
     * 获取插件数量
     */
    get count(): number;
}
