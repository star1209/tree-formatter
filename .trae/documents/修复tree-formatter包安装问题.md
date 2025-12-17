# 修复tree-formatter包安装问题

## 问题分析
从GitHub安装包时找不到模块"tree-formatter"的原因：
1. **repository URL错误**：package.json中使用了占位符`your-username`而非实际用户名`star1209`
2. **缺少构建脚本**：没有`prepare`脚本，从GitHub安装时不会自动构建项目
3. **需要确保构建产物正确**：虽然dist目录已提交，但最佳实践是添加自动构建

## 解决方案

### 1. 更新package.json中的repository URL
将占位符URL替换为实际GitHub地址：
```json
"repository": {
  "type": "git",
  "url": "https://github.com/star1209/tree-formatter.git"
}
```

### 2. 添加prepare脚本
在scripts中添加prepare脚本，确保从GitHub安装时自动构建：
```json
"scripts": {
  "prepare": "npm run build:all",
  ...
}
```

### 3. 确保所有必要文件都被包含
检查package.json的files字段，确保包含所有必要文件：
```json
"files": [
  "dist",
  "README.md",
  "LICENSE"
]
```

### 4. 验证构建产物
确保构建命令生成正确的输出文件，特别是esm格式的文件，因为package.json中配置了exports字段支持esm和cjs两种格式。

## 预期效果
修复后，使用`pnpm i git+https://github.com/star1209/tree-formatter.git`安装时：
1. npm会自动运行prepare脚本构建项目
2. 生成所有必要的构建产物
3. 正确导出模块和类型声明
4. 可以正常引入和使用tree-formatter包