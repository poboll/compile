# C语言编译器各阶段测试指南

本项目提供了C语言编译器各个编译阶段的独立测试程序，帮助您深入理解编译器的工作原理。

## 📁 文件结构

```
bianyi/
├── docs/
│   └── c-compiler-detailed-stages.md  # 详细技术文档
├── src/compiler/                       # 编译器源代码
├── test_lexer_only.c                  # 词法分析器测试
├── test_parser_only.c                 # 语法分析器测试
├── test_semantic_only.c               # 语义分析器测试
├── test_optimizer_only.c              # 代码优化器测试
├── test_codegen_only.c                # 代码生成器测试
├── test_full_pipeline.c               # 完整编译流程测试
├── Makefile.tests                     # 测试程序构建文件
└── README_TESTS.md                    # 本文件
```

## 🚀 快速开始

### 1. 编译所有测试程序

```bash
# 使用专用的测试Makefile
make -f Makefile.tests all
```

### 2. 运行单个阶段测试

```bash
# 词法分析器测试
./test_lexer_only

# 语法分析器测试
./test_parser_only

# 语义分析器测试
./test_semantic_only

# 代码优化器测试
./test_optimizer_only

# 代码生成器测试
./test_codegen_only

# 完整编译流程测试
./test_full_pipeline
```

### 3. 运行所有测试

```bash
# 一次性运行所有测试
make -f Makefile.tests run_tests
```

## 📋 各阶段测试说明

### 🔍 词法分析器测试 (`test_lexer_only`)

**功能**：测试词法分析器将源代码转换为Token流的能力

**测试内容**：
- 基本Token识别（关键字、标识符、数字、运算符等）
- 字符串和字符常量处理
- 注释处理
- 错误Token检测
- 行号和列号跟踪

**输出示例**：
```
=== 词法分析测试 ===
源代码:
int x = 10;

=== Token流 ===
  1. Token: INT             | Value: 'int' | Line: 1 | Column: 1
  2. Token: IDENTIFIER      | Value: 'x' | Line: 1 | Column: 5
  3. Token: EQUAL           | Value: '=' | Line: 1 | Column: 7
  4. Token: NUMBER          | Value: '10' | Line: 1 | Column: 9
  5. Token: SEMICOLON       | Value: ';' | Line: 1 | Column: 11
  6. Token: EOF             | Value: '' | Line: 1 | Column: 12

总共生成 6 个Token
```

### 🌳 语法分析器测试 (`test_parser_only`)

**功能**：测试语法分析器将Token流构建为抽象语法树(AST)的能力

**测试内容**：
- 变量声明解析
- 函数定义解析
- 控制流语句解析（if、while、for）
- 表达式解析
- 语法错误检测
- AST结构验证

**输出示例**：
```
=== 语法分析测试 ===
源代码:
int x = 10;

✅ 语法分析成功！

=== 生成的AST ===
--- Abstract Syntax Tree ---
(var-decl)
--- End of AST ---

=== AST统计信息 ===
语句数量: 1
```

### 🔬 语义分析器测试 (`test_semantic_only`)

**功能**：测试语义分析器进行类型检查和作用域验证的能力

**测试内容**：
- 变量声明检查
- 变量使用前声明验证
- 作用域规则检查
- 类型兼容性检查
- 函数调用验证
- 重复声明检测

**输出示例**：
```
=== 语义分析测试 ===
源代码:
int x = 10; int y = x + 5;

✅ 语法分析成功，开始语义分析...

📋 符号表信息:
   当前作用域级别: 0
   符号表状态: 已初始化

🔍 语义分析结果:
   错误数量: 0
   ✅ 无语义错误
```

### ⚡ 代码优化器测试 (`test_optimizer_only`)

**功能**：测试代码优化器的各种优化策略

**测试内容**：
- 常量折叠优化
- 死代码消除
- 代数简化
- 公共子表达式消除
- 不同优化级别对比（O0、O1、O2）

**输出示例**：
```
=== 代码优化测试 ===
源代码:
int x = 5 + 10; int y = 3 * 4;

🔧 优化配置:
   优化级别: 基础优化 (O1)
   启用的优化:
     - 常量折叠 (Constant Folding)
     - 死代码消除 (Dead Code Elimination)
     - 基础代数简化

✅ 优化完成
```

### 🎯 代码生成器测试 (`test_codegen_only`)

**功能**：测试目标代码生成器将AST转换为C语言代码的能力

**测试内容**：
- 变量声明代码生成
- 函数定义代码生成
- 控制流语句代码生成
- 表达式代码生成
- 文件输出功能

