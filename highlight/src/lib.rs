use error::{ConstructorError, HighlightError};
use hast::{HastElement, HastNode, HastProperties};
use language::{ClassList, RepoInfo, TreeSitterEntry};
use libloading::Library;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use tree_sitter_highlight::HighlightConfiguration;
use std::{
    collections::{HashMap, HashSet},
    env::Args,
    path::PathBuf,
    rc::Rc,
    sync::Arc,
};

#[cfg(feature = "napi")]
use napi_derive::napi;

use crate::{
    language::{clone_repo, standard_repos},
    util::Intersect,
};

mod error;
mod format;
mod hast;
mod language;
mod util;

#[derive(rust_embed::RustEmbed)]
#[folder = "src/queries/"]
struct StaticQueries;

/*

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Language {
    JS,
    TS,
    CSS,
    Rust,
    Regex,
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
    ];

    fn highlight_init(&self) -> fn() -> HighlightConfiguration {
        match self {
            Language::JS => || {
                HighlightConfiguration::new(
                    tree_sitter_javascript::language(),
                    tree_sitter_javascript::HIGHLIGHT_QUERY,
                    tree_sitter_javascript::INJECTION_QUERY,
                    tree_sitter_javascript::LOCALS_QUERY,
                )
                .unwrap()
            },
            Language::TS => || {
                let highlights = query_union![
                    tree_sitter_typescript::HIGHLIGHT_QUERY,
                    tree_sitter_javascript::HIGHLIGHT_QUERY
                ];

                let locals = query_union![
                    tree_sitter_typescript::LOCALS_QUERY,
                    tree_sitter_javascript::LOCALS_QUERY
                ];

                HighlightConfiguration::new(
                    tree_sitter_typescript::language_typescript(),
                    &highlights,
                    tree_sitter_javascript::INJECTION_QUERY,
                    &locals,
                )
                .unwrap()
            },
            Language::CSS => || {
                HighlightConfiguration::new(
                    tree_sitter_css::language(),
                    tree_sitter_css::HIGHLIGHTS_QUERY,
                    "",
                    "",
                )
                .unwrap()
            },
            Language::Rust => || {
                const RUST_HIGHLIGHT: &'static str =
                    include_str!("../extensions/rust_highlight.scm");
                HighlightConfiguration::new(
                    tree_sitter_rust::language(),
                    RUST_HIGHLIGHT,
                    tree_sitter_rust::INJECTIONS_QUERY,
                    "",
                )
                .unwrap()
            },
            Language::Regex => || {
                HighlightConfiguration::new(
                    tree_sitter_regex::language(),
                    tree_sitter_regex::HIGHLIGHTS_QUERY,
                    "",
                    "",
                )
                .unwrap()
            },
        }
    }

    fn injections(&self) -> &'static [Self] {
        match self {
            Language::JS => &[Language::Regex],
            Language::TS => &[Language::Regex],
            Language::CSS => &[],
            Language::Rust => &[],
            Language::Regex => &[],
        }
    }

    fn name(&self) -> &'static str {
        match self {
            Language::JS => "javascript",
            Language::TS => "typescript",
            Language::CSS => "css",
            Language::Rust => "rust",
            Language::Regex => "regex",
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
            _ => Err(HighlightError::UnknownLanguage(value.to_string())),
        }
    }
}
*/

