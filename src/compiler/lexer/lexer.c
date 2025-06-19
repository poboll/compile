/**
 * 词法分析器实现 - lexer.c
 * @description 词法分析器，负责将源代码分解为token序列
 *              支持标识符、关键字、字面量、运算符等token识别
 *              提供完整的词法错误检测和位置跟踪功能
 * @module compiler/lexer
 * @author poboll
 * @date 2025
 * @version 1.0
 * @features
 *   - 关键字识别与分类
 *   - 数字和字符串字面量解析
 *   - 运算符和分隔符识别
 *   - 行列位置精确跟踪
 *   - 词法错误检测与报告
 */

#include "lexer.h"

// 关键字表
static const char *keywords[] = {
    "let", "const", "var", "function", "if", "else", "while",
    "for", "return", "class", "true", "false", "null",
    NULL // 终止标记
};

// 判断字符串是否为关键字
bool is_keyword(const char *str)
{
  for (int i = 0; keywords[i] != NULL; i++)
  {
    if (strcmp(str, keywords[i]) == 0)
    {
      return true;
    }
  }
  return false;
}

// 创建Token
Token *token_create(TokenType type, const char *value, int line, int column)
{
  Token *token = (Token *)safe_malloc(sizeof(Token));
  token->type = type;
  token->value = value ? safe_strdup(value) : NULL;
  token->line = line;
  token->column = column;
  return token;
}

// 销毁Token
void token_free(void *token_ptr)
{
  if (!token_ptr)
    return;

  Token *token = (Token *)token_ptr;
  if (token->value)
  {
    free(token->value);
  }
  free(token);
}

// 获取Token类型名称
const char *token_type_name(TokenType type)
{
  switch (type)
  {
  case TOKEN_KEYWORD:
    return "KEYWORD";
  case TOKEN_IDENTIFIER:
    return "IDENTIFIER";
  case TOKEN_NUMBER:
    return "NUMBER";
  case TOKEN_STRING:
    return "STRING";
  case TOKEN_OPERATOR:
    return "OPERATOR";
  case TOKEN_PUNCTUATION:
    return "PUNCTUATION";
  case TOKEN_COMMENT:
    return "COMMENT";
  case TOKEN_WHITESPACE:
    return "WHITESPACE";
  case TOKEN_EOF:
    return "EOF";
  case TOKEN_UNKNOWN:
    return "UNKNOWN";
  default:
    return "INVALID";
  }
}

// 打印Token信息
void token_print(Token *token)
{
  if (!token)
    return;

  const char *type_name = token_type_name(token->type);
  printf("Token { type: %s, value: '%s', line: %d, column: %d }\n",
         type_name,
         token->value ? token->value : "NULL",
         token->line,
         token->column);
}

// 创建词法分析器
Lexer *lexer_create(const char *source_code)
{
  Lexer *lexer = (Lexer *)safe_malloc(sizeof(Lexer));
  lexer->source_code = safe_strdup(source_code);
  lexer->current_pos = 0;
  lexer->line = 1;
  lexer->column = 1;
  lexer->tokens = arraylist_create(100); // 初始容量为100
  lexer->errors = arraylist_create(10);  // 初始容量为10
  return lexer;
}

// 销毁词法分析器
void lexer_free(Lexer *lexer)
{
  if (!lexer)
    return;

  free(lexer->source_code);
  arraylist_free(lexer->tokens, token_free);
  arraylist_free(lexer->errors, free);
  free(lexer);
}

// 添加错误信息
static void lexer_add_error(Lexer *lexer, const char *message, int line, int column)
{
  ErrorInfo *error = (ErrorInfo *)safe_malloc(sizeof(ErrorInfo));
  error->type = ERROR_LEXICAL;
  error->message = safe_strdup(message);
  error->line = line;
  error->column = column;
  error->context = NULL;

  arraylist_add(lexer->errors, error);
  log_message(LOG_ERROR, "词法错误: %s 在第%d行第%d列", message, line, column);
}

// 获取当前字符
static char lexer_current_char(Lexer *lexer)
{
  if (lexer->current_pos >= strlen(lexer->source_code))
  {
    return '\0'; // 字符串结束
  }
  return lexer->source_code[lexer->current_pos];
}

// 获取下一个字符（不移动位置）
static char lexer_peek_char(Lexer *lexer, int offset)
{
  int pos = lexer->current_pos + offset;
  if (pos >= strlen(lexer->source_code) || pos < 0)
  {
    return '\0'; // 字符串结束
  }
  return lexer->source_code[pos];
}

// 移动到下一个字符
static void lexer_advance(Lexer *lexer)
{
  if (lexer_current_char(lexer) == '\n')
  {
    lexer->line++;
    lexer->column = 1;
  }
  else
  {
    lexer->column++;
  }
  lexer->current_pos++;
}

