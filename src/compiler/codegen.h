/**
 * 目标代码生成器头文件
 *
 * 功能：
 * 1. 定义代码生成器的接口和数据结构
 * 2. 声明将 AST 转换为目标代码的函数
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#ifndef COMPILER_CODEGEN_H
#define COMPILER_CODEGEN_H

#include "ast.h"
#include <stdio.h>

// 代码生成器目标
typedef enum
{
    TARGET_C,       // 生成 C 代码
    TARGET_ASM_X86, // 生成 x86 汇编 (未来扩展)
    TARGET_LLVM_IR, // 生成 LLVM IR (未来扩展)
} CodeGenTarget;

// 代码生成器配置
typedef struct
{
    CodeGenTarget target; // 目标平台
    FILE *output_file;    // 输出文件指针
    int indent_level;     // 当前缩进级别
} CodeGenConfig;

// 代码生成器
typedef struct
{
    CodeGenConfig config;
    bool had_error;
} CodeGenerator;

// 初始化代码生成器
void init_code_generator(CodeGenerator *codegen, CodeGenTarget target, const char *output_filename);

// 释放代码生成器资源
void free_code_generator(CodeGenerator *codegen);

// 执行代码生成
bool run_code_generation(CodeGenerator *codegen, ArrayList *statements);

#endif // COMPILER_CODEGEN_H