"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
/**
 * 插件管理器
 */
class PluginManager {
    constructor() {
        this.plugins = new Map();
    }
    /**
     * 注册插件
     */
    register(plugin) {
        if (this.plugins.has(plugin.name)) {
            console.warn(`插件 "${plugin.name}" 已存在，将被覆盖`);
        }
        this.plugins.set(plugin.name, plugin);
    }
    /**
     * 取消注册插件
     */
    unregister(pluginName) {
        return this.plugins.delete(pluginName);
    }
    /**
     * 获取插件
     */
    getPlugin(pluginName) {
        return this.plugins.get(pluginName);
    }
    /**
     * 获取所有插件
     */
    getAllPlugins() {
        return Array.from(this.plugins.values())
            .sort((a, b) => (a.priority || 100) - (b.priority || 100));
    }
    /**
     * 应用节点创建钩子
     */
    applyNodeCreated(node, context) {
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
    applyNodeLinked(parent, child, context) {
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
    applyTreeBuilt(tree, context) {
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
    clear() {
        this.plugins.clear();
    }
    /**
     * 获取插件数量
     */
    get count() {
        return this.plugins.size;
    }
}
exports.PluginManager = PluginManager;
