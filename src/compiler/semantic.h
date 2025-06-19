/**
 * 语义分析模块头文件
 *
 * 功能：
 * 1. 包含语义分析所需的所有头文件
 * 2. 定义语义分析的主要接口
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#ifndef COMPILER_SEMANTIC_H
#define COMPILER_SEMANTIC_H

#include "ast.h"
#include "symbol.h"
#include "analyzer.h"

// 语义分析入口函数
bool run_semantic_analysis(ArrayList *statements);

#endif // COMPILER_SEMANTIC_H