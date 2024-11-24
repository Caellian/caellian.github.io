use napi::Either;
use napi_derive::napi;
use std::collections::HashMap;
use tree_sitter_highlight::{HighlightConfiguration, HighlightEvent, Highlighter};

const STANDARD_HIGHLIGHTS: &'static [&'static str] = &[
    "attribute",
    "boolean",
    "carriage-return",
    "comment",
    "comment.documentation",
    "constant",
    "constant.builtin",
    "constructor",
    "constructor.builtin",
    "embedded",
    "error",
    "escape",
    "function",
    "function.builtin",
    "keyword",
    "module",
    "number",
    "operator",
    "property",
    "property.builtin",
    "punctuation",
    "punctuation.bracket",
    "punctuation.delimiter",
    "punctuation.special",
    "string",
    "string.escape",
    "string.regexp",
    "string.special",
    "string.special.symbol",
    "tag",
    "type",
    "type.builtin",
    "variable",
    "variable.builtin",
    "variable.member",
    "variable.parameter",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Language {
    JS,
    TS,
    CSS,
    Rust,
    Regex,
    HTML,
}

macro_rules! query_union {
    ($first: path $(,$other: path)*) => {
        $first.to_owned() $(+ $other)*
    };
}

impl Language {
    const ALL: &'static [Language] = &[
        Language::JS,
        Language::TS,
        Language::CSS,
        Language::Rust,
        Language::Regex,
        Language::HTML,
    ];

    fn highlight_init(&self) -> fn() -> HighlightConfiguration {
        match self {
            Language::JS => || {
                HighlightConfiguration::new(
                    tree_sitter_javascript::LANGUAGE.into(),
                    Language::JS.name(),
                    tree_sitter_javascript::HIGHLIGHT_QUERY,
                    tree_sitter_javascript::INJECTIONS_QUERY,
                    tree_sitter_javascript::LOCALS_QUERY,
                )
                .unwrap()
            },
            Language::TS => || {
                let highlights = query_union![
                    tree_sitter_typescript::HIGHLIGHTS_QUERY,
                    tree_sitter_javascript::HIGHLIGHT_QUERY
                ];

                let locals = query_union![
                    tree_sitter_typescript::LOCALS_QUERY,
                    tree_sitter_javascript::LOCALS_QUERY
                ];

                HighlightConfiguration::new(
                    tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
                    Language::TS.name(),
                    &highlights,
                    tree_sitter_javascript::INJECTIONS_QUERY,
                    &locals,
                )
                .unwrap()
            },
            Language::CSS => || {
                HighlightConfiguration::new(
                    tree_sitter_css::LANGUAGE.into(),
                    Language::CSS.name(),
                    tree_sitter_css::HIGHLIGHTS_QUERY,
                    "",
                    "",
                )
                .unwrap()
            },
            Language::Rust => || {
                const RUST_HIGHLIGHT: &str =
                    include_str!("../extensions/rust_highlight.scm");
                HighlightConfiguration::new(
                    tree_sitter_rust::LANGUAGE.into(),
                    Language::Rust.name(),
                    RUST_HIGHLIGHT,
                    tree_sitter_rust::INJECTIONS_QUERY,
                    "",
                )
                .unwrap()
            },
            Language::Regex => || {
                HighlightConfiguration::new(
                    tree_sitter_regex::LANGUAGE.into(),
                    Language::Regex.name(),
                    tree_sitter_regex::HIGHLIGHTS_QUERY,
                    "",
                    "",
                )
                .unwrap()
            },
            Language::HTML => || {
                const HTML_HIGHLIGHT: &str =
                    include_str!("../extensions/html_highlight.scm");
                const HTML_INJECTION: &str =
                    include_str!("../extensions/html_injections.scm");
                HighlightConfiguration::new(
                    tree_sitter_html::LANGUAGE.into(),
                    Language::HTML.name(),
                    HTML_HIGHLIGHT,
                    HTML_INJECTION,
                    ""
                )
                .unwrap()
            }
        }
    }

    fn injections(&self) -> &'static [Self] {
        match self {
            Language::JS => &[Language::Regex],
            Language::TS => &[Language::Regex],
            Language::CSS => &[],
            Language::Rust => &[],
            Language::Regex => &[],
            Language::HTML => &[Language::JS, Language::CSS],
        }
    }

    fn name(&self) -> &'static str {
        match self {
            Language::JS => "javascript",
            Language::TS => "typescript",
            Language::CSS => "css",
            Language::Rust => "rust",
            Language::Regex => "regex",
            Language::HTML => "html",
        }
    }
}

