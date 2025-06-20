// test_parser_only.c
// 语法分析器独立测试程序
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/ast.h"
#include "src/compiler/common.h"

// 使用完整的AST打印函数
// print_ast函数在ast_printer.c中定义，提供完整的AST结构显示

void print_separator(const char *title) {
    printf("\n");
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n%s\n", title);
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n");
}

void print_parse_errors(Parser *parser) {
    if (parser->had_error) {
        printf("\n❌ 语法错误详情:\n");
        printf("   - 在第 %d 行发现语法错误\n", parser->current.line);
        printf("   - 当前Token: %.*s\n", parser->current.length, parser->current.start);
        printf("   - 可能的原因: 语法不符合C语言规范\n");
    }
}

void test_parser(const char *source_code, const char *test_name) {
    printf("\n=== %s ===\n", test_name);
    printf("源代码:\n%s\n", source_code);
    
    // 词法分析
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    // 语法分析
    Parser parser;
    init_parser(&parser, &lexer);
    
    printf("\n🌳 开始语法分析...\n");
    ArrayList *ast = parse(&parser);
    
    if (parser.had_error) {
        printf("❌ 语法分析失败！\n");
        print_parse_errors(&parser);
        return;
    }
    
    printf("✅ 语法分析成功！\n");
    
    printf("\n=== 生成的AST ===\n");
    print_ast(ast);
    
    // 统计AST节点
    printf("\n📊 AST统计信息:\n");
    printf("   语句数量: %d\n", ast ? ast->size : 0);
    
    // 分析语句类型分布
    if (ast && ast->size > 0) {
        int var_decls = 0, functions = 0, expressions = 0, controls = 0;
        
        for (int i = 0; i < ast->size; i++) {
            Stmt *stmt = (Stmt*)arraylist_get(ast, i);
            if (stmt) {
                switch (stmt->type) {
                    case STMT_VAR_DECL:
                        var_decls++;
                        break;
                    case STMT_FUNC_DECL:
                        functions++;
                        break;
                    case STMT_EXPRESSION:
                        expressions++;
                        break;
                    case STMT_IF:
                    case STMT_WHILE:
                    case STMT_FOR:
                        controls++;
                        break;
                    default:
                        break;
                }
            }
        }
        
        printf("   - 变量声明: %d\n", var_decls);
        printf("   - 函数定义: %d\n", functions);
        printf("   - 表达式语句: %d\n", expressions);
        printf("   - 控制流语句: %d\n", controls);
    }
    
    // TODO: 释放AST内存
    // free_ast(ast);
}

int main() {
    printf("🌳 C语言编译器 - 语法分析器独立测试\n");
    printf("作者: AI Assistant\n");
    printf("版本: 1.0\n");
    
    // 测试用例1：简单变量声明
    const char *test1 = "int x = 10;";
    test_parser(test1, "测试1: 简单变量声明");
    
    print_separator("");
    
    // 测试用例2：多个变量声明
    const char *test2 = "int x = 10; int y = 20; char c = 'a';";
    test_parser(test2, "测试2: 多个变量声明");
    
    print_separator("");
    
    // 测试用例3：简单函数定义
    const char *test3 = "int add(int a, int b) { return a + b; }";
    test_parser(test3, "测试3: 简单函数定义");
    
    print_separator("");
    
    // 测试用例4：if语句
    const char *test4 = "if (x > 5) { x = x + 1; }";
    test_parser(test4, "测试4: if语句");
    
    print_separator("");
    
    // 测试用例5：while循环
    const char *test5 = "while (i < 10) { i = i + 1; }";
    test_parser(test5, "测试5: while循环");
    
    print_separator("");
    
    // 测试用例6：复杂表达式
    const char *test6 = "result = (a + b) * c - d / e;";
    test_parser(test6, "测试6: 复杂表达式");
    
    print_separator("");
    
    // 测试用例7：嵌套块语句
    const char *test7 = 
        "if (x > 0) {\n"
        "    if (y > 0) {\n"
        "        z = x + y;\n"
        "    }\n"
        "}";
    test_parser(test7, "测试7: 嵌套块语句");
    
    print_separator("");
    
    // 测试用例8：完整函数
    const char *test8 = 
        "int factorial(int n) {\n"
        "    if (n <= 1) {\n"
        "        return 1;\n"
        "    }\n"
        "    return n * factorial(n - 1);\n"
        "}";
    test_parser(test8, "测试8: 递归函数定义");
    
    print_separator("");
    
    // 测试用例9：语法错误测试
    const char *test9 = "int x = ; // 缺少表达式";
    test_parser(test9, "测试9: 语法错误处理");
    
    print_separator("");
    
    // 测试用例10：复杂程序
    const char *test10 = 
        "int main() {\n"
        "    int x = 5;\n"
        "    int y = 10;\n"
        "    if (x < y) {\n"
        "        printf(\"x is smaller\");\n"
        "    } else {\n"
        "        printf(\"y is smaller\");\n"
        "    }\n"
        "    return 0;\n"
        "}";
    test_parser(test10, "测试10: 完整main函数");
    
    printf("\n🎉 语法分析器测试完成！\n");
    printf("\n💡 提示:\n");
    printf("   - AST展示了源代码的语法结构\n");
    printf("   - 语法错误会阻止AST的生成\n");
    printf("   - 可以通过修改测试用例验证不同的语法规则\n");
    printf("   - 递归下降解析器按照语法规则构建AST\n");
    
    return 0;
}