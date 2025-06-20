// test_lexer_only.c
// 词法分析器独立测试程序
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "src/compiler/lexer.h"
#include "src/compiler/token.h"
#include "src/compiler/common.h"

// 注意：token_type_to_string 和 print_token 函数已在 token.c 中定义

void print_separator(const char *title) {
    printf("\n");
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n%s\n", title);
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n");
}

void test_lexer(const char *source_code, const char *test_name) {
    printf("\n=== %s ===\n", test_name);
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
        
        // 如果遇到错误Token，显示错误信息
        if (token.type == TOKEN_ERROR) {
            printf("     ❌ 词法错误: 无法识别的字符\n");
        }
    } while (token.type != TOKEN_EOF && token.type != TOKEN_ERROR);
    
    printf("\n📊 统计信息: 总共生成 %d 个Token\n", token_count);
    
    if (token.type == TOKEN_ERROR) {
        printf("❌ 词法分析失败\n");
    } else {
        printf("✅ 词法分析成功\n");
    }
}

int main() {
    printf("🔍 C语言编译器 - 词法分析器独立测试\n");
    printf("作者: AI Assistant\n");
    printf("版本: 1.0\n");
    
    // 测试用例1：简单变量声明
    const char *test1 = "int x = 10;";
    test_lexer(test1, "测试1: 简单变量声明");
    
    print_separator("");
    
    // 测试用例2：函数定义
    const char *test2 = "int add(int a, int b) { return a + b; }";
    test_lexer(test2, "测试2: 函数定义");
    
    print_separator("");
    
    // 测试用例3：控制流语句
    const char *test3 = "if (x > 5) { printf(\"hello\"); }";
    test_lexer(test3, "测试3: 控制流语句");
    
    print_separator("");
    
    // 测试用例4：复杂表达式
    const char *test4 = "result = (a + b) * c - d / e;";
    test_lexer(test4, "测试4: 复杂表达式");
    
    print_separator("");
    
    // 测试用例5：多行代码
    const char *test5 = 
        "int factorial(int n) {\n"
        "    if (n <= 1) return 1;\n"
        "    return n * factorial(n - 1);\n"
        "}";
    test_lexer(test5, "测试5: 多行函数定义");
    
    print_separator("");
    
    // 测试用例6：字符串和字符常量
    const char *test6 = "char c = 'a'; char *str = \"Hello, World!\";";
    test_lexer(test6, "测试6: 字符串和字符常量");
    
    print_separator("");
    
    // 测试用例7：注释处理（如果支持）
    const char *test7 = 
        "int x = 5; // 这是行注释\n"
        "/* 这是块注释 */ int y = 10;";
    test_lexer(test7, "测试7: 注释处理");
    
    print_separator("");
    
    // 测试用例8：错误处理
    const char *test8 = "int x = 10@; // 包含非法字符";
    test_lexer(test8, "测试8: 错误处理");
    
    printf("\n🎉 词法分析器测试完成！\n");
    printf("\n💡 提示:\n");
    printf("   - 如果看到 ERROR Token，说明源代码包含词法错误\n");
    printf("   - Token的行号和列号信息有助于定位错误位置\n");
    printf("   - 可以修改测试用例来验证不同的词法规则\n");
    
    return 0;
}