/**
 * 语法分析器头文件 - parser.h
 * @description 递归下降语法分析器，将Token序列转换为抽象语法树(AST)
 *              定义了AST节点类型、解析器结构和相关函数接口
 * @module compiler/parser
 * @author poboll
 * @date 2025
 * @version 1.0
 *
 * 主要功能：
 * 1. 实现递归下降语法分析算法
 * 2. 构建抽象语法树(AST)
 * 3. 语法错误检测和恢复
 * 4. 支持变量声明、函数定义、表达式等语法结构
 * 5. 提供完整的AST节点类型定义
 * 6. 内存管理和错误处理机制
 */

#ifndef COMPILER_PARSER_H
#define COMPILER_PARSER_H

#include "../common.h"
#include "../lexer/lexer.h"

// AST节点类型
typedef enum
{
  // 程序结构
  NODE_PROGRAM,         // 程序根节点
  NODE_BLOCK_STATEMENT, // 块语句

  // 声明
  NODE_VARIABLE_DECLARATION, // 变量声明
  NODE_FUNCTION_DECLARATION, // 函数声明

  // 语句
  NODE_EXPRESSION_STATEMENT, // 表达式语句
  NODE_IF_STATEMENT,         // if语句
  NODE_WHILE_STATEMENT,      // while循环语句
  NODE_RETURN_STATEMENT,     // return语句
  NODE_PRINT_STATEMENT,      // 打印语句

  // 表达式
  NODE_ASSIGNMENT_EXPRESSION, // 赋值表达式
  NODE_BINARY_EXPRESSION,     // 二元表达式
  NODE_UNARY_EXPRESSION,      // 一元表达式
  NODE_CALL_EXPRESSION,       // 函数调用表达式

  // 基本元素
  NODE_IDENTIFIER, // 标识符
  NODE_LITERAL     // 字面量
} AstNodeType;

// 前向声明
typedef struct AstNode AstNode;

// AST节点基础结构
struct AstNode
{
  AstNodeType type;        // 节点类型
  int line;                // 源代码行号
  int column;              // 源代码列号
  void (*free)(AstNode *); // 释放节点资源的函数
};

// 程序节点
typedef struct
{
  AstNode base;          // 基类
  ArrayList *statements; // 语句列表
} ProgramNode;

// 块语句节点
typedef struct
{
  AstNode base;          // 基类
  ArrayList *statements; // 语句列表
} BlockStatementNode;

// 变量声明节点
typedef struct
{
  AstNode base;         // 基类
  char *kind;           // 声明类型（let/const/var）
  AstNode *identifier;  // 标识符
  AstNode *initializer; // 初始化表达式（可能为NULL）
} VariableDeclarationNode;

// 函数声明节点
typedef struct
{
  AstNode base;        // 基类
  AstNode *identifier; // 函数名
  ArrayList *params;   // 参数列表
  AstNode *body;       // 函数体
} FunctionDeclarationNode;

// 表达式语句节点
typedef struct
{
  AstNode base;        // 基类
  AstNode *expression; // 表达式
} ExpressionStatementNode;

// if语句节点
typedef struct
{
  AstNode base;        // 基类
  AstNode *test;       // 条件表达式
  AstNode *consequent; // if分支
  AstNode *alternate;  // else分支（可能为NULL）
} IfStatementNode;

// while循环语句节点
typedef struct
{
  AstNode base;  // 基类
  AstNode *test; // 循环条件
  AstNode *body; // 循环体
} WhileStatementNode;

// return语句节点
typedef struct
{
  AstNode base;      // 基类
  AstNode *argument; // 返回值表达式（可能为NULL）
} ReturnStatementNode;

// 打印语句节点
typedef struct
{
  AstNode base;        // 基类
  AstNode *expression; // 打印表达式
} PrintStatementNode;

