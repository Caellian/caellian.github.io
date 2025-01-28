#![allow(unused)]

use napi::{
    bindgen_prelude::{FromNapiValue, ToNapiValue},
    Env, JsUnknown, NapiRaw, NapiValue,
};
use napi_derive::napi;
use std::{cell::UnsafeCell, collections::HashMap};
use tree_sitter_highlight::{
    HighlightConfiguration, HighlightEvent as TSHighlightEvent, Highlighter,
};

include!(concat!(env!("OUT_DIR"), "/language.rs"));

impl FromNapiValue for Language {
    unsafe fn from_napi_value(
        env: napi_sys::napi_env,
        value: napi_sys::napi_value,
    ) -> napi::Result<Self> {
        let value = JsUnknown::from_raw(env, value)?;
        let value = value.coerce_to_string()?;
        let value = value.into_utf8()?;
        let value = value.as_str()?;
        for language in Language::ALL {
            if value == language.name() {
                return Ok(*language);
            }
        }
        Err(napi::Error::new(
            napi::Status::InvalidArg,
            format!("language '{value}' not supported"),
        ))
    }
}
impl ToNapiValue for Language {
    unsafe fn to_napi_value(
        env: napi_sys::napi_env,
        this: Self,
    ) -> napi::Result<napi_sys::napi_value> {
        let env = Env::from_raw(env);
        env.create_string(this.name()).map(|it| it.raw())
    }
}

#[napi(object)]
#[derive(Default)]
pub struct LanguageOptions {
    /// Replaces default captures with custom ones.
    pub captures: Option<Vec<String>>,
    /// Extends default captures with additional ones.
    pub extra_captures: Option<Vec<String>>,
    pub enabled: Option<Vec<Language>>,
}

pub struct Languages {
    enabled: Vec<Language>,
    highlights: Vec<String>,
    configurations: HashMap<Language, &'static HighlightConfiguration>,
    class_names: Vec<Vec<String>>,
    highlighter: UnsafeCell<*mut Highlighter>,
}

impl Languages {
    pub fn load(mut options: LanguageOptions) -> Self {
        let mut highlights = options.captures.unwrap_or_else(default_highlights);
        if let Some(extra) = &mut options.extra_captures {
            highlights.append(extra);
        }

        let enabled: Vec<Language> = options
            .enabled
            .unwrap_or_else(|| Language::ALL.to_vec());

        let mut configurations: HashMap<_, &'static HighlightConfiguration> = HashMap::new();
        for lang in &enabled {
            let init = lang.highlight_init();
            let mut it = init();
            it.configure(&highlights);
            configurations.insert(*lang, Box::leak(Box::new(it)));
        }

        let class_names = highlights
            .iter()
            .map(|s| s.split('.').map(|it| it.to_string()).collect())
            .collect();

        Self {
            enabled,
            highlights,
            configurations,
            class_names,
            highlighter: UnsafeCell::new(Box::leak(Box::new(Highlighter::new()))),
        }
    }

    pub fn enabled(&self) -> &[Language] {
        &self.enabled
    }

    pub fn highlight<'c>(&'c self, language: Language, source: &'c str) -> Option<HighlightEvents> {
        let config: &'static HighlightConfiguration = match self.configurations.get(&language) {
            Some(it) => it,
            None => return None,
        };
        let injection_highlights: HashMap<&'static str, &'static HighlightConfiguration> = language
            .injections()
            .iter()
            .map(|it| (it.name(), *self.configurations.get(it).unwrap()))
            .collect();

        let (revert_pos, highlighter_location, highlighter) = unsafe {
            let value = *self.highlighter.get();
            if value.is_null() {
                // TODO: Store multiple highlighters in queue.
                // Not that important as this crate is currently only used from Node which is single-threaded.
                todo!("highlighter in use");
            }
            let revert_pos = self.highlighter.get();
            std::ptr::write(revert_pos, std::ptr::null_mut());
            (revert_pos, value, value.as_mut().unwrap_unchecked())
        };

        let highlights = highlighter
            .highlight(config, source.as_bytes(), None, move |other| {
                injection_highlights.get(other).copied()
            })
            .unwrap();

        Some(HighlightEvents {
            source,
            revert_pos,
            highlighter_location,
            producer: Box::leak(Box::new(highlights)),
            captures: &self.class_names,
        })
    }
}

pub type Error = tree_sitter_highlight::Error;
pub struct HighlightEvents<'c> {
    source: &'c str,
    captures: &'c [Vec<String>],
    revert_pos: *mut *mut Highlighter,
    highlighter_location: *mut Highlighter,
    producer: &'c mut dyn Iterator<Item = Result<TSHighlightEvent, Error>>,
}
impl<'c> HighlightEvents<'c> {
    fn map_event(&self, event: TSHighlightEvent) -> HighlightEvent<'c> {
        match event {
            TSHighlightEvent::Source { start, end } => HighlightEvent::Source {
                content: &self.source[start..end],
                start,
                end,
            },
            TSHighlightEvent::HighlightStart(i) => HighlightEvent::HighlightStart {
                captures: &self.captures[i.0],
            },
            TSHighlightEvent::HighlightEnd => HighlightEvent::HighlightEnd,
        }
    }
}
impl<'c> Iterator for HighlightEvents<'c> {
    type Item = Result<HighlightEvent<'c>, Error>;
    fn next(&mut self) -> Option<Self::Item> {
        let event = self.producer.next()?;
        let event = match event {
            Ok(it) => it,
            Err(err) => return Some(Err(err)),
        };
        return Some(Ok(self.map_event(event)));
    }
}
impl<'c> Drop for HighlightEvents<'c> {
    fn drop(&mut self) {
        unsafe {
            std::ptr::write(self.revert_pos, self.highlighter_location);
        }
    }
}

pub enum HighlightEvent<'c> {
    Source {
        content: &'c str,
        start: usize,
        end: usize,
    },
    HighlightStart {
        captures: &'c [String],
    },
    HighlightEnd,
}
