/**
 * AST 节点构造函数 - ast.c
 * @description 提供创建和初始化各种AST节点的函数实现
 *              包含表达式、语句、声明等各类AST节点的构造函数
 * @module compiler/ast
 * @author poboll
 * @date 2025
 * @version 1.0
 *
 * 主要功能：
 * 1. 提供创建和初始化各种AST节点的函数
 * 2. 实现AST节点的内存管理
 * 3. 支持二元表达式、一元表达式等构造
 * 4. 提供语句和声明节点的创建接口
 * 5. 确保AST节点的正确初始化和类型设置
 */

#include "ast.h"
#include "common.h"

// --- 表达式构造函数 ---

Expr *new_binary_expr(Expr *left, Token op, Expr *right)
{
    BinaryExpr *expr = (BinaryExpr *)safe_malloc(sizeof(BinaryExpr));
    expr->base.type = EXPR_BINARY;
    expr->left = left;
    expr->op = op;
    expr->right = right;
    return (Expr *)expr;
}

Expr *new_unary_expr(Token op, Expr *right)
{
    UnaryExpr *expr = (UnaryExpr *)safe_malloc(sizeof(UnaryExpr));
    expr->base.type = EXPR_UNARY;
    expr->op = op;
    expr->right = right;
    return (Expr *)expr;
}

Expr *new_literal_expr(Token literal)
{
    LiteralExpr *expr = (LiteralExpr *)safe_malloc(sizeof(LiteralExpr));
    expr->base.type = EXPR_LITERAL;
    expr->literal = literal;
    return (Expr *)expr;
}

Expr *new_variable_expr(Token name)
{
    VariableExpr *expr = (VariableExpr *)safe_malloc(sizeof(VariableExpr));
    expr->base.type = EXPR_VARIABLE;
    expr->name = name;
    return (Expr *)expr;
}

Expr *new_assign_expr(Token name, Expr *value)
{
    AssignExpr *expr = (AssignExpr *)safe_malloc(sizeof(AssignExpr));
    expr->base.type = EXPR_ASSIGN;
    expr->name = name;
    expr->value = value;
    return (Expr *)expr;
}

Expr *new_call_expr(Expr *callee, ArrayList *arguments)
{
    CallExpr *expr = (CallExpr *)safe_malloc(sizeof(CallExpr));
    expr->base.type = EXPR_CALL;
    expr->callee = callee;
    expr->arguments = arguments;
    return (Expr *)expr;
}

Expr *new_postfix_expr(Expr *left, Token op)
{
    PostfixExpr *expr = (PostfixExpr *)safe_malloc(sizeof(PostfixExpr));
    expr->base.type = EXPR_POSTFIX;
    expr->left = left;
    expr->op = op;
    return (Expr *)expr;
}

// --- 语句构造函数 ---

Stmt *new_expression_stmt(Expr *expression)
{
    ExpressionStmt *stmt = (ExpressionStmt *)safe_malloc(sizeof(ExpressionStmt));
    stmt->base.type = STMT_EXPRESSION;
    stmt->expression = expression;
    return (Stmt *)stmt;
}

Stmt *new_if_stmt(Expr *condition, Stmt *then_branch, Stmt *else_branch)
{
    IfStmt *stmt = (IfStmt *)safe_malloc(sizeof(IfStmt));
    stmt->base.type = STMT_IF;
    stmt->condition = condition;
    stmt->then_branch = then_branch;
    stmt->else_branch = else_branch;
    return (Stmt *)stmt;
}

Stmt *new_while_stmt(Expr *condition, Stmt *body)
{
    WhileStmt *stmt = (WhileStmt *)safe_malloc(sizeof(WhileStmt));
    stmt->base.type = STMT_WHILE;
    stmt->condition = condition;
    stmt->body = body;
    return (Stmt *)stmt;
}

Stmt *new_for_stmt(Stmt *initializer, Expr *condition, Expr *increment, Stmt *body)
{
    ForStmt *stmt = (ForStmt *)safe_malloc(sizeof(ForStmt));
    stmt->base.type = STMT_FOR;
    stmt->initializer = initializer;
    stmt->condition = condition;
    stmt->increment = increment;
    stmt->body = body;
    return (Stmt *)stmt;
}

Stmt *new_block_stmt(ArrayList *statements)
{
    BlockStmt *stmt = (BlockStmt *)safe_malloc(sizeof(BlockStmt));
    stmt->base.type = STMT_BLOCK;
    stmt->statements = statements;
    return (Stmt *)stmt;
}

Stmt *new_return_stmt(Token keyword, Expr *value)
{
    ReturnStmt *stmt = (ReturnStmt *)safe_malloc(sizeof(ReturnStmt));
    stmt->base.type = STMT_RETURN;
    stmt->keyword = keyword;
    stmt->value = value;
    return (Stmt *)stmt;
}

Stmt *new_var_decl_stmt(Token name, Expr *initializer)
{
    VarDeclStmt *stmt = (VarDeclStmt *)safe_malloc(sizeof(VarDeclStmt));
    stmt->base.type = STMT_VAR_DECL;
    stmt->name = name;
    stmt->initializer = initializer;
    return (Stmt *)stmt;
}

Stmt *new_func_decl_stmt(Token name, ArrayList *params, BlockStmt *body)
{
    FuncDeclStmt *stmt = (FuncDeclStmt *)safe_malloc(sizeof(FuncDeclStmt));
    stmt->base.type = STMT_FUNC_DECL;
    stmt->name = name;
    stmt->params = params;
    stmt->body = body;
    return (Stmt *)stmt;
}