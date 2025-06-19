/**
 * Token实现 - 词法分析器
 *
 * 功能：
 * 1. 实现Token相关的辅助函数
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include "token.h"
#include <stdio.h>

const char *token_type_to_string(TokenType type)
{
    switch (type)
    {
    case TOKEN_EOF:
        return "EOF";
    case TOKEN_ERROR:
        return "Error";
    case TOKEN_INT:
        return "int";
    case TOKEN_CHAR:
        return "char";
    case TOKEN_VOID:
        return "void";
    case TOKEN_IF:
        return "if";
    case TOKEN_ELSE:
        return "else";
    case TOKEN_WHILE:
        return "while";
    case TOKEN_FOR:
        return "for";
    case TOKEN_RETURN:
        return "return";
    case TOKEN_SIZEOF:
        return "sizeof";
    case TOKEN_IDENTIFIER:
        return "Identifier";
    case TOKEN_NUMBER:
        return "Number";
    case TOKEN_STRING:
        return "String";
    case TOKEN_CHAR_LIT:
        return "CharLiteral";
    case TOKEN_PLUS:
        return "+";
    case TOKEN_MINUS:
        return "-";
    case TOKEN_STAR:
        return "*";
    case TOKEN_SLASH:
        return "/";
    case TOKEN_PERCENT:
        return "%";
    case TOKEN_EQUAL:
        return "=";
    case TOKEN_EQUAL_EQUAL:
        return "==";
    case TOKEN_BANG:
        return "!";
    case TOKEN_BANG_EQUAL:
        return "!=";
    case TOKEN_LESS:
        return "<";
    case TOKEN_LESS_EQUAL:
        return "<=";
    case TOKEN_GREATER:
        return ">";
    case TOKEN_GREATER_EQUAL:
        return ">=";
    case TOKEN_AMPERSAND:
        return "&";
    case TOKEN_PIPE:
        return "|";
    case TOKEN_PLUS_PLUS:
        return "++";
    case TOKEN_MINUS_MINUS:
        return "--";
    case TOKEN_LPAREN:
        return "(";
    case TOKEN_RPAREN:
        return ")";
    case TOKEN_LBRACE:
        return "{";
    case TOKEN_RBRACE:
        return "}";
    case TOKEN_LBRACKET:
        return "[";
    case TOKEN_RBRACKET:
        return "]";
    case TOKEN_COMMA:
        return ",";
    case TOKEN_SEMICOLON:
        return ";";
    case TOKEN_DOT:
        return ".";
    default:
        return "Unknown";
    }
}

void print_token(Token *token)
{
    printf("[Line %4d, Col %4d] %-15s '%.*s'\n",
           token->line,
           token->column,
           token_type_to_string(token->type),
           token->length,
           token->start);
}