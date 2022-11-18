#include <tree_sitter/parser.h>
#include <wctype.h>
#include <stdio.h>

#define DEBUG_PRINTF(...) do{ fprintf( stderr, __VA_ARGS__ ); } while( false )

enum TokenType {
  CODE_BLOCK
};

void *tree_sitter_alex_external_scanner_create() { return NULL; }
void tree_sitter_alex_external_scanner_destroy(void *p) {}
void tree_sitter_alex_external_scanner_reset(void *p) {}
unsigned tree_sitter_alex_external_scanner_serialize(void *p, char *buffer) { return 0; }
void tree_sitter_alex_external_scanner_deserialize(void *p, const char *b, unsigned n) {}

static bool scan_code_string(TSLexer *lexer, int32_t end) {
  while (lexer->lookahead != 0) {
    if (lexer->lookahead == '\\') {
      lexer->advance(lexer, false);
      lexer->advance(lexer, false);
    }

    if (lexer->lookahead == end) {
      lexer->advance(lexer, false);
      return true;
    }
    lexer->advance(lexer, false);
  }
  return false;
}


static bool scan_code_block(TSLexer *lexer) {
  lexer->result_symbol = CODE_BLOCK;

  unsigned open_brace = 1;
  int32_t curr = '{';

  while (lexer->lookahead != 0) {
    if (lexer->lookahead == '\'' && !iswalnum(curr)) {
      lexer->advance(lexer, false);
      if (lexer->lookahead != '\'') {
        scan_code_string(lexer, '\'');
      }
    }
    if (lexer->lookahead == '"') {
      scan_code_string(lexer, '"');
    }
    if (lexer->lookahead == '{') {
      open_brace++;
    }
    if (lexer->lookahead == '}') {
      open_brace--;
    }
    if (open_brace == 0) {
      lexer->mark_end(lexer);
      return true;
    }
    curr = lexer->lookahead;
    lexer->advance(lexer, false);
  }

  lexer->mark_end(lexer);
  return true;
}

bool tree_sitter_alex_external_scanner_scan(void *payload, TSLexer *lexer,
                                                  const bool *valid_symbols) {
  if (valid_symbols[CODE_BLOCK]) {
    return scan_code_block(lexer);
  }
  return false;
}
