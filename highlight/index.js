import { readFile } from "fs/promises";
import { createRequire } from 'node:module';

const { platform, arch } = process

const BINARY_NAME = "tshighlight"

async function isMusl() {
  // For Node 10
  if (!process.report || typeof process.report.getReport !== 'function') {
    try {
      const which = (await import('child_process')).execSync('which ldd');
      const lddPath = which.toString().trim()
      const ldd = await readFile(lddPath, 'utf8');
      return ldd.includes('musl')
    } catch (e) {
      return true
    }
  } else {
    const { glibcVersionRuntime } = process.report.getReport().header
    return !glibcVersionRuntime
  }
}

const require = createRequire(import.meta.url);
async function loadTarget(triple) {
  return require(`./${BINARY_NAME}.${triple}.node`)
}

async function nativeBinding() {
  switch (platform) {
    case 'android':
      switch (arch) {
        case 'arm64':
          return loadTarget("android-arm64")
        case 'arm':
          return loadTarget("android-android-arm-eabi")
        default:
          throw new Error(`Unsupported architecture on Android ${arch}`)
      }
    case 'win32':
      switch (arch) {
        case 'x64':
          return loadTarget("win32-x64-msvc")
        case 'ia32':
          return loadTarget("win32-ia32-msvc")
        case 'arm64':
          return loadTarget("win32-arm64-msvc")
        default:
          throw new Error(`Unsupported architecture on Windows: ${arch}`)
      }
      break
    case 'darwin':
      try {
        let universal = await loadTarget("darwin-universal")
        return universal
      } catch (e) { }
      switch (arch) {
        case 'x64':
          return loadTarget("darwin-x64")
        case 'arm64':
          return loadTarget("darwin-arm64")
        default:
          throw new Error(`Unsupported architecture on macOS: ${arch}`)
      }
    case 'freebsd':
      if (arch !== 'x64') {
        throw new Error(`Unsupported architecture on FreeBSD: ${arch}`)
      }
      return loadTarget("freebsd-x64")
    case 'linux':
      let toolkit = await isMusl() ? "musl" : "gnu";
      switch (arch) {
        case 'x64':
          return loadTarget(`linux-x64-${toolkit}`)
        case 'arm64':
          return loadTarget(`linux-arm64-${toolkit}`)
        case 'arm':
          return loadTarget(`linux-arm-gnueabihf`)
        case 'riscv64':
          return loadTarget(`linux-riscv64-${toolkit}`)
        default:
          throw new Error(`Unsupported architecture on Linux: ${arch}`)
      }
    default:
      throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`)
  }
}

const { Highlighter } = await nativeBinding();

export default Highlighter;
