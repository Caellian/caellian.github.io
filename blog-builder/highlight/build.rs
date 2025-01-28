use serde::Deserialize;
use std::fmt::Write as _;
use std::{
    collections::HashMap,
    fs::File,
    io::{BufWriter, Write},
    path::PathBuf,
};

macro_rules! p {
    ($($tokens: tt)*) => {
        println!("cargo:warning={}", format!($($tokens)*))
    }
}

#[derive(Deserialize)]
struct LanguageDefinition {
    name: String,
    #[serde(default)]
    language: String,
    #[serde(default)]
    module: String,

    #[serde(default)]
    injections: Vec<String>,
    #[serde(default)]
    detect: Vec<String>,

    #[serde(default)]
    highlights_query: Vec<String>,
    #[serde(default)]
    injections_query: Vec<String>,
    #[serde(default)]
    locals_query: Vec<String>,

    #[serde(default)]
    line_comment: String,
    #[serde(default)]
    block_comment: Vec<String>,
}

#[derive(Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
enum ResolvePurpose {
    Language,
    Query,
}
impl ResolvePurpose {
    fn local_path(&self) -> PathBuf {
        std::env::current_dir().unwrap().join(match self {
            ResolvePurpose::Language => "parsers",
            ResolvePurpose::Query => "querries",
        })
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
struct ResolveContext<'c> {
    purpose: ResolvePurpose,
    module: &'c str,
}

enum Source {
    Local(PathBuf),
    Crate(String),
}
impl Source {
    fn resolve_path(ctx: ResolveContext, path: &str) -> Self {
        if let Some(module_name) = path.strip_prefix("module:") {
            Self::Crate(format!("{}::{module_name}", ctx.module))
        } else if let Some(file_path) = path.strip_prefix("local:") {
            let path = ctx.purpose.local_path().join(file_path);
            Self::Local(PathBuf::from(path))
        } else if path.contains("::") {
            Self::Crate(path.to_string())
        } else {
            Self::Local(PathBuf::from(path))
        }
    }
    fn resolve_paths<S, I>(ctx: ResolveContext, paths: I) -> Vec<Source>
    where
        S: AsRef<str>,
        I: IntoIterator<Item = S>,
    {
        paths
            .into_iter()
            .map(|it| Self::resolve_path(ctx, it.as_ref()))
            .collect()
    }

    fn to_source_str(&self) -> String {
        match self {
            Source::Local(file) => format!("include_str!(\"{}\")", file.to_string_lossy()),
            Source::Crate(path) => path.clone(),
        }
    }

    fn gen_collected_query(
        query: &[Self],
        configure: &mut String,
        variable_name: impl AsRef<str>,
    ) -> String {
        let variable_name = variable_name.as_ref();
        let hq_var;
        if query.is_empty() {
            hq_var = "\"\"".to_string();
        } else if query.len() == 1 {
            hq_var = query[0].to_source_str();
        } else {
            hq_var = format!("&{variable_name}");
            writeln!(
                configure,
                "let mut {variable_name} = String::with_capacity(1024);"
            )
            .unwrap();
            let mut first = true;
            for highlight in query {
                let content = highlight.to_source_str();
                if !first {
                    writeln!(configure, "{variable_name}.push('\\n');").unwrap();
                }
                writeln!(configure, "{variable_name}.push_str({content});").unwrap();
                first = false;
            }
        }
        hq_var
    }
}

struct LanguageData {
    source_name: String,
    runtime_name: String,
    injections: Vec<String>,
    detect: Vec<String>,

    language_library: Source,
    highlights_query: Vec<Source>,
    injections_query: Vec<Source>,
    locals_query: Vec<Source>,

