/**
 * Token定义 - 词法分析器
 *
 * 功能：
 * 1. 定义Token类型
 * 2. 定义Token结构体
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#ifndef COMPILER_TOKEN_H
#define COMPILER_TOKEN_H

#include "common.h"

// Token类型枚举
typedef enum
{
    // 特殊Token
    TOKEN_EOF,   // 文件结束符
    TOKEN_ERROR, // 错误

    // 关键字 (C语言的子集)
    TOKEN_INT,    // "int"
    TOKEN_CHAR,   // "char"
    TOKEN_VOID,   // "void"
    TOKEN_IF,     // "if"
    TOKEN_ELSE,   // "else"
    TOKEN_WHILE,  // "while"
    TOKEN_FOR,    // "for"
    TOKEN_RETURN, // "return"
    TOKEN_SIZEOF, // "sizeof"

    // 标识符和字面量
    TOKEN_IDENTIFIER, // 标识符
    TOKEN_NUMBER,     // 数字字面量
    TOKEN_STRING,     // 字符串字面量
    TOKEN_CHAR_LIT,   // 字符字面量
    TOKEN_TRUE,       // "true"
    TOKEN_FALSE,      // "false"

    // 运算符
    TOKEN_PLUS,    // +
    TOKEN_MINUS,   // -
    TOKEN_STAR,    // *
    TOKEN_SLASH,   // /
    TOKEN_PERCENT, // %

    TOKEN_EQUAL,         // =
    TOKEN_EQUAL_EQUAL,   // ==
    TOKEN_BANG,          // !
    TOKEN_BANG_EQUAL,    // !=
    TOKEN_LESS,          // <
    TOKEN_LESS_EQUAL,    // <=
    TOKEN_GREATER,       // >
    TOKEN_GREATER_EQUAL, // >=

    TOKEN_AMPERSAND,   // &
    TOKEN_PIPE,        // |
    TOKEN_AND,         // &&
    TOKEN_OR,          // ||
    TOKEN_PLUS_PLUS,   // ++
    TOKEN_MINUS_MINUS, // --

    // 分隔符
    TOKEN_LPAREN,    // (
    TOKEN_RPAREN,    // )
    TOKEN_LBRACE,    // {
    TOKEN_RBRACE,    // }
    TOKEN_LBRACKET,  // [
    TOKEN_RBRACKET,  // ]
    TOKEN_COMMA,     // ,
    TOKEN_SEMICOLON, // ;
    TOKEN_DOT,       // .

} TokenType;

// Token结构
typedef struct
{
    TokenType type;    // Token类型
    const char *start; // 在源代码中的起始位置
    int length;        // Token的长度
    int line;          // Token所在的行号
    int column;        // Token所在的列号
} Token;

// 函数声明，用于打印Token信息（方便调试）
const char *token_type_to_string(TokenType type);
void print_token(Token *token);

#endif // COMPILER_TOKEN_H