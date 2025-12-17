import { TreePlugin, NodeContext } from '../core/types';

/**
 * 插件管理器
 */
export class PluginManager<T = any> {
  private plugins: Map<string, TreePlugin<T>> = new Map();
  
  /**
   * 注册插件
   */
  register(plugin: TreePlugin<T>): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`插件 "${plugin.name}" 已存在，将被覆盖`);
    }
    this.plugins.set(plugin.name, plugin);
  }
  
  /**
   * 取消注册插件
   */
  unregister(pluginName: string): boolean {
    return this.plugins.delete(pluginName);
  }
  
  /**
   * 获取插件
   */
  getPlugin(pluginName: string): TreePlugin<T> | undefined {
    return this.plugins.get(pluginName);
  }
  
  /**
   * 获取所有插件
   */
  getAllPlugins(): TreePlugin<T>[] {
    return Array.from(this.plugins.values())
      .sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }
  
  /**
   * 应用节点创建钩子
   */
  applyNodeCreated(node: T, context: NodeContext): T {
    let result = node;
    
    for (const plugin of this.getAllPlugins()) {
      if (plugin.onNodeCreated) {
        plugin.onNodeCreated(result, context);
      }
    }
    
    return result;
  }
  
  /**
   * 应用节点链接钩子
   */
  applyNodeLinked(parent: T, child: T, context: NodeContext): boolean {
    let allowLink = true;
    
    for (const plugin of this.getAllPlugins()) {
      if (plugin.onNodeLinked) {
        const result = plugin.onNodeLinked(parent, child, context);
        if (result === false) {
          allowLink = false;
          break;
        }
      }
    }
    
    return allowLink;
  }
  
  /**
   * 应用树构建完成钩子
   */
  applyTreeBuilt(tree: T[], context: { originalList: T[] }): T[] {
    let result = tree;
    
    for (const plugin of this.getAllPlugins()) {
      if (plugin.onTreeBuilt) {
        const pluginResult = plugin.onTreeBuilt(result, context);
        if (pluginResult) {
          result = pluginResult;
        }
      }
    }
    
    return result;
  }
  
  /**
   * 清除所有插件
   */
  clear(): void {
    this.plugins.clear();
  }
  
  /**
   * 获取插件数量
   */
  get count(): number {
    return this.plugins.size;
  }
}