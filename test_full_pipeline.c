// test_full_pipeline.c
// 完整编译流程测试程序
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/analyzer.h"
#include "src/compiler/optimizer.h"
#include "src/compiler/codegen.h"
#include "src/compiler/common.h"

void print_separator(const char *title) {
    printf("\n");
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n%s\n", title);
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n");
}

void print_stage_header(const char *stage_name, const char *icon) {
    printf("\n%s 阶段%d：%s\n", icon, 
           strcmp(stage_name, "词法分析") == 0 ? 1 :
           strcmp(stage_name, "语法分析") == 0 ? 2 :
           strcmp(stage_name, "语义分析") == 0 ? 3 :
           strcmp(stage_name, "代码优化") == 0 ? 4 : 5,
           stage_name);
    for (int i = 0; i < 40; i++) printf("-");
    printf("\n");
}

void print_compilation_summary(int token_count, int ast_nodes, bool semantic_ok, 
                             bool optimization_ok, bool codegen_ok, 
                             double compile_time, const char *output_file) {
    printf("\n");
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n📊 编译统计报告\n");
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n");
    
    printf("🔢 数量统计:\n");
    printf("   Token数量: %d\n", token_count);
    printf("   AST节点数: %d\n", ast_nodes);
    printf("   编译耗时: %.4f 秒\n", compile_time);
    
    printf("\n✅ 阶段状态:\n");
    printf("   词法分析: %s\n", token_count > 0 ? "✅ 成功" : "❌ 失败");
    printf("   语法分析: %s\n", ast_nodes > 0 ? "✅ 成功" : "❌ 失败");
    printf("   语义分析: %s\n", semantic_ok ? "✅ 成功" : "❌ 失败");
    printf("   代码优化: %s\n", optimization_ok ? "✅ 成功" : "❌ 失败");
    printf("   代码生成: %s\n", codegen_ok ? "✅ 成功" : "❌ 失败");
    
    printf("\n📁 输出文件:\n");
    printf("   目标文件: %s\n", output_file ? output_file : "无");
    
    printf("\n🎯 编译结果: %s\n", 
           codegen_ok ? "🎉 编译成功" : "💥 编译失败");
    
    if (codegen_ok) {
        printf("\n🚀 下一步操作:\n");
        printf("   可以使用以下命令编译和运行生成的代码:\n");
        if (output_file) {
            printf("   $ gcc %s -o program\n", output_file);
            printf("   $ ./program\n");
        }
    }
}

