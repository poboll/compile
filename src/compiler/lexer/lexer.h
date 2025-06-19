/**
 * 词法分析器头文件 - lexer.h
 * @description 词法分析器，负责将源代码分解为token序列，实现编译器的第一个阶段
 *              定义了Token类型、词法分析器结构和相关函数接口
 * @module compiler/lexer
 * @author poboll
 * @date 2025
 * @version 1.0
 *
 * 主要功能：
 * 1. 识别关键字、标识符、数字、字符串等词法单元
 * 2. 处理注释和空白字符
 * 3. 提供位置信息用于错误报告
 * 4. 支持错误恢复和容错处理
 * 5. 定义完整的Token类型枚举
 * 6. 提供词法分析器状态管理
 */

#ifndef COMPILER_LEXER_H
#define COMPILER_LEXER_H

#include "../common.h"

// Token类型
typedef enum
{
  TOKEN_KEYWORD,     // 关键字
  TOKEN_IDENTIFIER,  // 标识符
  TOKEN_NUMBER,      // 数字
  TOKEN_STRING,      // 字符串
  TOKEN_OPERATOR,    // 运算符
  TOKEN_PUNCTUATION, // 标点符号
  TOKEN_COMMENT,     // 注释
  TOKEN_WHITESPACE,  // 空白字符
  TOKEN_EOF,         // 文件结束
  TOKEN_UNKNOWN      // 未知类型
} TokenType;

// Token结构
typedef struct
{
  TokenType type; // Token类型
  char *value;    // Token文本值
  int line;       // 行号
  int column;     // 列号
} Token;

// 词法分析器结构
typedef struct
{
  char *source_code; // 源代码
  int current_pos;   // 当前位置
  int line;          // 当前行号
  int column;        // 当前列号
  ArrayList *tokens; // Token列表
  ArrayList *errors; // 错误信息列表
} Lexer;

// 创建词法分析器
Lexer *lexer_create(const char *source_code);

// 销毁词法分析器
void lexer_free(Lexer *lexer);

// 进行词法分析，返回Token列表
ArrayList *lexer_tokenize(Lexer *lexer);

// 获取词法分析错误
ArrayList *lexer_get_errors(Lexer *lexer);

// 创建Token
Token *token_create(TokenType type, const char *value, int line, int column);

// 销毁Token
void token_free(void *token);

// 获取Token类型名称
const char *token_type_name(TokenType type);

// 打印Token信息
void token_print(Token *token);

// 判断字符串是否为关键字
bool is_keyword(const char *str);

#endif /* COMPILER_LEXER_H */