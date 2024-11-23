use std::{
    env::temp_dir,
    ffi::OsStr,
    io::{BufReader, Read},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    time::Duration,
};

use crate::error::EnvironmentError;

#[derive(Clone)]
pub(crate) struct CommandContext {
    name: &'static str,
    path: PathBuf,
    cwd: Option<PathBuf>,
}

pub(crate) mod system_commands {
    use once_cell::sync::Lazy;
    use std::path::PathBuf;

    use super::CommandContext;
    use crate::error::EnvironmentError;

    macro_rules! decl_system_command {
        ($name: ident, $cmd: literal) => {
            pub fn $name() -> Result<CommandContext, EnvironmentError> {
                static PATH: Lazy<Result<PathBuf, EnvironmentError>> = Lazy::new(|| {
                    which::which($cmd).map_err(|_| EnvironmentError::CommandNotInPath {
                        command: $cmd.to_string(),
                    })
                });

                PATH.clone().map(|it| CommandContext {
                    name: $cmd,
                    path: it,
                    cwd: None,
                })
            }
        };
    }

    decl_system_command!(git, "git");
    decl_system_command!(tree_sitter_cli, "tree-sitter");

    pub fn compiler() -> Result<CommandContext, EnvironmentError> {
        static CACHED: Lazy<Result<PathBuf, EnvironmentError>> = Lazy::new(|| {
            if let Ok(cc) = std::env::var("CC") {
                let cc_path = PathBuf::from(&cc);
                if cc_path.components().count() > 0 {
                    if cc_path.exists() {
                        Ok(cc_path)
                    } else {
                        Err(EnvironmentError::ExecutableNotFound { path: cc_path })
                    }
                } else {
                    which::which(&cc)
                        .map_err(|_| EnvironmentError::CommandNotInPath { command: cc })
                }
            } else {
                which::which("clang").or(which::which("gcc")).map_err(|_| {
                    EnvironmentError::CommandNotInPath {
                        command: "clang or gcc".to_string(),
                    }
                })
            }
        });

        let command = CACHED.clone()?;

        Ok(CommandContext {
            name: "compiler",
            path: command,
            cwd: None,
        })
    }
}

pub(crate) fn with_cwd<F: FnOnce() -> Result<CommandContext, EnvironmentError>>(
    system_command: F,
    path: impl AsRef<Path>,
) -> impl FnOnce() -> Result<CommandContext, EnvironmentError> {
    move || {
        system_command().map(|it| {
            let mut state = it;
            state.cwd = Some(path.as_ref().to_path_buf());
            state
        })
    }
}

pub(crate) fn run_command<
    F: FnOnce() -> Result<CommandContext, EnvironmentError>,
    S: AsRef<OsStr>,
>(
    system_command: F,
    args: &[S],
) -> Result<String, EnvironmentError> {
    let CommandContext { name, path, cwd } = system_command()?;

    let mut command = Command::new(&path);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());
    command.args(args);

    if let Some(cwd) = cwd {
        command.current_dir(cwd);
    }

    let mut child = command.spawn().map_err(|_| EnvironmentError::SpawnError {
        executable: path,
        args: args
            .iter()
            .map(|it| it.as_ref().to_string_lossy().to_string())
            .collect(),
    })?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let status = child
        .wait()
        .expect(format!("can't wait for {} process", name).as_str());

    let mut output = String::new();
    BufReader::new(stdout).read_to_string(&mut output);

    if !status.success() {
        let mut message = String::new();
        BufReader::new(stderr).read_to_string(&mut message);
        return Err(EnvironmentError::CommandError {
            command: name.to_string(),
            message,
        });
    }

    Ok(output)
}

pub trait Intersect {
    fn has_intersection(&self, other: &Self) -> bool;
}
impl<V: PartialEq> Intersect for Vec<V> {
    fn has_intersection(&self, other: &Self) -> bool {
        self.iter().any(|lhs| other.iter().any(|rhs| rhs.eq(lhs)))
    }
}

pub fn as_str_or_empty(value: &Option<String>) -> &str {
    match value {
        Some(it) => it.as_str(),
        None => "",
    }
}

pub fn client() -> Result<reqwest::blocking::Client, reqwest::Error> {
    reqwest::blocking::Client::builder()
        .user_agent("tree-sitter-highlight")
        .build()
}

pub fn read_git_file<S: AsRef<str>>(
    url: impl AsRef<str>,
    branch: Option<S>,
    path: impl AsRef<Path>,
) -> Option<String> {
    let url = url.as_ref();
    let dir = temp_dir();

    let mut clone_args: Vec<_> = ["clone", "-q", "--depth", "1", "--no-checkout"]
        .into_iter()
        .map(|it| it.to_string())
        .collect();
    if let Some(branch) = branch {
        clone_args.extend(["-b".to_string(), branch.as_ref().to_string()])
    }
    clone_args.extend([url.to_string(), "remote".to_string()]);

    run_command(with_cwd(system_commands::git, &dir), clone_args.as_ref()).ok()?;
    let remote = dir.join("remote");
    run_command(
        with_cwd(system_commands::git, &remote),
        &[
            OsStr::new("checkout"),
            OsStr::new("HEAD"),
            path.as_ref().as_os_str(),
        ],
    )
    .ok()?;
    let file_path = remote.join(path);
    let result = std::fs::read_to_string(file_path).ok();
    std::fs::remove_dir(remote);

    result
}

pub trait CollectResults<T, E, R> {
    fn collect_results(self) -> Result<R, E>;
}
impl<T, E, I: Iterator<Item = Result<T, E>>> CollectResults<T, E, Vec<T>> for I {
    fn collect_results(self) -> Result<Vec<T>, E> {
        let mut result = Vec::new();
        for entry in self {
            match entry {
                Ok(it) => result.push(it),
                Err(err) => return Err(err),
            }
        }
        Ok(result)
    }
}

pub fn html_escape(c: u8) -> Option<&'static [u8]> {
    match c as char {
        '>' => Some(b"&gt;"),
        '<' => Some(b"&lt;"),
        '&' => Some(b"&amp;"),
        '\'' => Some(b"&#39;"),
        '"' => Some(b"&quot;"),
        _ => None,
    }
}
