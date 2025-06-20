# C语言编译器各阶段详细运行指南

本文档提供C语言编译器各个阶段的单独运行代码和详细输出说明。

## 目录
1. [词法分析阶段](#1-词法分析阶段)
2. [语法分析阶段](#2-语法分析阶段)
3. [语义分析阶段](#3-语义分析阶段)
4. [代码优化阶段](#4-代码优化阶段)
5. [目标代码生成阶段](#5-目标代码生成阶段)
6. [完整编译流程](#6-完整编译流程)

---

## 1. 词法分析阶段

### 1.1 单独运行词法分析器

创建独立的词法分析测试程序：

```c
// test_lexer_only.c
#include <stdio.h>
#include <stdlib.h>
#include "src/compiler/lexer.h"
#include "src/compiler/token.h"
#include "src/compiler/common.h"

// Token类型转字符串函数
const char *token_type_to_string(TokenType type) {
    switch (type) {
        case TOKEN_EOF: return "EOF";
        case TOKEN_ERROR: return "ERROR";
        case TOKEN_INT: return "INT";
        case TOKEN_CHAR: return "CHAR";
        case TOKEN_VOID: return "VOID";
        case TOKEN_IF: return "IF";
        case TOKEN_ELSE: return "ELSE";
        case TOKEN_WHILE: return "WHILE";
        case TOKEN_FOR: return "FOR";
        case TOKEN_RETURN: return "RETURN";
        case TOKEN_IDENTIFIER: return "IDENTIFIER";
        case TOKEN_NUMBER: return "NUMBER";
        case TOKEN_STRING: return "STRING";
        case TOKEN_PLUS: return "PLUS";
        case TOKEN_MINUS: return "MINUS";
        case TOKEN_STAR: return "STAR";
        case TOKEN_SLASH: return "SLASH";
        case TOKEN_EQUAL: return "EQUAL";
        case TOKEN_EQUAL_EQUAL: return "EQUAL_EQUAL";
        case TOKEN_LESS: return "LESS";
        case TOKEN_GREATER: return "GREATER";
        case TOKEN_LPAREN: return "LPAREN";
        case TOKEN_RPAREN: return "RPAREN";
        case TOKEN_LBRACE: return "LBRACE";
        case TOKEN_RBRACE: return "RBRACE";
        case TOKEN_SEMICOLON: return "SEMICOLON";
        case TOKEN_COMMA: return "COMMA";
        default: return "UNKNOWN";
    }
}

void print_token(Token *token) {
    printf("Token: %-15s | Value: '%.*s' | Line: %d | Column: %d\n",
           token_type_to_string(token->type),
           token->length, token->start,
           token->line, token->column);
}

void test_lexer(const char *source_code) {
    printf("=== 词法分析测试 ===\n");
    printf("源代码:\n%s\n", source_code);
    printf("\n=== Token流 ===\n");
    
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    Token token;
    int token_count = 0;
    
    do {
        token = scan_token(&lexer);
        printf("%3d. ", ++token_count);
        print_token(&token);
    } while (token.type != TOKEN_EOF);
    
    printf("\n总共生成 %d 个Token\n", token_count);
}

int main() {
    // 测试用例1：简单变量声明
    const char *test1 = "int x = 10;";
    test_lexer(test1);
    
    printf("\n" "=" * 50 "\n\n");
    
    // 测试用例2：函数定义
    const char *test2 = "int add(int a, int b) { return a + b; }";
    test_lexer(test2);
    
    printf("\n" "=" * 50 "\n\n");
    
    // 测试用例3：控制流语句
    const char *test3 = "if (x > 5) { printf(\"hello\"); }";
    test_lexer(test3);
    
    return 0;
}
```

### 1.2 编译和运行词法分析器

```bash
# 编译词法分析器测试程序
gcc -g -Wall -Isrc -std=c11 -o test_lexer_only test_lexer_only.c \
    src/compiler/lexer.c src/compiler/common.c src/compiler/token.c

# 运行测试
./test_lexer_only
```

### 1.3 预期输出示例

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

---

## 2. 语法分析阶段

### 2.1 单独运行语法分析器

```c
// test_parser_only.c
#include <stdio.h>
#include <stdlib.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/ast.h"
#include "src/compiler/ast_printer.c"  // 包含AST打印功能

void test_parser(const char *source_code) {
    printf("=== 语法分析测试 ===\n");
    printf("源代码:\n%s\n", source_code);
    
    // 词法分析
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    // 语法分析
    Parser parser;
    init_parser(&parser, &lexer);
    ArrayList *ast = parse(&parser);
    
    if (parser.had_error) {
        printf("\n❌ 语法分析失败！\n");
        return;
    }
    
    printf("\n✅ 语法分析成功！\n");
    printf("\n=== 生成的AST ===\n");
    print_ast(ast);
    
    // 统计AST节点
    printf("\n=== AST统计信息 ===\n");
    printf("语句数量: %d\n", ast->size);
    
    // TODO: 释放AST内存
}

int main() {
    // 测试用例1：变量声明
    const char *test1 = "int x = 10;";
    test_parser(test1);
    
    printf("\n" "=" * 60 "\n\n");
    
    // 测试用例2：函数定义
    const char *test2 = "int add(int a, int b) { return a + b; }";
    test_parser(test2);
    
    printf("\n" "=" * 60 "\n\n");
    
    // 测试用例3：if语句
    const char *test3 = "if (x > 5) { x = x + 1; }";
    test_parser(test3);
    
    return 0;
}
```

### 2.2 编译和运行语法分析器

```bash
# 编译语法分析器测试程序
gcc -g -Wall -Isrc -std=c11 -o test_parser_only test_parser_only.c \
    src/compiler/lexer.c src/compiler/parser.c src/compiler/ast.c \
    src/compiler/common.c src/compiler/token.c

# 运行测试
./test_parser_only
```

### 2.3 预期输出示例

```
=== 语法分析测试 ===
源代码:
int x = 10;

✅ 语法分析成功！

=== 生成的AST ===
--- Abstract Syntax Tree ---
(var-decl x = 10)
--- End of AST ---

=== AST统计信息 ===
语句数量: 1
```

---

## 3. 语义分析阶段

### 3.1 单独运行语义分析器

```c
// test_semantic_only.c
#include <stdio.h>
#include <stdlib.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/analyzer.h"
#include "src/compiler/symbol.h"

void print_symbol_table(SymbolTable *table) {
    printf("\n=== 符号表内容 ===\n");
    // 这里需要实现符号表的遍历打印功能
    // 由于当前实现使用hashmap，需要添加遍历接口
    printf("符号表级别: %d\n", table->current->level);
    printf("错误数量: %d\n", table->errors->size);
}

void test_semantic_analysis(const char *source_code) {
    printf("=== 语义分析测试 ===\n");
    printf("源代码:\n%s\n", source_code);
    
    // 词法分析
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    // 语法分析
    Parser parser;
    init_parser(&parser, &lexer);
    ArrayList *ast = parse(&parser);
    
    if (parser.had_error) {
        printf("\n❌ 语法分析失败，无法进行语义分析！\n");
        return;
    }
    
    // 语义分析
    Analyzer analyzer;
    init_analyzer(&analyzer);
    
    printf("\n=== 开始语义分析 ===\n");
    bool semantic_result = analyze(&analyzer, ast);
    
    // 打印符号表
    print_symbol_table(analyzer.symbol_table);
    
    // 打印语义错误
    print_semantic_errors(&analyzer);
    
    if (semantic_result) {
        printf("\n✅ 语义分析成功！\n");
    } else {
        printf("\n❌ 语义分析失败！\n");
    }
    
    free_analyzer(&analyzer);
}

int main() {
    // 测试用例1：正确的变量声明和使用
    const char *test1 = "int x = 10; int y = x + 5;";
    test_semantic_analysis(test1);
    
    printf("\n" "=" * 60 "\n\n");
    
    // 测试用例2：未声明变量的使用（应该报错）
    const char *test2 = "int x = y + 5;";
    test_semantic_analysis(test2);
    
    printf("\n" "=" * 60 "\n\n");
    
    // 测试用例3：函数定义和调用
    const char *test3 = "int add(int a, int b) { return a + b; } int main() { int result = add(3, 4); }";
    test_semantic_analysis(test3);
    
    return 0;
}
```

### 3.2 编译和运行语义分析器

```bash
# 编译语义分析器测试程序
gcc -g -Wall -Isrc -std=c11 -o test_semantic_only test_semantic_only.c \
    src/compiler/lexer.c src/compiler/parser.c src/compiler/analyzer.c \
    src/compiler/symbol.c src/compiler/ast.c src/compiler/common.c src/compiler/token.c

# 运行测试
./test_semantic_only
```

---

## 4. 代码优化阶段

### 4.1 单独运行代码优化器

```c
// test_optimizer_only.c
#include <stdio.h>
#include <stdlib.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/optimizer.h"
#include "src/compiler/ast_printer.c"

void test_optimization(const char *source_code, OptimizationLevel level) {
    printf("=== 代码优化测试 (级别: %d) ===\n", level);
    printf("源代码:\n%s\n", source_code);
    
    // 词法分析
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    // 语法分析
    Parser parser;
    init_parser(&parser, &lexer);
    ArrayList *ast = parse(&parser);
    
    if (parser.had_error) {
        printf("\n❌ 语法分析失败，无法进行优化！\n");
        return;
    }
    
    printf("\n=== 优化前的AST ===\n");
    print_ast(ast);
    
    // 代码优化
    Optimizer optimizer;
    init_optimizer(&optimizer, level);
    
    printf("\n=== 开始代码优化 ===\n");
    bool optimization_result = run_optimization(&optimizer, ast);
    
    if (optimization_result) {
        printf("\n=== 优化后的AST ===\n");
        print_ast(ast);
        printf("\n✅ 代码优化成功！\n");
    } else {
        printf("\n❌ 代码优化失败！\n");
    }
    
    free_optimizer(&optimizer);
}

int main() {
    // 测试用例1：常量折叠优化
    const char *test1 = "int x = 5 + 10; int y = 3 * 4;";
    test_optimization(test1, OPT_LEVEL_BASIC);
    
    printf("\n" "=" * 60 "\n\n");
    
    // 测试用例2：死代码消除
    const char *test2 = "if (1) { printf(\"always\"); } if (0) { printf(\"never\"); }";
    test_optimization(test2, OPT_LEVEL_BASIC);
    
    printf("\n" "=" * 60 "\n\n");
    
    // 测试用例3：无优化对比
    test_optimization(test1, OPT_LEVEL_NONE);
    
    return 0;
}
```

---

## 5. 目标代码生成阶段

### 5.1 单独运行代码生成器

```c
// test_codegen_only.c
#include <stdio.h>
#include <stdlib.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/codegen.h"

void test_code_generation(const char *source_code) {
    printf("=== 目标代码生成测试 ===\n");
    printf("源代码:\n%s\n", source_code);
    
    // 词法分析
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    // 语法分析
    Parser parser;
    init_parser(&parser, &lexer);
    ArrayList *ast = parse(&parser);
    
    if (parser.had_error) {
        printf("\n❌ 语法分析失败，无法生成代码！\n");
        return;
    }
    
    // 目标代码生成
    CodeGenerator codegen;
    init_code_generator(&codegen, TARGET_C, NULL);  // 输出到stdout
    
    printf("\n=== 开始目标代码生成 ===\n");
    bool codegen_result = run_code_generation(&codegen, ast);
    
    if (codegen_result) {
        printf("\n✅ 目标代码生成成功！\n");
    } else {
        printf("\n❌ 目标代码生成失败！\n");
    }
    
    free_code_generator(&codegen);
}

int main() {
    // 测试用例1：简单变量声明
    const char *test1 = "int x = 10; int y = x + 5;";
    test_code_generation(test1);
    
    printf("\n" "=" * 60 "\n\n");
    
    // 测试用例2：函数定义
    const char *test2 = "int add(int a, int b) { return a + b; }";
    test_code_generation(test2);
    
    printf("\n" "=" * 60 "\n\n");
    
    // 测试用例3：控制流
    const char *test3 = "int main() { if (x > 5) { printf(\"hello\"); } return 0; }";
    test_code_generation(test3);
    
    return 0;
}
```

---

## 6. 完整编译流程

### 6.1 详细的编译流程测试

```c
// test_full_pipeline.c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/analyzer.h"
#include "src/compiler/optimizer.h"
#include "src/compiler/codegen.h"

void test_full_compilation(const char *source_code) {
    printf("=== 完整编译流程测试 ===\n");
    printf("源代码:\n%s\n", source_code);
    printf("\n" "=" * 50 "\n");
    
    clock_t start_time = clock();
    
    // 阶段1：词法分析
    printf("\n🔍 阶段1：词法分析\n");
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    // 统计Token数量
    int token_count = 0;
    Token token;
    Lexer temp_lexer = lexer;  // 临时复制用于统计
    do {
        token = scan_token(&temp_lexer);
        token_count++;
    } while (token.type != TOKEN_EOF);
    
    printf("✅ 词法分析完成，生成 %d 个Token\n", token_count);
    
    // 阶段2：语法分析
    printf("\n🌳 阶段2：语法分析\n");
    Parser parser;
    init_parser(&parser, &lexer);
    ArrayList *ast = parse(&parser);
    
    if (parser.had_error) {
        printf("❌ 语法分析失败，编译终止\n");
        return;
    }
    printf("✅ 语法分析完成，生成 %d 个语句节点\n", ast->size);
    
    // 阶段3：语义分析
    printf("\n🔬 阶段3：语义分析\n");
    Analyzer analyzer;
    init_analyzer(&analyzer);
    bool semantic_result = analyze(&analyzer, ast);
    
    if (!semantic_result) {
        printf("❌ 语义分析失败\n");
        print_semantic_errors(&analyzer);
        free_analyzer(&analyzer);
        return;
    }
    printf("✅ 语义分析完成，无错误\n");
    
    // 阶段4：代码优化
    printf("\n⚡ 阶段4：代码优化\n");
    Optimizer optimizer;
    init_optimizer(&optimizer, OPT_LEVEL_BASIC);
    bool optimization_result = run_optimization(&optimizer, ast);
    
    if (!optimization_result) {
        printf("❌ 代码优化失败\n");
        free_optimizer(&optimizer);
        free_analyzer(&analyzer);
        return;
    }
    printf("✅ 代码优化完成\n");
    
    // 阶段5：目标代码生成
    printf("\n🎯 阶段5：目标代码生成\n");
    CodeGenerator codegen;
    init_code_generator(&codegen, TARGET_C, "output_test.c");
    bool codegen_result = run_code_generation(&codegen, ast);
    
    if (!codegen_result) {
        printf("❌ 目标代码生成失败\n");
    } else {
        printf("✅ 目标代码生成完成，输出到 output_test.c\n");
    }
    
    // 计算总耗时
    clock_t end_time = clock();
    double cpu_time_used = ((double) (end_time - start_time)) / CLOCKS_PER_SEC;
    
    printf("\n" "=" * 50 "\n");
    printf("📊 编译统计信息:\n");
    printf("   Token数量: %d\n", token_count);
    printf("   AST节点数: %d\n", ast->size);
    printf("   编译耗时: %.4f 秒\n", cpu_time_used);
    printf("   编译状态: %s\n", codegen_result ? "成功" : "失败");
    
    // 清理资源
    free_code_generator(&codegen);
    free_optimizer(&optimizer);
    free_analyzer(&analyzer);
}

int main() {
    // 测试完整的C程序
    const char *full_program = 
        "int factorial(int n) {\n"
        "    if (n <= 1) {\n"
        "        return 1;\n"
        "    }\n"
        "    return n * factorial(n - 1);\n"
        "}\n\n"
        "int main() {\n"
        "    int num = 5;\n"
        "    int result = factorial(num);\n"
        "    printf(\"Factorial of %d is %d\\n\", num, result);\n"
        "    return 0;\n"
        "}";
    
    test_full_compilation(full_program);
    
    return 0;
}
```

### 6.2 编译和运行完整测试

```bash
# 编译完整流程测试程序
gcc -g -Wall -Isrc -std=c11 -o test_full_pipeline test_full_pipeline.c \
    src/compiler/lexer.c src/compiler/parser.c src/compiler/analyzer.c \
    src/compiler/optimizer.c src/compiler/codegen.c src/compiler/symbol.c \
    src/compiler/ast.c src/compiler/ast_printer.c src/compiler/common.c src/compiler/token.c

# 运行完整测试
./test_full_pipeline
```

---

## 7. 语法分析表生成

### 7.1 LL(1)语法分析表

基于当前的递归下降解析器，我们可以构造对应的LL(1)语法分析表：

```
语法规则：
program        → declaration*
declaration    → varDecl | funDecl
varDecl        → type IDENTIFIER ( "=" expression )? ";"
funDecl        → type IDENTIFIER "(" parameters? ")" block
parameters     → type IDENTIFIER ( "," type IDENTIFIER )*
block          → "{" statement* "}"
statement      → exprStmt | ifStmt | whileStmt | returnStmt | block
exprStmt       → expression ";"
ifStmt         → "if" "(" expression ")" statement ( "else" statement )?
whileStmt      → "while" "(" expression ")" statement
returnStmt     → "return" expression? ";"
expression     → assignment
assignment     → IDENTIFIER "=" assignment | logical_or
logical_or     → logical_and ( "||" logical_and )*
logical_and    → equality ( "&&" equality )*
equality       → comparison ( ( "!=" | "==" ) comparison )*
comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )*
term           → factor ( ( "-" | "+" ) factor )*
factor         → unary ( ( "/" | "*" ) unary )*
unary          → ( "!" | "-" ) unary | postfix
postfix        → primary ( "++" | "--" )?
primary        → NUMBER | STRING | IDENTIFIER | "(" expression ")"
type           → "int" | "char" | "void"
```

### 7.2 FIRST和FOLLOW集合

```
FIRST集合：
FIRST(program) = {int, char, void, ε}
FIRST(declaration) = {int, char, void}
FIRST(varDecl) = {int, char, void}
FIRST(funDecl) = {int, char, void}
FIRST(statement) = {IDENTIFIER, if, while, return, {, NUMBER, STRING, (, !, -}
FIRST(expression) = {IDENTIFIER, NUMBER, STRING, (, !, -}
FIRST(primary) = {NUMBER, STRING, IDENTIFIER, (}

FOLLOW集合：
FOLLOW(program) = {$}
FOLLOW(declaration) = {int, char, void, $}
FOLLOW(statement) = {}, int, char, void, $}
FOLLOW(expression) = {;, ), ,, }, int, char, void, $}
```

---

## 8. 使用说明

### 8.1 快速开始

```bash
# 1. 编译所有测试程序
make clean
make

# 2. 运行单个阶段测试
./test_lexer_only
./test_parser_only
./test_semantic_only
./test_optimizer_only
./test_codegen_only

# 3. 运行完整编译流程
./test_full_pipeline

# 4. 运行原始编译器
./compiler tests/test_code.c
```

### 8.2 自定义测试

你可以修改各个测试程序中的测试用例，或者创建新的源代码文件进行测试：

```c
// 在任何测试程序中修改这部分
const char *your_test_code = "你的C代码";
test_function(your_test_code);
```

### 8.3 调试技巧

1. **启用详细输出**：在编译时添加 `-DDEBUG` 标志
2. **使用GDB调试**：`gdb ./test_program`
3. **内存检查**：`valgrind ./test_program`
4. **查看中间文件**：检查生成的 `output.c` 文件

---

## 9. 扩展功能

### 9.1 添加新的优化

在 `optimizer.c` 中添加新的优化函数：

```c
static Expr *optimize_algebraic_simplification(Optimizer *optimizer, Expr *expr) {
    // 实现代数简化优化
    // 例如：x + 0 → x, x * 1 → x
}
```

### 9.2 支持新的目标平台

在 `codegen.c` 中添加新的目标代码生成：

```c
typedef enum {
    TARGET_C,
    TARGET_ASM_X86,
    TARGET_LLVM_IR,
    TARGET_JAVASCRIPT  // 新增
} CodeGenTarget;
```

这个详细指南提供了C语言编译器各个阶段的独立运行代码和详细说明，帮助你深入理解编译器的工作原理。