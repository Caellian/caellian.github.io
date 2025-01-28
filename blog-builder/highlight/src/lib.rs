use hast::{visit::*, Element, ElementChild, Node, Text};

use napi_derive::napi;

mod language;
use language::*;
use std::hash::Hasher;

mod annotation;
mod frame;
mod hast;

#[napi(object)]
#[derive(Default)]
pub struct Options {
    pub language: Option<LanguageOptions>,
}

#[napi]
pub struct Highlighter {
    languages: Languages,
}

#[napi]
impl Highlighter {
    #[napi(constructor)]
    pub fn new(options: Option<Options>) -> Self {
        let options = options.unwrap_or_default();

        let languages = Languages::load(options.language.unwrap_or_default());

        Self { languages }
    }

    #[napi(ts_return_type = "Language[]")]
    pub fn enabled_languages(&self) -> &[Language] {
        self.languages.enabled()
    }

    #[napi]
    pub fn is_language_enabled(
        &self,
        #[napi(ts_arg_type = "Language | string")] language: String,
    ) -> bool {
        let language = match Language::for_block(language) {
            Some(it) => it,
            None => return false,
        };
        self.languages.enabled().contains(&language)
    }

    /// Returns a `hast` `<span>` element.
    ///
    /// `code` is expected to be a raw souce code string. Special characters
    /// ('<', ...) and control characters (`\n`, `\t`, ...) must not be
    /// escaped ('&#x3C;', '\\n', '\\t', ...).
    #[napi(ts_return_type = "import(\"hast\").Element | null")]
    pub fn highlight(
        &self,
        code: String,
        block_language: String,
    ) -> napi::Result<Option<Element<CodeBlockData>>> {
        let language = match Language::for_block(&block_language) {
            Some(it) => it,
            None => return Ok(None),
        };

        let highlights = self.languages.highlight(language, &code).unwrap();
        let mut queue = vec![Node::from(Element::new("pre").with_classes([
            "source".to_string(),
            format!("language-{}", block_language),
        ]))];

        for event in highlights {
            match event.unwrap() {
                HighlightEvent::HighlightStart { captures: tags } => {
                    let node = Node::from(Element::new("span").with_classes(tags));
                    queue.push(node);
                }
                HighlightEvent::Source { content, .. } => {
                    let last = queue.last_mut().unwrap();
                    match last {
                        Node::Element(parent) => {
                            parent.push_child(Text::new(content));
                        }
                        Node::Text(text) => {
                            text.push_str(content);
                        }
                        Node::None => unreachable!(
                            "can't append source to last queue element; queue is empty"
                        ),
                    }
                }
                HighlightEvent::HighlightEnd => {
                    let content = queue.pop().unwrap();
                    let content = match content {
                        Node::Element(mut last_element) => {
                            annotation::handle_annotation_comments(&mut last_element, language);
                            ElementChild::Element(last_element)
                        }
                        Node::Text(it) => ElementChild::Text(it),
                        _ => unreachable!("content neither text nor element"),
                    };

                    let last_element = match queue.last_mut() {
                        Some(Node::Element(element)) => element,
                        other => unreachable!(
                            "highlight produced non-element node with children: {:?}",
                            other.map(|it| it.kind())
                        ),
                    };
                    last_element.push_child(content);
                }
            }
        }

        let mut result = queue.pop().unwrap();
        visit_mut(&mut result, |access: MutVisitAccess<'_, CodeBlockData>| {
            match access.prev_sibling() {
                Some(Node::Element(element)) if element.tag() == "annotation" => {}
                _ => return (Continue, NoMutation),
            };

            match access.item() {
                Node::Text(text) if text.as_str() == "\n" => return (Continue, Drop),
                _ => {}
            }

            (Skip, NoMutation)
        });

        let mut result = result.into_element().ok().unwrap();
        let has_heading_annotation = match result.children().first() {
            Some(ElementChild::Element(element)) => element.tag() == "annotation",
            _ => false,
        };
        if has_heading_annotation {
            let annotation = result.children_mut().remove(0).into_element().unwrap();
            let annotation = annotation.properties();
            let data = annotation::properties_to_data(annotation);
            result.extend_data(data)
        }
        result.set_data(CodeBlockData::LineCount(
            result.text_content().unwrap().lines().count(),
        ));

        visit_mut(
            &mut result,
            |mut access: MutVisitAccess<'_, CodeBlockData>| {
                let annotation = match access.prev_sibling_mut() {
                    Some(node) => {
                        if let Node::Element(element) = node {
                            if element.tag() == "annotation" {
                                unsafe { std::mem::take(node).into_element().unwrap_unchecked() }
                            } else {
                                return (Continue, NoMutation);
                            }
                        } else {
                            return (Continue, NoMutation);
                        }
                    }
                    _ => return (Continue, NoMutation),
                };

                (Skip, NoMutation)
            },
        );
        Ok(Some(result))
    }
}

hast::data::hast_data!(pub CodeBlockData {
    LineCount(count: usize) => |env| {
        env.create_uint32(count as u32)
    },
    HideHeading(value: bool) => |env| {
        env.get_boolean(value)
    },
    ShowCopy(value: bool) => |env| {
        env.get_boolean(value)
    },
    FileName(value: bool) => |env| {
        env.get_boolean(value)
    },
    VariableName(value: bool) => |env| {
        env.get_boolean(value)
    },
});

pub(crate) fn hash<T: std::hash::Hash>(value: &T) -> u64 {
    let mut hasher = ahash::AHasher::default();
    value.hash(&mut hasher);
    hasher.finish()
}

/*

function processHeadingAnnotations(block, options) {
  filterOutHandled(block.annotations, (it) => {
    let storeDynamic = takeTag(it, "store-dynamic");
    if (storeDynamic === true) {
      options.storeDynamic = true;
    }

    let file = takeTag(it, "file");
    if (typeof file === "string") {
      options.file = file;
    }

    let name = takeTag(it, "name");
    if (typeof name === "string") {
      options.name = name;
    }

    return it.value.trim().length == 0;
  });
}

function processNumberAnnotations(block, options) {
  filterOutHandled(block.annotations, (it) => {
    let collapse = takeTag(it, "collapse-lines");
    if (collapse === true) {
      options.collapse = true;
    }

    let hide = takeTag(it, "hide-lines");
    if (hide === true) {
      options.hide = true;
    }

    let start = takeTag(it, "line-start");
    if (typeof start === "number") {
      options.start = start;
    }

    return it.value.trim().length == 0;
  });
}
  */
