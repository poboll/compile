# 词法分析器测试工具

本目录包含了词法分析器的独立测试工具，用于单独运行和测试词法分析器功能。

## 文件说明

- `lexer.js` - 词法分析器主文件
- `run-lexer.js` - 完整的测试套件，包含多个预定义测试用例
- `test-single.js` - 单个代码片段快速测试工具
- `README.md` - 本说明文档

## 使用方法

### 1. 运行完整测试套件

```bash
# 在 /Users/Apple/Downloads/bianyi/src/compiler/lexer 目录下运行
node run-lexer.js
```

这将运行所有预定义的测试用例，包括：
- 基本变量声明
- 函数定义
- 条件语句
- 循环语句
- 复杂表达式
- 注释测试
- 字符串和字符
- 数字类型
- 操作符测试
- 错误处理测试

### 2. 快速测试单个代码片段

```bash
# 使用默认测试代码
node test-single.js

# 测试自定义代码
node test-single.js "let x = 10; console.log(x);"

# 测试多行代码（使用引号包围）
node test-single.js "function test() { return 42; }"
```

### 3. 在其他代码中使用

```javascript
// 引入测试工具
const { testSingleCode } = require('./test-single.js');
const { runTestCase, testCases } = require('./run-lexer.js');

// 测试单个代码片段
testSingleCode('let x = 10;', '我的测试');

// 运行特定测试用例
runTestCase(testCases[0], 0);
```

## 输出说明

### Token 信息格式

每个 Token 包含以下信息：
- **序号**: Token 在序列中的位置
- **类型**: Token 的类型（如 KEYWORD, IDENTIFIER, NUMBER 等）
- **值**: Token 的具体值
- **位置**: Token 在源代码中的位置 [行:列]
- **详情**: Token 类型的中文说明

### 统计信息

- **Token类型分布**: 各种类型 Token 的数量统计
- **总Token数量**: 分析出的 Token 总数
- **错误数量**: 词法分析过程中发现的错误数
- **分析耗时**: 词法分析所用时间（毫秒）

### 错误信息

如果源代码中存在词法错误，会显示：
- 错误位置（行号和列号）
- 错误描述
- 问题字符（如果适用）

## 支持的 Token 类型

- `KEYWORD` - 关键字（如 let, const, function, if, for 等）
- `IDENTIFIER` - 标识符（变量名、函数名等）
- `NUMBER` - 数字字面量
- `STRING` - 字符串字面量
- `OPERATOR` - 操作符（+, -, *, /, ==, != 等）
- `DELIMITER` - 分隔符（括号、分号、逗号等）
- `EOF` - 文件结束标记
- `UNKNOWN` - 未知字符（错误情况）

## 测试用例说明

### 基本功能测试
1. **变量声明**: 测试 let, const, var 关键字
2. **函数定义**: 测试 function 关键字和参数列表
3. **控制流**: 测试 if/else, for, while 语句
4. **表达式**: 测试算术和逻辑表达式

### 特殊情况测试
5. **注释处理**: 测试单行和多行注释
6. **字符串处理**: 测试各种字符串格式和转义字符
7. **数字处理**: 测试整数、浮点数、负数
8. **操作符**: 测试各种操作符的识别

### 错误处理测试
9. **非法字符**: 测试对非法字符的处理
10. **未终止字符串**: 测试错误恢复机制

## 性能信息

测试工具会记录每个测试用例的执行时间，帮助分析词法分析器的性能：
- 单个测试用例的耗时
- 总体测试的平均耗时
- Token 生成速度

## 自定义测试

你可以通过修改 `run-lexer.js` 中的 `testCases` 数组来添加自己的测试用例：

```javascript
const customTest = {
    name: '我的测试用例',
    code: `// 你的测试代码
let myVar = "test";`
};

testCases.push(customTest);
```

## 注意事项

1. 确保在正确的目录下运行脚本
2. 词法分析器文件 `lexer.js` 必须存在于同一目录
3. 测试代码中的中文字符串需要正确的编码
4. 大型代码文件可能需要较长的分析时间

## 故障排除

### 常见问题

1. **模块找不到错误**
   ```
   Error: Cannot find module './lexer.js'
   ```
   解决方案：确保在包含 `lexer.js` 的目录中运行脚本

2. **语法错误**
   ```
   SyntaxError: Unexpected token
   ```
   解决方案：检查测试代码的语法是否正确

3. **编码问题**
   如果输出中文字符显示异常，确保终端支持 UTF-8 编码

### 调试建议

- 使用 `test-single.js` 逐步测试小段代码
- 查看详细的 Token 序列来理解分析过程
- 注意错误信息中的位置信息
- 对比预期结果和实际输出

---

**作者**: 编译系统课程设计  
**版本**: 1.0  
**更新日期**: 2024年