    line_comment: Option<String>,
    block_comment: Option<(String, Option<String>, String)>,
}
impl From<(String, LanguageDefinition)> for LanguageData {
    fn from((source_name, definition): (String, LanguageDefinition)) -> Self {
        let module = match !definition.module.is_empty() {
            true => definition.module,
            false => format!("tree_sitter_{}", definition.name),
        };

        let rctx = ResolveContext {
            purpose: ResolvePurpose::Language,
            module: &module,
        };

        let language_library = match !definition.language.is_empty() {
            true => Source::resolve_path(rctx, &definition.language),
            false => Source::Crate(format!("{module}::LANGUAGE")),
        };

        let rctx = ResolveContext {
            purpose: ResolvePurpose::Query,
            module: &module,
        };
        let highlights_query = Source::resolve_paths(rctx, definition.highlights_query);
        let injections_query = Source::resolve_paths(rctx, definition.injections_query);
        let locals_query = Source::resolve_paths(rctx, definition.locals_query);

        let line_comment = match !definition.line_comment.is_empty() {
            true => Some(definition.line_comment),
            false => None,
        };
        let block_comment = match definition.block_comment.len() {
            3 => Some((
                definition.block_comment[0].clone(),
                Some(definition.block_comment[1].clone()),
                definition.block_comment[2].clone(),
            )),
            2 => Some((
                definition.block_comment[0].clone(),
                None,
                definition.block_comment[1].clone(),
            )),
            0 => None,
            other => {
                p!("block comment length of '{source_name}' language invalid; expected 3, got {other}");
                None
            }
        };

        LanguageData {
            source_name,
            runtime_name: definition.name,
            injections: definition.injections,
            detect: definition.detect,

            language_library,
            highlights_query,
            injections_query,
            locals_query,

            line_comment,
            block_comment,
        }
    }
}
impl LanguageData {
    fn write_highlight_config<W: Write>(&self, output: &mut W) -> std::io::Result<()> {
        let mut configure = String::new();

        let language = match &self.language_library {
            Source::Local(_) => todo!("local language binaries not yet implemented"),
            Source::Crate(path) => path,
        };

        let highlights_var =
            Source::gen_collected_query(&self.highlights_query, &mut configure, "highlights");
        let injections_var =
            Source::gen_collected_query(&self.injections_query, &mut configure, "injections");
        let locals_var = Source::gen_collected_query(&self.locals_query, &mut configure, "locals");

        writeln!(
            output,
            r#"{ENUM_NAME}::{0} => || {{
            {configure}
            tree_sitter_highlight::HighlightConfiguration::new(
                {language}.into(),
                "{1}",
                {highlights_var},
                {injections_var},
                {locals_var},
            )
            .unwrap()
        }},"#,
            self.source_name, self.runtime_name
        )?;
        Ok(())
    }
}

#[derive(Deserialize)]
#[serde(from = "HashMap<String, LanguageDefinition>")]
struct Languages(Vec<LanguageData>);
impl Languages {
    #[inline]
    fn ids(&self) -> impl Iterator<Item = &str> + '_ {
        self.0.iter().map(|it| it.source_name.as_str())
    }
    #[inline]
    fn iter(&self) -> impl Iterator<Item = &LanguageData> + '_ {
        self.0.iter()
    }
    #[inline]
    fn iter_mut(&mut self) -> impl Iterator<Item = &mut LanguageData> + '_ {
        self.0.iter_mut()
    }

    fn write_language_enum<W: Write>(&self, output: &mut W) -> std::io::Result<()> {
        writeln!(
            output,
            "#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]\npub enum {ENUM_NAME} {{"
        )?;
        for lang in self.iter() {
            writeln!(output, "{},", lang.source_name)?;
        }
        writeln!(output, "}}")?;
        Ok(())
    }

    fn write_language_impl<W: Write>(&self, output: &mut W) -> std::io::Result<()> {
        writeln!(output, "impl {ENUM_NAME} {{")?;
        let all_items = self
            .iter()
            .map(|it| format!("{ENUM_NAME}::{}", it.source_name))
            .join(",\n");
        writeln!(output, "pub const ALL: &[{ENUM_NAME}] = &[{all_items}];")?;

        writeln!(
            output,
            "fn highlight_init(&self) -> fn() -> tree_sitter_highlight::HighlightConfiguration {{\nmatch self {{"
        )?;
        for lang in self.iter() {
            lang.write_highlight_config(output)?
        }
        writeln!(output, "}}\n}}")?;

        writeln!(
            output,
            "fn injections(&self) -> &'static [Self] {{\nmatch self {{"
        )?;
        for lang in self.iter() {
            if lang.injections.is_empty() {
                continue;
            }
            let targets = lang
                .injections
                .iter()
                .map(|required| format!("{ENUM_NAME}::{required}"))
                .join(", ");
            writeln!(output, "{ENUM_NAME}::{} => &[{targets}],", lang.source_name)?;
        }
        writeln!(output, "_ => &[],\n}}\n}}")?;

        writeln!(
            output,
            "pub fn name(&self) -> &'static str {{\nmatch self {{"
        )?;
        for lang in self.iter() {
            writeln!(
                output,
                "{ENUM_NAME}::{} => \"{}\",",
                lang.source_name, lang.runtime_name
            )?;
        }
        writeln!(output, "}}\n}}")?;

        writeln!(
            output,
            "pub fn for_block(block_language: impl AsRef<str>) -> Option<Self> {{\nmatch block_language.as_ref() {{"
        )?;
        for lang in self.iter() {
            if lang.detect.is_empty() {
                continue;
            }
            let checks = lang.detect.iter().map(|it| format!("\"{it}\"")).join(" | ");
            writeln!(
                output,
                "{checks} => Some({ENUM_NAME}::{}),",
                lang.source_name
            )?;
        }
        writeln!(output, "_ => None,\n}}\n}}")?;

        writeln!(
            output,
            "pub fn line_comment_prefix(&self) -> Option<&'static str> {{\nmatch self {{"
        )?;
        for lang in self.iter() {
            if let Some(line_comment) = &lang.line_comment {
                writeln!(
                    output,
                    "{ENUM_NAME}::{} => Some(\"{}\"),",
                    lang.source_name,
                    line_comment
                )?;
            }
        }
        writeln!(output, "_ => None,\n}}\n}}")?;

        writeln!(
            output,
            "pub fn block_comment_parts(&self) -> Option<(&'static str, Option<&'static str>, &'static str)> {{\nmatch self {{"
        )?;
        for lang in self.iter() {
            if let Some((pre, inner, post)) = &lang.block_comment {
                match inner {
                    Some(inner) => writeln!(
                        output,
                        "{ENUM_NAME}::{} => Some((\"{}\", Some(\"{}\"), \"{}\")),",
                        lang.source_name,
                        pre,
                        inner,
                        post
                    )?,
                    None => writeln!(
                        output,
                        "{ENUM_NAME}::{} => Some((\"{}\", None, \"{}\")),",
                        lang.source_name,
                        pre,
                        post
                    )?
                }
            }
        }
        writeln!(output, "_ => None,\n}}\n}}")?;

        writeln!(output, "}}")?;
        Ok(())
    }

    fn write_language_definitions<W: Write>(&self, mut output: W) -> std::io::Result<()> {
        self.write_language_enum(&mut output)?;
        self.write_language_impl(&mut output)?;
        Ok(())
    }
}
impl From<HashMap<String, LanguageDefinition>> for Languages {
    fn from(value: HashMap<String, LanguageDefinition>) -> Self {
        Self(value.into_iter().map(LanguageData::from).collect())
    }
}

