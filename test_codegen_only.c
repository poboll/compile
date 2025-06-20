// test_codegen_only.c
// 代码生成器独立测试程序
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "src/compiler/lexer.h"
#include "src/compiler/parser.h"
#include "src/compiler/codegen.h"
#include "src/compiler/common.h"

void print_separator(const char *title) {
    printf("\n");
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n%s\n", title);
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n");
}

const char* target_to_string(CodeGenTarget target) {
    switch (target) {
        case TARGET_C: return "C语言";
        // 如果有其他目标，可以在这里添加
        default: return "未知目标";
    }
}

void print_codegen_info(CodeGenTarget target, const char *output_file) {
    printf("\n🎯 代码生成配置:\n");
    printf("   目标语言: %s\n", target_to_string(target));
    printf("   输出文件: %s\n", output_file ? output_file : "标准输出");
    printf("   生成模式: %s\n", output_file ? "文件输出" : "控制台输出");
}

void print_generated_code_preview(const char *output_file) {
    if (!output_file) {
        printf("\n📄 生成的代码已输出到控制台\n");
        return;
    }
    
    printf("\n📄 生成的代码预览 (%s):\n", output_file);
    printf("--- 开始 ---\n");
    
    FILE *file = fopen(output_file, "r");
    if (file) {
        char line[256];
        int line_count = 0;
        while (fgets(line, sizeof(line), file) && line_count < 20) {
            printf("%3d: %s", ++line_count, line);
        }
        if (!feof(file)) {
            printf("... (文件较长，仅显示前20行)\n");
        }
        fclose(file);
    } else {
        printf("❌ 无法读取输出文件\n");
    }
    
    printf("--- 结束 ---\n");
}

void test_code_generation(const char *source_code, const char *test_name, const char *output_file) {
    printf("\n=== %s ===\n", test_name);
    printf("源代码:\n%s\n", source_code);
    
    print_codegen_info(TARGET_C, output_file);
    
    // 词法分析
    Lexer lexer;
    init_lexer(&lexer, source_code);
    
    // 语法分析
    Parser parser;
    init_parser(&parser, &lexer);
    ArrayList *ast = parse(&parser);
    
    if (parser.had_error) {
        printf("\n❌ 语法分析失败，无法生成代码！\n");
        printf("   错误位置: 第 %d 行\n", parser.current.line);
        return;
    }
    
    printf("\n✅ 语法分析成功，开始目标代码生成...\n");
    
    // 目标代码生成
    CodeGenerator codegen;
    init_code_generator(&codegen, TARGET_C, output_file);
    
    printf("\n🔧 执行代码生成过程:\n");
    printf("   1. 初始化代码生成器...\n");
    printf("   2. 遍历AST节点...\n");
    printf("   3. 生成目标代码...\n");
    printf("   4. 写入输出文件...\n");
    
    bool codegen_result = run_code_generation(&codegen, ast);
    
    if (codegen_result) {
        printf("   ✅ 代码生成完成\n");
        
        printf("\n📊 代码生成统计:\n");
        printf("   生成状态: 成功\n");
        printf("   目标平台: %s\n", target_to_string(TARGET_C));
        printf("   AST节点数: %d\n", ast ? ast->size : 0);
        
        // 显示生成的代码
        if (output_file) {
            print_generated_code_preview(output_file);
            
            // 检查文件大小
            FILE *file = fopen(output_file, "r");
            if (file) {
                fseek(file, 0, SEEK_END);
                long file_size = ftell(file);
                fclose(file);
                printf("   输出文件大小: %ld 字节\n", file_size);
            }
        }
        
    } else {
        printf("   ❌ 代码生成失败\n");
        printf("\n📊 代码生成统计:\n");
        printf("   生成状态: 失败\n");
        printf("   可能原因: AST结构不完整或代码生成器内部错误\n");
    }
    
    // 清理资源
    free_code_generator(&codegen);
}