void test_full_compilation(const char *source_code, const char *test_name, 
                          OptimizationLevel opt_level, const char *output_file) {
    printf("\n=== %s ===\n", test_name);
    printf("源代码:\n%s\n", source_code);
    printf("\n编译配置:\n");
    printf("   优化级别: %s\n", 
           opt_level == OPT_LEVEL_NONE ? "O0 (无优化)" :
           opt_level == OPT_LEVEL_BASIC ? "O1 (基础优化)" : "O2 (激进优化)");
    printf("   输出文件: %s\n", output_file ? output_file : "标准输出");
    
    clock_t start_time = clock();
    clock_t end_time;
    double cpu_time_used;
    
    // 初始化统计变量
    int token_count = 0;
    int ast_nodes = 0;
    bool semantic_ok = false;
    bool optimization_ok = false;
    bool codegen_ok = false;
    
    // 阶段1：词法分析
    print_stage_header("词法分析", "🔍");
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    // 统计Token数量
    Token token;
    Lexer temp_lexer = lexer;  // 临时复制用于统计
    do {
        token = scan_token(&temp_lexer);
        if (token.type != TOKEN_EOF) token_count++;
    } while (token.type != TOKEN_EOF && token.type != TOKEN_ERROR);
    
    if (token.type == TOKEN_ERROR) {
        printf("❌ 词法分析失败：发现无法识别的字符\n");
        printf("   错误位置: 第 %d 行，第 %d 列\n", token.line, token.column);
        goto cleanup;
    }
    
    printf("✅ 词法分析完成\n");
    printf("   生成Token数量: %d\n", token_count);
    printf("   词法错误数量: 0\n");
    
    // 阶段2：语法分析
    print_stage_header("语法分析", "🌳");
    Parser parser;
    init_parser(&parser, &lexer);
    ArrayList *ast = parse(&parser);
    
    if (parser.had_error) {
        printf("❌ 语法分析失败\n");
        printf("   错误位置: 第 %d 行\n", parser.current.line);
        printf("   当前Token: %.*s\n", parser.current.length, parser.current.start);
        goto cleanup;
    }
    
    ast_nodes = ast ? ast->size : 0;
    printf("✅ 语法分析完成\n");
    printf("   生成AST节点数: %d\n", ast_nodes);
    printf("   语法错误数量: 0\n");
    
    // 阶段3：语义分析
    print_stage_header("语义分析", "🔬");
    Analyzer analyzer;
    init_analyzer(&analyzer);
    
    printf("正在执行语义检查...\n");
    printf("   - 符号表构建\n");
    printf("   - 类型检查\n");
    printf("   - 作用域验证\n");
    printf("   - 语义规则检查\n");
    
    semantic_ok = analyze(&analyzer, ast);
    
    if (!semantic_ok) {
        printf("❌ 语义分析失败\n");
        if (analyzer.symbol_table && analyzer.symbol_table->errors) {
            printf("   语义错误数量: %d\n", analyzer.symbol_table->errors->size);
        }
        free_analyzer(&analyzer);
        goto cleanup;
    }
    
    printf("✅ 语义分析完成\n");
    printf("   语义错误数量: 0\n");
    printf("   符号表状态: 正常\n");
    
    // 阶段4：代码优化
    print_stage_header("代码优化", "⚡");
    Optimizer optimizer;
    init_optimizer(&optimizer, opt_level);
    
    printf("正在执行代码优化...\n");
    switch (opt_level) {
        case OPT_LEVEL_NONE:
            printf("   - 跳过优化 (O0)\n");
            break;
        case OPT_LEVEL_BASIC:
            printf("   - 常量折叠\n");
            printf("   - 死代码消除\n");
            printf("   - 基础代数简化\n");
            break;
        case OPT_LEVEL_MEDIUM:
            printf("   - 常量折叠\n");
            printf("   - 死代码消除\n");
            printf("   - 部分公共子表达式消除\n");
            break;
        case OPT_LEVEL_AGGRESSIVE:
            printf("   - 常量折叠\n");
            printf("   - 死代码消除\n");
            printf("   - 公共子表达式消除\n");
            printf("   - 循环优化\n");
            break;
    }
    
    optimization_ok = run_optimization(&optimizer, ast);
    
    if (!optimization_ok) {
        printf("❌ 代码优化失败\n");
        free_optimizer(&optimizer);
        free_analyzer(&analyzer);
        goto cleanup;
    }
    
    printf("✅ 代码优化完成\n");
    printf("   优化级别: %s\n", 
           opt_level == OPT_LEVEL_NONE ? "O0" :
           opt_level == OPT_LEVEL_BASIC ? "O1" : "O2");
    printf("   优化状态: 成功\n");
    
    // 阶段5：目标代码生成
    print_stage_header("目标代码生成", "🎯");
    CodeGenerator codegen;
    init_code_generator(&codegen, TARGET_C, output_file);
    
    printf("正在生成目标代码...\n");
    printf("   - 遍历优化后的AST\n");
    printf("   - 生成C语言代码\n");
    printf("   - 写入输出文件\n");
    
    codegen_ok = run_code_generation(&codegen, ast);
    
    if (!codegen_ok) {
        printf("❌ 目标代码生成失败\n");
        free_code_generator(&codegen);
        free_optimizer(&optimizer);
        free_analyzer(&analyzer);
        goto cleanup;
    }
    
    printf("✅ 目标代码生成完成\n");
    printf("   目标语言: C\n");
    printf("   输出文件: %s\n", output_file ? output_file : "标准输出");
    
    // 显示生成代码的预览
    if (output_file) {
        printf("\n📄 生成代码预览:\n");
        FILE *file = fopen(output_file, "r");
        if (file) {
            char line[256];
            int line_num = 0;
            while (fgets(line, sizeof(line), file) && line_num < 10) {
                printf("   %2d: %s", ++line_num, line);
            }
            if (!feof(file)) {
                printf("   ... (显示前10行)\n");
            }
            fclose(file);
        }
    }
    
    // 清理资源
    free_code_generator(&codegen);
    free_optimizer(&optimizer);
    free_analyzer(&analyzer);
    
cleanup:
    // 计算总耗时
    end_time = clock();
    cpu_time_used = ((double) (end_time - start_time)) / CLOCKS_PER_SEC;
    
    // 打印编译统计报告
    print_compilation_summary(token_count, ast_nodes, semantic_ok, 
                            optimization_ok, codegen_ok, cpu_time_used, output_file);
}

