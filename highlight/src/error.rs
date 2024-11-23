use std::path::PathBuf;

use indoc::formatdoc;
use napi::bindgen_prelude::error;
use thiserror::Error;

#[derive(Debug, Clone, Error)]
#[error("resource path '{0}' is invalid")]
pub struct InvalidResourcePath(pub String);

#[derive(Debug, Clone, Error)]
pub enum EnvironmentError {
    #[error("{command} not in PATH")]
    CommandNotInPath { command: String },
    #[error("{path} not found")]
    ExecutableNotFound { path: PathBuf },
    #[error("unable to spawn {executable} with args: {args:?}")]
    SpawnError {
        executable: PathBuf,
        args: Vec<String>,
    },
    #[error("{command} command error: {message}")]
    CommandError { command: String, message: String },
    #[error("not a valid tree-sitter repository: {repo}; {reason}")]
    InvalidRepo { repo: String, reason: &'static str },
    #[error("parser at {path} not built")]
    NotBuilt { path: PathBuf },
    #[error("invalid parser at {path}")]
    InvalidParser { path: PathBuf },
}

#[derive(Debug, Error)]
pub enum ConstructorError {
    #[error("unable to create clone target directory: {0}")]
    InvalidCloneTarget(
        #[source]
        #[from]
        std::io::Error,
    ),
    #[error("unable to clone {language} repo: {inner}")]
    NotCloned {
        language: String,
        #[source]
        inner: EnvironmentError,
    },
    #[error("entry library not loaded")]
    NotLoaded,
    #[error("unable to load language: {0}")]
    UnableToLoadLanguage(String),
    #[error("unable to build {language} project: {inner}")]
    NotBuilt {
        language: String,
        #[source]
        inner: EnvironmentError,
    },
    #[error("error building query: {0}")]
    BadQuery(#[source] tree_sitter::QueryError),
    #[error("unable to load parser: '{path}'; {reason}")]
    UnableToLoadParser { path: PathBuf, reason: &'static str },
}

#[cfg(feature = "napi")]
impl Into<napi::Error> for ConstructorError {
    fn into(self) -> napi::Error {
        napi::Error::new(napi::Status::Unknown, self.to_string())
    }
}

#[derive(Debug, Error)]
pub enum HighlightError {
    #[error("unknown language: {0}")]
    UnknownLanguage(String),
    #[error("invalid language tree sitter version {found}; expected {expected}")]
    InvalidLanguageVersion { found: usize, expected: usize },
    #[error("parser cache poisened")]
    ParserCachePoisened,
    #[error(transparent)]
    Environment(#[from] EnvironmentError),
    #[error(transparent)]
    QuerryError(#[from] tree_sitter::QueryError),
    #[error("highlighting cancelled")]
    Cancelled,
    #[error("unknown error")]
    Unknown,
}

#[cfg(feature = "napi")]
impl Into<napi::Error> for HighlightError {
    fn into(self) -> napi::Error {
        match self {
            HighlightError::UnknownLanguage(_) => {
                napi::Error::new(napi::Status::InvalidArg, self.to_string())
            }
            HighlightError::InvalidLanguageVersion { .. } => {
                napi::Error::new(napi::Status::Unknown, self.to_string())
            }
            HighlightError::Unknown => {
                napi::Error::new(napi::Status::Unknown, "unknown tree-sitter error")
            }
            HighlightError::ParserCachePoisened => {
                napi::Error::new(napi::Status::Unknown, self.to_string())
            }
            HighlightError::Environment(error) => {
                napi::Error::new(napi::Status::Unknown, error.to_string())
            }
            HighlightError::QuerryError(error) => {
                let message = formatdoc!(
                    "
                    query error on row {row}, column {column} (offset: {offset}): {kind:?}
                    message: {message}
                    ",
                    row = error.row,
                    column = error.column,
                    offset = error.offset,
                    kind = error.kind,
                    message = error.message
                );
                napi::Error::new(napi::Status::Unknown, message)
            }
            HighlightError::Cancelled => {
                napi::Error::new(napi::Status::Unknown, "highlighting cancelled")
            }
            HighlightError::Unknown => napi::Error::new(napi::Status::Unknown, "unknown error"),
        }
    }
}