// 判断是否为字母
static bool is_letter(char c)
{
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

// 判断是否为数字
static bool is_digit(char c)
{
  return c >= '0' && c <= '9';
}

// 判断是否为空白字符
static bool is_whitespace(char c)
{
  return c == ' ' || c == '\t' || c == '\n' || c == '\r';
}

// 添加Token
static void lexer_add_token(Lexer *lexer, TokenType type, const char *value)
{
  Token *token = token_create(type, value, lexer->line, lexer->column);
  arraylist_add(lexer->tokens, token);
}

// 处理标识符或关键字
static void lexer_consume_identifier(Lexer *lexer)
{
  int start_pos = lexer->current_pos;
  int start_line = lexer->line;
  int start_column = lexer->column;

  // 消费所有字母、数字和下划线
  while (is_letter(lexer_current_char(lexer)) ||
         is_digit(lexer_current_char(lexer)) ||
         lexer_current_char(lexer) == '_')
  {
    lexer_advance(lexer);
  }

  // 提取标识符文本
  int length = lexer->current_pos - start_pos;
  char *value = str_substring(lexer->source_code, start_pos, length);

  // 判断是否为关键字
  if (is_keyword(value))
  {
    lexer_add_token(lexer, TOKEN_KEYWORD, value);
  }
  else
  {
    lexer_add_token(lexer, TOKEN_IDENTIFIER, value);
  }

  free(value);
}

// 处理数字
static void lexer_consume_number(Lexer *lexer)
{
  int start_pos = lexer->current_pos;
  int start_line = lexer->line;
  int start_column = lexer->column;

  // 消费整数部分
  while (is_digit(lexer_current_char(lexer)))
  {
    lexer_advance(lexer);
  }

  // 处理小数点
  if (lexer_current_char(lexer) == '.' && is_digit(lexer_peek_char(lexer, 1)))
  {
    lexer_advance(lexer); // 消费小数点

    // 消费小数部分
    while (is_digit(lexer_current_char(lexer)))
    {
      lexer_advance(lexer);
    }
  }

  // 提取数字文本
  int length = lexer->current_pos - start_pos;
  char *value = str_substring(lexer->source_code, start_pos, length);

  lexer_add_token(lexer, TOKEN_NUMBER, value);

  free(value);
}

// 处理字符串
static void lexer_consume_string(Lexer *lexer, char quote_char)
{
  int start_pos = lexer->current_pos;
  int start_line = lexer->line;
  int start_column = lexer->column;

  lexer_advance(lexer); // 消费起始引号

  char *string_value = (char *)safe_malloc(1); // 空字符串
  string_value[0] = '\0';

  while (lexer_current_char(lexer) != quote_char && lexer_current_char(lexer) != '\0')
  {
    // 处理转义字符
    if (lexer_current_char(lexer) == '\\')
    {
      lexer_advance(lexer); // 消费反斜杠

      char escaped_char;
      switch (lexer_current_char(lexer))
      {
      case 'n':
        escaped_char = '\n';
        break;
      case 't':
        escaped_char = '\t';
        break;
      case 'r':
        escaped_char = '\r';
        break;
      case '\'':
        escaped_char = '\'';
        break;
      case '"':
        escaped_char = '"';
        break;
      case '\\':
        escaped_char = '\\';
        break;
      default:
        // 无效的转义序列
        char error_msg[100];
        snprintf(error_msg, sizeof(error_msg), "无效的转义序列 '\\%c'", lexer_current_char(lexer));
        lexer_add_error(lexer, error_msg, lexer->line, lexer->column);
        escaped_char = lexer_current_char(lexer);
        break;
      }

      // 添加转义后的字符到字符串
      size_t len = strlen(string_value);
      string_value = (char *)safe_realloc(string_value, len + 2);
      string_value[len] = escaped_char;
      string_value[len + 1] = '\0';

      lexer_advance(lexer); // 消费转义字符的第二个字符
    }
    else
    {
      // 普通字符
      size_t len = strlen(string_value);
      string_value = (char *)safe_realloc(string_value, len + 2);
      string_value[len] = lexer_current_char(lexer);
      string_value[len + 1] = '\0';

      lexer_advance(lexer); // 消费普通字符
    }
  }

  if (lexer_current_char(lexer) == quote_char)
  {
    lexer_advance(lexer); // 消费结束引号
    lexer_add_token(lexer, TOKEN_STRING, string_value);
  }
  else
  {
    // 未闭合的字符串
    lexer_add_error(lexer, "未闭合的字符串", start_line, start_column);
    lexer_add_token(lexer, TOKEN_UNKNOWN, string_value);
  }

  free(string_value);
}

// 处理单行注释
static void lexer_consume_single_line_comment(Lexer *lexer)
{
  int start_pos = lexer->current_pos;
  int start_line = lexer->line;
  int start_column = lexer->column;

  lexer_advance(lexer); // 消费第一个 '/'
  lexer_advance(lexer); // 消费第二个 '/'

  // 消费直到行尾的所有字符
  while (lexer_current_char(lexer) != '\n' && lexer_current_char(lexer) != '\0')
  {
    lexer_advance(lexer);
  }

  // 注释通常会被忽略，不生成token
  // 如果需要保留注释，可以取消下面的注释
  /*
  int length = lexer->current_pos - start_pos;
  char* value = str_substring(lexer->source_code, start_pos, length);
  lexer_add_token(lexer, TOKEN_COMMENT, value);
  free(value);
  */
}

// 处理多行注释
static void lexer_consume_multi_line_comment(Lexer *lexer)
{
  int start_pos = lexer->current_pos;
  int start_line = lexer->line;
  int start_column = lexer->column;

  lexer_advance(lexer); // 消费 '/'
  lexer_advance(lexer); // 消费 '*'

  bool closed = false;

  // 查找注释结束标记 */
  while (lexer_current_char(lexer) != '\0')
  {
    if (lexer_current_char(lexer) == '*' && lexer_peek_char(lexer, 1) == '/')
    {
      lexer_advance(lexer); // 消费 '*'
      lexer_advance(lexer); // 消费 '/'
      closed = true;
      break;
    }
    lexer_advance(lexer);
  }

  if (!closed)
  {
    // 未闭合的多行注释
    lexer_add_error(lexer, "未闭合的多行注释", start_line, start_column);
  }

  // 注释通常会被忽略，不生成token
}

// 处理空白字符
static void lexer_consume_whitespace(Lexer *lexer)
{
  while (is_whitespace(lexer_current_char(lexer)))
  {
    lexer_advance(lexer);
  }
}

// 进行词法分析，返回Token列表
ArrayList *lexer_tokenize(Lexer *lexer)
{
  log_message(LOG_INFO, "词法分析器: 开始分析源代码...");

  while (lexer_current_char(lexer) != '\0')
  {
    char current = lexer_current_char(lexer);

    // 跳过空白字符
    if (is_whitespace(current))
    {
      lexer_consume_whitespace(lexer);
      continue;
    }

    // 处理标识符或关键字
    if (is_letter(current) || current == '_')
    {
      lexer_consume_identifier(lexer);
      continue;
    }

    // 处理数字
    if (is_digit(current))
    {
      lexer_consume_number(lexer);
      continue;
    }

    // 处理字符串
    if (current == '"' || current == '\'')
    {
      lexer_consume_string(lexer, current);
      continue;
    }

    // 处理注释
    if (current == '/' && lexer_peek_char(lexer, 1) == '/')
    {
      lexer_consume_single_line_comment(lexer);
      continue;
    }

    if (current == '/' && lexer_peek_char(lexer, 1) == '*')
    {
      lexer_consume_multi_line_comment(lexer);
      continue;
    }

    // 处理操作符和标点符号
    if (strchr("+-*/=<>!&|;(),{}[].", current))
    {
      char op_str[3] = {current, '\0', '\0'};

      // 检查是否为双字符操作符
      char next = lexer_peek_char(lexer, 1);
      if ((current == '=' && next == '=') ||
          (current == '!' && next == '=') ||
          (current == '<' && next == '=') ||
          (current == '>' && next == '=') ||
          (current == '&' && next == '&') ||
          (current == '|' && next == '|'))
      {
        op_str[1] = next;
        lexer_add_token(lexer, TOKEN_OPERATOR, op_str);
        lexer_advance(lexer); // 消费第一个字符
        lexer_advance(lexer); // 消费第二个字符
      }
      else
      {
        lexer_add_token(lexer, TOKEN_OPERATOR, op_str);
        lexer_advance(lexer); // 消费单字符
      }
      continue;
    }

    // 处理未知字符
    char error_msg[100];
    snprintf(error_msg, sizeof(error_msg), "未知字符 '%c'", current);
    lexer_add_error(lexer, error_msg, lexer->line, lexer->column);

    char unknown_str[2] = {current, '\0'};
    lexer_add_token(lexer, TOKEN_UNKNOWN, unknown_str);
    lexer_advance(lexer);
  }

  // 添加EOF标记
  lexer_add_token(lexer, TOKEN_EOF, NULL);

  return lexer->tokens;
}

// 获取词法分析错误
ArrayList *lexer_get_errors(Lexer *lexer)
{
  return lexer->errors;
}