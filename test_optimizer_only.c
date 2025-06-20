// test_optimizer_only.c
// 代码优化器独立测试程序
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/optimizer.h"
#include "src/compiler/common.h"

void print_separator(const char *title) {
    printf("\n");
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n%s\n", title);
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n");
}

// 简化的AST打印函数（用于显示优化前后的对比）
void print_ast_summary(ArrayList *statements, const char *label) {
    printf("\n=== %s ===\n", label);
    if (!statements || statements->size == 0) {
        printf("(空AST)\n");
        return;
    }
    
    printf("AST节点数: %d\n", statements->size);
    for (int i = 0; i < statements->size; i++) {
        Stmt *stmt = (Stmt*)arraylist_get(statements, i);
        if (stmt) {
            switch (stmt->type) {
                case STMT_VAR_DECL:
                    printf("  %d. 变量声明语句\n", i + 1);
                    break;
                case STMT_FUNC_DECL:
                    printf("  %d. 函数定义语句\n", i + 1);
                    break;
                case STMT_IF:
                    printf("  %d. if条件语句\n", i + 1);
                    break;
                case STMT_WHILE:
                    printf("  %d. while循环语句\n", i + 1);
                    break;
                case STMT_RETURN:
                    printf("  %d. return语句\n", i + 1);
                    break;
                case STMT_EXPRESSION:
                    printf("  %d. 表达式语句\n", i + 1);
                    break;
                case STMT_BLOCK:
                    printf("  %d. 块语句\n", i + 1);
                    break;
                default:
                    printf("  %d. 未知语句类型\n", i + 1);
                    break;
            }
        }
    }
}

const char* optimization_level_to_string(OptimizationLevel level) {
    switch (level) {
        case OPT_LEVEL_NONE: return "无优化 (O0)";
        case OPT_LEVEL_BASIC: return "基础优化 (O1)";
        case OPT_LEVEL_AGGRESSIVE: return "激进优化 (O2)";
        default: return "未知优化级别";
    }
}

void print_optimization_level_info(OptimizationLevel level) {
    printf("\n🔧 优化配置:\n");
    printf("   优化级别: %s\n", optimization_level_to_string(level));
    
    switch (level) {
        case OPT_LEVEL_NONE:
            printf("   启用的优化: 无\n");
            printf("   说明: 保持原始代码结构，不进行任何优化\n");
            break;
        case OPT_LEVEL_BASIC:
            printf("   启用的优化:\n");
            printf("     - 常量折叠 (Constant Folding)\n");
            printf("     - 死代码消除 (Dead Code Elimination)\n");
            printf("     - 基础代数简化\n");
            break;
        case OPT_LEVEL_MEDIUM:
            printf("   启用的优化:\n");
            printf("     - 常量折叠 (Constant Folding)\n");
            printf("     - 死代码消除 (Dead Code Elimination)\n");
            printf("     - 基础代数简化\n");
            printf("     - 部分公共子表达式消除\n");
            break;
        case OPT_LEVEL_AGGRESSIVE:
            printf("   启用的优化:\n");
            printf("     - 常量折叠 (Constant Folding)\n");
            printf("     - 死代码消除 (Dead Code Elimination)\n");
            printf("     - 公共子表达式消除 (CSE)\n");
            printf("     - 循环优化\n");
            printf("     - 内联优化\n");
            break;
    }
}

void test_optimization(const char *source_code, const char *test_name, OptimizationLevel level) {
    printf("\n=== %s ===\n", test_name);
    printf("源代码:\n%s\n", source_code);
    
    print_optimization_level_info(level);
    
    // 词法分析
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    // 语法分析
    Parser parser;
    init_parser(&parser, &lexer);
    ArrayList *ast = parse(&parser);
    
    if (parser.had_error) {
        printf("\n❌ 语法分析失败，无法进行优化！\n");
        printf("   错误位置: 第 %d 行\n", parser.current.line);
        return;
    }
    
    printf("\n✅ 语法分析成功，开始代码优化...\n");
    
    // 显示优化前的AST
    print_ast_summary(ast, "优化前的AST");
    
    // 代码优化
    Optimizer optimizer;
    init_optimizer(&optimizer, level);
    
    printf("\n⚡ 执行优化过程:\n");
    printf("   1. 初始化优化器...\n");
    printf("   2. 分析AST结构...\n");
    printf("   3. 应用优化规则...\n");
    printf("   4. 验证优化结果...\n");
    
    bool optimization_result = run_optimization(&optimizer, ast);
    
    if (optimization_result) {
        printf("   ✅ 优化完成\n");
        
        // 显示优化后的AST
        print_ast_summary(ast, "优化后的AST");
        
        printf("\n📊 优化统计:\n");
        printf("   优化状态: 成功\n");
        printf("   优化级别: %s\n", optimization_level_to_string(level));
        
        // 这里可以添加更详细的优化统计信息
        // 比如：消除的死代码数量、折叠的常量表达式数量等
        
    } else {
        printf("   ❌ 优化失败\n");
        printf("\n📊 优化统计:\n");
        printf("   优化状态: 失败\n");
        printf("   可能原因: AST结构不兼容或优化器内部错误\n");
    }
    
    // 清理资源
    free_optimizer(&optimizer);
}

