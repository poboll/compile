/**
 * 代码优化器实现
 *
 * 功能：
 * 1. 实现常量折叠等基本优化
 * 2. 遍历并修改 AST 以应用优化
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include "optimizer.h"
#include "token.h"
#include "common.h"
#include "ast.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 函数前向声明
static Stmt *optimize_stmt(Optimizer *optimizer, Stmt *stmt);
static Expr *optimize_expr(Optimizer *optimizer, Expr *expr);

// 初始化优化器
void init_optimizer(Optimizer *optimizer, OptimizationLevel level)
{
    optimizer->config.level = level;
    optimizer->had_error = false;
    optimizer->warnings = arraylist_create(4);

    // 根据优化级别设置具体优化选项
    switch (level)
    {
    case OPT_LEVEL_NONE:
        optimizer->config.constant_folding = false;
        optimizer->config.dead_code_elimination = false;
        optimizer->config.common_subexpr_elimination = false;
        break;
    case OPT_LEVEL_BASIC:
        optimizer->config.constant_folding = true;
        optimizer->config.dead_code_elimination = true;
        optimizer->config.common_subexpr_elimination = false;
        break;
    case OPT_LEVEL_MEDIUM:
    case OPT_LEVEL_AGGRESSIVE:
        optimizer->config.constant_folding = true;
        optimizer->config.dead_code_elimination = true;
        optimizer->config.common_subexpr_elimination = true; // 示例，未实现
        break;
    }
}

// 释放优化器资源
void free_optimizer(Optimizer *optimizer)
{
    if (optimizer == NULL)
        return;
    arraylist_free(optimizer->warnings, free);
}

// 执行代码优化
bool run_optimization(Optimizer *optimizer, ArrayList *statements)
{
    if (optimizer->config.level == OPT_LEVEL_NONE)
    {
        printf("--- 代码优化已跳过 (级别: NONE) ---\n\n");
        return true;
    }

    printf("--- 代码优化 (级别: %d) ---\n", optimizer->config.level);

    ArrayList *new_statements = arraylist_create(statements->capacity);

    for (int i = 0; i < statements->size; i++)
    {
        Stmt *stmt = (Stmt *)arraylist_get(statements, i);
        Stmt *optimized_stmt = optimize_stmt(optimizer, stmt);
        if (optimized_stmt != NULL)
        {
            arraylist_add(new_statements, optimized_stmt);
        }
    }

    // 替换旧的语句列表
    // 注意：这会改变传入的 statements 列表
    // TODO: 完善内存管理，释放被替换的节点
    statements->size = new_statements->size;
    statements->items = new_statements->items;

    print_optimization_info(optimizer);
    printf("------------------------\n\n");

    return !optimizer->had_error;
}

// 优化语句
static Stmt *optimize_stmt(Optimizer *optimizer, Stmt *stmt)
{
    if (stmt == NULL)
        return NULL;

    switch (stmt->type)
    {
    case STMT_EXPRESSION:
    {
        ExpressionStmt *expr_stmt = (ExpressionStmt *)stmt;
        expr_stmt->expression = optimize_expr(optimizer, expr_stmt->expression);
        return stmt;
    }
    case STMT_BLOCK:
    {
        BlockStmt *block = (BlockStmt *)stmt;
        ArrayList *new_statements = arraylist_create(block->statements->size);
        for (int i = 0; i < block->statements->size; i++)
        {
            Stmt *sub_stmt = (Stmt *)arraylist_get(block->statements, i);
            Stmt *optimized_sub_stmt = optimize_stmt(optimizer, sub_stmt);
            if (optimized_sub_stmt)
            {
                arraylist_add(new_statements, optimized_sub_stmt);
            }
        }
        // TODO: 释放旧的语句列表
        block->statements = new_statements;
        return stmt;
    }
    case STMT_IF:
    {
        IfStmt *if_stmt = (IfStmt *)stmt;
        if_stmt->condition = optimize_expr(optimizer, if_stmt->condition);

        // 死代码消除：如果条件是常量
        if (optimizer->config.dead_code_elimination && if_stmt->condition->type == EXPR_LITERAL)
        {
            LiteralExpr *cond_literal = (LiteralExpr *)if_stmt->condition;
            bool is_true = false;
            if (cond_literal->literal.type == TOKEN_TRUE)
                is_true = true;
            if (cond_literal->literal.type == TOKEN_NUMBER)
            {
                is_true = atoi(cond_literal->literal.start) != 0;
            }

            if (is_true)
            {
                // 条件为真，只保留 then 分支
                return optimize_stmt(optimizer, if_stmt->then_branch);
            }
            else
            {
                // 条件为假，只保留 else 分支 (如果存在)
                return optimize_stmt(optimizer, if_stmt->else_branch);
            }
        }

        if_stmt->then_branch = optimize_stmt(optimizer, if_stmt->then_branch);
        if_stmt->else_branch = optimize_stmt(optimizer, if_stmt->else_branch);
        return stmt;
    }
    // 其他语句类型...
    default:
        return stmt;
    }
}

// 优化表达式
static Expr *optimize_expr(Optimizer *optimizer, Expr *expr)
{
    if (expr == NULL)
        return NULL;

    switch (expr->type)
    {
    case EXPR_BINARY:
    {
        BinaryExpr *binary = (BinaryExpr *)expr;
        binary->left = optimize_expr(optimizer, binary->left);
        binary->right = optimize_expr(optimizer, binary->right);

        // 常量折叠
        if (optimizer->config.constant_folding &&
            binary->left->type == EXPR_LITERAL &&
            binary->right->type == EXPR_LITERAL)
        {

            LiteralExpr *left = (LiteralExpr *)binary->left;
            LiteralExpr *right = (LiteralExpr *)binary->right;

            // 只处理整型常量
            if (left->literal.type == TOKEN_NUMBER && right->literal.type == TOKEN_NUMBER)
            {
                int left_val = atoi(left->literal.start);
                int right_val = atoi(right->literal.start);
                int result_val;

                switch (binary->op.type)
                {
                case TOKEN_PLUS:
                    result_val = left_val + right_val;
                    break;
                case TOKEN_MINUS:
                    result_val = left_val - right_val;
                    break;
                case TOKEN_STAR:
                    result_val = left_val * right_val;
                    break;
                case TOKEN_SLASH:
                    if (right_val == 0)
                        return expr; // 避免除零错误
                    result_val = left_val / right_val;
                    break;
                default:
                    return expr; // 不处理其他操作
                }

                // 创建新的字面量Token
                char *new_val_str = (char *)safe_malloc(12); // "2147483647\0"
                sprintf(new_val_str, "%d", result_val);

                Token new_literal_token = {
                    .type = TOKEN_NUMBER,
                    .start = new_val_str,
                    .length = (int)strlen(new_val_str),
                    .line = binary->op.line};

                // 创建新的字面量表达式节点
                Expr *new_expr = new_literal_expr(new_literal_token);

                // 释放旧的节点
                // 注意：这里需要一个更完善的内存管理机制来处理 new_val_str
                free(left);
                free(right);
                free(binary);

                return new_expr;
            }
        }
        return expr;
    }
    // 其他表达式类型...
    default:
        return expr;
    }
}

// 打印优化信息
void print_optimization_info(Optimizer *optimizer)
{
    if (optimizer->warnings->size > 0)
    {
        printf("优化警告:\n");
        for (int i = 0; i < optimizer->warnings->size; i++)
        {
            printf("  - %s\n", (char *)arraylist_get(optimizer->warnings, i));
        }
    }
    else
    {
        printf("优化完成，无警告。\n");
    }
}