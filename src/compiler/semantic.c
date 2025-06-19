/**
 * 语义分析模块实现
 *
 * 功能：
 * 1. 实现语义分析的主要接口
 * 2. 集成符号表和语义分析器
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include "semantic.h"
#include <stdio.h>

// 运行语义分析
bool run_semantic_analysis(ArrayList *statements)
{
    Analyzer analyzer;
    init_analyzer(&analyzer);

    printf("--- 语义分析 ---\n");

    bool success = analyze(&analyzer, statements);

    if (!success)
    {
        print_semantic_errors(&analyzer);
    }
    else
    {
        printf("语义分析完成，未发现错误.\n");
    }

    printf("------------------\n\n");

    // 释放资源
    free_analyzer(&analyzer);

    return success;
}