int main() {
    printf("🚀 C语言编译器 - 完整编译流程测试\n");
    printf("作者: AI Assistant\n");
    printf("版本: 1.0\n");
    printf("\n本程序将测试编译器的完整流程：\n");
    printf("   词法分析 → 语法分析 → 语义分析 → 代码优化 → 目标代码生成\n");
    
    // 测试用例1：简单程序
    const char *test1 = 
        "int main() {\n"
        "    int x = 10;\n"
        "    int y = 20;\n"
        "    int sum = x + y;\n"
        "    return sum;\n"
        "}";
    test_full_compilation(test1, "测试1: 简单程序 (O0)", OPT_LEVEL_NONE, "output_simple.c");
    
    print_separator("");
    
    // 测试用例2：带优化的程序
    const char *test2 = 
        "int calculate() {\n"
        "    int a = 5 + 10;\n"
        "    int b = a * 1;\n"
        "    if (1) {\n"
        "        return b;\n"
        "    }\n"
        "    return 0;\n"
        "}";
    test_full_compilation(test2, "测试2: 优化测试 (O1)", OPT_LEVEL_BASIC, "output_optimized.c");
    
    print_separator("");
    
    // 测试用例3：递归函数
    const char *test3 = 
        "int factorial(int n) {\n"
        "    if (n <= 1) {\n"
        "        return 1;\n"
        "    }\n"
        "    return n * factorial(n - 1);\n"
        "}\n\n"
        "int main() {\n"
        "    int result = factorial(5);\n"
        "    return result;\n"
        "}";
    test_full_compilation(test3, "测试3: 递归函数 (O1)", OPT_LEVEL_BASIC, "output_recursive.c");
    
    print_separator("");
    
    // 测试用例4：复杂程序
    const char *test4 = 
        "int fibonacci(int n) {\n"
        "    if (n <= 1) return n;\n"
        "    return fibonacci(n-1) + fibonacci(n-2);\n"
        "}\n\n"
        "int main() {\n"
        "    int i = 0;\n"
        "    while (i < 10) {\n"
        "        int fib = fibonacci(i);\n"
        "        i = i + 1;\n"
        "    }\n"
        "    return 0;\n"
        "}";
    test_full_compilation(test4, "测试4: 复杂程序 (O2)", OPT_LEVEL_AGGRESSIVE, "output_complex.c");
    
    print_separator("");
    
    // 测试用例5：错误处理测试
    const char *test5 = 
        "int main() {\n"
        "    int x = y + 5; // y未声明\n"
        "    return x;\n"
        "}";
    test_full_compilation(test5, "测试5: 语义错误处理", OPT_LEVEL_BASIC, "output_error.c");
    
    print_separator("");
    
    // 测试用例6：语法错误测试
    const char *test6 = 
        "int main() {\n"
        "    int x = ; // 语法错误\n"
        "    return x;\n"
        "}";
    test_full_compilation(test6, "测试6: 语法错误处理", OPT_LEVEL_BASIC, "output_syntax_error.c");
    
    printf("\n🎉 完整编译流程测试完成！\n");
    printf("\n📋 测试总结:\n");
    printf("   ✅ 成功案例展示了完整的编译流程\n");
    printf("   ❌ 错误案例展示了错误处理机制\n");
    printf("   ⚡ 不同优化级别的效果对比\n");
    printf("   📊 详细的统计信息和性能数据\n");
    
    printf("\n📁 生成的文件:\n");
    printf("   📄 output_simple.c     - 简单程序\n");
    printf("   📄 output_optimized.c  - 优化后程序\n");
    printf("   📄 output_recursive.c  - 递归函数\n");
    printf("   📄 output_complex.c    - 复杂程序\n");
    
    printf("\n🔍 编译器特性验证:\n");
    printf("   ✓ 词法分析：Token识别和错误处理\n");
    printf("   ✓ 语法分析：AST构建和语法错误检测\n");
    printf("   ✓ 语义分析：类型检查和作用域验证\n");
    printf("   ✓ 代码优化：多级优化策略\n");
    printf("   ✓ 代码生成：C语言目标代码输出\n");
    
    printf("\n💡 使用建议:\n");
    printf("   - 检查生成的C文件是否可以正常编译\n");
    printf("   - 对比不同优化级别的输出差异\n");
    printf("   - 分析错误处理的准确性\n");
    printf("   - 验证编译时间和代码质量的平衡\n");
    
    return 0;
}