# 语义分析器测试工具

本目录包含语义分析器的独立测试工具，用于验证和调试语义分析功能。

## 📁 文件结构

### 核心文件
- `semantic.js` - 语义分析器主模块
- `symbol-table.js` - 符号表管理
- `type-checker.js` - 类型检查器

### 测试工具
- `run-semantic.js` - 完整的语义分析测试套件
- `test-single-semantic.js` - 单个代码片段快速测试
- `README.md` - 本文档

## 🚀 使用方法

### 运行完整测试套件

```bash
# 运行所有预定义测试用例
node run-semantic.js

# 测试自定义代码
node run-semantic.js "let x = 10; console.log(x);"
```

### 快速测试单个代码片段

```bash
# 使用默认测试代码
node test-single-semantic.js

# 测试指定代码
node test-single-semantic.js "function add(a, b) { return a + b; }"

# 显示帮助信息
node test-single-semantic.js --help
```

## 📊 输出格式

### 符号表信息
```
=== 符号表信息 ===

全局作用域:
  x: {"type":"let"}
  message: {"type":"const"}
  greet: {"type":"function"}

局部作用域 1:
  name: {"type":"param"}
  greeting: {"type":"let"}
```

### 语义分析统计
```
=== 语义分析统计 ===
作用域层数: 2
符号总数: 5
变量声明: 3
函数声明: 1
标识符引用: 8
类型检查次数: 12
语义错误: 0
类型错误: 0
分析耗时: 5ms
```

### 错误报告
```
❌ 发现语义错误:
  1. 错误: 变量 "x" 在当前作用域已声明 (行 3)
  2. 错误: 参数 "a" 重复声明 (行 5)
```

## 🧪 测试用例

### 基本功能测试
1. **基本变量声明** - 测试let、const、var声明
2. **函数声明和调用** - 测试函数定义和调用
3. **作用域测试** - 测试嵌套作用域和变量可见性

### 错误检测测试
4. **变量重复声明错误** - 检测同一作用域内的重复声明
5. **未声明变量使用错误** - 检测使用未声明的变量
6. **函数参数重复错误** - 检测函数参数名重复

### 高级功能测试
7. **复杂表达式类型检查** - 测试各种表达式的类型推断
8. **控制流语句** - 测试if、while等控制流语句的语义分析

## 🔍 支持的语义检查

### 作用域管理
- ✅ 全局作用域和局部作用域
- ✅ 作用域嵌套和变量遮蔽
- ✅ 函数参数作用域
- ✅ 块级作用域（let/const）

### 符号表管理
- ✅ 符号插入和查找
- ✅ 当前作用域查找
- ✅ 作用域链遍历
- ✅ 符号类型记录

### 错误检测
- ✅ 变量重复声明
- ✅ 未声明变量使用
- ✅ 函数参数重复
- ✅ 作用域违规访问

### 类型检查
- ✅ 基本数据类型检查
- ✅ 表达式类型推断
- ✅ 函数调用类型匹配
- ✅ 赋值类型兼容性

## ⚡ 性能信息

- **平均分析时间**: 2-10ms（取决于代码复杂度）
- **内存使用**: 轻量级，适合大型代码库
- **错误恢复**: 支持错误后继续分析
- **并发安全**: 每个分析器实例独立

## 🛠️ 自定义测试用例

### 添加新的测试用例

在 `run-semantic.js` 中的 `testCases` 数组添加新测试：

```javascript
{
    name: '自定义测试名称',
    code: `
// 你的测试代码
let example = "test";
function myFunction() {
    return example;
}
`
}
```

### 自定义语义检查规则

在 `semantic.js` 中添加新的节点处理方法：

```javascript
CustomNode(node) {
    // 自定义语义检查逻辑
    if (someCondition) {
        this.errors.push(`自定义错误信息 (行 ${node.line})`);
    }
}
```

## 🐛 故障排除

### 常见问题

1. **"Cannot find module" 错误**
   - 确保在正确的目录运行命令
   - 检查相对路径是否正确

2. **语义分析器报告意外错误**
   - 检查AST结构是否正确
   - 验证词法和语法分析是否成功

3. **符号表显示异常**
   - 确保作用域进入和退出配对
   - 检查符号插入逻辑

### 调试技巧

1. **启用详细日志**
   ```javascript
   const analyzer = new Analyzer(ast, {
       onEnter: (node) => console.log('进入:', node.nodeType),
       onExit: (node) => console.log('退出:', node.nodeType)
   });
   ```

2. **检查特定节点**
   ```bash
   node test-single-semantic.js "let x = 10;" | grep "变量声明"
   ```

3. **比较不同代码的分析结果**
   ```bash
   node test-single-semantic.js "let x = 10;"
   node test-single-semantic.js "const x = 10;"
   ```

## 🔧 扩展功能

### 添加新的类型检查

在 `type-checker.js` 中扩展类型检查功能：

```javascript
checkCustomType(expression) {
    // 自定义类型检查逻辑
    return DataType.CUSTOM;
}
```

### 集成到构建流程

```javascript
const { performSemanticAnalysis } = require('./run-semantic');

// 在构建脚本中使用
const result = performSemanticAnalysis(sourceCode, 'build-test');
if (!result.success || result.semanticErrors.length > 0) {
    process.exit(1);
}
```

### 生成分析报告

```javascript
const fs = require('fs');
const result = performSemanticAnalysis(code, 'report-test');

// 生成JSON报告
fs.writeFileSync('semantic-report.json', JSON.stringify(result, null, 2));
```

## 📚 相关文档

- [词法分析器文档](../lexer/README.md)
- [语法分析器文档](../parser/README.md)
- [代码优化器文档](../optimizer/README.md)
- [代码生成器文档](../codegen/README.md)

## 🤝 贡献指南

1. 添加新的测试用例时，请确保包含预期的错误信息
2. 修改语义检查规则时，请更新相应的测试用例
3. 提交前请运行完整的测试套件确保没有回归
4. 新功能请添加相应的文档说明

---

💡 **提示**: 语义分析是编译器的关键阶段，它确保代码在语义上是正确的。通过这些测试工具，你可以深入了解语义分析的工作原理并验证其正确性。