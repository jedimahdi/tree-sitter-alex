module.exports = grammar({
  name: 'alex',

  externals: $ => [
    $.code_block,
  ],

  extras: $ => [
    $.comment,
    /[\s\p{Zs}\uFEFF\u2060\u200B]/,
  ],

  conflicts: $ => [
    [$.rexp, $._alt]
  ],

  rules: {
    lexer: $ => seq(optional($.code), repeat($.directive), repeat($.macdef), $.scanner, optional($.code)),

    scanner: $ => seq($.bind, repeat($.tokendef)),
    bind: _ => /(([A-Za-z][A-Za-z'_]*) (\s+)?)?:-/,
    tokendef: $ => choice(seq($.startcodes, $.rule), seq($.startcodes, '{', repeat($.rule), '}'), $.rule),
    rule: $ => seq($.context, $.rhs),
    startcodes: $ => seq('<', $._startcodes0, '>'),
    _startcodes0: $ => choice(seq($.startcode, ',', $._startcodes0), $.startcode),
    startcode: $ => choice('0', $.identifier),
    rhs: $ => choice(';', $.code),
    context: $ => seq(optional($.left_ctx), $.rexp, optional($.right_ctx)),
    left_ctx: $ => choice('^', seq($.set, '^')),
    right_ctx: $ => choice('$', seq('/', $.rexp), seq('/', $.code)),

    macdef: $ => choice(seq($._smac_def, field('rhs', $.set)), seq($._rmac_def, field('rhs', $.rexp))),
    rmac: $ => choice(seq('@', $.identifier), seq('@', '{', $.identifier, '}')),
    _rmac_def: $ => seq(field('name', $.rmac), '='),
    smac: $ => choice(seq('$', $.identifier), seq('$', '{', $.identifier, '}')),
    _smac_def: $ => seq(field('name', $.smac), '='),

    rexp: $ => choice(seq($._alt, '|', $.rexp), $._alt),
    _alt: $ => choice(seq($._alt, $._term), $._term),
    _term: $ => prec.left(1, choice(seq($._rexp0, $.rep), $._rexp0)),
    rep: $ => choice('*', '+', '?', seq('{', $.mult, '}')),
    _rexp0: $ => choice(seq('(', ')'), $.string, $.rmac, $.set, seq('(', $.rexp, ')')),
    mult: $ => choice(/\d+/, seq(/\d+/, ','), seq(/\d+/, ',', /\d+/)),

    set: $ => choice(seq($.set, '#', $._set0), $._set0),
    _set0: $ => choice($._char, 
                      seq($._char, '-', $._char),
                      $.smac,
                      '.',
                      seq('[', repeat($.set), ']'),
                      seq('[', '^', repeat($.set), ']'),
                      seq('~', $._set0)),

    _char: $ => choice($.pattern_character, $.escaped_character),

    // escaped_character: $ => choice(/\\[\\_\'%\[\]\.:;,\$\|\*\+\?\#\~\-\{\}\(\)\^\/@tfvrn"<>=\w\d]/, /\\x([0-9A-Fa-f]){2,4}/, '\\ '),
    escaped_character: $ => seq('\\', choice(/./, seq('x', /[0-9A-Fa-f]+/), seq('o', /[0-7]+/), /\d+/)),

    pattern_character: $ => /[^\.;,\$\|\*\+\?\#\~\-\{\}\(\)\[\]\^\/\s%<=]/,

    directive: $ => seq(field("name", $.directive_name)
                      , field("value", $.string)),

    directive_name: _ => /%\w+/,

    string: _ => /\"[^\"]*\"/,

    code: $ => seq('{', $.code_block, '}', /\s*/),

    comment: _ => seq('--', /.*/),

    identifier: $ => token(/[A-Za-z][A-Za-z'_]*/),
  }
});
