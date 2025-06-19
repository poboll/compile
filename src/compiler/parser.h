/**
 * 解析器头文件 - Parser
 *
 * 功能：
 * 1. 定义Parser结构体
 * 2. 声明Parser的初始化和解析函数
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#ifndef COMPILER_PARSER_H
#define COMPILER_PARSER_H

#include "lexer.h"
#include "ast.h"

// Parser结构体
typedef struct
{
    Lexer *lexer;
    Token current;
    Token previous;
    bool had_error;
    bool panic_mode; // 用于错误恢复
} Parser;

// 初始化解析器
void init_parser(Parser *parser, Lexer *lexer);

// 解析源代码，返回顶层语句的列表 (ArrayList of Stmt*)
// 如果发生错误，返回NULL
ArrayList *parse(Parser *parser);

#endif // COMPILER_PARSER_H