// 赋值表达式节点
typedef struct
{
  AstNode base;   // 基类
  char *operator; // 赋值运算符（通常为 '='）
  AstNode *left;  // 左值（标识符）
  AstNode *right; // 右值（表达式）
} AssignmentExpressionNode;

// 二元表达式节点
typedef struct
{
  AstNode base;   // 基类
  char *operator; // 运算符
  AstNode *left;  // 左操作数
  AstNode *right; // 右操作数
} BinaryExpressionNode;

// 一元表达式节点
typedef struct
{
  AstNode base;      // 基类
  char *operator;    // 运算符
  AstNode *argument; // 操作数
  bool prefix;       // 是否为前缀运算符
} UnaryExpressionNode;

// 函数调用表达式节点
typedef struct
{
  AstNode base;         // 基类
  AstNode *callee;      // 被调用函数
  ArrayList *arguments; // 参数列表
} CallExpressionNode;

// 标识符节点
typedef struct
{
  AstNode base; // 基类
  char *name;   // 标识符名称
} IdentifierNode;

// 字面量类型
typedef enum
{
  LITERAL_NUMBER,
  LITERAL_STRING,
  LITERAL_BOOLEAN,
  LITERAL_NULL
} LiteralType;

// 字面量节点
typedef struct
{
  AstNode base;             // 基类
  LiteralType literal_type; // 字面量类型
  union
  {
    double number_value; // 数字值
    char *string_value;  // 字符串值
    bool boolean_value;  // 布尔值
  } value;
  char *raw; // 原始字符串表示
} LiteralNode;

// 语法分析器结构
typedef struct
{
  ArrayList *tokens; // Token列表
  int current_token; // 当前Token索引
  ArrayList *errors; // 错误信息列表
} Parser;

// 创建语法分析器
Parser *parser_create(ArrayList *tokens);

// 销毁语法分析器
void parser_free(Parser *parser);

// 进行语法分析，返回AST
AstNode *parser_parse(Parser *parser);

// 获取语法分析错误
ArrayList *parser_get_errors(Parser *parser);

// 创建各种AST节点的函数
ProgramNode *create_program_node(int line, int column);
BlockStatementNode *create_block_statement_node(int line, int column);
VariableDeclarationNode *create_variable_declaration_node(char *kind, AstNode *id, AstNode *init, int line, int column);
FunctionDeclarationNode *create_function_declaration_node(AstNode *id, ArrayList *params, AstNode *body, int line, int column);
ExpressionStatementNode *create_expression_statement_node(AstNode *expr, int line, int column);
IfStatementNode *create_if_statement_node(AstNode *test, AstNode *consequent, AstNode *alternate, int line, int column);
WhileStatementNode *create_while_statement_node(AstNode *test, AstNode *body, int line, int column);
ReturnStatementNode *create_return_statement_node(AstNode *argument, int line, int column);
PrintStatementNode *create_print_statement_node(AstNode *expression, int line, int column);
AssignmentExpressionNode *create_assignment_expression_node(char *op, AstNode *left, AstNode *right, int line, int column);
BinaryExpressionNode *create_binary_expression_node(char *op, AstNode *left, AstNode *right, int line, int column);
UnaryExpressionNode *create_unary_expression_node(char *op, AstNode *argument, bool prefix, int line, int column);
CallExpressionNode *create_call_expression_node(AstNode *callee, ArrayList *args, int line, int column);
IdentifierNode *create_identifier_node(char *name, int line, int column);
LiteralNode *create_number_literal_node(double value, char *raw, int line, int column);
LiteralNode *create_string_literal_node(char *value, char *raw, int line, int column);
LiteralNode *create_boolean_literal_node(bool value, char *raw, int line, int column);
LiteralNode *create_null_literal_node(char *raw, int line, int column);

// 通用释放AST节点的函数
void ast_node_free(AstNode *node);

// 打印AST节点的函数
void ast_node_print(AstNode *node, int indent);

#endif /* COMPILER_PARSER_H */