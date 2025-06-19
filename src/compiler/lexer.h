/**
 * 词法分析器头文件 - Lexer
 *
 * 功能：
 * 1. 定义Lexer结构体
 * 2. 声明Lexer的初始化和扫描函数
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#ifndef COMPILER_LEXER_H
#define COMPILER_LEXER_H

#include "token.h"

// Lexer结构体
typedef struct
{
    const char *start;   // 指向当前正在扫描的Token的起始位置
    const char *current; // 指向当前正在处理的字符
    int line;            // 当前行号
    int start_column;    // 当前Token的起始列号
    int column;          // 当前列号
} Lexer;

// 初始化词法分析器
void init_lexer(Lexer *lexer, const char *source);

// 扫描下一个Token
Token scan_token(Lexer *lexer);

#endif // COMPILER_LEXER_H