fn default_clone_path() -> PathBuf {
    PathBuf::from("./repos/")
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HighlightOptions {
    pub languages: Vec<String>,
    #[serde(default)]
    pub sources: Vec<RepoInfo>,
    #[serde(default)]
    pub classes: ClassList,

    #[serde(default = "default_clone_path")]
    pub clone_path: PathBuf,
}

impl Default for HighlightOptions {
    fn default() -> Self {
        Self {
            languages: Default::default(),
            sources: Default::default(),
            classes: Default::default(),
            clone_path: default_clone_path(),
        }
    }
}

#[cfg_attr(feature = "napi", napi(js_name = "Highlighter"))]
pub struct HighlightManager {
    /// Source repositories
    sources: Vec<RepoInfo>,

    /// Loaded parser objects
    parsers: HashMap<PathBuf, Arc<Library>>,

    configurations: HashMap<String, Arc<HighlightConfiguration>>,
}

#[cfg_attr(feature = "napi", napi)]
impl HighlightManager {
    pub fn new(mut options: HighlightOptions) -> Result<Self, ConstructorError> {
        let mut sources = Vec::with_capacity(options.sources.len());

        // Assume these will be needed
        sources.extend(options.sources);

        for std_repo in standard_repos() {
            if sources
                .iter_mut()
                .any(|source| source.repo == std_repo.repo)
            {
                // skip manually specified sources completely
                continue;
            }

            let mut i = 0;
            loop {
                if i >= options.languages.len() {
                    break;
                }

                let req = &options.languages[i];

                if std_repo
                    .entries
                    .iter()
                    .any(|entry| entry.match_block.contains(&req.to_lowercase()))
                {
                    sources.push(std_repo);
                    options.languages.swap_remove(i);
                    break;
                }

                i += 1;
            }
            if options.languages.is_empty() {
                break;
            }
        }

        // prepare requested parsers
        let mut configurations = HashMap::new();

        std::fs::create_dir_all(&options.clone_path)?;
        for mut remote in sources.into_iter() {
            let RepoInfo {
                repo,
                branch,
                entries,
                local_path,
                ..
            } = &mut remote;

            for entry in entries.into_iter() {
                if !entry.match_block.has_intersection(&options.languages) {
                    continue;
                }

                let requirements = entry.requirements();

                let language_name = entry.match_block.first().unwrap().clone();

                let remote_path =
                    clone_repo(repo, branch, &options.clone_path).map_err(|inner| {
                        ConstructorError::NotCloned {
                            language: language_name.clone(),
                            inner: inner.clone(),
                        }
                    })?;
                *local_path = Some(remote_path.clone());

                let parser_path =
                    entry
                        .build(remote_path)
                        .map_err(|inner| ConstructorError::NotBuilt {
                            language: language_name,
                            inner,
                        })?;

                let config = entry.configure(entry, local_path, &options.classes);
                let config = Arc::new(config);

                for name in &entry.match_block {
                    configurations.insert(name.clone(), config.clone());
                }
            }
        }

        Ok(HighlightManager {
            sources,
            parsers,
            configurations,
        })
    }

    #[cfg(feature = "napi")]
    #[napi(constructor)]
    pub fn constructor(options: serde_json::Value) -> napi::Result<Self> {
        let options = serde_json::from_value(options).expect("invalid options");
        Self::new(options).map_err(Into::<napi::Error>::into)
    }

    #[inline]
    fn highlight_config(&self, language: impl AsRef<str>) -> Option<&HighlightConfiguration> {
        self.configurations
            .get(language.as_ref())
            .map(|it| it.as_ref())
    }

    /*
    #[cfg(feature = "napi")]
    #[napi]
    pub fn supported_languages(&self) -> Vec<String> {
        Language::ALL.iter().map(|it| it.name().into()).collect()
    }

    #[cfg(feature = "napi")]
    #[napi]
    pub fn is_supported(&self, language: String) -> bool {
        Language::try_from(language.as_str()).is_ok()
    }

    pub fn highlight(&self, code: String, language: String) -> Result<HastNode, HighlightError> {
        let lang = Language::try_from(language.as_str())?;

        let mut highlighter = Highlighter::new();
        let config = self.highlight_config(lang);
        let highlights = highlighter
            .highlight(config, code.as_bytes(), None, |other| {
                self.injection_highlights(lang, other)
            })
            .unwrap();

        let mut stack = Vec::new();
        stack.push(HastNode::Element(HastElement {
            tag_name: "span".into(),
            properties: HastProperties {
                class_name: "source".into(),
            },
            children: Vec::new(),
        }));

        for event in highlights {
            let event = match event {
                Ok(ev) => ev,
                Err(err) => {
                    return Err(match err {
                        tree_sitter_highlight::Error::Cancelled => unreachable!("cancelled"),
                        tree_sitter_highlight::Error::InvalidLanguage => {
                            HighlightError::UnknownLanguage(language)
                        }
                        tree_sitter_highlight::Error::Unknown => HighlightError::Unknown,
                    })
                }
            };

            match event {
                HighlightEvent::HighlightStart(highlight) => {
                    let node = HastNode::Element(HastElement {
                        tag_name: "span".into(),
                        properties: HastProperties {
                            class_name: self.class_names[highlight.0].clone(),
                        },
                        children: Vec::new(),
                    });
                    stack.push(node);
                }
                HighlightEvent::Source { start, end } => {
                    let slice = &code[start..end];
                    let parent = stack.last_mut().unwrap();
                    match parent {
                        HastNode::Element(element) => {
                            element.children.push(HastNode::text(slice.into()));
                        }
                        HastNode::Text(text) => {
                            text.value.push_str(slice);
                        }
                    }
                }
                HighlightEvent::HighlightEnd => {
                    let node = stack.pop().unwrap();
                    if let Some(HastNode::Element(element)) = stack.last_mut() {
                        element.children.push(node);
                    } else {
                        // at least top level "source" should be present
                        unreachable!("stack should not be empty")
                    }
                }
            }
        }

        Ok(stack.pop().unwrap())
    }

    #[cfg(feature = "napi")]
    #[napi(js_name = "highlight")]
    pub fn highlight_napi(
        &self,
        code: String,
        language: String,
    ) -> napi::Result<serde_json::Value> {
        match self.highlight(code, language) {
            Ok(value) => {
                napi::Result::Ok(serde_json::to_value(value).expect("unable to serialize HastNode"))
            }
            Err(err) => napi::Result::Err(err.into()),
        }
    } */
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_name() {
        let options = HighlightOptions {
            languages: vec!["rust".to_string()],
            ..Default::default()
        };
        let manager = HighlightManager::new(options);
    }
}
