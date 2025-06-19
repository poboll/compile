/**
 * 目标代码生成器实现
 *
 * 功能：
 * 1. 将 AST 转换为目标 C 代码
 * 2. 处理代码格式化，如缩进
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include "codegen.h"
#include "ast.h"
#include <stdarg.h>
#include <stdio.h>
#include <string.h>

// 函数前向声明
static void gen_stmt(CodeGenerator *codegen, Stmt *stmt);
static void gen_expr(CodeGenerator *codegen, Expr *expr);

// --- 工具函数 ---

// 打印带缩进的格式化字符串
static void print_indent(CodeGenerator *codegen)
{
    for (int i = 0; i < codegen->config.indent_level; i++)
    {
        fprintf(codegen->config.output_file, "    "); // 4个空格缩进
    }
}

// 打印一行代码（带缩进和换行）
static void print_line(CodeGenerator *codegen, const char *format, ...)
{
    print_indent(codegen);
    va_list args;
    va_start(args, format);
    vfprintf(codegen->config.output_file, format, args);
    va_end(args);
    fprintf(codegen->config.output_file, "\n");
}

// 直接打印代码（不带缩进或换行）
static void print_raw(CodeGenerator *codegen, const char *format, ...)
{
    va_list args;
    va_start(args, format);
    vfprintf(codegen->config.output_file, format, args);
    va_end(args);
}

// --- 初始化和释放 ---

void init_code_generator(CodeGenerator *codegen, CodeGenTarget target, const char *output_filename)
{
    codegen->config.target = target;
    codegen->had_error = false;
    codegen->config.indent_level = 0;

    if (output_filename)
    {
        codegen->config.output_file = fopen(output_filename, "w");
        if (!codegen->config.output_file)
        {
            fprintf(stderr, "无法打开输出文件: %s\n", output_filename);
            codegen->had_error = true;
        }
    }
    else
    {
        codegen->config.output_file = stdout;
    }
}

void free_code_generator(CodeGenerator *codegen)
{
    if (codegen && codegen->config.output_file && codegen->config.output_file != stdout)
    {
        fclose(codegen->config.output_file);
    }
}

// --- 主生成函数 ---

bool run_code_generation(CodeGenerator *codegen, ArrayList *statements)
{
    if (codegen->had_error)
        return false;

    printf("--- 目标代码生成 (目标: C) ---\n");

    // 打印标准头文件
    print_line(codegen, "#include <stdio.h>");
    print_line(codegen, "#include <stdbool.h>");
    print_line(codegen, "");

    // 遍历所有顶层语句
    for (int i = 0; i < statements->size; i++)
    {
        gen_stmt(codegen, (Stmt *)arraylist_get(statements, i));
    }

    printf("目标代码已生成到 %s\n", "output.c"); // 假设文件名
    printf("---------------------------\n\n");
    return !codegen->had_error;
}

// --- 语句生成 ---

static void gen_stmt(CodeGenerator *codegen, Stmt *stmt)
{
    if (stmt == NULL)
        return;

    switch (stmt->type)
    {
    case STMT_EXPRESSION:
    {
        print_indent(codegen);
        gen_expr(codegen, ((ExpressionStmt *)stmt)->expression);
        print_raw(codegen, ";\n");
        break;
    }
    case STMT_VAR_DECL:
    {
        VarDeclStmt *decl = (VarDeclStmt *)stmt;
        print_indent(codegen);
        // 假设所有变量都是 int 类型
        print_raw(codegen, "int %.*s", decl->name.length, decl->name.start);
        if (decl->initializer)
        {
            print_raw(codegen, " = ");
            gen_expr(codegen, decl->initializer);
        }
        print_raw(codegen, ";\n");
        break;
    }
    case STMT_FUNC_DECL:
    {
        FuncDeclStmt *func = (FuncDeclStmt *)stmt;
        bool is_main = (func->name.length == 4 && strncmp(func->name.start, "main", 4) == 0);

        if (is_main)
        {
            print_raw(codegen, "int %.*s(", func->name.length, func->name.start);
        }
        else
        {
            // 默认返回类型为 void，后续可以从符号表获取
            print_raw(codegen, "void %.*s(", func->name.length, func->name.start);
        }

        for (int i = 0; i < func->params->size; i++)
        {
            Token *param_token = (Token *)arraylist_get(func->params, i);
            // 假设参数都是 int 类型
            print_raw(codegen, "int %.*s", param_token->length, param_token->start);
            if (i < func->params->size - 1)
            {
                print_raw(codegen, ", ");
            }
        }
        print_raw(codegen, ") ");

        // --- 函数体生成 (已修复) ---
        // 我们在这里直接处理代码块，以便为main函数添加 return 0;
        BlockStmt *body = func->body;

        print_line(codegen, "{");
        codegen->config.indent_level++;

        for (int i = 0; i < body->statements->size; i++)
        {
            gen_stmt(codegen, (Stmt *)arraylist_get(body->statements, i));
        }

        if (is_main)
        {
            print_line(codegen, "return 0;");
        }

        codegen->config.indent_level--;
        print_indent(codegen);
        print_raw(codegen, "}");

        print_raw(codegen, "\n\n");
        break;
    }
    case STMT_BLOCK:
    {
        print_line(codegen, "{");
        codegen->config.indent_level++;
        BlockStmt *block = (BlockStmt *)stmt;
        for (int i = 0; i < block->statements->size; i++)
        {
            gen_stmt(codegen, (Stmt *)arraylist_get(block->statements, i));
        }
        codegen->config.indent_level--;
        print_indent(codegen);
        print_raw(codegen, "}\n");
        break;
    }
    case STMT_IF:
    {
        IfStmt *if_stmt = (IfStmt *)stmt;
        print_indent(codegen);
        print_raw(codegen, "if (");
        gen_expr(codegen, if_stmt->condition);
        print_raw(codegen, ") ");
        gen_stmt(codegen, if_stmt->then_branch);
        if (if_stmt->else_branch)
        {
            print_indent(codegen);
            print_raw(codegen, "else ");
            gen_stmt(codegen, if_stmt->else_branch);
        }
        break;
    }
    case STMT_WHILE:
    {
        WhileStmt *while_stmt = (WhileStmt *)stmt;
        print_indent(codegen);
        print_raw(codegen, "while (");
        gen_expr(codegen, while_stmt->condition);
        print_raw(codegen, ") ");
        gen_stmt(codegen, while_stmt->body);
        break;
    }
    case STMT_RETURN:
    {
        ReturnStmt *ret_stmt = (ReturnStmt *)stmt;
        print_indent(codegen);
        print_raw(codegen, "return");
        if (ret_stmt->value)
        {
            print_raw(codegen, " ");
            gen_expr(codegen, ret_stmt->value);
        }
        print_raw(codegen, ";\n");
        break;
    }
    default:
        print_line(codegen, "// Unsupported statement type: %d", stmt->type);
        break;
    }
}

// --- 表达式生成 ---

static void gen_expr(CodeGenerator *codegen, Expr *expr)
{
    if (expr == NULL)
        return;

    switch (expr->type)
    {
    case EXPR_LITERAL:
    {
        Token *t = &((LiteralExpr *)expr)->literal;
        print_raw(codegen, "%.*s", t->length, t->start);
        break;
    }
    case EXPR_VARIABLE:
    {
        Token *t = &((VariableExpr *)expr)->name;
        print_raw(codegen, "%.*s", t->length, t->start);
        break;
    }
    case EXPR_ASSIGN:
    {
        AssignExpr *assign = (AssignExpr *)expr;
        print_raw(codegen, "%.*s = ", assign->name.length, assign->name.start);
        gen_expr(codegen, assign->value);
        break;
    }
    case EXPR_UNARY:
    {
        UnaryExpr *unary = (UnaryExpr *)expr;
        print_raw(codegen, "%.*s", unary->op.length, unary->op.start);
        gen_expr(codegen, unary->right);
        break;
    }
    case EXPR_BINARY:
    {
        BinaryExpr *binary = (BinaryExpr *)expr;
        print_raw(codegen, "(");
        gen_expr(codegen, binary->left);
        print_raw(codegen, " %.*s ", binary->op.length, binary->op.start);
        gen_expr(codegen, binary->right);
        print_raw(codegen, ")");
        break;
    }
    case EXPR_POSTFIX:
    {
        PostfixExpr *postfix = (PostfixExpr *)expr;
        gen_expr(codegen, postfix->left);
        print_raw(codegen, "%.*s", postfix->op.length, postfix->op.start);
        break;
    }
    case EXPR_CALL:
    {
        CallExpr *call = (CallExpr *)expr;
        gen_expr(codegen, call->callee);
        print_raw(codegen, "(");
        for (int i = 0; i < call->arguments->size; i++)
        {
            gen_expr(codegen, (Expr *)arraylist_get(call->arguments, i));
            if (i < call->arguments->size - 1)
            {
                print_raw(codegen, ", ");
            }
        }
        print_raw(codegen, ")");
        break;
    }
    default:
        print_raw(codegen, "/* Unsupported expression type: %d */", expr->type);
        break;
    }
}