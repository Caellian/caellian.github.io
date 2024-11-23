fn build_napi() {
    #[cfg(feature = "napi")]
    napi_build::setup();
}

fn is_enabled(feature: &str) -> bool {
    if let Ok(value) = std::env::var(format!("CARGO_FEATURE_{}", feature.replace("-", "_"))) {
        value == "1"
    } else {
        false
    }
}

fn main() {
    if is_enabled("CARGO_FEATURE_NAPI") {
        build_napi();
    }
}
