"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DESCRIPTION = exports.AUTHOR = exports.VERSION = exports.createMultiLevelSorting = exports.createSortingPlugin = exports.createTopologicalDetector = exports.createCycleDetectionPlugin = exports.PluginManager = exports.SmartTreeBuilder = exports.validateMinimalTree = exports.buildEnhancedTree = exports.buildMinimalTree = void 0;
exports.createTree = createTree;
exports.createAdvancedTree = createAdvancedTree;
exports.createPluginTreeBuilder = createPluginTreeBuilder;
const smart_1 = require("./builder/smart");
const enhanced_1 = require("./core/enhanced");
const minimal_1 = require("./core/minimal");
// 导出核心功能
var minimal_2 = require("./core/minimal");
Object.defineProperty(exports, "buildMinimalTree", { enumerable: true, get: function () { return minimal_2.buildMinimalTree; } });
var enhanced_2 = require("./core/enhanced");
Object.defineProperty(exports, "buildEnhancedTree", { enumerable: true, get: function () { return enhanced_2.buildEnhancedTree; } });
var minimal_3 = require("./core/minimal");
Object.defineProperty(exports, "validateMinimalTree", { enumerable: true, get: function () { return minimal_3.validateMinimalTree; } });
// 导出构建器
var smart_2 = require("./builder/smart");
Object.defineProperty(exports, "SmartTreeBuilder", { enumerable: true, get: function () { return smart_2.SmartTreeBuilder; } });
// 导出插件
var plugins_1 = require("./plugins");
Object.defineProperty(exports, "PluginManager", { enumerable: true, get: function () { return plugins_1.PluginManager; } });
var cycle_detection_1 = require("./plugins/cycle-detection");
Object.defineProperty(exports, "createCycleDetectionPlugin", { enumerable: true, get: function () { return cycle_detection_1.createCycleDetectionPlugin; } });
Object.defineProperty(exports, "createTopologicalDetector", { enumerable: true, get: function () { return cycle_detection_1.createTopologicalDetector; } });
var sorting_1 = require("./plugins/sorting");
Object.defineProperty(exports, "createSortingPlugin", { enumerable: true, get: function () { return sorting_1.createSortingPlugin; } });
Object.defineProperty(exports, "createMultiLevelSorting", { enumerable: true, get: function () { return sorting_1.createMultiLevelSorting; } });
/**
 * 快捷函数：创建树形结构（自动选择策略）
 */
function createTree(list, options = {}) {
    // 简单策略：根据数据量选择算法
    if (list.length < 1000) {
        return (0, minimal_1.buildMinimalTree)(list, options);
    }
    // 大数据量使用增强构建
    return (0, enhanced_1.buildEnhancedTree)(list, options);
}
/**
 * 创建高级树形构建器
 */
function createAdvancedTree(list, options = {}, formatCallback) {
    return (0, enhanced_1.buildEnhancedTree)(list, options, formatCallback);
}
/**
 * 创建带插件的树形构建器
 */
function createPluginTreeBuilder(plugins = [], config = {}) {
    const builder = new smart_1.SmartTreeBuilder(config);
    plugins.forEach(plugin => {
        builder.use(plugin);
    });
    return builder;
}
// 版本信息
exports.VERSION = '1.0.0';
exports.AUTHOR = 'Tree Formatter Library';
exports.DESCRIPTION = '高性能、模块化的树形结构构建库';
