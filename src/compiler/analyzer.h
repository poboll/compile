/**
 * 语义分析器头文件
 *
 * 功能：
 * 1. 定义语义分析器数据结构
 * 2. 声明语义分析的接口函数
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#ifndef COMPILER_SEMANTIC_ANALYZER_H
#define COMPILER_SEMANTIC_ANALYZER_H

#include "ast.h"
#include "symbol.h"

// 语义分析器结构
typedef struct
{
    SymbolTable *symbol_table;             // 符号表
    bool had_error;                        // 是否有语义错误
    bool in_function;                      // 当前是否在函数内部
    DataType current_function_return_type; // 当前函数的返回类型
} Analyzer;

// 初始化语义分析器
void init_analyzer(Analyzer *analyzer);

// 释放语义分析器资源
void free_analyzer(Analyzer *analyzer);

// 执行语义分析
bool analyze(Analyzer *analyzer, ArrayList *statements);

// 分析表达式，返回表达式的类型
DataType analyze_expr(Analyzer *analyzer, Expr *expr);

// 预定义内置函数
void predefine_built_in_functions(Analyzer *analyzer);

// 打印语义错误
void print_semantic_errors(Analyzer *analyzer);

#endif // COMPILER_SEMANTIC_ANALYZER_H