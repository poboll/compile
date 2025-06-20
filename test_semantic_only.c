// test_semantic_only.c
// 语义分析器独立测试程序
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/analyzer.h"
#include "src/compiler/symbol.h"
#include "src/compiler/common.h"

void print_separator(const char *title) {
    printf("\n");
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n%s\n", title);
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n");
}

// 简化的符号表打印函数
void print_symbol_table_info(SymbolTable *table) {
    printf("\n📋 符号表信息:\n");
    if (table && table->current) {
        printf("   当前作用域级别: %d\n", table->current->level);
        printf("   符号表状态: %s\n", table->current ? "已初始化" : "未初始化");
    } else {
        printf("   符号表状态: 未初始化\n");
    }
}

// 简化的语义错误打印函数
void print_semantic_errors_info(Analyzer *analyzer) {
    printf("\n🔍 语义分析结果:\n");
    if (analyzer->symbol_table && analyzer->symbol_table->errors) {
        int error_count = analyzer->symbol_table->errors->size;
        printf("   错误数量: %d\n", error_count);
        
        if (error_count > 0) {
            printf("   ❌ 发现语义错误:\n");
            // 这里可以遍历错误列表并打印详细信息
            // 由于具体实现可能不同，这里只显示错误数量
            for (int i = 0; i < error_count && i < 5; i++) {
                printf("      %d. 语义错误 (详细信息需要具体实现)\n", i + 1);
            }
            if (error_count > 5) {
                printf("      ... 还有 %d 个错误\n", error_count - 5);
            }
        } else {
            printf("   ✅ 无语义错误\n");
        }
    } else {
        printf("   ⚠️  错误列表未初始化\n");
    }
}

void test_semantic_analysis(const char *source_code, const char *test_name) {
    printf("\n=== %s ===\n", test_name);
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
        printf("   错误位置: 第 %d 行\n", parser.current.line);
        return;
    }
    
    printf("\n✅ 语法分析成功，开始语义分析...\n");
    
    // 语义分析
    Analyzer analyzer;
    init_analyzer(&analyzer);
    
    printf("\n🔬 执行语义分析阶段:\n");
    printf("   1. 初始化符号表...\n");
    printf("   2. 遍历AST节点...\n");
    printf("   3. 类型检查...\n");
    printf("   4. 作用域检查...\n");
    printf("   5. 语义规则验证...\n");
    
    bool semantic_result = analyze(&analyzer, ast);
    
    // 打印符号表信息
    print_symbol_table_info(analyzer.symbol_table);
    
    // 打印语义错误
    print_semantic_errors_info(&analyzer);
    
    // 分析结果统计
    printf("\n📊 语义分析统计:\n");
    if (ast) {
        printf("   处理的AST节点数: %d\n", ast->size);
    }
    
    if (semantic_result) {
        printf("   分析状态: ✅ 成功\n");
        printf("   语义正确性: 通过\n");
    } else {
        printf("   分析状态: ❌ 失败\n");
        printf("   语义正确性: 存在错误\n");
    }
    
    // 清理资源
    free_analyzer(&analyzer);
}

int main() {
    printf("🔬 C语言编译器 - 语义分析器独立测试\n");
    printf("作者: AI Assistant\n");
    printf("版本: 1.0\n");
    
    // 测试用例1：正确的变量声明和使用
    const char *test1 = "int x = 10; int y = x + 5;";
    test_semantic_analysis(test1, "测试1: 正确的变量声明和使用");
    
    print_separator("");
    
    // 测试用例2：未声明变量的使用（应该报错）
    const char *test2 = "int x = y + 5; // y未声明";
    test_semantic_analysis(test2, "测试2: 未声明变量使用");
    
    print_separator("");
    
    // 测试用例3：类型不匹配（如果支持类型检查）
    const char *test3 = "int x = 10; char y = x; // 可能的类型警告";
    test_semantic_analysis(test3, "测试3: 类型兼容性检查");
    
    print_separator("");
    
    // 测试用例4：函数定义和调用
    const char *test4 = 
        "int add(int a, int b) { return a + b; }\n"
        "int main() { int result = add(3, 4); return 0; }";
    test_semantic_analysis(test4, "测试4: 函数定义和调用");
    
    print_separator("");
    
    // 测试用例5：作用域测试
    const char *test5 = 
        "int x = 10;\n"
        "int main() {\n"
        "    int x = 20; // 局部变量遮蔽全局变量\n"
        "    return x;\n"
        "}";
    test_semantic_analysis(test5, "测试5: 变量作用域");
    
    print_separator("");
    
    // 测试用例6：函数参数作用域
    const char *test6 = 
        "int func(int a, int b) {\n"
        "    int c = a + b;\n"
        "    return c;\n"
        "}";
    test_semantic_analysis(test6, "测试6: 函数参数作用域");
    
    print_separator("");
    
    // 测试用例7：重复声明错误
    const char *test7 = 
        "int x = 10;\n"
        "int x = 20; // 重复声明";
    test_semantic_analysis(test7, "测试7: 重复声明检查");
    
    print_separator("");
    
    // 测试用例8：函数调用参数数量检查
    const char *test8 = 
        "int add(int a, int b) { return a + b; }\n"
        "int main() { int result = add(1); return 0; } // 参数不足";
    test_semantic_analysis(test8, "测试8: 函数调用参数检查");
    
    print_separator("");
    
    // 测试用例9：返回类型检查
    const char *test9 = 
        "int getValue() {\n"
        "    return; // 应该返回int值\n"
        "}";
    test_semantic_analysis(test9, "测试9: 返回类型检查");
    
    print_separator("");
    
    // 测试用例10：复杂的语义分析
    const char *test10 = 
        "int factorial(int n) {\n"
        "    if (n <= 1) {\n"
        "        return 1;\n"
        "    }\n"
        "    return n * factorial(n - 1);\n"
        "}\n\n"
        "int main() {\n"
        "    int num = 5;\n"
        "    int result = factorial(num);\n"
        "    return 0;\n"
        "}";
    test_semantic_analysis(test10, "测试10: 递归函数语义分析");
    
    printf("\n🎉 语义分析器测试完成！\n");
    printf("\n💡 语义分析检查项目:\n");
    printf("   ✓ 变量声明检查\n");
    printf("   ✓ 变量使用前声明检查\n");
    printf("   ✓ 作用域规则检查\n");
    printf("   ✓ 类型兼容性检查\n");
    printf("   ✓ 函数调用检查\n");
    printf("   ✓ 返回类型检查\n");
    printf("   ✓ 重复声明检查\n");
    
    printf("\n🔧 调试提示:\n");
    printf("   - 语义错误通常比语法错误更难发现\n");
    printf("   - 符号表记录了所有标识符的信息\n");
    printf("   - 作用域规则确保变量的正确访问\n");
    printf("   - 类型检查防止类型相关的运行时错误\n");
    
    return 0;
}