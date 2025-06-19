/**
 * AST Printer - 用于可视化AST
 *
 * 功能：
 * 1. 递归地打印AST节点，以S-表达式的形式展示
 *
 * 作者：poboll
 * 日期：2025-06-05
 */
#include "ast.h"
#include <stdio.h>

// --- 前向声明 ---
static void print_stmt(Stmt *stmt);
static void print_expr(Expr *expr);

// --- 公共函数 ---
void print_ast(ArrayList *statements)
{
    printf("--- Abstract Syntax Tree ---\n");
    for (int i = 0; i < statements->size; i++)
    {
        print_stmt((Stmt *)arraylist_get(statements, i));
        printf("\n");
    }
    printf("--- End of AST ---\n");
}

// --- 辅助打印函数 ---

static void parenthesize(const char *name, int expr_count, ...)
{
    printf("(%s", name);
    va_list args;
    va_start(args, expr_count);
    for (int i = 0; i < expr_count; i++)
    {
        printf(" ");
        Expr *expr = va_arg(args, Expr *);
        print_expr(expr);
    }
    va_end(args);
    printf(")");
}

static void print_expr(Expr *expr)
{
    if (expr == NULL)
    {
        printf("nil");
        return;
    }

    switch (expr->type)
    {
    case EXPR_BINARY:
    {
        BinaryExpr *e = (BinaryExpr *)expr;
        char op_str[2] = {e->op.start[0], '\0'};
        parenthesize(op_str, 2, e->left, e->right);
        break;
    }
    case EXPR_POSTFIX:
    {
        PostfixExpr *e = (PostfixExpr *)expr;
        printf("(");
        print_expr(e->left);
        printf(" %.*s)", e->op.length, e->op.start);
        break;
    }
    case EXPR_UNARY:
    {
        UnaryExpr *e = (UnaryExpr *)expr;
        char op_str[2] = {e->op.start[0], '\0'};
        parenthesize(op_str, 1, e->right);
        break;
    }
    case EXPR_LITERAL:
    {
        LiteralExpr *e = (LiteralExpr *)expr;
        printf("%.*s", e->literal.length, e->literal.start);
        break;
    }
    case EXPR_VARIABLE:
    {
        VariableExpr *e = (VariableExpr *)expr;
        printf("%.*s", e->name.length, e->name.start);
        break;
    }
    case EXPR_ASSIGN:
    {
        AssignExpr *e = (AssignExpr *)expr;
        printf("(= %.*s ", e->name.length, e->name.start);
        print_expr(e->value);
        printf(")");
        break;
    }
    case EXPR_CALL:
    {
        CallExpr *e = (CallExpr *)expr;
        printf("(call ");
        print_expr(e->callee);
        for (int i = 0; i < e->arguments->size; i++)
        {
            printf(" ");
            print_expr(arraylist_get(e->arguments, i));
        }
        printf(")");
        break;
    }
    }
}

static void print_stmt(Stmt *stmt)
{
    if (stmt == NULL)
    {
        printf("nil-stmt;");
        return;
    }
    switch (stmt->type)
    {
    case STMT_EXPRESSION:
    {
        ExpressionStmt *s = (ExpressionStmt *)stmt;
        printf("(expr-stmt ");
        print_expr(s->expression);
        printf(")");
        break;
    }
    case STMT_IF:
    {
        IfStmt *s = (IfStmt *)stmt;
        printf("(if ");
        print_expr(s->condition);
        printf(" ");
        print_stmt(s->then_branch);
        if (s->else_branch != NULL)
        {
            printf(" ");
            print_stmt(s->else_branch);
        }
        printf(")");
        break;
    }
    case STMT_BLOCK:
    {
        BlockStmt *s = (BlockStmt *)stmt;
        printf("(block\n");
        for (int i = 0; i < s->statements->size; i++)
        {
            printf("  ");
            print_stmt((Stmt *)arraylist_get(s->statements, i));
            printf("\n");
        }
        printf(")");
        break;
    }
    case STMT_VAR_DECL:
    {
        VarDeclStmt *s = (VarDeclStmt *)stmt;
        printf("(var-decl %.*s", s->name.length, s->name.start);
        if (s->initializer != NULL)
        {
            printf(" = ");
            print_expr(s->initializer);
        }
        printf(")");
        break;
    }
    case STMT_WHILE:
    {
        WhileStmt *s = (WhileStmt *)stmt;
        printf("(while ");
        print_expr(s->condition);
        printf(" ");
        print_stmt(s->body);
        printf(")");
        break;
    }
    case STMT_FOR:
    {
        ForStmt *s = (ForStmt *)stmt;
        printf("(for (");
        print_stmt(s->initializer);
        printf(") (");
        print_expr(s->condition);
        printf(") (");
        print_expr(s->increment);
        printf(") ");
        print_stmt(s->body);
        printf(")");
        break;
    }
    case STMT_RETURN:
    {
        ReturnStmt *s = (ReturnStmt *)stmt;
        printf("(return");
        if (s->value != NULL)
        {
            printf(" ");
            print_expr(s->value);
        }
        printf(")");
        break;
    }
    case STMT_FUNC_DECL:
    {
        FuncDeclStmt *s = (FuncDeclStmt *)stmt;
        printf("(fn %.*s (", s->name.length, s->name.start);
        if (s->params != NULL)
        {
            for (int i = 0; i < s->params->size; i++)
            {
                Token *param_token = (Token *)arraylist_get(s->params, i);
                printf("%.*s", param_token->length, param_token->start);
                if (i < s->params->size - 1)
                {
                    printf(" ");
                }
            }
        }
        printf(") ");
        print_stmt((Stmt *)s->body);
        printf(")");
        break;
    }
    // ... other statements to be added
    default:
        printf("(unknown_stmt)");
        break;
    }
}