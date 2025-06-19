/**
 * 语义分析器实现
 *
 * 功能：
 * 1. 遍历抽象语法树 (AST)
 * 2. 构建符号表并验证语义规则
 * 3. 类型检查和推导
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include "analyzer.h"
#include <stdio.h>
#include "token.h"

// 函数前向声明
static void analyze_stmt(Analyzer *analyzer, Stmt *stmt);
DataType analyze_expr(Analyzer *analyzer, Expr *expr);
static void analyze_block(Analyzer *analyzer, BlockStmt *block);
static void check_return_type(Analyzer *analyzer, DataType return_type, int line);

// 初始化分析器
void init_analyzer(Analyzer *analyzer)
{
    analyzer->symbol_table = symbol_table_create();
    analyzer->had_error = false;
    analyzer->in_function = false;
    analyzer->current_function_return_type = TYPE_VOID;

    // 预定义内置函数
    predefine_built_in_functions(analyzer);
}

// 释放分析器资源
void free_analyzer(Analyzer *analyzer)
{
    symbol_table_free(analyzer->symbol_table);
}

// 预定义内置函数
void predefine_built_in_functions(Analyzer *analyzer)
{
    // 定义 printf 函数
    Symbol *printf_sym = define_symbol(analyzer->symbol_table, "printf",
                                       SYMBOL_FUNCTION, TYPE_INT, 0);
    printf_sym->is_defined = true;

    // 定义 scanf 函数
    Symbol *scanf_sym = define_symbol(analyzer->symbol_table, "scanf",
                                      SYMBOL_FUNCTION, TYPE_INT, 0);
    scanf_sym->is_defined = true;

    // 定义 main 函数 (如果用户代码中没有定义)
    Symbol *main_sym = define_symbol(analyzer->symbol_table, "main",
                                     SYMBOL_FUNCTION, TYPE_VOID, 0);
    main_sym->is_defined = false; // 用户应该定义它
}

// 主分析函数，分析程序中的所有语句
bool analyze(Analyzer *analyzer, ArrayList *statements)
{
    for (int i = 0; i < statements->size; i++)
    {
        Stmt *stmt = (Stmt *)arraylist_get(statements, i);
        analyze_stmt(analyzer, stmt);
    }

    // 检查所有函数声明是否都已定义
    // TODO: 实现此检查

    return !analyzer->had_error;
}

// 分析语句
static void analyze_stmt(Analyzer *analyzer, Stmt *stmt)
{
    if (stmt == NULL)
        return;

    switch (stmt->type)
    {
    case STMT_EXPRESSION:
    {
        ExpressionStmt *expr_stmt = (ExpressionStmt *)stmt;
        analyze_expr(analyzer, expr_stmt->expression);
        break;
    }

    case STMT_IF:
    {
        IfStmt *if_stmt = (IfStmt *)stmt;

        // 分析条件表达式（应为布尔类型）
        DataType condition_type = analyze_expr(analyzer, if_stmt->condition);
        if (condition_type != TYPE_BOOL && condition_type != TYPE_INT)
        {
            add_semantic_error(analyzer->symbol_table,
                               "If条件必须是布尔类型或整型表达式");
            analyzer->had_error = true;
        }

        // 分析 then 分支
        analyze_stmt(analyzer, if_stmt->then_branch);

        // 分析 else 分支 (如果存在)
        if (if_stmt->else_branch != NULL)
        {
            analyze_stmt(analyzer, if_stmt->else_branch);
        }
        break;
    }

    case STMT_WHILE:
    {
        WhileStmt *while_stmt = (WhileStmt *)stmt;

        // 分析条件表达式
        DataType condition_type = analyze_expr(analyzer, while_stmt->condition);
        if (condition_type != TYPE_BOOL && condition_type != TYPE_INT)
        {
            add_semantic_error(analyzer->symbol_table,
                               "While条件必须是布尔类型或整型表达式");
            analyzer->had_error = true;
        }

        // 分析循环体
        analyze_stmt(analyzer, while_stmt->body);
        break;
    }

    case STMT_FOR:
    {
        ForStmt *for_stmt = (ForStmt *)stmt;

        // 创建for循环的作用域
        enter_scope(analyzer->symbol_table);

        // 分析初始化语句
        if (for_stmt->initializer != NULL)
        {
            analyze_stmt(analyzer, for_stmt->initializer);
        }

        // 分析条件表达式
        if (for_stmt->condition != NULL)
        {
            DataType condition_type = analyze_expr(analyzer, for_stmt->condition);
            if (condition_type != TYPE_BOOL && condition_type != TYPE_INT)
            {
                add_semantic_error(analyzer->symbol_table,
                                   "For循环条件必须是布尔类型或整型表达式");
                analyzer->had_error = true;
            }
        }

        // 分析增量表达式
        if (for_stmt->increment != NULL)
        {
            analyze_expr(analyzer, for_stmt->increment);
        }

        // 分析循环体
        analyze_stmt(analyzer, for_stmt->body);

        // 退出for循环作用域
        exit_scope(analyzer->symbol_table);
        break;
    }

    case STMT_BLOCK:
    {
        BlockStmt *block = (BlockStmt *)stmt;
        analyze_block(analyzer, block);
        break;
    }

    case STMT_RETURN:
    {
        ReturnStmt *return_stmt = (ReturnStmt *)stmt;

        // 检查是否在函数内部
        if (!analyzer->in_function)
        {
            add_semantic_error(analyzer->symbol_table,
                               "return语句只能出现在函数内部");
            analyzer->had_error = true;
            break;
        }

        // 检查返回值类型
        if (return_stmt->value != NULL)
        {
            DataType return_type = analyze_expr(analyzer, return_stmt->value);
            check_return_type(analyzer, return_type, return_stmt->keyword.line);
        }
        else if (analyzer->current_function_return_type != TYPE_VOID)
        {
            // 无返回值但函数类型不是void
            add_semantic_error(analyzer->symbol_table,
                               "函数需要返回值，类型: %s",
                               data_type_to_string(analyzer->current_function_return_type));
            analyzer->had_error = true;
        }
        break;
    }

    case STMT_VAR_DECL:
    {
        VarDeclStmt *var_decl = (VarDeclStmt *)stmt;

        // 默认为int类型
        DataType var_type = TYPE_INT;

        // TODO: 从变量声明中提取类型信息

        // 创建一个临时字符串来存储变量名
        char var_name[256];
        int name_len = var_decl->name.length < 255 ? var_decl->name.length : 255;
        strncpy(var_name, var_decl->name.start, name_len);
        var_name[name_len] = '\0';

        // 定义变量符号
        define_symbol(analyzer->symbol_table,
                      var_name,
                      SYMBOL_VARIABLE,
                      var_type,
                      var_decl->name.line);

        // 如果有初始化表达式，分析并检查类型
        if (var_decl->initializer != NULL)
        {
            DataType init_type = analyze_expr(analyzer, var_decl->initializer);

            // 类型检查
            if (init_type != var_type && init_type != TYPE_ERROR)
            {
                add_semantic_error(analyzer->symbol_table,
                                   "变量初始化类型不匹配: 需要 %s, 得到 %s",
                                   data_type_to_string(var_type),
                                   data_type_to_string(init_type));
                analyzer->had_error = true;
            }
        }
        break;
    }

    case STMT_FUNC_DECL:
    {
        FuncDeclStmt *func_decl = (FuncDeclStmt *)stmt;

        DataType return_type = TYPE_VOID; // TODO: Parse return type

        // Create a null-terminated string for the function name
        char func_name[256];
        int name_len = func_decl->name.length < 255 ? func_decl->name.length : 255;
        strncpy(func_name, func_decl->name.start, name_len);
        func_name[name_len] = '\0';

        Symbol *existing_sym = lookup_symbol(analyzer->symbol_table, func_name);
        Symbol *func_sym = NULL;

        if (existing_sym != NULL)
        {
            // It's a redefinition or a definition for a forward declaration
            if (existing_sym->type == SYMBOL_FUNCTION && !existing_sym->is_defined)
            {
                existing_sym->is_defined = true;
                func_sym = existing_sym;
            }
            else
            {
                add_semantic_error(analyzer->symbol_table,
                                   "重定义函数 '%s'", func_name);
                analyzer->had_error = true;
                break;
            }
        }
        else
        {
            // New function definition
            func_sym = define_symbol(analyzer->symbol_table,
                                     func_name,
                                     SYMBOL_FUNCTION,
                                     return_type,
                                     func_decl->name.line);
            if (func_sym == NULL)
            { // define_symbol can fail on redefinition in same scope
                analyzer->had_error = true;
                break;
            }
            func_sym->is_defined = true;
        }

        // Save current function context and enter new one
        bool prev_in_function = analyzer->in_function;
        DataType prev_return_type = analyzer->current_function_return_type;
        analyzer->in_function = true;
        analyzer->current_function_return_type = return_type;

        // Enter function scope
        enter_scope(analyzer->symbol_table);

        // Define parameters in the new scope and add to function symbol
        if (func_sym->params->size == 0)
        { // Only add params if we haven't processed a forward decl
            for (int i = 0; i < func_decl->params->size; i++)
            {
                Token *param_token = (Token *)arraylist_get(func_decl->params, i);

                char param_name[256];
                int param_len = param_token->length < 255 ? param_token->length : 255;
                strncpy(param_name, param_token->start, param_len);
                param_name[param_len] = '\0';

                DataType param_type = TYPE_INT; // TODO: Parse param types

                // Add to function symbol's param list
                Symbol *param_sym_for_func = (Symbol *)safe_malloc(sizeof(Symbol));
                param_sym_for_func->name = safe_strdup(param_name);
                param_sym_for_func->type = SYMBOL_PARAMETER;
                param_sym_for_func->data_type = param_type;
                arraylist_add(func_sym->params, param_sym_for_func);

                // Define in the new scope for the function body
                define_symbol(analyzer->symbol_table,
                              param_name,
                              SYMBOL_PARAMETER,
                              param_type,
                              param_token->line);
            }
        }

        // Analyze function body
        analyze_block(analyzer, func_decl->body);

        // Exit function scope
        exit_scope(analyzer->symbol_table);

        // Restore previous function context
        analyzer->in_function = prev_in_function;
        analyzer->current_function_return_type = prev_return_type;

        break;
    }
    }
}

// 分析代码块
static void analyze_block(Analyzer *analyzer, BlockStmt *block)
{
    // 创建新的作用域
    enter_scope(analyzer->symbol_table);

    // 分析块中的每个语句
    for (int i = 0; i < block->statements->size; i++)
    {
        Stmt *stmt = (Stmt *)arraylist_get(block->statements, i);
        analyze_stmt(analyzer, stmt);
    }

    // 退出作用域
    exit_scope(analyzer->symbol_table);
}

// 分析表达式，返回表达式的类型
DataType analyze_expr(Analyzer *analyzer, Expr *expr)
{
    if (expr == NULL)
        return TYPE_ERROR;

    switch (expr->type)
    {
    case EXPR_LITERAL:
    {
        LiteralExpr *literal = (LiteralExpr *)expr;

        // 根据字面量的类型返回相应的数据类型
        switch (literal->literal.type)
        {
        case TOKEN_NUMBER:
            return TYPE_INT;
        case TOKEN_STRING:
            return TYPE_STRING;
        case TOKEN_CHAR:
            return TYPE_CHAR;
        case TOKEN_TRUE:
        case TOKEN_FALSE:
            return TYPE_BOOL;
        default:
            return TYPE_ERROR;
        }
    }

    case EXPR_VARIABLE:
    {
        VariableExpr *var = (VariableExpr *)expr;

        // 创建一个临时字符串来存储变量名
        char var_name[256];
        int name_len = var->name.length < 255 ? var->name.length : 255;
        strncpy(var_name, var->name.start, name_len);
        var_name[name_len] = '\0';

        // 查找变量
        Symbol *symbol = lookup_symbol(analyzer->symbol_table, var_name);
        if (symbol == NULL)
        {
            add_semantic_error(analyzer->symbol_table,
                               "未定义的变量 '%s'", var_name);
            analyzer->had_error = true;
            return TYPE_ERROR;
        }

        return symbol->data_type;
    }

    case EXPR_ASSIGN:
    {
        AssignExpr *assign = (AssignExpr *)expr;

        // 创建一个临时字符串来存储变量名
        char var_name[256];
        int name_len = assign->name.length < 255 ? assign->name.length : 255;
        strncpy(var_name, assign->name.start, name_len);
        var_name[name_len] = '\0';

        // 查找变量
        Symbol *symbol = lookup_symbol(analyzer->symbol_table, var_name);
        if (symbol == NULL)
        {
            add_semantic_error(analyzer->symbol_table,
                               "未定义的变量 '%s'", var_name);
            analyzer->had_error = true;
            return TYPE_ERROR;
        }

        // 分析赋值的值
        DataType value_type = analyze_expr(analyzer, assign->value);

        // 检查类型兼容性
        if (symbol->data_type != value_type && value_type != TYPE_ERROR)
        {
            add_semantic_error(analyzer->symbol_table,
                               "赋值类型不匹配: 变量 '%s' 类型为 %s, 值类型为 %s",
                               var_name,
                               data_type_to_string(symbol->data_type),
                               data_type_to_string(value_type));
            analyzer->had_error = true;
        }

        return symbol->data_type;
    }

    case EXPR_BINARY:
    {
        BinaryExpr *binary = (BinaryExpr *)expr;

        // 分析左右操作数
        DataType left_type = analyze_expr(analyzer, binary->left);
        DataType right_type = analyze_expr(analyzer, binary->right);

        // 如果任一操作数有错误，返回错误类型
        if (left_type == TYPE_ERROR || right_type == TYPE_ERROR)
        {
            return TYPE_ERROR;
        }

        // 根据操作符和操作数类型确定结果类型
        switch (binary->op.type)
        {
        // 算术运算符
        case TOKEN_PLUS:
        case TOKEN_MINUS:
        case TOKEN_STAR:
        case TOKEN_SLASH:
        case TOKEN_PERCENT:
            if (left_type == TYPE_INT && right_type == TYPE_INT)
            {
                return TYPE_INT;
            }
            else if (left_type == TYPE_FLOAT || right_type == TYPE_FLOAT)
            {
                return TYPE_FLOAT;
            }
            else
            {
                add_semantic_error(analyzer->symbol_table,
                                   "算术运算需要数值类型操作数");
                analyzer->had_error = true;
                return TYPE_ERROR;
            }

        // 比较运算符
        case TOKEN_EQUAL_EQUAL:
        case TOKEN_BANG_EQUAL:
        case TOKEN_LESS:
        case TOKEN_LESS_EQUAL:
        case TOKEN_GREATER:
        case TOKEN_GREATER_EQUAL:
            if ((left_type == TYPE_INT || left_type == TYPE_FLOAT) &&
                (right_type == TYPE_INT || right_type == TYPE_FLOAT))
            {
                return TYPE_BOOL;
            }
            else
            {
                add_semantic_error(analyzer->symbol_table,
                                   "比较运算需要可比较的类型");
                analyzer->had_error = true;
                return TYPE_ERROR;
            }

        // 逻辑运算符
        case TOKEN_AND:
        case TOKEN_OR:
            if ((left_type == TYPE_BOOL || left_type == TYPE_INT) &&
                (right_type == TYPE_BOOL || right_type == TYPE_INT))
            {
                return TYPE_BOOL;
            }
            else
            {
                add_semantic_error(analyzer->symbol_table,
                                   "逻辑运算需要布尔类型或整型操作数");
                analyzer->had_error = true;
                return TYPE_ERROR;
            }

        default:
            add_semantic_error(analyzer->symbol_table,
                               "未知的二元运算符");
            analyzer->had_error = true;
            return TYPE_ERROR;
        }
    }

    case EXPR_UNARY:
    {
        UnaryExpr *unary = (UnaryExpr *)expr;

        // 分析操作数
        DataType operand_type = analyze_expr(analyzer, unary->right);

        // 如果操作数有错误，返回错误类型
        if (operand_type == TYPE_ERROR)
        {
            return TYPE_ERROR;
        }

        // 根据运算符和操作数类型确定结果类型
        switch (unary->op.type)
        {
        case TOKEN_MINUS:
            if (operand_type == TYPE_INT || operand_type == TYPE_FLOAT)
            {
                return operand_type;
            }
            else
            {
                add_semantic_error(analyzer->symbol_table,
                                   "一元负号运算需要数值类型操作数");
                analyzer->had_error = true;
                return TYPE_ERROR;
            }

        case TOKEN_BANG:
            if (operand_type == TYPE_BOOL || operand_type == TYPE_INT)
            {
                return TYPE_BOOL;
            }
            else
            {
                add_semantic_error(analyzer->symbol_table,
                                   "逻辑非运算需要布尔类型或整型操作数");
                analyzer->had_error = true;
                return TYPE_ERROR;
            }

        default:
            add_semantic_error(analyzer->symbol_table,
                               "未知的一元运算符");
            analyzer->had_error = true;
            return TYPE_ERROR;
        }
    }

    case EXPR_POSTFIX:
    {
        PostfixExpr *postfix = (PostfixExpr *)expr;

        // 分析操作数
        DataType operand_type = analyze_expr(analyzer, postfix->left);

        // 如果操作数有错误，返回错误类型
        if (operand_type == TYPE_ERROR)
        {
            return TYPE_ERROR;
        }

        // 后缀运算符要求操作数是变量且类型为整数
        if (postfix->left->type != EXPR_VARIABLE)
        {
            add_semantic_error(analyzer->symbol_table,
                               "后缀运算符需要变量作为操作数");
            analyzer->had_error = true;
            return TYPE_ERROR;
        }

        if (operand_type != TYPE_INT)
        {
            add_semantic_error(analyzer->symbol_table,
                               "后缀自增/自减运算需要整型操作数");
            analyzer->had_error = true;
            return TYPE_ERROR;
        }

        return TYPE_INT;
    }

    case EXPR_CALL:
    {
        CallExpr *call = (CallExpr *)expr;

        // 确保被调用者是变量表达式
        if (call->callee->type != EXPR_VARIABLE)
        {
            add_semantic_error(analyzer->symbol_table,
                               "调用表达式的被调用者必须是函数名");
            analyzer->had_error = true;
            return TYPE_ERROR;
        }

        VariableExpr *func_var = (VariableExpr *)call->callee;

        // 创建一个临时字符串来存储函数名
        char func_name[256];
        int name_len = func_var->name.length < 255 ? func_var->name.length : 255;
        strncpy(func_name, func_var->name.start, name_len);
        func_name[name_len] = '\0';

        // 查找函数
        Symbol *func = lookup_symbol(analyzer->symbol_table, func_name);
        if (func == NULL)
        {
            add_semantic_error(analyzer->symbol_table,
                               "未定义的函数 '%s'", func_name);
            analyzer->had_error = true;
            return TYPE_ERROR;
        }

        // Special case for var-arg functions
        if (strcmp(func_name, "printf") == 0 || strcmp(func_name, "scanf") == 0)
        {
            // Skip argument count and type checks for printf/scanf
        }
        else
        {
            // 检查参数数量
            if (func->params != NULL && func->params->size != call->arguments->size)
            {
                add_semantic_error(analyzer->symbol_table,
                                   "函数 '%s' 需要 %d 个参数，但提供了 %d 个",
                                   func_name,
                                   func->params->size,
                                   call->arguments->size);
                analyzer->had_error = true;
                // Don't return here, to check for more errors
            }

            // 检查参数类型
            for (int i = 0; i < call->arguments->size; i++)
            {
                Expr *arg = (Expr *)arraylist_get(call->arguments, i);
                DataType arg_type = analyze_expr(analyzer, arg);

                // 如果有函数参数定义，检查类型兼容性
                if (func->params != NULL && i < func->params->size)
                {
                    Symbol *param = (Symbol *)arraylist_get(func->params, i);
                    if (param->data_type != arg_type && arg_type != TYPE_ERROR)
                    {
                        add_semantic_error(analyzer->symbol_table,
                                           "函数 '%s' 的第 %d 个参数类型不匹配: 需要 %s, 提供了 %s",
                                           func_name,
                                           i + 1,
                                           data_type_to_string(param->data_type),
                                           data_type_to_string(arg_type));
                        analyzer->had_error = true;
                    }
                }
            }
        }

        return func->data_type;
    }

    default:
        add_semantic_error(analyzer->symbol_table, "未知的表达式类型");
        analyzer->had_error = true;
        return TYPE_ERROR;
    }
}

// 检查返回值类型是否与函数返回类型匹配
static void check_return_type(Analyzer *analyzer, DataType return_type, int line)
{
    if (return_type == TYPE_ERROR)
    {
        return; // 已经报告过错误
    }

    if (analyzer->current_function_return_type != return_type)
    {
        add_semantic_error(analyzer->symbol_table,
                           "返回类型不匹配: 函数返回类型为 %s, 实际返回 %s (行 %d)",
                           data_type_to_string(analyzer->current_function_return_type),
                           data_type_to_string(return_type),
                           line);
        analyzer->had_error = true;
    }
}

// 打印语义错误
void print_semantic_errors(Analyzer *analyzer)
{
    printf("--- 语义分析错误 ---\n");

    for (int i = 0; i < analyzer->symbol_table->errors->size; i++)
    {
        char *error = (char *)arraylist_get(analyzer->symbol_table->errors, i);
        printf("语义错误: %s\n", error);
    }

    if (analyzer->symbol_table->errors->size == 0)
    {
        printf("没有发现语义错误.\n");
    }

    printf("----------------------\n");
}