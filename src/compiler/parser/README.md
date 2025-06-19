# 语法分析器测试工具

本目录包含语法分析器的独立运行和测试工具，用于验证语法分析器的功能和调试语法分析过程。

## 文件说明

### 核心文件
- `parser.js` - 语法分析器主文件，实现递归下降语法分析
- `ast-node.js` - AST节点定义文件
- `parser.h` / `parser.c` - C语言版本的语法分析器

### 测试工具
- `run-parser.js` - 完整的语法分析器测试套件
- `test-single-parser.js` - 单代码片段快速测试工具
- `README.md` - 本说明文档

## 使用方法

### 1. 运行完整测试套件

```bash
# 在 parser 目录下运行
node run-parser.js
```

这将运行所有预定义的测试用例，包括：
- 变量声明测试
- 函数声明测试
- 条件语句测试
- 循环语句测试
- 复杂表达式测试
- 函数调用测试
- 嵌套结构测试
- 语法错误测试

### 2. 测试单个代码片段

```bash
# 使用默认测试代码
node test-single-parser.js

# 测试自定义代码
node test-single-parser.js "let x = 10; if (x > 5) { console.log('大于5'); }"

# 测试多行代码（使用引号包围）
node test-single-parser.js "function test() { return 42; } let result = test();"
```

### 3. 在其他代码中使用

```javascript
const { testSingleCode } = require('./test-single-parser');
const { runTestCase, formatASTNode } = require('./run-parser');

// 测试单个代码片段
const result = testSingleCode('let x = 42;');
console.log('分析结果:', result);

// 运行自定义测试用例
runTestCase('我的测试', 'function hello() { console.log("Hello"); }');
```

## 输出格式

### AST节点显示

```
Program (1:1) {2 statements}
  VariableDeclaration (1:1) [let] x
    Literal 42
  ExpressionStatement (2:1)
    CallExpression console.log (1 args)
      arg0:
        Literal "Hello"
```

### 统计信息

```
=== 语法分析统计 ===
总节点数: 8
节点类型分布:
  Literal: 2
  Identifier: 2
  VariableDeclaration: 1
  ExpressionStatement: 1
  CallExpression: 1
  Program: 1
语法错误数: 0
分析耗时: 5ms
```

### 错误信息

```
=== 语法错误详情 ===
1. Syntax error: Expected ';' after variable declaration (行1, 列10)
2. Syntax error: Expected ')' after parameter list (行3, 列15)
```

## 支持的语法结构

### 变量声明
- `let` 声明
- `const` 声明
- `var` 声明
- 带初始化值的声明

### 函数
- 函数声明
- 参数列表
- 函数体
- 返回语句

### 控制流
- `if` / `else` 条件语句
- `while` 循环
- 块语句

### 表达式
- 二元表达式（算术、比较、逻辑）
- 一元表达式
- 赋值表达式
- 函数调用表达式
- 标识符和字面量

### 数据类型
- 数字（整数、浮点数）
- 字符串
- 布尔值
- null

## 测试用例说明

### 基础语法测试
1. **变量声明** - 测试各种变量声明语法
2. **函数声明** - 测试函数定义和参数
3. **条件语句** - 测试if/else逻辑
4. **循环语句** - 测试while循环

### 复杂结构测试
5. **复杂表达式** - 测试运算符优先级和组合
6. **函数调用** - 测试函数调用语法
7. **嵌套结构** - 测试递归函数等复杂结构

### 错误处理测试
8. **语法错误测试** - 测试错误恢复机制

## 性能信息

- 每个测试用例都会显示分析耗时
- 统计AST节点数量和类型分布
- 提供总体性能统计

## 自定义测试用例

可以在 `run-parser.js` 中添加新的测试用例：

```javascript
const newTestCase = {
    name: '我的测试用例',
    code: `// 你的测试代码
let test = "hello world";
console.log(test);`
};

// 添加到 testCases 数组中
testCases.push(newTestCase);
```

## 故障排除

### 常见问题

1. **模块未找到错误**
   - 确保在正确的目录下运行脚本
   - 检查相对路径是否正确

2. **语法分析失败**
   - 检查词法分析是否成功
   - 查看错误信息定位问题

3. **AST显示不完整**
   - 可能存在循环引用
   - 检查节点结构是否正确

### 调试技巧

1. **启用详细日志**
   - 在parser.js中取消注释console.log语句

2. **分步调试**
   - 先运行词法分析器确保Token正确
   - 再运行语法分析器检查AST构建

3. **使用简单测试用例**
   - 从最简单的语法开始测试
   - 逐步增加复杂度

## 扩展功能

### 添加新的AST节点类型
1. 在parser.js中定义新的节点类
2. 在formatASTNode函数中添加格式化逻辑
3. 更新相应的解析方法

### 添加新的语法结构
1. 扩展parseStatement方法
2. 实现对应的解析函数
3. 添加相应的测试用例

### 改进错误恢复
1. 优化synchronize方法
2. 添加更多同步点
3. 提供更详细的错误信息

---

**注意**: 这些工具主要用于开发和调试阶段，帮助理解语法分析器的工作原理和验证其正确性。