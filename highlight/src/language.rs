use std::{
    collections::{HashMap, HashSet},
    path::{Path, PathBuf},
    str::FromStr,
    sync::Arc,
    vec,
};

use libloading::Library;
use reqwest::Url;
use serde::Deserialize;
use serde_with::{formats::PreferMany, serde_as, OneOrMany};
use tree_sitter::Language;
use tree_sitter_highlight::HighlightConfiguration;

use crate::{
    error::{ConstructorError, EnvironmentError, InvalidResourcePath},
    util::{self, system_commands},
};

const LANGUAGE_PATH: &str = "./languages/";
const PARSER_NAME: &str = "parser.so";

const STANDARD_HIGHLIGHTS: &[&str] = &[
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

#[derive(Debug, Clone, PartialEq)]
pub enum RepoURL {
    Resolved(String),
    Id(String),
}

impl FromStr for RepoURL {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if s.ends_with(".git") {
            Ok(Self::Resolved(s.to_string()))
        } else if s.chars().all(|it| it.is_alphanumeric() || ['_', '-'].contains(&it)) {
            Ok(Self::Id(s.to_string()))
        } else {
            Err(())
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum RemoteResource {
    Repo { url: RepoURL, path: PathBuf },
    // HTTP {
    //     https: bool,
    //     host: String,
    //     path: PathBuf,
    // },
    // FTP {
    //     user: Option<String>,
    //     password: Option<String>,
    //     server: String,
    //     path: PathBuf,
    // },
}

#[derive(Debug, Clone, PartialEq)]
pub enum ResourcePath {
    Remote(RemoteResource),
    Local(PathBuf),
}

impl FromStr for ResourcePath {
    type Err = InvalidResourcePath;

    fn from_str(path: &str) -> Result<Self, Self::Err> {
        let mut split = path.split(":");
        let namespace = match split.next() {
            Some(ns) => ns,
            None => return Err(InvalidResourcePath(path.to_string())),
        };
        let (namespace, name) = match split.next() {
            Some(name) => (namespace, name),
            None => return Ok(ResourcePath::Local(PathBuf::from(namespace))),
        };

        match namespace {
            "http" | "https" => todo!("http resources not implemented"),
            "ftp" => todo!("ftp resources not implemented"),
            other => {
                unimplemented!("FIXME dunno what to do here anymore")
            }
        }
    }
}

#[serde_as]
#[derive(Default, Deserialize)]
#[serde(default)]
pub struct TreeSitterEntry {
    /// List of codeblock language names to match by this entry
    #[serde_as(deserialize_as = "OneOrMany<_, PreferMany>")]
    pub match_block: Vec<String>,

    /// Optional path to the subproject directory if source contains multiple
    /// parsers
    pub path: Option<PathBuf>,

    /// Highlight scheme files
    #[serde_as(deserialize_as = "OneOrMany<_, PreferMany>")]
    pub highlights: Vec<String>,
    /// Locals scheme files
    #[serde_as(deserialize_as = "OneOrMany<_, PreferMany>")]
    pub locals: Vec<String>,
    /// Injection scheme files
    #[serde_as(deserialize_as = "OneOrMany<_, PreferMany>")]
    pub injections: Vec<String>,

    /// Matches for injection callback
    #[serde_as(deserialize_as = "OneOrMany<_, PreferMany>")]
    pub injection_keys: Vec<String>,

    #[serde(skip)]
    pub parser: Option<Arc<Library>>,

    pub init_function: String,

    #[serde(skip)]
    pub configuration: Option<Arc<HighlightConfiguration>>,
}

impl TreeSitterEntry {
    pub fn requirements(&self) -> HashSet<String> {
        let mut result = collect_requirements(&self.highlights);
        result.extend(collect_requirements(&self.locals));
        result.extend(collect_requirements(&self.injections));
        result
    }

    pub fn build(
        &mut self,
        local_path: impl AsRef<Path>,
    ) -> Result<Arc<Library>, EnvironmentError> {
        // TODO: multiple entries can use the same parser

        let entry_path = match &self.path {
            Some(it) => local_path.as_ref().join(it),
            None => local_path.as_ref().to_path_buf(),
        };

        util::run_command(
            util::with_cwd(system_commands::tree_sitter_cli, &entry_path),
            &["generate", "-b"],
        )?;

        util::run_command(
            util::with_cwd(system_commands::compiler, &entry_path),
            &["-shared", "-Os", "-o", PARSER_NAME, "-I./src", "src/**/*.c"],
        )?;

        let parser_path = entry_path.join(PARSER_NAME);
        let parser_path = std::fs::canonicalize(parser_path)
            .map_err(|_| EnvironmentError::NotBuilt { path: entry_path })?;

        let loaded = unsafe {
            Library::new(&parser_path).map_err(|_| EnvironmentError::InvalidParser {
                path: parser_path.clone(),
            })?
        };
        let loaded = Arc::new(loaded);
        self.parser = Some(loaded.clone());
        Ok(loaded)
    }

    pub fn configure(
        &mut self,
        local_path: impl AsRef<Path>,
    ) -> Result<Arc<HighlightConfiguration>, ConstructorError> {
        let parser = self.parser.clone().ok_or(ConstructorError::NotLoaded)?;

        let language = unsafe {
            let load: libloading::Symbol<unsafe extern "C" fn() -> Language> = parser
                .get(self.init_function.as_bytes())
                .map_err(|_| ConstructorError::UnableToLoadLanguage(self.init_function.clone()))?;
            load()
        };

        let mut highlights_query = String::new();
        let mut injection_query = String::new();
        let mut locals_query = String::new();

        for hl in &self.highlights {
            todo!("handle highlights");
        }

        let mut config = HighlightConfiguration::new(
            language,
            self.match_block.first().expect("missing match_block"),
            &highlights_query,
            &injection_query,
            &locals_query,
        )
        .map_err(ConstructorError::BadQuery)?;
        let config = Arc::new(config);

        self.configuration = Some(config.clone());

        Ok(config)
    }
}

#[serde_as]
#[derive(Default, Deserialize)]
pub struct RepoInfo {
    /// Repo display name
    #[serde(default)]
    pub name: Option<String>,
    /// Repository ID, used for referencing querries from other repositories
    pub id: Option<String>,

    /// Url to the repository
    pub repo: String,
    /// Repository branch to use
    #[serde(default)]
    pub branch: Option<String>,

    /// List of grammars provided by the repo
    #[serde_as(deserialize_as = "OneOrMany<_, PreferMany>")]
    #[serde(default)]
    pub entries: Vec<TreeSitterEntry>,

    #[serde(skip)]
    pub local_path: Option<PathBuf>,
}

fn repo_name(url: &str) -> Option<&str> {
    url.split("/").last().and_then(|it| it.strip_suffix(".git"))
}

pub fn clone_repo(
    url: &str,
    branch: &Option<String>,
    root: impl AsRef<Path>,
) -> Result<PathBuf, EnvironmentError> {
    let root = root.as_ref();

    let clone_target = match repo_name(url) {
        Some(it) => it,
        None => {
            return Err(EnvironmentError::InvalidRepo {
                repo: url.to_string(),
                reason: "not a git url",
            })
        }
    };

    let mut args = vec!["clone", "-q", url];
    if let Some(branch) = branch {
        args.push("-b");
        args.push(branch);
    }
    args.push(clone_target);

    util::run_command(util::with_cwd(system_commands::git, root), &args)?;

    Ok(root.join(clone_target))
}

pub struct ClassList {
    highlights: Vec<String>,
    class_names: Vec<String>,
}

impl ClassList {
    pub fn new<S: AsRef<str>, I: IntoIterator<Item = S>>(highlights: I) -> Self {
        let (highlights, class_names) = highlights
            .into_iter()
            .map(|it| {
                let s = it.as_ref();
                (s.to_string(), s.replace(".", " "))
            })
            .unzip();

        ClassList {
            highlights,
            class_names,
        }
    }
}

impl<'de> Deserialize<'de> for ClassList {
    fn deserialize<D>(de: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Ok(ClassList::new(Vec::<String>::deserialize(de)?))
    }
}

impl Default for ClassList {
    fn default() -> Self {
        ClassList::new(STANDARD_HIGHLIGHTS)
    }
}

fn collect_requirements(list: &[String]) -> HashSet<String> {
    let mut requirements = HashSet::new();

    for item in list {
        if item.contains(":") {
            let req: String = item.chars().take_while(|it| *it != ':').collect();
            if req.len() > 0 {
                requirements.insert(req.to_lowercase());
            }
        }
    }

    return requirements;
}

/*
#[derive(Default)]
pub struct LanguageDefinition {
    pub name: String,

    pub source: Option<Arc<RepoInfo>>,

    pub parser_path: Option<PathBuf>,
    pub parser_init_fn: Option<String>,

    pub highlights_query: Option<String>,
    pub injection_query: Option<String>,
    pub locals_query: Option<String>,

    configuration: Option<HighlightConfiguration>,
}

impl LanguageDefinition {
    pub(crate) fn configuration(&mut self) -> Result<&HighlightConfiguration, HighlightError> {
        if self.configuration.is_some() {
            return Ok(self.configuration.as_ref().unwrap());
        }

        let library_path = self
            .parser_path
            .clone()
            .unwrap_or_else(|| PathBuf::from(format!("./parser_{}.so", self.name)));
        let function_path = self
            .parser_init_fn
            .clone()
            .unwrap_or_else(|| format!("tree_sitter_{}", self.name));

        let parser = get_parser(&library_path)?;
        let language = unsafe {
            let load: libloading::Symbol<unsafe extern "C" fn() -> Language> = parser
                .get(function_path.as_bytes())
                .map_err(|_| HighlightError::UnableToLoadLanguage(self.name.clone()))?;
            load()
        };

        let config = HighlightConfiguration::new(
            self.name.clone(),
            language,
            util::as_str_or_empty(&self.highlights_query),
            util::as_str_or_empty(&self.injection_query),
            util::as_str_or_empty(&self.locals_query),
        )?;

        self.configuration = Some(config);
        Ok(self.configuration.as_ref().unwrap())
    }
}

struct DefinitionVisitor;
#[derive(Deserialize)]
#[serde(field_identifier, rename_all = "camelCase")]
enum DefinitionFields {
    Name,
    ParserPath,
    ParserInitFn,
    HighlightsQuery,
    InjectionQuery,
    LocalsQuery,
}
impl<'de> Visitor<'de> for DefinitionVisitor {
    type Value = LanguageDefinition;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("expected a language string or definition struct")
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
    where
        E: serde::de::Error,
    {
        Ok(LanguageDefinition::from(v))
    }

    fn visit_string<E>(self, v: String) -> Result<Self::Value, E>
    where
        E: serde::de::Error,
    {
        Ok(LanguageDefinition::from(v))
    }

    fn visit_map<A>(self, mut map: A) -> Result<Self::Value, A::Error>
    where
        A: serde::de::MapAccess<'de>,
    {
        let mut result = LanguageDefinition::default();
        let mut name_set = false;

        while let Some(key) = map.next_key()? {
            match key {
                DefinitionFields::Name => {
                    name_set = true;
                    result.name = map.next_value()?;
                }
                DefinitionFields::ParserPath => {
                    result.parser_path = map.next_value()?;
                }
                DefinitionFields::ParserInitFn => {
                    result.parser_init_fn = map.next_value()?;
                }
                DefinitionFields::HighlightsQuery => {
                    result.highlights_query = map.next_value()?;
                }
                DefinitionFields::InjectionQuery => {
                    result.injection_query = map.next_value()?;
                }
                DefinitionFields::LocalsQuery => {
                    result.locals_query = map.next_value()?;
                }
            }
        }

        if name_set {
            Ok(result)
        } else {
            Err(serde::de::Error::missing_field("name"))
        }
    }
}
impl<'de> Deserialize<'de> for LanguageDefinition {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_any(DefinitionVisitor)
    }
}
fn get_parser(path: &Path) -> Result<&'static Library, HighlightError> {
    static CACHE: Mutex<Option<HashMap<PathBuf, Box<Library>>>> = Mutex::new(None);

    let mut cache = CACHE
        .lock()
        .map_err(|_| HighlightError::ParserCachePoisened)?;

    let path_name = path.to_string_lossy().to_string();

    if !path.exists() {
        return Err(HighlightError::UnableToLoadParser {
            path: path_name,
            reason: "missing file",
        });
    }

    let path = std::fs::canonicalize(path).expect("can't canonicalize path");

    if let Some(ref cached) = cache.as_ref().map(|it| it.get(&path)).flatten() {
        return Ok(unsafe {
            // SAFETY: Box<Library> is never dropped or mutated, so it's safe to
            // use value it points to as a static reference.
            addr_of!(***cached).as_ref().unwrap_unchecked()
        });
    }

    let loaded = unsafe {
        Library::new(&path).map_err(|_| HighlightError::UnableToLoadParser {
            path: path_name,
            reason: "invalid library",
        })?
    };

    let cache = match *cache {
        Some(ref mut it) => it,
        ref mut it => {
            let created = HashMap::new();
            *it = Some(created);
            it.as_mut().unwrap()
        }
    };

    cache.insert(path.clone(), Box::new(loaded));
    Ok(unsafe {
        // SAFETY: Box<Library> is never dropped or mutated, so it's safe to use
        // value it points to as a static reference.
        addr_of!(**cache.get(&path).unwrap())
            .as_ref()
            .unwrap_unchecked()
    })
}
 */

pub(crate) fn standard_repos() -> Vec<RepoInfo> {
    static LANGUAGES: &str = include_str!("./languages.json");

    let mut result = Vec::new();
    let languages: HashMap<String, RepoInfo> =
        serde_json::from_str(LANGUAGES).expect("invalid languages.json");

    for (key, mut lang) in languages {
        lang.entries = lang
            .entries
            .into_iter()
            .filter(|it: &TreeSitterEntry| !it.highlights.is_empty())
            .collect();

        if lang.entries.len() == 0 {
            continue;
        }

        lang.id = Some(key);

        result.push(lang);
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_name() {
        let repos = standard_repos();
    }
}