#[derive(Deserialize)]
struct Config {
    highlights: Vec<String>,
    languages: Languages,
}
const ENUM_NAME: &str = "Language";
impl Config {
    fn load() -> Self {
        let languages =
            std::fs::read_to_string("./src/language.ron").expect("missing language definitions");
        let mut result: Self =
            ron::from_str(&languages).expect("invalid language definitions file");

        let mut remove = Vec::with_capacity(10);
        let known: Vec<_> = result.languages.ids().map(|it| it.to_string()).collect();
        for language in result.languages.iter_mut() {
            remove.reserve(language.injections.len());
            for required in &language.injections {
                if !known.contains(required) {
                    p!(
                        "{} requires {required} language injection, but it's not defined",
                        language.source_name
                    );
                    remove.push(required.clone());
                }
            }
            language.injections = std::mem::take(&mut language.injections)
                .into_iter()
                .filter(|it| !remove.contains(it))
                .collect();
            remove.clear();
        }

        result
    }

    fn generate_languages_source(&self) -> std::io::Result<()> {
        println!("cargo:rerun-if-changed=src/language.ron");
        let target_path = PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("language.rs");
        let target = File::create(target_path).unwrap();
        let mut target = BufWriter::new(target);

        writeln!(target, "fn default_highlights() -> Vec<String> {{\nvec![")?;
        for highlight in &self.highlights {
            writeln!(target, "\"{highlight}\".to_string(),")?;
        }
        writeln!(target, "]\n}}")?;

        self.languages.write_language_definitions(target)
    }

    fn generate_index_dts_patch(&self) -> std::io::Result<()> {
        println!("cargo:rerun-if-changed=src/language.ron");
        let target_path = std::env::current_dir().unwrap().join("index_patch.sh");
        let target = File::create(target_path).unwrap();
        let mut target = BufWriter::new(target);

        const INDEX: &str = "index.d.ts";
        writeln!(target, "echo \"\" >> {INDEX}")?;
        if let Some(last) = self.languages.0.last() {
            writeln!(target, "echo \"export type Language =\" >> {INDEX}")?;
            for lang in self.languages.iter() {
                let suffix = if lang.runtime_name == last.runtime_name {
                    ";"
                } else {
                    ""
                };
                writeln!(
                    target,
                    "echo \"  | \\\"{}\\\"{suffix}\" >> {INDEX}",
                    lang.runtime_name
                )?;
            }
        } else {
            writeln!(target, "echo \"type Language = string;\" >> {INDEX}")?;
        }
        writeln!(target, "echo \"\" >> {INDEX}")?;
        writeln!(target, "echo \"export default Highlighter;\" >> {INDEX}")?;
        Ok(())
    }
}

trait JoinStrIterExt<S: AsRef<str>>: Iterator<Item = S> {
    fn join(self, with: impl AsRef<str>) -> String;
}
impl<S: AsRef<str>, I: Iterator<Item = S>> JoinStrIterExt<S> for I {
    fn join(mut self, with: impl AsRef<str>) -> String {
        let with = with.as_ref();
        let first = match self.next() {
            Some(it) => it.as_ref().to_string(),
            None => return String::new(),
        };
        self.fold(first, |acc, it| acc + with + it.as_ref())
    }
}

fn main() {
    let config = Config::load();
    config.generate_languages_source().unwrap();
    config.generate_index_dts_patch().unwrap();

    napi_build::setup();
}
