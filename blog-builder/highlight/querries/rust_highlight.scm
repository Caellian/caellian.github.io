; Identifier conventions
; Pattern matching: https://tree-sitter.github.io/tree-sitter/using-parsers#pattern-matching-with-queries
; Grammar: https://github.com/tree-sitter/tree-sitter-rust/blob/master/src/grammar.json

; Assume all-caps names are constants
((identifier) @constant
 (#match? @constant "^[A-Z][A-Z\\d_]+$'"))

; Assume that uppercase names in paths are types
((scoped_identifier
  path: (identifier) @type)
 (#match? @type "^[A-Z]"))
((scoped_identifier
  path: (scoped_identifier
    name: (identifier) @type))
 (#match? @type "^[A-Z]"))
((scoped_type_identifier
  path: (identifier) @type)
 (#match? @type "^[A-Z]"))
((scoped_type_identifier
  path: (scoped_identifier
    name: (identifier) @type))
 (#match? @type "^[A-Z]"))

; Assume other uppercase names are enum constructors
((identifier) @constant.builtin
 (#match? @constant.builtin "(Some|None|Ok|Err)"))

((identifier) @constructor
 (#match? @constructor "^[A-Z]"))

; Assume all qualified names in struct patterns are enum constructors. (They're
; either that, or struct names; highlighting both as constructors seems to be
; the less glaring choice of error, visually.)
(struct_pattern
  type: (scoped_type_identifier
    name: (type_identifier) @constructor))

; Function calls

(call_expression
  function: (identifier) @function)
(call_expression
  function: (field_expression
    field: (field_identifier) @function.method))
(call_expression
  function: (scoped_identifier
    "::"
    name: (identifier) @function))

(generic_function
  function: (identifier) @function)
(generic_function
  function: (scoped_identifier
    name: (identifier) @function))
(generic_function
  function: (field_expression
    field: (field_identifier) @function.method))

(macro_definition "macro_rules!" @function.macro) @macro.definition
(macro_invocation
  macro: (identifier) @function.macro
  "!" @function.macro)

(metavariable) @variable.macro

; Function definitions

(function_item (identifier) @function)
(function_signature_item (identifier) @function)

; Other identifiers

(type_identifier) @type
(primitive_type) @type.builtin
(field_identifier) @property

(line_comment) @comment
(block_comment) @comment

(parameter (identifier) @variable.parameter)

[
  "use"
  "mod"
] @include.keyword

(type_cast_expression "as" @keyword.operator)
(qualified_type "as" @keyword.operator)


(self_parameter
  "&"
  (lifetime (identifier) @label)? @storageclass.lifetime
  (mutable_specifier)? @keyword.storageclass.mutable
  (self)?
) @builtin.reference

(reference_expression
  "&"
  (mutable_specifier)? @keyword.storageclass.mutable
  (_) @variable
) @reference

(reference_pattern
  "&"
  (lifetime (identifier) @label)? @storageclass.lifetime
  (mutable_specifier)? @keyword.storageclass.mutable
  (_)
) @reference

(reference_type
  "&"
  (lifetime (identifier) @label)? @storageclass.lifetime
  (mutable_specifier)? @keyword.storageclass.mutable
  (_) @type
) @reference

(lifetime (identifier) @label) @storage.lifetime

[
  "static"
  "const"
  "ref"
  "move"
  "dyn"
] @keyword.storage.modifier

"as" @keyword
"async" @keyword
"await" @keyword
"break" @keyword
"continue" @keyword
"default" @keyword
"else" @keyword
"enum" @keyword
"extern" @keyword
"fn" @keyword
"for" @keyword
"if" @keyword
"impl" @keyword
"in" @keyword
"let" @keyword
"loop" @keyword
"macro_rules!" @keyword
"match" @keyword
"pub" @keyword
"return" @keyword
"struct" @keyword
"trait" @keyword
"type" @keyword
"union" @keyword
"unsafe" @keyword
"where" @keyword
"while" @keyword
(mutable_specifier) @keyword
(use_list (self) @keyword)
(scoped_use_list (self) @keyword.namespace)
(scoped_identifier [(crate) (super) (self)] @keyword.namespace)
(visibility_modifier [(crate) (super) (self)] @keyword.namespace)

(crate) @keyword
(super) @keyword
(self) @keyword

(char_literal) @string
(string_literal) @string
(raw_string_literal) @string

(boolean_literal) @constant.boolean
(negative_literal
  "-" @unary.operator)
(integer_literal) @constant.number
(float_literal) @constant.number.float

(escape_sequence) @escape

(attribute_item) @attribute
(inner_attribute_item) @attribute

(assignment_expression "=" @assignment.operator)

(compound_assignment_expr [
  "%="
  "&="
  "*="
  "+="
  "-="
  "/="
  "<<="
  "="
  ">>="
  "^="
  "|="
] @compound.assignment.operator)

[
  ".."
  "..="
] @range.operator

(binary_expression [
  "!="
  "%"
  "&"
  "&&"
  "*"
  "+"
  "-"
  "/"
  "<"
  "<<"
  "<="
  "=="
  ">"
  ">="
  ">>"
  "?"
  "@"
  "^"
  "|"
  "||"
] @binary.operator)

(unary_expression [
  "!"
  "-"
  "*"
] @unary.operator)

(try_expression "?" @try.operator)

; Punctuation

[
  "(" 
  ")" 
  "[" 
  "]" 
  "{" 
  "}"
] @punctuation.bracket

(type_arguments
  "<" @punctuation.bracket
  ">" @punctuation.bracket)
(type_parameters
  "<" @punctuation.bracket
  ">" @punctuation.bracket)

[
  "::"
  ":"
  "."
  ","
  ";"
] @punctuation.delimiter