**输出示例**：
```
=== 代码生成测试 ===
源代码:
int add(int a, int b) { return a + b; }

🎯 代码生成配置:
   目标语言: C语言
   输出文件: output_test.c

✅ 代码生成完成

📄 生成的代码预览 (output_test.c):
--- 开始 ---
  1: int add(int a, int b) {
  2:     return a + b;
  3: }
--- 结束 ---
```

### 🚀 完整编译流程测试 (`test_full_pipeline`)

**功能**：测试完整的编译流程，展示所有阶段的协同工作

**测试内容**：
- 五个编译阶段的顺序执行
- 错误处理和传播
- 性能统计
- 不同优化级别的完整流程
- 编译时间测量

**输出示例**：
```
=== 完整编译流程测试 ===
源代码:
int main() {
    int x = 10;
    return x;
}

🔍 阶段1：词法分析
✅ 词法分析完成，生成 8 个Token

🌳 阶段2：语法分析
✅ 语法分析完成，生成 1 个语句节点

🔬 阶段3：语义分析
✅ 语义分析完成，无错误

⚡ 阶段4：代码优化
✅ 代码优化完成

🎯 阶段5：目标代码生成
✅ 目标代码生成完成

📊 编译统计报告
🎉 编译成功
```

## 🔧 高级用法

### 调试模式编译

```bash
# 编译调试版本（包含调试信息）
make -f Makefile.tests debug
```

### 内存检查

```bash
# 使用Valgrind检查内存泄漏
make -f Makefile.tests valgrind_test
```

### 自定义测试

您可以修改测试程序中的测试用例：

```c
// 在任何测试程序的main函数中添加
const char *my_test = "您的C代码";
test_function(my_test, "我的测试");
```

### 单独编译特定测试

```bash
# 只编译词法分析器测试
make -f Makefile.tests test_lexer_only

# 只编译语法分析器测试
make -f Makefile.tests test_parser_only
```

## 📊 测试结果分析

### 成功指标

- **词法分析**：所有Token正确识别，无ERROR Token
- **语法分析**：AST成功构建，无语法错误
- **语义分析**：符号表正确构建，无语义错误
- **代码优化**：优化规则正确应用，AST结构保持有效
- **代码生成**：生成有效的C语言代码

### 错误处理

- **词法错误**：显示错误字符的位置信息
- **语法错误**：显示错误Token和期望的语法结构
- **语义错误**：显示类型不匹配、未声明变量等错误
- **优化错误**：显示优化过程中的问题
- **生成错误**：显示代码生成失败的原因

## 🎓 学习建议

### 初学者路径

1. **从词法分析开始**：理解Token的概念和识别过程
2. **学习语法分析**：了解AST的构建和语法规则
3. **掌握语义分析**：理解类型系统和作用域规则
4. **探索代码优化**：学习各种优化技术
5. **完成代码生成**：理解目标代码的生成过程

### 进阶学习

1. **修改语法规则**：在parser.c中添加新的语法支持
2. **实现新的优化**：在optimizer.c中添加自定义优化
3. **支持新目标**：在codegen.c中添加新的目标语言
4. **性能分析**：使用profiling工具分析编译器性能

### 实验建议

1. **对比不同优化级别**：观察O0、O1、O2的输出差异
2. **测试错误处理**：故意引入各种错误，观察错误报告
3. **分析生成代码**：检查生成的C代码是否可以正常编译运行
4. **性能测试**：测试大型源文件的编译时间

## 🐛 故障排除

### 编译问题

```bash
# 如果编译失败，检查依赖
make -f Makefile.tests clean
make -f Makefile.tests all

# 检查源文件是否存在
ls src/compiler/
```

### 运行时问题

```bash
# 如果程序崩溃，使用调试器
gdb ./test_lexer_only
(gdb) run
(gdb) bt  # 查看调用栈
```

### 内存问题

```bash
# 检查内存泄漏
valgrind --leak-check=full ./test_lexer_only
```

## 📚 相关资源

- **详细技术文档**：`docs/c-compiler-detailed-stages.md`
- **编译器源码**：`src/compiler/` 目录
- **构建配置**：`Makefile.tests`
- **原始编译器**：项目根目录的主Makefile

## 🤝 贡献指南

如果您想改进这些测试程序：

1. 添加新的测试用例
2. 改进错误处理
3. 增加更详细的输出信息
4. 优化性能统计
5. 添加新的编译目标支持

## 📄 许可证

本项目遵循与主编译器项目相同的许可证。

---

**祝您学习愉快！如果您有任何问题，请查看详细技术文档或检查源代码实现。** 🎉