/**
 * 词法分析器实现 - Lexer
 *
 * 功能：
 * 1. 实现词法分析器的核心逻辑，将源代码转换为Token流
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include "lexer.h"
#include <string.h>
#include <ctype.h>

// --- 前向声明 ---
static Token make_token(Lexer *lexer, TokenType type);
static Token error_token(Lexer *lexer, const char *message);
static char advance(Lexer *lexer);
static bool is_at_end(Lexer *lexer);
static bool match(Lexer *lexer, char expected);
static void skip_whitespace(Lexer *lexer);
static char peek(Lexer *lexer);
static char peek_next(Lexer *lexer);
static Token string(Lexer *lexer);
static Token number(Lexer *lexer);
static Token identifier(Lexer *lexer);
static TokenType identifier_type(Lexer *lexer);
static TokenType check_keyword(Lexer *lexer, int start, int length, const char *rest, TokenType type);

// --- 公共函数实现 ---

void init_lexer(Lexer *lexer, const char *source)
{
    lexer->start = source;
    lexer->current = source;
    lexer->line = 1;
    lexer->column = 1;
    lexer->start_column = 1;
}

Token scan_token(Lexer *lexer)
{
    skip_whitespace(lexer);

    lexer->start = lexer->current;
    lexer->start_column = lexer->column;

    if (*lexer->current == '\0')
        return make_token(lexer, TOKEN_EOF);

    char c = advance(lexer);

    if (isalpha(c) || c == '_')
        return identifier(lexer);
    if (isdigit(c))
        return number(lexer);

    switch (c)
    {
    case '(':
        return make_token(lexer, TOKEN_LPAREN);
    case ')':
        return make_token(lexer, TOKEN_RPAREN);
    case '{':
        return make_token(lexer, TOKEN_LBRACE);
    case '}':
        return make_token(lexer, TOKEN_RBRACE);
    case '[':
        return make_token(lexer, TOKEN_LBRACKET);
    case ']':
        return make_token(lexer, TOKEN_RBRACKET);
    case ';':
        return make_token(lexer, TOKEN_SEMICOLON);
    case ',':
        return make_token(lexer, TOKEN_COMMA);
    case '.':
        return make_token(lexer, TOKEN_DOT);
    case '-':
        if (match(lexer, '-'))
            return make_token(lexer, TOKEN_MINUS_MINUS);
        return make_token(lexer, TOKEN_MINUS);
    case '+':
        if (match(lexer, '+'))
            return make_token(lexer, TOKEN_PLUS_PLUS);
        return make_token(lexer, TOKEN_PLUS);
    case '/':
        return make_token(lexer, TOKEN_SLASH);
    case '*':
        return make_token(lexer, TOKEN_STAR);
    case '%':
        return make_token(lexer, TOKEN_PERCENT);
    case '!':
        return make_token(lexer, match(lexer, '=') ? TOKEN_BANG_EQUAL : TOKEN_BANG);
    case '=':
        return make_token(lexer, match(lexer, '=') ? TOKEN_EQUAL_EQUAL : TOKEN_EQUAL);
    case '<':
        return make_token(lexer, match(lexer, '=') ? TOKEN_LESS_EQUAL : TOKEN_LESS);
    case '>':
        return make_token(lexer, match(lexer, '=') ? TOKEN_GREATER_EQUAL : TOKEN_GREATER);
    case '&':
        return make_token(lexer, match(lexer, '&') ? TOKEN_AND : TOKEN_AMPERSAND);
    case '|':
        return make_token(lexer, match(lexer, '|') ? TOKEN_OR : TOKEN_PIPE);
    case '"':
        return string(lexer);
    case '\'':
        if (peek(lexer) == '\\')
        {
            advance(lexer);
        }
        if (is_at_end(lexer))
            return error_token(lexer, "Unterminated character literal.");
        advance(lexer);

        if (peek(lexer) != '\'')
        {
            return error_token(lexer, "Unterminated character literal.");
        }
        advance(lexer);
        return make_token(lexer, TOKEN_CHAR_LIT);
    }

    return error_token(lexer, "Unexpected character.");
}

// --- 静态辅助函数实现 ---

static bool is_at_end(Lexer *lexer)
{
    return *lexer->current == '\0';
}

static Token make_token(Lexer *lexer, TokenType type)
{
    Token token;
    token.type = type;
    token.start = lexer->start;
    token.length = (int)(lexer->current - lexer->start);
    token.line = lexer->line;
    token.column = lexer->start_column;
    return token;
}

static Token error_token(Lexer *lexer, const char *message)
{
    Token token;
    token.type = TOKEN_ERROR;
    token.start = message;
    token.length = (int)strlen(message);
    token.line = lexer->line;
    token.column = lexer->start_column;
    return token;
}

static char advance(Lexer *lexer)
{
    lexer->current++;
    lexer->column++;
    return lexer->current[-1];
}

static bool match(Lexer *lexer, char expected)
{
    if (is_at_end(lexer))
        return false;
    if (*lexer->current != expected)
        return false;
    lexer->current++;
    lexer->column++;
    return true;
}

static void skip_whitespace(Lexer *lexer)
{
    for (;;)
    {
        char c = peek(lexer);
        switch (c)
        {
        case ' ':
        case '\r':
        case '\t':
            advance(lexer);
            break;
        case '\n':
            lexer->line++;
            lexer->column = 1;
            advance(lexer);
            break;
        case '/':
            if (peek_next(lexer) == '/')
            {
                while (peek(lexer) != '\n' && !is_at_end(lexer))
                    advance(lexer);
            }
            else if (peek_next(lexer) == '*')
            {
                advance(lexer);
                advance(lexer);
                while (!(peek(lexer) == '*' && peek_next(lexer) == '/') && !is_at_end(lexer))
                {
                    if (peek(lexer) == '\n')
                    {
                        lexer->line++;
                        lexer->column = 1;
                    }
                    advance(lexer);
                }
                if (!is_at_end(lexer))
                {
                    advance(lexer);
                    advance(lexer);
                }
            }
            else
            {
                return;
            }
            break;
        default:
            return;
        }
    }
}

static char peek(Lexer *lexer)
{
    return *lexer->current;
}

static char peek_next(Lexer *lexer)
{
    if (is_at_end(lexer))
        return '\0';
    return lexer->current[1];
}

static Token string(Lexer *lexer)
{
    while (peek(lexer) != '"' && !is_at_end(lexer))
    {
        if (peek(lexer) == '\n')
        {
            lexer->line++;
            lexer->column = 1;
        }
        advance(lexer);
    }

    if (is_at_end(lexer))
        return error_token(lexer, "Unterminated string.");

    advance(lexer);
    return make_token(lexer, TOKEN_STRING);
}

static Token number(Lexer *lexer)
{
    while (isdigit(peek(lexer)))
        advance(lexer);

    if (peek(lexer) == '.' && isdigit(peek_next(lexer)))
    {
        advance(lexer);

        while (isdigit(peek(lexer)))
            advance(lexer);
    }
    return make_token(lexer, TOKEN_NUMBER);
}

static Token identifier(Lexer *lexer)
{
    while (isalnum(peek(lexer)) || peek(lexer) == '_')
        advance(lexer);
    return make_token(lexer, identifier_type(lexer));
}

static TokenType identifier_type(Lexer *lexer)
{
    switch (lexer->start[0])
    {
    case 'c':
        return check_keyword(lexer, 1, 3, "har", TOKEN_CHAR);
    case 'e':
        return check_keyword(lexer, 1, 3, "lse", TOKEN_ELSE);
    case 'f':
        if (lexer->current - lexer->start > 1)
        {
            switch (lexer->start[1])
            {
            case 'a':
                return check_keyword(lexer, 2, 3, "lse", TOKEN_FALSE);
            case 'o':
                return check_keyword(lexer, 2, 1, "r", TOKEN_FOR);
            }
        }
        break;
    case 'i':
        if (lexer->current - lexer->start > 1)
        {
            switch (lexer->start[1])
            {
            case 'f':
                return check_keyword(lexer, 2, 0, "", TOKEN_IF);
            case 'n':
                return check_keyword(lexer, 2, 1, "t", TOKEN_INT);
            }
        }
        break;
    case 'r':
        return check_keyword(lexer, 1, 5, "eturn", TOKEN_RETURN);
    case 's':
        return check_keyword(lexer, 1, 5, "izeof", TOKEN_SIZEOF);
    case 't':
        return check_keyword(lexer, 1, 3, "rue", TOKEN_TRUE);
    case 'v':
        return check_keyword(lexer, 1, 3, "oid", TOKEN_VOID);
    case 'w':
        return check_keyword(lexer, 1, 4, "hile", TOKEN_WHILE);
    }

    return TOKEN_IDENTIFIER;
}

static TokenType check_keyword(Lexer *lexer, int start, int length, const char *rest, TokenType type)
{
    if (lexer->current - lexer->start == start + length &&
        memcmp(lexer->start + start, rest, length) == 0)
    {
        return type;
    }
    return TOKEN_IDENTIFIER;
}