int main() {
    printf("⚡ C语言编译器 - 代码优化器独立测试\n");
    printf("作者: AI Assistant\n");
    printf("版本: 1.0\n");
    
    // 测试用例1：常量折叠优化
    const char *test1 = "int x = 5 + 10; int y = 3 * 4; int z = 100 / 5;";
    test_optimization(test1, "测试1: 常量折叠优化", OPT_LEVEL_BASIC);
    
    print_separator("");
    
    // 测试用例2：死代码消除
    const char *test2 = 
        "if (1) { printf(\"always executed\"); }\n"
        "if (0) { printf(\"never executed\"); }\n"
        "int unreachable = 42;";
    test_optimization(test2, "测试2: 死代码消除", OPT_LEVEL_BASIC);
    
    print_separator("");
    
    // 测试用例3：代数简化
    const char *test3 = 
        "int a = x + 0;\n"
        "int b = y * 1;\n"
        "int c = z - 0;\n"
        "int d = w / 1;";
    test_optimization(test3, "测试3: 代数简化", OPT_LEVEL_BASIC);
    
    print_separator("");
    
    // 测试用例4：公共子表达式消除
    const char *test4 = 
        "int a = x + y;\n"
        "int b = x + y;\n"
        "int c = (x + y) * 2;";
    test_optimization(test4, "测试4: 公共子表达式消除", OPT_LEVEL_AGGRESSIVE);
    
    print_separator("");
    
    // 测试用例5：循环优化
    const char *test5 = 
        "for (int i = 0; i < 10; i++) {\n"
        "    int constant = 5 + 3;\n"
        "    printf(\"%d\", constant);\n"
        "}";
    test_optimization(test5, "测试5: 循环不变量外提", OPT_LEVEL_AGGRESSIVE);
    
    print_separator("");
    
    // 测试用例6：无优化对比
    const char *test6 = "int x = 5 + 10; int y = 3 * 4;";
    test_optimization(test6, "测试6: 无优化 (对比)", OPT_LEVEL_NONE);
    
    print_separator("");
    
    // 测试用例7：复杂表达式优化
    const char *test7 = 
        "int result = ((5 + 3) * 2) - (4 / 2) + (10 % 3);\n"
        "int simplified = 0 * x + 1 * y;";
    test_optimization(test7, "测试7: 复杂表达式优化", OPT_LEVEL_BASIC);
    
    print_separator("");
    
    // 测试用例8：函数内优化
    const char *test8 = 
        "int calculate() {\n"
        "    int a = 10 + 20;\n"
        "    int b = a * 1;\n"
        "    if (0) {\n"
        "        return -1;\n"
        "    }\n"
        "    return b;\n"
        "}";
    test_optimization(test8, "测试8: 函数内部优化", OPT_LEVEL_BASIC);
    
    print_separator("");
    
    // 测试用例9：嵌套优化
    const char *test9 = 
        "if (1) {\n"
        "    int x = 5 + 5;\n"
        "    if (0) {\n"
        "        int y = x * 2;\n"
        "    }\n"
        "    return x;\n"
        "}";
    test_optimization(test9, "测试9: 嵌套结构优化", OPT_LEVEL_AGGRESSIVE);
    
    print_separator("");
    
    // 测试用例10：优化级别对比
    const char *test10 = 
        "int complex_calc() {\n"
        "    int a = 5 + 10;\n"
        "    int b = a * 1;\n"
        "    int c = b + 0;\n"
        "    if (1) return c;\n"
        "    if (0) return -1;\n"
        "    return 0;\n"
        "}";
    
    printf("\n=== 测试10: 不同优化级别对比 ===\n");
    printf("源代码:\n%s\n", test10);
    
    printf("\n--- O0 级别 ---");
    test_optimization(test10, "O0优化", OPT_LEVEL_NONE);
    
    printf("\n--- O1 级别 ---");
    test_optimization(test10, "O1优化", OPT_LEVEL_BASIC);
    
    printf("\n--- O2 级别 ---");
    test_optimization(test10, "O2优化", OPT_LEVEL_AGGRESSIVE);
    
    printf("\n🎉 代码优化器测试完成！\n");
    printf("\n💡 优化技术说明:\n");
    printf("   🔹 常量折叠: 编译时计算常量表达式\n");
    printf("   🔹 死代码消除: 移除永远不会执行的代码\n");
    printf("   🔹 代数简化: 简化数学表达式 (如 x+0→x)\n");
    printf("   🔹 公共子表达式消除: 避免重复计算\n");
    printf("   🔹 循环优化: 提升循环性能\n");
    
    printf("\n🔧 优化级别指南:\n");
    printf("   O0: 无优化，保持原始结构，便于调试\n");
    printf("   O1: 基础优化，平衡编译时间和性能\n");
    printf("   O2: 激进优化，最大化运行时性能\n");
    
    printf("\n⚠️  注意事项:\n");
    printf("   - 优化可能改变代码的执行顺序\n");
    printf("   - 某些优化可能影响调试体验\n");
    printf("   - 激进优化可能增加编译时间\n");
    
    return 0;
}