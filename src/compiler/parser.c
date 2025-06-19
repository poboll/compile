/**
 * 解析器实现 - Parser
 *
 * 功能：
 * 1. 使用递归下降法将token流解析为AST
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include "parser.h"
#include <stdio.h>
#include <stdlib.h>

// --- 前向声明 ---
static void advance(Parser *parser);
static bool check(Parser *parser, TokenType type);
static bool match(Parser *parser, TokenType type);
static void consume(Parser *parser, TokenType type, const char *message);
static void error_at(Parser *parser, Token *token, const char *message);
static void error_at_current(Parser *parser, const char *message);
static void error(Parser *parser, const char *message);
static void synchronize(Parser *parser);

static Stmt *declaration(Parser *parser);
static Stmt *statement(Parser *parser);
static Stmt *if_statement(Parser *parser);
static Stmt *while_statement(Parser *parser);
static Stmt *for_statement(Parser *parser);
static Stmt *return_statement(Parser *parser);
static Stmt *block(Parser *parser);
static Stmt *expression_statement(Parser *parser);

static Expr *expression(Parser *parser);
static Expr *assignment(Parser *parser);
static Expr *logical_or(Parser *parser);
static Expr *logical_and(Parser *parser);
static Expr *equality(Parser *parser);
static Expr *comparison(Parser *parser);
static Expr *term(Parser *parser);
static Expr *factor(Parser *parser);
static Expr *unary(Parser *parser);
static Expr *postfix(Parser *parser);
static Expr *call(Parser *parser);
static Expr *finish_call(Parser *parser, Expr *callee);
static Expr *primary(Parser *parser);

// --- 公共函数实现 ---

void init_parser(Parser *parser, Lexer *lexer)
{
    parser->lexer = lexer;
    parser->had_error = false;
    parser->panic_mode = false;
    advance(parser);
}

ArrayList *parse(Parser *parser)
{
    ArrayList *statements = arraylist_create(10);
    while (!check(parser, TOKEN_EOF))
    {
        arraylist_add(statements, declaration(parser));
    }
    return statements;
}

// --- 辅助函数实现 ---

static void advance(Parser *parser)
{
    parser->previous = parser->current;
    for (;;)
    {
        parser->current = scan_token(parser->lexer);
        if (parser->current.type != TOKEN_ERROR)
            break;
        error_at_current(parser, parser->current.start);
    }
}

static bool check(Parser *parser, TokenType type)
{
    return parser->current.type == type;
}

static bool match(Parser *parser, TokenType type)
{
    if (!check(parser, type))
        return false;
    advance(parser);
    return true;
}

static void consume(Parser *parser, TokenType type, const char *message)
{
    if (check(parser, type))
    {
        advance(parser);
        return;
    }
    error_at_current(parser, message);
}

static void error_at(Parser *parser, Token *token, const char *message)
{
    if (parser->panic_mode)
        return;
    parser->panic_mode = true;
    fprintf(stderr, "[Line %d, Col %d] Error", token->line, token->column);
    if (token->type == TOKEN_EOF)
    {
        fprintf(stderr, " at end");
    }
    else if (token->type != TOKEN_ERROR)
    {
        fprintf(stderr, " at '%.*s'", token->length, token->start);
    }
    fprintf(stderr, ": %s\n", message);
    parser->had_error = true;
}

static void error_at_current(Parser *parser, const char *message)
{
    error_at(parser, &parser->current, message);
}

static void error(Parser *parser, const char *message)
{
    error_at(parser, &parser->previous, message);
}

static void synchronize(Parser *parser)
{
    parser->panic_mode = false;
    while (parser->current.type != TOKEN_EOF)
    {
        if (parser->previous.type == TOKEN_SEMICOLON)
            return;
        switch (parser->current.type)
        {
        case TOKEN_INT:
        case TOKEN_CHAR:
        case TOKEN_VOID:
        case TOKEN_FOR:
        case TOKEN_IF:
        case TOKEN_WHILE:
        case TOKEN_RETURN:
            return;
        default:; // Do nothing.
        }
        advance(parser);
    }
}

// --- 声明与语句解析 ---

static Stmt *declaration(Parser *parser)
{
    if (match(parser, TOKEN_INT) || match(parser, TOKEN_CHAR) || match(parser, TOKEN_VOID))
    {
        // Token type_token = parser->previous;
        while (match(parser, TOKEN_STAR))
        {
        }
        consume(parser, TOKEN_IDENTIFIER, "Expect variable or function name.");
        Token name_token = parser->previous;

        if (match(parser, TOKEN_LPAREN))
        { // Function declaration
            ArrayList *parameters = arraylist_create(4);
            if (!check(parser, TOKEN_RPAREN))
            {
                do
                {
                    if (parameters->size >= 255)
                        error(parser, "Cannot have more than 255 parameters.");
                    if (match(parser, TOKEN_INT) || match(parser, TOKEN_CHAR) || match(parser, TOKEN_VOID))
                    {
                        while (match(parser, TOKEN_STAR))
                        {
                        }
                        consume(parser, TOKEN_IDENTIFIER, "Expect parameter name.");
                        arraylist_add(parameters, (void *)&parser->previous);
                    }
                    else
                    {
                        error_at_current(parser, "Expect parameter type.");
                        break;
                    }
                } while (match(parser, TOKEN_COMMA));
            }
            consume(parser, TOKEN_RPAREN, "Expect ')' after parameters.");
            consume(parser, TOKEN_LBRACE, "Expect '{' before function body.");
            BlockStmt *body = (BlockStmt *)block(parser);
            return new_func_decl_stmt(name_token, parameters, body);
        }
        else
        { // Variable declaration
            Expr *initializer = NULL;
            if (match(parser, TOKEN_EQUAL))
            {
                initializer = expression(parser);
            }
            consume(parser, TOKEN_SEMICOLON, "Expect ';' after variable declaration.");
            return new_var_decl_stmt(name_token, initializer);
        }
    }

    Stmt *stmt = statement(parser);
    if (parser->panic_mode)
        synchronize(parser);
    return stmt;
}

static Stmt *statement(Parser *parser)
{
    if (match(parser, TOKEN_IF))
        return if_statement(parser);
    if (match(parser, TOKEN_WHILE))
        return while_statement(parser);
    if (match(parser, TOKEN_FOR))
        return for_statement(parser);
    if (match(parser, TOKEN_RETURN))
        return return_statement(parser);
    if (match(parser, TOKEN_LBRACE))
        return block(parser);
    return expression_statement(parser);
}

static Stmt *for_statement(Parser *parser)
{
    consume(parser, TOKEN_LPAREN, "Expect '(' after 'for'.");
    Stmt *initializer;
    if (match(parser, TOKEN_SEMICOLON))
    {
        initializer = NULL;
    }
    else if (check(parser, TOKEN_INT) || check(parser, TOKEN_CHAR) || check(parser, TOKEN_VOID))
    {
        initializer = declaration(parser);
    }
    else
    {
        initializer = expression_statement(parser);
    }

    Expr *condition = NULL;
    if (!check(parser, TOKEN_SEMICOLON))
    {
        condition = expression(parser);
    }
    consume(parser, TOKEN_SEMICOLON, "Expect ';' after loop condition.");

    Expr *increment = NULL;
    if (!check(parser, TOKEN_RPAREN))
    {
        increment = expression(parser);
    }
    consume(parser, TOKEN_RPAREN, "Expect ')' after for clauses.");

    Stmt *body = statement(parser);
    return new_for_stmt(initializer, condition, increment, body);
}

static Stmt *if_statement(Parser *parser)
{
    consume(parser, TOKEN_LPAREN, "Expect '(' after 'if'.");
    Expr *condition = expression(parser);
    consume(parser, TOKEN_RPAREN, "Expect ')' after if condition.");
    Stmt *then_branch = statement(parser);
    Stmt *else_branch = NULL;
    if (match(parser, TOKEN_ELSE))
    {
        else_branch = statement(parser);
    }
    return new_if_stmt(condition, then_branch, else_branch);
}

static Stmt *while_statement(Parser *parser)
{
    consume(parser, TOKEN_LPAREN, "Expect '(' after 'while'.");
    Expr *condition = expression(parser);
    consume(parser, TOKEN_RPAREN, "Expect ')' after while condition.");
    Stmt *body = statement(parser);
    return new_while_stmt(condition, body);
}

static Stmt *return_statement(Parser *parser)
{
    Token keyword = parser->previous;
    Expr *value = NULL;
    if (!check(parser, TOKEN_SEMICOLON))
    {
        value = expression(parser);
    }
    consume(parser, TOKEN_SEMICOLON, "Expect ';' after return value.");
    return new_return_stmt(keyword, value);
}

static Stmt *block(Parser *parser)
{
    ArrayList *statements = arraylist_create(8);
    while (!check(parser, TOKEN_RBRACE) && !check(parser, TOKEN_EOF))
    {
        arraylist_add(statements, declaration(parser));
    }
    consume(parser, TOKEN_RBRACE, "Expect '}' after block.");
    return new_block_stmt(statements);
}

static Stmt *expression_statement(Parser *parser)
{
    Expr *expr = expression(parser);
    consume(parser, TOKEN_SEMICOLON, "Expect ';' after expression.");
    return new_expression_stmt(expr);
}

// --- 表达式解析 ---

static Expr *expression(Parser *parser)
{
    return assignment(parser);
}

static Expr *assignment(Parser *parser)
{
    Expr *expr = logical_or(parser);
    if (match(parser, TOKEN_EQUAL))
    {
        // Token equals = parser->previous;
        Expr *value = assignment(parser);
        if (expr->type == EXPR_VARIABLE)
        {
            Token name = ((VariableExpr *)expr)->name;
            return new_assign_expr(name, value);
        }
        error(parser, "Invalid assignment target.");
    }
    return expr;
}

static Expr *binary_expression(Parser *parser, Expr *(*higher_precedence)(Parser *), TokenType types[], int type_count)
{
    Expr *expr = higher_precedence(parser);

    while (true)
    {
        bool matched = false;
        for (int i = 0; i < type_count; i++)
        {
            if (match(parser, types[i]))
            {
                Token op = parser->previous;
                Expr *right = higher_precedence(parser);
                expr = new_binary_expr(expr, op, right);
                matched = true;
                break; // Found an operator, break inner loop and continue outer while
            }
        }
        if (!matched)
        {
            break; // No matching operator found, exit the loop
        }
    }

    return expr;
}

static Expr *logical_or(Parser *parser)
{
    TokenType types[] = {TOKEN_PIPE};
    return binary_expression(parser, logical_and, types, 1);
}

static Expr *logical_and(Parser *parser)
{
    TokenType types[] = {TOKEN_AMPERSAND};
    return binary_expression(parser, equality, types, 1);
}

static Expr *equality(Parser *parser)
{
    TokenType types[] = {TOKEN_EQUAL_EQUAL, TOKEN_BANG_EQUAL};
    return binary_expression(parser, comparison, types, 2);
}

static Expr *comparison(Parser *parser)
{
    TokenType types[] = {TOKEN_GREATER, TOKEN_GREATER_EQUAL, TOKEN_LESS, TOKEN_LESS_EQUAL};
    return binary_expression(parser, term, types, 4);
}

static Expr *term(Parser *parser)
{
    TokenType types[] = {TOKEN_MINUS, TOKEN_PLUS};
    return binary_expression(parser, factor, types, 2);
}

static Expr *factor(Parser *parser)
{
    TokenType types[] = {TOKEN_SLASH, TOKEN_STAR, TOKEN_PERCENT};
    return binary_expression(parser, unary, types, 3);
}

static Expr *unary(Parser *parser)
{
    if (match(parser, TOKEN_BANG) || match(parser, TOKEN_MINUS))
    {
        Token op = parser->previous;
        Expr *right = unary(parser);
        return new_unary_expr(op, right);
    }
    return postfix(parser);
}

static Expr *postfix(Parser *parser)
{
    Expr *expr = call(parser);
    while (match(parser, TOKEN_PLUS_PLUS) || match(parser, TOKEN_MINUS_MINUS))
    {
        Token op = parser->previous;
        expr = new_postfix_expr(expr, op);
    }
    return expr;
}

static Expr *call(Parser *parser)
{
    Expr *expr = primary(parser);
    while (match(parser, TOKEN_LPAREN))
    {
        expr = finish_call(parser, expr);
    }
    return expr;
}

static Expr *finish_call(Parser *parser, Expr *callee)
{
    ArrayList *arguments = arraylist_create(4);
    if (!check(parser, TOKEN_RPAREN))
    {
        do
        {
            if (arguments->size >= 255)
                error(parser, "Cannot have more than 255 arguments.");
            arraylist_add(arguments, expression(parser));
        } while (match(parser, TOKEN_COMMA));
    }
    consume(parser, TOKEN_RPAREN, "Expect ')' after arguments.");
    return new_call_expr(callee, arguments);
}

static Expr *primary(Parser *parser)
{
    if (match(parser, TOKEN_NUMBER) || match(parser, TOKEN_STRING) || match(parser, TOKEN_CHAR_LIT))
    {
        return new_literal_expr(parser->previous);
    }
    if (match(parser, TOKEN_IDENTIFIER))
    {
        return new_variable_expr(parser->previous);
    }
    if (match(parser, TOKEN_LPAREN))
    {
        Expr *expr = expression(parser);
        consume(parser, TOKEN_RPAREN, "Expect ')' after expression.");
        return expr;
    }
    error_at_current(parser, "Expect expression.");
    return NULL;
}