impl TryFrom<&str> for Language {
    type Error = HighlightError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value.as_ref() {
            "js" | "javascript" => Ok(Language::JS),
            "ts" | "typescript" => Ok(Language::TS),
            "css" => Ok(Language::CSS),
            "rust" => Ok(Language::Rust),
            "regex" => Ok(Language::Regex),
            "html" => Ok(Language::HTML),
            _ => Err(HighlightError::UnknownLanguage(value.to_string())),
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum HighlightError {
    #[error("unknown language: {0}")]
    UnknownLanguage(String),
}

impl Into<napi::Error> for HighlightError {
    fn into(self) -> napi::Error {
        match self {
            HighlightError::UnknownLanguage(_) => {
                napi::Error::new(napi::Status::InvalidArg, self.to_string())
            }
        }
    }
}

#[napi(object)]
pub struct HastProperties {
    pub class_name: String,
}

#[napi(object)]
pub struct HastNode {
    #[napi(js_name = "type")]
    pub kind: String,
    pub tag_name: String,
    pub properties: HastProperties,
    pub children: Vec<Either<HastNode, HastTextNode>>,
}

#[napi(object)]
pub struct HastTextNode {
    #[napi(js_name = "type")]
    pub kind: String,
    pub value: String,
}

#[napi(js_name = "Highlighter")]
pub struct JsHighlighter {
    #[napi(readonly)]
    pub highlight_names: Vec<String>,
    configurations: HashMap<Language, HighlightConfiguration>,
    class_names: Vec<String>,
}

#[napi]
impl JsHighlighter {
    #[napi(constructor)]
    pub fn new(highlight_names: Option<Vec<String>>) -> Self {
        let highlight_names = highlight_names.unwrap_or_else(|| {
            STANDARD_HIGHLIGHTS
                .iter()
                .map(|it| it.to_string())
                .collect()
        });

        let mut configurations = HashMap::new();
        for lang in Language::ALL {
            let init = lang.highlight_init();
            let mut it = init();
            it.configure(&highlight_names);
            configurations.insert(*lang, it);
        }

        let class_names = highlight_names
            .iter()
            .map(|s| s.replace('.', " "))
            .collect();

        Self {
            highlight_names,
            configurations,
            class_names,
        }
    }

    #[inline]
    fn highlight_config(&self, language: Language) -> &HighlightConfiguration {
        self.configurations
            .get(&language)
            .expect("language not configured")
    }

    #[inline]
    fn injection_highlights(
        &self,
        language: Language,
        for_language: &str,
    ) -> Option<&HighlightConfiguration> {
        language
            .injections()
            .iter()
            .find(|it| it.name() == for_language)
            .map(|it| self.highlight_config(*it))
    }

    #[napi]
    pub fn supported_languages(&self) -> Vec<String> {
        Language::ALL.iter().map(|it| it.name().into()).collect()
    }

    #[napi]
    pub fn is_supported(&self, language: String) -> bool {
        Language::try_from(language.as_str()).is_ok()
    }

    #[napi]
    pub fn highlight(&self, code: String, language: String) -> napi::Result<HastNode> {
        let language = Language::try_from(language.as_str()).map_err(Into::<napi::Error>::into)?;

        let mut highlighter = Highlighter::new();
        let config = self.highlight_config(language);
        let highlights = highlighter
            .highlight(config, code.as_bytes(), None, |other| {
                self.injection_highlights(language, other)
            })
            .unwrap();

        let mut stack = Vec::new();
        stack.push(HastNode {
            kind: "element".into(),
            tag_name: "span".into(),
            properties: HastProperties {
                class_name: "source".into(),
            },
            children: Vec::new(),
        });

        for event in highlights {
            match event.unwrap() {
                HighlightEvent::HighlightStart(highlight) => {
                    let node = HastNode {
                        kind: "element".into(),
                        tag_name: "span".into(),
                        properties: HastProperties {
                            class_name: self.class_names[highlight.0].clone(),
                        },
                        children: Vec::new(),
                    };
                    stack.push(node);
                }
                HighlightEvent::Source { start, end } => {
                    let slice = &code[start..end];
                    let parent = stack.last_mut().unwrap();
                    if let Some(Either::B(text_node)) = parent.children.last_mut() {
                        text_node.value.push_str(slice);
                    } else {
                        let text_node = HastTextNode {
                            kind: "text".into(),
                            value: slice.into(),
                        };
                        parent.children.push(Either::B(text_node));
                    }
                }
                HighlightEvent::HighlightEnd => {
                    let node = stack.pop().unwrap();
                    let parent = stack.last_mut().unwrap();
                    parent.children.push(Either::A(node));
                }
            }
        }

        Ok(stack.pop().unwrap())
    }
}
