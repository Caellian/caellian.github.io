use crate::{
    hast::{Data, Element, Properties, PropertyValue},
    Language,
};
use napi::{bindgen_prelude::ToNapiValue, Env, NapiRaw, Status};
use std::{collections::HashMap, str::FromStr};

pub static MARKER: &str = "#!";
pub static TAG: &str = "annotation";

#[derive(Debug, Clone, PartialEq)]
pub enum AnnotationValue {
    Bool(bool),
    Number(f64),
    String(String),
}
impl FromStr for AnnotationValue {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "false" => return Ok(AnnotationValue::Bool(false)),
            "true" => return Ok(AnnotationValue::Bool(true)),
            "" => return Ok(AnnotationValue::Bool(true)),
            _ => {}
        }

        if let Ok(number) = s.parse::<usize>() {
            return Ok(AnnotationValue::Number(number as f64));
        } else if let Ok(number) = s.parse::<f64>() {
            return Ok(AnnotationValue::Number(number));
        }

        Ok(AnnotationValue::String(s.to_string()))
    }
}
impl From<AnnotationValue> for PropertyValue {
    fn from(value: AnnotationValue) -> Self {
        match value {
            AnnotationValue::Bool(value) => PropertyValue::Boolean(value),
            AnnotationValue::Number(value) => PropertyValue::Number(value),
            AnnotationValue::String(value) => PropertyValue::String(value),
        }
    }
}
impl ToNapiValue for AnnotationValue {
    unsafe fn to_napi_value(
        env: napi::sys::napi_env,
        this: Self,
    ) -> napi::Result<napi::sys::napi_value> {
        let env = Env::from_raw(env);
        Ok(match this {
            AnnotationValue::Bool(boolean) => env.get_boolean(boolean)?.raw(),
            AnnotationValue::Number(value) => env.create_double(value)?.raw(),
            AnnotationValue::String(string) => env.create_string_from_std(string)?.raw(),
        })
    }
}

fn normalize_annotation_name(name: &str) -> Result<String, Error> {
    if name.is_empty() {
        return Err(Error::MissingName(String::new()));
    }
    if name
        .chars()
        .next()
        .map(|it| it.is_numeric())
        .unwrap_or(false)
    {
        return Err(Error::LeadingDigit(name.to_string()));
    }
    let result = name.replace("_", "-").replace(" ", "-");
    if result
        .chars()
        .any(|it| !(it.is_ascii_alphanumeric() || it == '-'))
    {
        return Err(Error::InvalidName(name.to_string()));
    }
    Ok(result)
}

fn parse_annotation_seq<'a>(
    pos: &'a str,
    annotations: &mut HashMap<String, AnnotationValue>,
) -> Result<&'a str, Error> {
    let mut pos = pos.trim_start();
    if pos.is_empty() {
        return Ok(pos);
    }
    let name: String = pos
        .chars()
        .take_while(|it| *it != ' ' && *it != ':')
        .collect();
    let name_normalized = normalize_annotation_name(&name)?;
    pos = pos.split_at(name.len()).1;
    if pos.is_empty() {
        annotations.insert(name_normalized, AnnotationValue::Bool(true));
        return Ok(pos);
    }
    // must be next because name was created with take_while
    pos = pos.split_at(':'.len_utf8()).1;
    let mut delimiter = None;
    if pos.starts_with('"') {
        delimiter = Some('"');
        pos = pos.split_at('"'.len_utf8()).1;
    } else if pos.starts_with('\'') {
        delimiter = Some('\'');
        pos = pos.split_at('\''.len_utf8()).1;
    }
    let content: String = match delimiter {
        Some(delimited) => {
            let mut length = 0;
            let mut escaped = false;
            for (i, ch) in pos.char_indices() {
                if ch == delimited {
                    if escaped {
                        escaped = false;
                    } else {
                        length = i;
                        break;
                    }
                } else if ch == '\\' {
                    escaped = true;
                } else if escaped {
                    // some other escaped character (e.g. \n)
                    escaped = false;
                }
            }
            pos[0..length].to_string()
        }
        None => pos.chars().take_while(|it| !it.is_whitespace()).collect(),
    };
    pos = pos.split_at(content.len()).1;
    if let Some(delimiter) = delimiter {
        pos = pos.split_at(delimiter.len_utf8()).1;
    }

    let value = AnnotationValue::from_str(&content)?;
    annotations.insert(name_normalized, value);

    Ok(pos)
}

pub fn transform_annotation<D: Data>(node: &mut Element<D>, text: &str) -> Result<(), Error> {
    let text = text.strip_prefix(MARKER).unwrap();
    let text = text.split_once("\n").map(|it| it.0).unwrap_or(text);
    let mut text = text.trim();

    let mut extracted = HashMap::new();
    while !text.is_empty() {
        text = parse_annotation_seq(text, &mut extracted)?;
    }
    // parsed correctly

    *node = Element::new(TAG).with_properties(extracted);

    Ok(())
}

fn detect_and_clean_block_comment(text: &str, language: Language) -> Option<String> {
    let (prefix, line_decoration, suffix) = language.block_comment_parts()?;
    if !text.starts_with(prefix) || !text.ends_with(suffix) {
        return None;
    }
    let text =
        text[prefix.as_bytes().len()..text.as_bytes().len() - suffix.as_bytes().len()].trim();

    if let Some(line_decoration) = line_decoration {
        if let Some((first_line, rest)) = text.split_once("\n") {
            let mut result = String::with_capacity(text.len());
            result.push_str(first_line.trim_end());
            for line in rest.split("\n") {
                result.push('\n');
                let line = line.trim();
                if let Some(line) = line.strip_prefix(line_decoration) {
                    result.push_str(line);
                } else {
                    result.push_str(line);
                }
            }
            return Some(result);
        }
    }

    Some(text.to_string())
}

fn comment_content<D: Data>(element: &Element<D>, language: Language) -> Option<String> {
    if element.tag() != "span" || !element.has_class("comment") {
        return None;
    }
    let text = element.text_content().unwrap();
    let text = text.trim();
    if let Some(multiline) = detect_and_clean_block_comment(text, language) {
        return Some(multiline);
    }
    if let Some(prefix) = language.line_comment_prefix() {
        if text.starts_with(prefix) {
            return Some(text.split_at(prefix.as_bytes().len()).1.trim().to_string());
        }
    }

    Some(text.to_string())
}

pub fn handle_annotation_comments<D: Data>(last_element: &mut Element<D>, language: Language) {
    let comment = match comment_content(last_element, language) {
        Some(it) => it,
        None => return,
    };
    if comment.starts_with(MARKER) {
        transform_annotation(last_element, &comment).unwrap();
    }
}

macro_rules! store_annotation_properties {
    ($($property: literal => ),* $(,)?) => {
        
    };
}

pub fn properties_to_data<D: Data>(properties: &Properties) -> Vec<D> {
    let mut result = Vec::with_capacity(properties.len());
    for (key, property) in properties.iter() {
        todo!()
    }
    result
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("invalid attribute value: '{0}'")]
    InvalidValue(String),
    #[error("annotation name can't start with a digit: '{0}'")]
    LeadingDigit(String),
    #[error("invalid annotation name: '{0}'")]
    InvalidName(String),
    #[error("missing annotation name: '{0}'")]
    MissingName(String),
    #[error("annotation '{0}' value quote wasn't closed properly")]
    UnclosedQuote(String),
}

impl From<Error> for napi::Error {
    fn from(value: Error) -> Self {
        napi::Error::new(Status::InvalidArg, value.to_string())
    }
}