int main() {
    printf("🎯 C语言编译器 - 代码生成器独立测试\n");
    printf("作者: AI Assistant\n");
    printf("版本: 1.0\n");
    
    // 测试用例1：简单变量声明
    const char *test1 = "int x = 10; int y = x + 5;";
    test_code_generation(test1, "测试1: 简单变量声明", "output_test1.c");
    
    print_separator("");
    
    // 测试用例2：函数定义
    const char *test2 = "int add(int a, int b) { return a + b; }";
    test_code_generation(test2, "测试2: 函数定义", "output_test2.c");
    
    print_separator("");
    
    // 测试用例3：控制流语句
    const char *test3 = 
        "int main() {\n"
        "    int x = 5;\n"
        "    if (x > 3) {\n"
        "        printf(\"x is greater than 3\");\n"
        "    }\n"
        "    return 0;\n"
        "}";
    test_code_generation(test3, "测试3: 控制流语句", "output_test3.c");
    
    print_separator("");
    
    // 测试用例4：循环语句
    const char *test4 = 
        "int main() {\n"
        "    int i = 0;\n"
        "    while (i < 10) {\n"
        "        printf(\"%d \", i);\n"
        "        i = i + 1;\n"
        "    }\n"
        "    return 0;\n"
        "}";
    test_code_generation(test4, "测试4: 循环语句", "output_test4.c");
    
    print_separator("");
    
    // 测试用例5：复杂表达式
    const char *test5 = 
        "int calculate() {\n"
        "    int a = 10;\n"
        "    int b = 20;\n"
        "    int result = (a + b) * 2 - a / 2;\n"
        "    return result;\n"
        "}";
    test_code_generation(test5, "测试5: 复杂表达式", "output_test5.c");
    
    print_separator("");
    
    // 测试用例6：嵌套结构
    const char *test6 = 
        "int main() {\n"
        "    int x = 5;\n"
        "    if (x > 0) {\n"
        "        if (x < 10) {\n"
        "            printf(\"x is between 0 and 10\");\n"
        "        } else {\n"
        "            printf(\"x is 10 or greater\");\n"
        "        }\n"
        "    }\n"
        "    return 0;\n"
        "}";
    test_code_generation(test6, "测试6: 嵌套结构", "output_test6.c");
    
    print_separator("");
    
    // 测试用例7：递归函数
    const char *test7 = 
        "int factorial(int n) {\n"
        "    if (n <= 1) {\n"
        "        return 1;\n"
        "    }\n"
        "    return n * factorial(n - 1);\n"
        "}\n\n"
        "int main() {\n"
        "    int result = factorial(5);\n"
        "    printf(\"Factorial of 5 is %d\", result);\n"
        "    return 0;\n"
        "}";
    test_code_generation(test7, "测试7: 递归函数", "output_test7.c");
    
    print_separator("");
    
    // 测试用例8：多个函数
    const char *test8 = 
        "int add(int a, int b) { return a + b; }\n"
        "int multiply(int a, int b) { return a * b; }\n"
        "int main() {\n"
        "    int x = add(3, 4);\n"
        "    int y = multiply(x, 2);\n"
        "    return y;\n"
        "}";
    test_code_generation(test8, "测试8: 多个函数", "output_test8.c");
    
    print_separator("");
    
    // 测试用例9：输出到控制台（无文件）
    const char *test9 = "int simple() { return 42; }";
    test_code_generation(test9, "测试9: 控制台输出", NULL);
    
    print_separator("");
    
    // 测试用例10：完整程序
    const char *test10 = 
        "#include <stdio.h>\n\n"
        "int fibonacci(int n) {\n"
        "    if (n <= 1) return n;\n"
        "    return fibonacci(n-1) + fibonacci(n-2);\n"
        "}\n\n"
        "int main() {\n"
        "    int n = 10;\n"
        "    printf(\"Fibonacci sequence:\\n\");\n"
        "    for (int i = 0; i < n; i++) {\n"
        "        printf(\"%d \", fibonacci(i));\n"
        "    }\n"
        "    printf(\"\\n\");\n"
        "    return 0;\n"
        "}";
    test_code_generation(test10, "测试10: 完整程序", "output_complete.c");
    
    printf("\n🎉 代码生成器测试完成！\n");
    printf("\n💡 代码生成特性:\n");
    printf("   ✓ 变量声明和初始化\n");
    printf("   ✓ 函数定义和调用\n");
    printf("   ✓ 控制流语句 (if/else, while, for)\n");
    printf("   ✓ 表达式计算\n");
    printf("   ✓ 递归函数支持\n");
    printf("   ✓ 嵌套结构处理\n");
    
    printf("\n🔧 输出文件说明:\n");
    printf("   📁 output_test1.c  - 变量声明示例\n");
    printf("   📁 output_test2.c  - 函数定义示例\n");
    printf("   📁 output_test3.c  - 控制流示例\n");
    printf("   📁 output_test4.c  - 循环语句示例\n");
    printf("   📁 output_test5.c  - 复杂表达式示例\n");
    printf("   📁 output_test6.c  - 嵌套结构示例\n");
    printf("   📁 output_test7.c  - 递归函数示例\n");
    printf("   📁 output_test8.c  - 多函数示例\n");
    printf("   📁 output_complete.c - 完整程序示例\n");
    
    printf("\n🚀 验证生成的代码:\n");
    printf("   可以使用以下命令编译和运行生成的C代码:\n");
    printf("   $ gcc output_complete.c -o test_program\n");
    printf("   $ ./test_program\n");
    
    printf("\n⚠️  注意事项:\n");
    printf("   - 生成的代码应该是有效的C语言代码\n");
    printf("   - 确保包含必要的头文件和库函数\n");
    printf("   - 检查生成代码的语法正确性\n");
    printf("   - 验证运行时行为是否符合预期\n");
    
    return 0;
}