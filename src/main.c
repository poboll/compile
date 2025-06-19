/**
 * 主程序入口
 *
 * 功能：
 * 1. 驱动编译器，连接各个模块
 * 2. 依次执行词法分析、语法分析、语义分析、代码优化和目标代码生成
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include <stdio.h>
#include <stdlib.h>
#include "compiler/common.h"
#include "compiler/lexer.h"
#include "compiler/parser.h"
#include "compiler/ast.h"
#include "compiler/analyzer.h" // 移除 "semantic/"
#include "compiler/optimizer.h"
#include "compiler/codegen.h"

// 运行完整的编译流程
static void run_compiler(const char *source_code)
{
    // 阶段 1: 词法分析
    printf("--- 阶段 1: 词法分析 ---\n");
    Lexer lexer;
    init_lexer(&lexer, source_code);
    // 可以在这里打印 tokens 用于调试，但默认关闭以保持简洁
    printf("词法分析完成.\n\n");

    // 阶段 2: 语法分析 (Parsing)
    printf("--- 阶段 2: 语法分析 ---\n");
    Parser parser;
    init_parser(&parser, &lexer);
    ArrayList *ast = parse(&parser);

    if (parser.had_error)
    {
        printf("语法分析失败，编译终止。\n");
        // TODO: Free AST
        return;
    }
    printf("语法分析完成，生成 AST.\n");
    // print_ast(ast); // 取消注释以打印 AST
    printf("---------------------\n\n");

    // 阶段 3: 语义分析
    Analyzer analyzer;
    init_analyzer(&analyzer);
    bool semantic_result = analyze(&analyzer, ast);
    print_semantic_errors(&analyzer); // 总是打印错误，即使没有错误

    if (!semantic_result)
    {
        printf("语义分析失败，编译终止。\n");
        // TODO: Free AST
        return;
    }

    // 阶段 4: 代码优化
    Optimizer optimizer;
    init_optimizer(&optimizer, OPT_LEVEL_BASIC);
    if (!run_optimization(&optimizer, ast))
    {
        printf("代码优化失败，编译终止。\n");
        // TODO: Free AST & optimizer
        return;
    }
    printf("优化后的 AST:\n");
    print_ast(ast); // 打印优化后的AST以供查看
    printf("\n");

    // 阶段 5: 目标代码生成
    CodeGenerator codegen;
    init_code_generator(&codegen, TARGET_C, "output.c");
    if (!run_code_generation(&codegen, ast))
    {
        printf("代码生成失败，编译终止。\n");
    }
    free_code_generator(&codegen);

    // TODO: 释放 AST 资源
    free_optimizer(&optimizer);
}

int main(int argc, const char *argv[])
{
    if (argc != 2)
    {
        fprintf(stderr, "用法: %s <源文件>\n", argv[0]);
        return 1;
    }

    // 从文件读取源代码
    char *source_code = read_file(argv[1]);
    if (source_code == NULL)
    {
        fprintf(stderr, "无法打开文件 \"%s\".\n", argv[1]);
        return 1;
    }

    printf("--- 正在编译源文件: %s ---\n", argv[1]);
    printf("--- 源代码 ---\n%s\n--------------------\n\n", source_code);

    // 运行完整的编译流程
    run_compiler(source_code);

    // 释放源代码内存
    free(source_code);

    printf("编译流程结束。\n");
    return 0;
}