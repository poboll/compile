/**
 * 代码优化器头文件
 *
 * 功能：
 * 1. 定义代码优化的接口
 * 2. 声明优化器的结构
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#ifndef COMPILER_OPTIMIZER_H
#define COMPILER_OPTIMIZER_H

#include "ast.h"

// 优化级别
typedef enum
{
    OPT_LEVEL_NONE,      // 不进行优化
    OPT_LEVEL_BASIC,     // 基本优化
    OPT_LEVEL_MEDIUM,    // 中等优化
    OPT_LEVEL_AGGRESSIVE // 激进优化
} OptimizationLevel;

// 优化器配置
typedef struct
{
    OptimizationLevel level;         // 优化级别
    bool constant_folding;           // 常量折叠
    bool dead_code_elimination;      // 死代码消除
    bool common_subexpr_elimination; // 公共子表达式消除
} OptimizerConfig;

// 优化器
typedef struct
{
    OptimizerConfig config; // 优化配置
    bool had_error;         // 是否发生错误
    ArrayList *warnings;    // 优化过程中的警告
} Optimizer;

// 初始化优化器
void init_optimizer(Optimizer *optimizer, OptimizationLevel level);

// 释放优化器资源
void free_optimizer(Optimizer *optimizer);

// 执行代码优化
bool run_optimization(Optimizer *optimizer, ArrayList *statements);

// 打印优化信息
void print_optimization_info(Optimizer *optimizer);

#endif // COMPILER_OPTIMIZER_H