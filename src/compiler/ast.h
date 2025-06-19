/**
 * 抽象语法树 (AST) 定义 - ast.h
 * @description 定义抽象语法树的节点类型和数据结构
 *              包含表达式、语句、声明等各类AST节点的完整定义
 * @module compiler/ast
 * @author poboll
 * @date 2025
 * @version 1.0
 *
 * 主要功能：
 * 1. 定义表达式 (Expression) 的节点类型和结构
 * 2. 定义语句 (Statement) 的节点类型和结构
 * 3. 定义声明 (Declaration) 的节点类型和结构
 * 4. 提供AST节点的基础类型枚举
 * 5. 定义节点间的继承关系和组合结构
 * 6. 支持类型安全的AST操作接口
 */

#ifndef COMPILER_AST_H
#define COMPILER_AST_H

#include "common.h"
#include "token.h"

// --- 表达式 (Expressions) ---

// 前向声明
struct Stmt;

// 表达式类型
typedef enum
{
    EXPR_BINARY,   // 二元运算: left op right
    EXPR_UNARY,    // 一元运算: op right
    EXPR_POSTFIX,  // 后缀运算: left op
    EXPR_LITERAL,  // 字面量 (数字, 字符串, char)
    EXPR_VARIABLE, // 变量
    EXPR_ASSIGN,   // 赋值: name = value
    EXPR_CALL,     // 函数调用: callee(arguments)
} ExprType;

// 表达式基类
typedef struct Expr
{
    ExprType type;
} Expr;

// 二元表达式
typedef struct
{
    Expr base;
    Expr *left;
    Token op;
    Expr *right;
} BinaryExpr;

// 一元表达式
typedef struct
{
    Expr base;
    Token op;
    Expr *right;
} UnaryExpr;

// 后缀表达式
typedef struct
{
    Expr base;
    Expr *left;
    Token op;
} PostfixExpr;

// 字面量表达式
typedef struct
{
    Expr base;
    Token literal; // The token containing the value
} LiteralExpr;

// 变量表达式
typedef struct
{
    Expr base;
    Token name;
} VariableExpr;

// 赋值表达式
typedef struct
{
    Expr base;
    Token name;
    Expr *value;
} AssignExpr;

// 函数调用表达式
typedef struct
{
    Expr base;
    Expr *callee;
    ArrayList *arguments; // of Expr*
} CallExpr;

// --- 语句 (Statements) ---

// 语句类型
typedef enum
{
    STMT_EXPRESSION, // 表达式语句
    STMT_IF,         // if 语句
    STMT_WHILE,      // while 语句
    STMT_FOR,        // for 语句
    STMT_BLOCK,      // { ... } 代码块
    STMT_RETURN,     // return 语句
    STMT_VAR_DECL,   // 变量声明
    STMT_FUNC_DECL,  // 函数声明
} StmtType;

// 语句基类
typedef struct Stmt
{
    StmtType type;
} Stmt;

// 表达式语句
typedef struct
{
    Stmt base;
    Expr *expression;
} ExpressionStmt;

// If 语句
typedef struct
{
    Stmt base;
    Expr *condition;
    Stmt *then_branch;
    Stmt *else_branch; // Can be NULL
} IfStmt;

// While 语句
typedef struct
{
    Stmt base;
    Expr *condition;
    Stmt *body;
} WhileStmt;

// For 语句
typedef struct
{
    Stmt base;
    Stmt *initializer; // Can be NULL
    Expr *condition;   // Can be NULL
    Expr *increment;   // Can be NULL
    Stmt *body;
} ForStmt;

// 代码块语句
typedef struct
{
    Stmt base;
    ArrayList *statements; // of Stmt*
} BlockStmt;

// Return 语句
typedef struct
{
    Stmt base;
    Token keyword; // The 'return' token
    Expr *value;   // Can be NULL for `return;`
} ReturnStmt;

// 变量声明语句
typedef struct
{
    Stmt base;
    Token name;
    Expr *initializer; // Can be NULL
} VarDeclStmt;

// 函数声明语句 (也可以看作是顶层声明)
typedef struct
{
    Stmt base;
    Token name;
    ArrayList *params; // of Token(s) for parameter names
    BlockStmt *body;
} FuncDeclStmt;

// --- AST 遍历/打印 (Visitor Pattern) ---
// 为了方便打印和后续处理，我们使用访问者模式
// 每个节点类型都有一个对应的 visit 函数

// 前向声明
void print_ast(ArrayList *statements);

// --- 构造函数声明 ---

// 表达式构造函数
Expr *new_binary_expr(Expr *left, Token op, Expr *right);
Expr *new_unary_expr(Token op, Expr *right);
Expr *new_postfix_expr(Expr *left, Token op);
Expr *new_literal_expr(Token literal);
Expr *new_variable_expr(Token name);
Expr *new_assign_expr(Token name, Expr *value);
Expr *new_call_expr(Expr *callee, ArrayList *arguments);

// 语句构造函数
Stmt *new_expression_stmt(Expr *expression);
Stmt *new_if_stmt(Expr *condition, Stmt *then_branch, Stmt *else_branch);
Stmt *new_while_stmt(Expr *condition, Stmt *body);
Stmt *new_for_stmt(Stmt *initializer, Expr *condition, Expr *increment, Stmt *body);
Stmt *new_block_stmt(ArrayList *statements);
Stmt *new_return_stmt(Token keyword, Expr *value);
Stmt *new_var_decl_stmt(Token name, Expr *initializer);
Stmt *new_func_decl_stmt(Token name, ArrayList *params, BlockStmt *body);

#endif // COMPILER_AST_H