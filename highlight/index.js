import { stat, readFile } from "fs/promises";
import { createRequire } from 'node:module';
import { join } from "path";
import url from "url";

const { platform, arch } = process

const BINARY_NAME = "highlight"
let nativeBinding = null

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

async function exists(name) {
  let path = url.fileURLToPath(new URL(name, import.meta.url))
  return stat(path).then(() => true).catch(() => false)
}

async function loadTarget(triple) {
  let doesExist = await exists(`./${BINARY_NAME}.${triple}.node`);
  const require = createRequire(import.meta.url);
  if (doesExist) {
    return require(`./${BINARY_NAME}.${triple}.node`)
  } else {
    return require(`${BINARY_NAME}-${triple}`)
  }
}

switch (platform) {
  case 'android':
    switch (arch) {
      case 'arm64':
        nativeBinding = loadTarget("android-arm64")
        break
      case 'arm':
        nativeBinding = loadTarget("android-android-arm-eabi")
        break
      default:
        throw new Error(`Unsupported architecture on Android ${arch}`)
    }
    break
  case 'win32':
    switch (arch) {
      case 'x64':
        nativeBinding = loadTarget("win32-x64-msvc")
        break
      case 'ia32':
        nativeBinding = loadTarget("win32-ia32-msvc")
        break
      case 'arm64':
        nativeBinding = loadTarget("win32-arm64-msvc")
        break
      default:
        throw new Error(`Unsupported architecture on Windows: ${arch}`)
    }
    break
  case 'darwin':
    nativeBinding = loadTarget("darwin-universal")
    switch (arch) {
      case 'x64':
        nativeBinding = loadTarget("darwin-x64")
        break
      case 'arm64':
        nativeBinding = loadTarget("darwin-arm64")
        break
      default:
        throw new Error(`Unsupported architecture on macOS: ${arch}`)
    }
    break
  case 'freebsd':
    if (arch !== 'x64') {
      throw new Error(`Unsupported architecture on FreeBSD: ${arch}`)
    }
    nativeBinding = loadTarget("freebsd-x64")
    break
  case 'linux':
    let toolkit = await isMusl() ? "musl" : "gnu";
    switch (arch) {
      case 'x64':
        nativeBinding = loadTarget(`linux-x64-${toolkit}`)
        break
      case 'arm64':
        nativeBinding = loadTarget(`linux-arm64-${toolkit}`)
        break
      case 'arm':
        nativeBinding = loadTarget(`linux-arm-gnueabihf`)
        break
      case 'riscv64':
        nativeBinding = loadTarget(`linux-riscv64-${toolkit}`)
        break
      default:
        throw new Error(`Unsupported architecture on Linux: ${arch}`)
    }
    break
  default:
    throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`)
}

const { Highlighter } = await nativeBinding;

export default Highlighter;
