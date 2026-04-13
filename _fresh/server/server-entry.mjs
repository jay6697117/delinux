var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _internal, _buildCache, _additionalStyles, _getBuildCache, _commands, _onError;
function checkWindows() {
  const global2 = globalThis;
  const os = global2.Deno?.build?.os;
  return typeof os === "string" ? os === "windows" : global2.navigator?.platform?.startsWith("Win") ?? global2.process?.platform?.startsWith("win") ?? false;
}
const isWindows = checkWindows();
function assertPath(path) {
  if (typeof path !== "string") {
    throw new TypeError(`Path must be a string, received "${JSON.stringify(path)}"`);
  }
}
function assertArg$1(url) {
  url = url instanceof URL ? url : new URL(url);
  if (url.protocol !== "file:") {
    throw new TypeError(`URL must be a file URL: received "${url.protocol}"`);
  }
  return url;
}
function fromFileUrl$2(url) {
  url = assertArg$1(url);
  return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
const CHAR_UPPERCASE_A = 65;
const CHAR_LOWERCASE_A = 97;
const CHAR_UPPERCASE_Z = 90;
const CHAR_LOWERCASE_Z = 122;
const CHAR_DOT = 46;
const CHAR_FORWARD_SLASH = 47;
const CHAR_BACKWARD_SLASH = 92;
const CHAR_COLON = 58;
function isPosixPathSeparator(code2) {
  return code2 === CHAR_FORWARD_SLASH;
}
function isPathSeparator(code2) {
  return code2 === CHAR_FORWARD_SLASH || code2 === CHAR_BACKWARD_SLASH;
}
function isWindowsDeviceRoot(code2) {
  return code2 >= CHAR_LOWERCASE_A && code2 <= CHAR_LOWERCASE_Z || code2 >= CHAR_UPPERCASE_A && code2 <= CHAR_UPPERCASE_Z;
}
function fromFileUrl$1(url) {
  url = assertArg$1(url);
  let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
  if (url.hostname !== "") {
    path = `\\\\${url.hostname}${path}`;
  }
  return path;
}
function fromFileUrl(url) {
  return isWindows ? fromFileUrl$1(url) : fromFileUrl$2(url);
}
function isAbsolute$2(path) {
  assertPath(path);
  return path.length > 0 && isPosixPathSeparator(path.charCodeAt(0));
}
function isAbsolute$1(path) {
  assertPath(path);
  const len = path.length;
  if (len === 0) return false;
  const code2 = path.charCodeAt(0);
  if (isPathSeparator(code2)) {
    return true;
  } else if (isWindowsDeviceRoot(code2)) {
    if (len > 2 && path.charCodeAt(1) === CHAR_COLON) {
      if (isPathSeparator(path.charCodeAt(2))) return true;
    }
  }
  return false;
}
function isAbsolute(path) {
  return isWindows ? isAbsolute$1(path) : isAbsolute$2(path);
}
function assertArg(path) {
  assertPath(path);
  if (path.length === 0) return ".";
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator2) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code2;
  for (let i2 = 0; i2 <= path.length; ++i2) {
    if (i2 < path.length) code2 = path.charCodeAt(i2);
    else if (isPathSeparator2(code2)) break;
    else code2 = CHAR_FORWARD_SLASH;
    if (isPathSeparator2(code2)) {
      if (lastSlash === i2 - 1 || dots === 1) ;
      else if (lastSlash !== i2 - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== CHAR_DOT || res.charCodeAt(res.length - 2) !== CHAR_DOT) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i2;
            dots = 0;
            continue;
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i2;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += `${separator}..`;
          else res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) res += separator + path.slice(lastSlash + 1, i2);
        else res = path.slice(lastSlash + 1, i2);
        lastSegmentLength = i2 - lastSlash - 1;
      }
      lastSlash = i2;
      dots = 0;
    } else if (code2 === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
function normalize$1(path) {
  if (path instanceof URL) {
    path = fromFileUrl$2(path);
  }
  assertArg(path);
  const isAbsolute2 = isPosixPathSeparator(path.charCodeAt(0));
  const trailingSeparator = isPosixPathSeparator(path.charCodeAt(path.length - 1));
  path = normalizeString(path, !isAbsolute2, "/", isPosixPathSeparator);
  if (path.length === 0 && !isAbsolute2) path = ".";
  if (path.length > 0 && trailingSeparator) path += "/";
  if (isAbsolute2) return `/${path}`;
  return path;
}
function join$2(path, ...paths) {
  if (path === void 0) return ".";
  if (path instanceof URL) {
    path = fromFileUrl$2(path);
  }
  paths = path ? [path, ...paths] : paths;
  paths.forEach((path2) => assertPath(path2));
  const joined = paths.filter((path2) => path2.length > 0).join("/");
  return joined === "" ? "." : normalize$1(joined);
}
function normalize(path) {
  if (path instanceof URL) {
    path = fromFileUrl$1(path);
  }
  assertArg(path);
  const len = path.length;
  let rootEnd = 0;
  let device;
  let isAbsolute2 = false;
  const code2 = path.charCodeAt(0);
  if (len > 1) {
    if (isPathSeparator(code2)) {
      isAbsolute2 = true;
      if (isPathSeparator(path.charCodeAt(1))) {
        let j2 = 2;
        let last = j2;
        for (; j2 < len; ++j2) {
          if (isPathSeparator(path.charCodeAt(j2))) break;
        }
        if (j2 < len && j2 !== last) {
          const firstPart = path.slice(last, j2);
          last = j2;
          for (; j2 < len; ++j2) {
            if (!isPathSeparator(path.charCodeAt(j2))) break;
          }
          if (j2 < len && j2 !== last) {
            last = j2;
            for (; j2 < len; ++j2) {
              if (isPathSeparator(path.charCodeAt(j2))) break;
            }
            if (j2 === len) {
              return `\\\\${firstPart}\\${path.slice(last)}\\`;
            } else if (j2 !== last) {
              device = `\\\\${firstPart}\\${path.slice(last, j2)}`;
              rootEnd = j2;
            }
          }
        }
      } else {
        rootEnd = 1;
      }
    } else if (isWindowsDeviceRoot(code2)) {
      if (path.charCodeAt(1) === CHAR_COLON) {
        device = path.slice(0, 2);
        rootEnd = 2;
        if (len > 2) {
          if (isPathSeparator(path.charCodeAt(2))) {
            isAbsolute2 = true;
            rootEnd = 3;
          }
        }
      }
    }
  } else if (isPathSeparator(code2)) {
    return "\\";
  }
  let tail;
  if (rootEnd < len) {
    tail = normalizeString(path.slice(rootEnd), !isAbsolute2, "\\", isPathSeparator);
  } else {
    tail = "";
  }
  if (tail.length === 0 && !isAbsolute2) tail = ".";
  if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
    tail += "\\";
  }
  if (device === void 0) {
    if (isAbsolute2) {
      if (tail.length > 0) return `\\${tail}`;
      else return "\\";
    }
    return tail;
  } else if (isAbsolute2) {
    if (tail.length > 0) return `${device}\\${tail}`;
    else return `${device}\\`;
  }
  return device + tail;
}
function join$1(path, ...paths) {
  if (path instanceof URL) {
    path = fromFileUrl$1(path);
  }
  paths = path ? [path, ...paths] : paths;
  paths.forEach((path2) => assertPath(path2));
  paths = paths.filter((path2) => path2.length > 0);
  if (paths.length === 0) return ".";
  let needsReplace = true;
  let slashCount = 0;
  const firstPart = paths[0];
  if (isPathSeparator(firstPart.charCodeAt(0))) {
    ++slashCount;
    const firstLen = firstPart.length;
    if (firstLen > 1) {
      if (isPathSeparator(firstPart.charCodeAt(1))) {
        ++slashCount;
        if (firstLen > 2) {
          if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
          else {
            needsReplace = false;
          }
        }
      }
    }
  }
  let joined = paths.join("\\");
  if (needsReplace) {
    for (; slashCount < joined.length; ++slashCount) {
      if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
    }
    if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
  }
  return normalize(joined);
}
function join(path, ...paths) {
  return isWindows ? join$1(path, ...paths) : join$2(path, ...paths);
}
function resolve$1(...pathSegments) {
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let i2 = pathSegments.length - 1; i2 >= -1 && !resolvedAbsolute; i2--) {
    let path;
    if (i2 >= 0) path = pathSegments[i2];
    else {
      const {
        Deno: Deno2
      } = globalThis;
      if (typeof Deno2?.cwd !== "function") {
        throw new TypeError("Resolved a relative path without a current working directory (CWD)");
      }
      path = Deno2.cwd();
    }
    assertPath(path);
    if (path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isPosixPathSeparator(path.charCodeAt(0));
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
  if (resolvedAbsolute) {
    if (resolvedPath.length > 0) return `/${resolvedPath}`;
    else return "/";
  } else if (resolvedPath.length > 0) return resolvedPath;
  else return ".";
}
function assertArgs(from, to) {
  assertPath(from);
  assertPath(to);
  if (from === to) return "";
}
function relative$2(from, to) {
  assertArgs(from, to);
  from = resolve$1(from);
  to = resolve$1(to);
  if (from === to) return "";
  let fromStart = 1;
  const fromEnd = from.length;
  for (; fromStart < fromEnd; ++fromStart) {
    if (!isPosixPathSeparator(from.charCodeAt(fromStart))) break;
  }
  const fromLen = fromEnd - fromStart;
  let toStart = 1;
  const toEnd = to.length;
  for (; toStart < toEnd; ++toStart) {
    if (!isPosixPathSeparator(to.charCodeAt(toStart))) break;
  }
  const toLen = toEnd - toStart;
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i2 = 0;
  for (; i2 <= length; ++i2) {
    if (i2 === length) {
      if (toLen > length) {
        if (isPosixPathSeparator(to.charCodeAt(toStart + i2))) {
          return to.slice(toStart + i2 + 1);
        } else if (i2 === 0) {
          return to.slice(toStart + i2);
        }
      } else if (fromLen > length) {
        if (isPosixPathSeparator(from.charCodeAt(fromStart + i2))) {
          lastCommonSep = i2;
        } else if (i2 === 0) {
          lastCommonSep = 0;
        }
      }
      break;
    }
    const fromCode = from.charCodeAt(fromStart + i2);
    const toCode = to.charCodeAt(toStart + i2);
    if (fromCode !== toCode) break;
    else if (isPosixPathSeparator(fromCode)) lastCommonSep = i2;
  }
  let out = "";
  for (i2 = fromStart + lastCommonSep + 1; i2 <= fromEnd; ++i2) {
    if (i2 === fromEnd || isPosixPathSeparator(from.charCodeAt(i2))) {
      if (out.length === 0) out += "..";
      else out += "/..";
    }
  }
  if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
  else {
    toStart += lastCommonSep;
    if (isPosixPathSeparator(to.charCodeAt(toStart))) ++toStart;
    return to.slice(toStart);
  }
}
function resolve(...pathSegments) {
  let resolvedDevice = "";
  let resolvedTail = "";
  let resolvedAbsolute = false;
  for (let i2 = pathSegments.length - 1; i2 >= -1; i2--) {
    let path;
    const {
      Deno: Deno2
    } = globalThis;
    if (i2 >= 0) {
      path = pathSegments[i2];
    } else if (!resolvedDevice) {
      if (typeof Deno2?.cwd !== "function") {
        throw new TypeError("Resolved a drive-letter-less path without a current working directory (CWD)");
      }
      path = Deno2.cwd();
    } else {
      if (typeof Deno2?.env?.get !== "function" || typeof Deno2?.cwd !== "function") {
        throw new TypeError("Resolved a relative path without a current working directory (CWD)");
      }
      path = Deno2.cwd();
      if (path === void 0 || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
        path = `${resolvedDevice}\\`;
      }
    }
    assertPath(path);
    const len = path.length;
    if (len === 0) continue;
    let rootEnd = 0;
    let device = "";
    let isAbsolute2 = false;
    const code2 = path.charCodeAt(0);
    if (len > 1) {
      if (isPathSeparator(code2)) {
        isAbsolute2 = true;
        if (isPathSeparator(path.charCodeAt(1))) {
          let j2 = 2;
          let last = j2;
          for (; j2 < len; ++j2) {
            if (isPathSeparator(path.charCodeAt(j2))) break;
          }
          if (j2 < len && j2 !== last) {
            const firstPart = path.slice(last, j2);
            last = j2;
            for (; j2 < len; ++j2) {
              if (!isPathSeparator(path.charCodeAt(j2))) break;
            }
            if (j2 < len && j2 !== last) {
              last = j2;
              for (; j2 < len; ++j2) {
                if (isPathSeparator(path.charCodeAt(j2))) break;
              }
              if (j2 === len) {
                device = `\\\\${firstPart}\\${path.slice(last)}`;
                rootEnd = j2;
              } else if (j2 !== last) {
                device = `\\\\${firstPart}\\${path.slice(last, j2)}`;
                rootEnd = j2;
              }
            }
          }
        } else {
          rootEnd = 1;
        }
      } else if (isWindowsDeviceRoot(code2)) {
        if (path.charCodeAt(1) === CHAR_COLON) {
          device = path.slice(0, 2);
          rootEnd = 2;
          if (len > 2) {
            if (isPathSeparator(path.charCodeAt(2))) {
              isAbsolute2 = true;
              rootEnd = 3;
            }
          }
        }
      }
    } else if (isPathSeparator(code2)) {
      rootEnd = 1;
      isAbsolute2 = true;
    }
    if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
      continue;
    }
    if (resolvedDevice.length === 0 && device.length > 0) {
      resolvedDevice = device;
    }
    if (!resolvedAbsolute) {
      resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
      resolvedAbsolute = isAbsolute2;
    }
    if (resolvedAbsolute && resolvedDevice.length > 0) break;
  }
  resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
  return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function relative$1(from, to) {
  assertArgs(from, to);
  const fromOrig = resolve(from);
  const toOrig = resolve(to);
  if (fromOrig === toOrig) return "";
  from = fromOrig.toLowerCase();
  to = toOrig.toLowerCase();
  if (from === to) return "";
  let fromStart = 0;
  let fromEnd = from.length;
  for (; fromStart < fromEnd; ++fromStart) {
    if (from.charCodeAt(fromStart) !== CHAR_BACKWARD_SLASH) break;
  }
  for (; fromEnd - 1 > fromStart; --fromEnd) {
    if (from.charCodeAt(fromEnd - 1) !== CHAR_BACKWARD_SLASH) break;
  }
  const fromLen = fromEnd - fromStart;
  let toStart = 0;
  let toEnd = to.length;
  for (; toStart < toEnd; ++toStart) {
    if (to.charCodeAt(toStart) !== CHAR_BACKWARD_SLASH) break;
  }
  for (; toEnd - 1 > toStart; --toEnd) {
    if (to.charCodeAt(toEnd - 1) !== CHAR_BACKWARD_SLASH) break;
  }
  const toLen = toEnd - toStart;
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i2 = 0;
  for (; i2 <= length; ++i2) {
    if (i2 === length) {
      if (toLen > length) {
        if (to.charCodeAt(toStart + i2) === CHAR_BACKWARD_SLASH) {
          return toOrig.slice(toStart + i2 + 1);
        } else if (i2 === 2) {
          return toOrig.slice(toStart + i2);
        }
      }
      if (fromLen > length) {
        if (from.charCodeAt(fromStart + i2) === CHAR_BACKWARD_SLASH) {
          lastCommonSep = i2;
        } else if (i2 === 2) {
          lastCommonSep = 3;
        }
      }
      break;
    }
    const fromCode = from.charCodeAt(fromStart + i2);
    const toCode = to.charCodeAt(toStart + i2);
    if (fromCode !== toCode) break;
    else if (fromCode === CHAR_BACKWARD_SLASH) lastCommonSep = i2;
  }
  if (i2 !== length && lastCommonSep === -1) {
    return toOrig;
  }
  let out = "";
  if (lastCommonSep === -1) lastCommonSep = 0;
  for (i2 = fromStart + lastCommonSep + 1; i2 <= fromEnd; ++i2) {
    if (i2 === fromEnd || from.charCodeAt(i2) === CHAR_BACKWARD_SLASH) {
      if (out.length === 0) out += "..";
      else out += "\\..";
    }
  }
  if (out.length > 0) {
    return out + toOrig.slice(toStart + lastCommonSep, toEnd);
  } else {
    toStart += lastCommonSep;
    if (toOrig.charCodeAt(toStart) === CHAR_BACKWARD_SLASH) ++toStart;
    return toOrig.slice(toStart, toEnd);
  }
}
function relative(from, to) {
  return isWindows ? relative$1(from, to) : relative$2(from, to);
}
var exports$I = {};
Object.defineProperty(exports$I, "__esModule", {
  value: true
});
Object.defineProperty(exports$I, "__esModule", {
  value: true
});
exports$I.VERSION = void 0;
exports$I.VERSION = "1.9.1";
var _VERSION = exports$I.VERSION;
const _default$G = exports$I.default ?? exports$I;
var __require$G = exports$I;
exports$I.__esModule;
const _mod$c = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VERSION: _VERSION,
  __require: __require$G,
  default: _default$G
}, Symbol.toStringTag, { value: "Module" }));
var exports$H = {};
Object.defineProperty(exports$H, "__esModule", {
  value: true
});
Object.defineProperty(exports$H, "__esModule", {
  value: true
});
const version_1$1 = __require$G ?? _default$G ?? _mod$c;
const re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
function _makeCompatibilityCheck(ownVersion) {
  const acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
  const rejectedVersions = /* @__PURE__ */ new Set();
  const myVersionMatch = ownVersion.match(re);
  if (!myVersionMatch) {
    return () => false;
  }
  const ownVersionParsed = {
    major: +myVersionMatch[1],
    minor: +myVersionMatch[2],
    patch: +myVersionMatch[3],
    prerelease: myVersionMatch[4]
  };
  if (ownVersionParsed.prerelease != null) {
    return function isExactmatch(globalVersion) {
      return globalVersion === ownVersion;
    };
  }
  function _reject(v2) {
    rejectedVersions.add(v2);
    return false;
  }
  function _accept(v2) {
    acceptedVersions.add(v2);
    return true;
  }
  return function isCompatible(globalVersion) {
    if (acceptedVersions.has(globalVersion)) {
      return true;
    }
    if (rejectedVersions.has(globalVersion)) {
      return false;
    }
    const globalVersionMatch = globalVersion.match(re);
    if (!globalVersionMatch) {
      return _reject(globalVersion);
    }
    const globalVersionParsed = {
      major: +globalVersionMatch[1],
      minor: +globalVersionMatch[2],
      patch: +globalVersionMatch[3],
      prerelease: globalVersionMatch[4]
    };
    if (globalVersionParsed.prerelease != null) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major !== globalVersionParsed.major) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major === 0) {
      if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
        return _accept(globalVersion);
      }
      return _reject(globalVersion);
    }
    if (ownVersionParsed.minor <= globalVersionParsed.minor) {
      return _accept(globalVersion);
    }
    return _reject(globalVersion);
  };
}
exports$H._makeCompatibilityCheck = _makeCompatibilityCheck;
exports$H.isCompatible = _makeCompatibilityCheck(version_1$1.VERSION);
exports$H._makeCompatibilityCheck;
var _isCompatible = exports$H.isCompatible;
const _default$F = exports$H.default ?? exports$H;
var __require$F = exports$H;
exports$H.__esModule;
const _mod2$6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$F,
  default: _default$F,
  isCompatible: _isCompatible
}, Symbol.toStringTag, { value: "Module" }));
var exports$G = {};
Object.defineProperty(exports$G, "__esModule", {
  value: true
});
Object.defineProperty(exports$G, "__esModule", {
  value: true
});
const version_1 = __require$G ?? _default$G ?? _mod$c;
const semver_1 = __require$F ?? _default$F ?? _mod2$6;
const major = version_1.VERSION.split(".")[0];
const GLOBAL_OPENTELEMETRY_API_KEY = /* @__PURE__ */ Symbol.for(`opentelemetry.js.api.${major}`);
const _global = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};
function registerGlobal(type, instance, diag2, allowOverride = false) {
  var _a;
  const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : {
    version: version_1.VERSION
  };
  if (!allowOverride && api[type]) {
    const err = new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
    diag2.error(err.stack || err.message);
    return false;
  }
  if (api.version !== version_1.VERSION) {
    const err = new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${version_1.VERSION}`);
    diag2.error(err.stack || err.message);
    return false;
  }
  api[type] = instance;
  diag2.debug(`@opentelemetry/api: Registered a global for ${type} v${version_1.VERSION}.`);
  return true;
}
exports$G.registerGlobal = registerGlobal;
function getGlobal(type) {
  var _a, _b;
  const globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
  if (!globalVersion || !(0, semver_1.isCompatible)(globalVersion)) {
    return;
  }
  return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
}
exports$G.getGlobal = getGlobal;
function unregisterGlobal(type, diag2) {
  diag2.debug(`@opentelemetry/api: Unregistering a global for ${type} v${version_1.VERSION}.`);
  const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
  if (api) {
    delete api[type];
  }
}
exports$G.unregisterGlobal = unregisterGlobal;
var _registerGlobal = exports$G.registerGlobal;
var _getGlobal = exports$G.getGlobal;
var _unregisterGlobal = exports$G.unregisterGlobal;
const _default$E = exports$G.default ?? exports$G;
var __require$E = exports$G;
exports$G.__esModule;
const _mod2$5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$E,
  default: _default$E,
  getGlobal: _getGlobal,
  registerGlobal: _registerGlobal,
  unregisterGlobal: _unregisterGlobal
}, Symbol.toStringTag, { value: "Module" }));
var exports$F = {};
Object.defineProperty(exports$F, "__esModule", {
  value: true
});
Object.defineProperty(exports$F, "__esModule", {
  value: true
});
exports$F.DiagLogLevel = void 0;
(function(DiagLogLevel) {
  DiagLogLevel[DiagLogLevel["NONE"] = 0] = "NONE";
  DiagLogLevel[DiagLogLevel["ERROR"] = 30] = "ERROR";
  DiagLogLevel[DiagLogLevel["WARN"] = 50] = "WARN";
  DiagLogLevel[DiagLogLevel["INFO"] = 60] = "INFO";
  DiagLogLevel[DiagLogLevel["DEBUG"] = 70] = "DEBUG";
  DiagLogLevel[DiagLogLevel["VERBOSE"] = 80] = "VERBOSE";
  DiagLogLevel[DiagLogLevel["ALL"] = 9999] = "ALL";
})(exports$F.DiagLogLevel || (exports$F.DiagLogLevel = {}));
var _DiagLogLevel = exports$F.DiagLogLevel;
const _default$D = exports$F.default ?? exports$F;
var __require$D = exports$F;
exports$F.__esModule;
const _mod4$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DiagLogLevel: _DiagLogLevel,
  __require: __require$D,
  default: _default$D
}, Symbol.toStringTag, { value: "Module" }));
var exports$E = {};
Object.defineProperty(exports$E, "__esModule", {
  value: true
});
Object.defineProperty(exports$E, "__esModule", {
  value: true
});
exports$E.createLogLevelDiagLogger = void 0;
const types_1$2 = __require$D ?? _default$D ?? _mod4$2;
function createLogLevelDiagLogger(maxLevel, logger) {
  if (maxLevel < types_1$2.DiagLogLevel.NONE) {
    maxLevel = types_1$2.DiagLogLevel.NONE;
  } else if (maxLevel > types_1$2.DiagLogLevel.ALL) {
    maxLevel = types_1$2.DiagLogLevel.ALL;
  }
  logger = logger || {};
  function _filterFunc(funcName, theLevel) {
    const theFunc = logger[funcName];
    if (typeof theFunc === "function" && maxLevel >= theLevel) {
      return theFunc.bind(logger);
    }
    return function() {
    };
  }
  return {
    error: _filterFunc("error", types_1$2.DiagLogLevel.ERROR),
    warn: _filterFunc("warn", types_1$2.DiagLogLevel.WARN),
    info: _filterFunc("info", types_1$2.DiagLogLevel.INFO),
    debug: _filterFunc("debug", types_1$2.DiagLogLevel.DEBUG),
    verbose: _filterFunc("verbose", types_1$2.DiagLogLevel.VERBOSE)
  };
}
exports$E.createLogLevelDiagLogger = createLogLevelDiagLogger;
var _createLogLevelDiagLogger = exports$E.createLogLevelDiagLogger;
const _default$C = exports$E.default ?? exports$E;
var __require$C = exports$E;
exports$E.__esModule;
const _mod2$4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$C,
  createLogLevelDiagLogger: _createLogLevelDiagLogger,
  default: _default$C
}, Symbol.toStringTag, { value: "Module" }));
var exports$D = {};
Object.defineProperty(exports$D, "__esModule", {
  value: true
});
Object.defineProperty(exports$D, "__esModule", {
  value: true
});
exports$D.DiagComponentLogger = void 0;
const global_utils_1$5 = __require$E ?? _default$E ?? _mod2$5;
class DiagComponentLogger {
  constructor(props) {
    this._namespace = props.namespace || "DiagComponentLogger";
  }
  debug(...args) {
    return logProxy("debug", this._namespace, args);
  }
  error(...args) {
    return logProxy("error", this._namespace, args);
  }
  info(...args) {
    return logProxy("info", this._namespace, args);
  }
  warn(...args) {
    return logProxy("warn", this._namespace, args);
  }
  verbose(...args) {
    return logProxy("verbose", this._namespace, args);
  }
}
exports$D.DiagComponentLogger = DiagComponentLogger;
function logProxy(funcName, namespace, args) {
  const logger = (0, global_utils_1$5.getGlobal)("diag");
  if (!logger) {
    return;
  }
  return logger[funcName](namespace, ...args);
}
var _DiagComponentLogger = exports$D.DiagComponentLogger;
const _default$B = exports$D.default ?? exports$D;
var __require$B = exports$D;
exports$D.__esModule;
const _mod$b = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DiagComponentLogger: _DiagComponentLogger,
  __require: __require$B,
  default: _default$B
}, Symbol.toStringTag, { value: "Module" }));
var exports$C = {};
Object.defineProperty(exports$C, "__esModule", {
  value: true
});
Object.defineProperty(exports$C, "__esModule", {
  value: true
});
exports$C.DiagAPI = void 0;
const ComponentLogger_1 = __require$B ?? _default$B ?? _mod$b;
const logLevelLogger_1 = __require$C ?? _default$C ?? _mod2$4;
const types_1$1 = __require$D ?? _default$D ?? _mod4$2;
const global_utils_1$4 = __require$E ?? _default$E ?? _mod2$5;
const API_NAME$4 = "diag";
class DiagAPI {
  /** Get the singleton instance of the DiagAPI API */
  static instance() {
    if (!this._instance) {
      this._instance = new DiagAPI();
    }
    return this._instance;
  }
  /**
   * Private internal constructor
   * @private
   */
  constructor() {
    function _logProxy(funcName) {
      return function(...args) {
        const logger = (0, global_utils_1$4.getGlobal)("diag");
        if (!logger) return;
        return logger[funcName](...args);
      };
    }
    const self2 = this;
    const setLogger = (logger, optionsOrLogLevel = {
      logLevel: types_1$1.DiagLogLevel.INFO
    }) => {
      var _a, _b, _c;
      if (logger === self2) {
        const err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
        self2.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
        return false;
      }
      if (typeof optionsOrLogLevel === "number") {
        optionsOrLogLevel = {
          logLevel: optionsOrLogLevel
        };
      }
      const oldLogger = (0, global_utils_1$4.getGlobal)("diag");
      const newLogger = (0, logLevelLogger_1.createLogLevelDiagLogger)((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : types_1$1.DiagLogLevel.INFO, logger);
      if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
        const stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
        oldLogger.warn(`Current logger will be overwritten from ${stack}`);
        newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
      }
      return (0, global_utils_1$4.registerGlobal)("diag", newLogger, self2, true);
    };
    self2.setLogger = setLogger;
    self2.disable = () => {
      (0, global_utils_1$4.unregisterGlobal)(API_NAME$4, self2);
    };
    self2.createComponentLogger = (options2) => {
      return new ComponentLogger_1.DiagComponentLogger(options2);
    };
    self2.verbose = _logProxy("verbose");
    self2.debug = _logProxy("debug");
    self2.info = _logProxy("info");
    self2.warn = _logProxy("warn");
    self2.error = _logProxy("error");
  }
}
exports$C.DiagAPI = DiagAPI;
var _DiagAPI = exports$C.DiagAPI;
const _default$A = exports$C.default ?? exports$C;
var __require$A = exports$C;
exports$C.__esModule;
const _mod$a = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DiagAPI: _DiagAPI,
  __require: __require$A,
  default: _default$A
}, Symbol.toStringTag, { value: "Module" }));
var exports$B = {};
Object.defineProperty(exports$B, "__esModule", {
  value: true
});
Object.defineProperty(exports$B, "__esModule", {
  value: true
});
function createContextKey(description) {
  return Symbol.for(description);
}
exports$B.createContextKey = createContextKey;
class BaseContext {
  /**
   * Construct a new context which inherits values from an optional parent context.
   *
   * @param parentContext a context from which to inherit values
   */
  constructor(parentContext) {
    const self2 = this;
    self2._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
    self2.getValue = (key) => self2._currentContext.get(key);
    self2.setValue = (key, value) => {
      const context = new BaseContext(self2._currentContext);
      context._currentContext.set(key, value);
      return context;
    };
    self2.deleteValue = (key) => {
      const context = new BaseContext(self2._currentContext);
      context._currentContext.delete(key);
      return context;
    };
  }
}
exports$B.ROOT_CONTEXT = new BaseContext();
var _createContextKey = exports$B.createContextKey;
var _ROOT_CONTEXT = exports$B.ROOT_CONTEXT;
const _default$z = exports$B.default ?? exports$B;
var __require$z = exports$B;
exports$B.__esModule;
const _mod2$3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ROOT_CONTEXT: _ROOT_CONTEXT,
  __require: __require$z,
  createContextKey: _createContextKey,
  default: _default$z
}, Symbol.toStringTag, { value: "Module" }));
var exports$A = {};
Object.defineProperty(exports$A, "__esModule", {
  value: true
});
Object.defineProperty(exports$A, "__esModule", {
  value: true
});
exports$A.NoopContextManager = void 0;
const context_1$5 = __require$z ?? _default$z ?? _mod2$3;
class NoopContextManager {
  active() {
    return context_1$5.ROOT_CONTEXT;
  }
  with(_context2, fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  bind(_context2, target) {
    return target;
  }
  enable() {
    return this;
  }
  disable() {
    return this;
  }
}
exports$A.NoopContextManager = NoopContextManager;
var _NoopContextManager = exports$A.NoopContextManager;
const _default$y = exports$A.default ?? exports$A;
var __require$y = exports$A;
exports$A.__esModule;
const _mod$9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NoopContextManager: _NoopContextManager,
  __require: __require$y,
  default: _default$y
}, Symbol.toStringTag, { value: "Module" }));
var exports$z = {};
Object.defineProperty(exports$z, "__esModule", {
  value: true
});
Object.defineProperty(exports$z, "__esModule", {
  value: true
});
exports$z.ContextAPI = void 0;
const NoopContextManager_1 = __require$y ?? _default$y ?? _mod$9;
const global_utils_1$3 = __require$E ?? _default$E ?? _mod2$5;
const diag_1$5 = __require$A ?? _default$A ?? _mod$a;
const API_NAME$3 = "context";
const NOOP_CONTEXT_MANAGER = new NoopContextManager_1.NoopContextManager();
class ContextAPI {
  /** Empty private constructor prevents end users from constructing a new instance of the API */
  constructor() {
  }
  /** Get the singleton instance of the Context API */
  static getInstance() {
    if (!this._instance) {
      this._instance = new ContextAPI();
    }
    return this._instance;
  }
  /**
   * Set the current context manager.
   *
   * @returns true if the context manager was successfully registered, else false
   */
  setGlobalContextManager(contextManager) {
    return (0, global_utils_1$3.registerGlobal)(API_NAME$3, contextManager, diag_1$5.DiagAPI.instance());
  }
  /**
   * Get the currently active context
   */
  active() {
    return this._getContextManager().active();
  }
  /**
   * Execute a function with an active context
   *
   * @param context context to be active during function execution
   * @param fn function to execute in a context
   * @param thisArg optional receiver to be used for calling fn
   * @param args optional arguments forwarded to fn
   */
  with(context, fn, thisArg, ...args) {
    return this._getContextManager().with(context, fn, thisArg, ...args);
  }
  /**
   * Bind a context to a target function or event emitter
   *
   * @param context context to bind to the event emitter or function. Defaults to the currently active context
   * @param target function or event emitter to bind
   */
  bind(context, target) {
    return this._getContextManager().bind(context, target);
  }
  _getContextManager() {
    return (0, global_utils_1$3.getGlobal)(API_NAME$3) || NOOP_CONTEXT_MANAGER;
  }
  /** Disable and remove the global context manager */
  disable() {
    this._getContextManager().disable();
    (0, global_utils_1$3.unregisterGlobal)(API_NAME$3, diag_1$5.DiagAPI.instance());
  }
}
exports$z.ContextAPI = ContextAPI;
var _ContextAPI = exports$z.ContextAPI;
const _default$x = exports$z.default ?? exports$z;
var __require$x = exports$z;
exports$z.__esModule;
const _mod$8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ContextAPI: _ContextAPI,
  __require: __require$x,
  default: _default$x
}, Symbol.toStringTag, { value: "Module" }));
var exports$y = {};
Object.defineProperty(exports$y, "__esModule", {
  value: true
});
Object.defineProperty(exports$y, "__esModule", {
  value: true
});
exports$y.TraceFlags = void 0;
(function(TraceFlags) {
  TraceFlags[TraceFlags["NONE"] = 0] = "NONE";
  TraceFlags[TraceFlags["SAMPLED"] = 1] = "SAMPLED";
})(exports$y.TraceFlags || (exports$y.TraceFlags = {}));
var _TraceFlags = exports$y.TraceFlags;
const _default$w = exports$y.default ?? exports$y;
var __require$w = exports$y;
exports$y.__esModule;
const _mod11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  TraceFlags: _TraceFlags,
  __require: __require$w,
  default: _default$w
}, Symbol.toStringTag, { value: "Module" }));
var exports$x = {};
Object.defineProperty(exports$x, "__esModule", {
  value: true
});
Object.defineProperty(exports$x, "__esModule", {
  value: true
});
const trace_flags_1$1 = __require$w ?? _default$w ?? _mod11;
exports$x.INVALID_SPANID = "0000000000000000";
exports$x.INVALID_TRACEID = "00000000000000000000000000000000";
exports$x.INVALID_SPAN_CONTEXT = {
  traceId: exports$x.INVALID_TRACEID,
  spanId: exports$x.INVALID_SPANID,
  traceFlags: trace_flags_1$1.TraceFlags.NONE
};
var _INVALID_SPANID = exports$x.INVALID_SPANID;
var _INVALID_TRACEID = exports$x.INVALID_TRACEID;
var _INVALID_SPAN_CONTEXT = exports$x.INVALID_SPAN_CONTEXT;
const _default$v = exports$x.default ?? exports$x;
var __require$v = exports$x;
exports$x.__esModule;
const _mod14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  INVALID_SPANID: _INVALID_SPANID,
  INVALID_SPAN_CONTEXT: _INVALID_SPAN_CONTEXT,
  INVALID_TRACEID: _INVALID_TRACEID,
  __require: __require$v,
  default: _default$v
}, Symbol.toStringTag, { value: "Module" }));
var exports$w = {};
Object.defineProperty(exports$w, "__esModule", {
  value: true
});
Object.defineProperty(exports$w, "__esModule", {
  value: true
});
exports$w.NonRecordingSpan = void 0;
const invalid_span_constants_1$2 = __require$v ?? _default$v ?? _mod14;
class NonRecordingSpan {
  constructor(spanContext = invalid_span_constants_1$2.INVALID_SPAN_CONTEXT) {
    this._spanContext = spanContext;
  }
  // Returns a SpanContext.
  spanContext() {
    return this._spanContext;
  }
  // By default does nothing
  setAttribute(_key, _value) {
    return this;
  }
  // By default does nothing
  setAttributes(_attributes) {
    return this;
  }
  // By default does nothing
  addEvent(_name, _attributes) {
    return this;
  }
  addLink(_link) {
    return this;
  }
  addLinks(_links) {
    return this;
  }
  // By default does nothing
  setStatus(_status) {
    return this;
  }
  // By default does nothing
  updateName(_name) {
    return this;
  }
  // By default does nothing
  end(_endTime) {
  }
  // isRecording always returns false for NonRecordingSpan.
  isRecording() {
    return false;
  }
  // By default does nothing
  recordException(_exception, _time) {
  }
}
exports$w.NonRecordingSpan = NonRecordingSpan;
var _NonRecordingSpan = exports$w.NonRecordingSpan;
const _default$u = exports$w.default ?? exports$w;
var __require$u = exports$w;
exports$w.__esModule;
const _mod3$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NonRecordingSpan: _NonRecordingSpan,
  __require: __require$u,
  default: _default$u
}, Symbol.toStringTag, { value: "Module" }));
var exports$v = {};
Object.defineProperty(exports$v, "__esModule", {
  value: true
});
Object.defineProperty(exports$v, "__esModule", {
  value: true
});
const context_1$4 = __require$z ?? _default$z ?? _mod2$3;
const NonRecordingSpan_1$2 = __require$u ?? _default$u ?? _mod3$2;
const context_2$1 = __require$x ?? _default$x ?? _mod$8;
const SPAN_KEY = (0, context_1$4.createContextKey)("OpenTelemetry Context Key SPAN");
function getSpan(context) {
  return context.getValue(SPAN_KEY) || void 0;
}
exports$v.getSpan = getSpan;
function getActiveSpan() {
  return getSpan(context_2$1.ContextAPI.getInstance().active());
}
exports$v.getActiveSpan = getActiveSpan;
function setSpan(context, span) {
  return context.setValue(SPAN_KEY, span);
}
exports$v.setSpan = setSpan;
function deleteSpan(context) {
  return context.deleteValue(SPAN_KEY);
}
exports$v.deleteSpan = deleteSpan;
function setSpanContext(context, spanContext) {
  return setSpan(context, new NonRecordingSpan_1$2.NonRecordingSpan(spanContext));
}
exports$v.setSpanContext = setSpanContext;
function getSpanContext(context) {
  var _a;
  return (_a = getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
}
exports$v.getSpanContext = getSpanContext;
var _getSpan = exports$v.getSpan;
var _getActiveSpan = exports$v.getActiveSpan;
var _setSpan = exports$v.setSpan;
var _deleteSpan = exports$v.deleteSpan;
var _setSpanContext = exports$v.setSpanContext;
var _getSpanContext = exports$v.getSpanContext;
const _default$t = exports$v.default ?? exports$v;
var __require$t = exports$v;
exports$v.__esModule;
const _mod4$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$t,
  default: _default$t,
  deleteSpan: _deleteSpan,
  getActiveSpan: _getActiveSpan,
  getSpan: _getSpan,
  getSpanContext: _getSpanContext,
  setSpan: _setSpan,
  setSpanContext: _setSpanContext
}, Symbol.toStringTag, { value: "Module" }));
var exports$u = {};
Object.defineProperty(exports$u, "__esModule", {
  value: true
});
Object.defineProperty(exports$u, "__esModule", {
  value: true
});
const invalid_span_constants_1$1 = __require$v ?? _default$v ?? _mod14;
const NonRecordingSpan_1$1 = __require$u ?? _default$u ?? _mod3$2;
const isHex = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
function isValidHex(id, length) {
  if (typeof id !== "string" || id.length !== length) return false;
  let r2 = 0;
  for (let i2 = 0; i2 < id.length; i2 += 4) {
    r2 += (isHex[id.charCodeAt(i2)] | 0) + (isHex[id.charCodeAt(i2 + 1)] | 0) + (isHex[id.charCodeAt(i2 + 2)] | 0) + (isHex[id.charCodeAt(i2 + 3)] | 0);
  }
  return r2 === length;
}
function isValidTraceId(traceId) {
  return isValidHex(traceId, 32) && traceId !== invalid_span_constants_1$1.INVALID_TRACEID;
}
exports$u.isValidTraceId = isValidTraceId;
function isValidSpanId(spanId) {
  return isValidHex(spanId, 16) && spanId !== invalid_span_constants_1$1.INVALID_SPANID;
}
exports$u.isValidSpanId = isValidSpanId;
function isSpanContextValid(spanContext) {
  return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
exports$u.isSpanContextValid = isSpanContextValid;
function wrapSpanContext(spanContext) {
  return new NonRecordingSpan_1$1.NonRecordingSpan(spanContext);
}
exports$u.wrapSpanContext = wrapSpanContext;
var _isValidTraceId = exports$u.isValidTraceId;
var _isValidSpanId = exports$u.isValidSpanId;
var _isSpanContextValid = exports$u.isSpanContextValid;
var _wrapSpanContext = exports$u.wrapSpanContext;
const _default$s = exports$u.default ?? exports$u;
var __require$s = exports$u;
exports$u.__esModule;
const _mod13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$s,
  default: _default$s,
  isSpanContextValid: _isSpanContextValid,
  isValidSpanId: _isValidSpanId,
  isValidTraceId: _isValidTraceId,
  wrapSpanContext: _wrapSpanContext
}, Symbol.toStringTag, { value: "Module" }));
var exports$t = {};
Object.defineProperty(exports$t, "__esModule", {
  value: true
});
Object.defineProperty(exports$t, "__esModule", {
  value: true
});
exports$t.NoopTracer = void 0;
const context_1$3 = __require$x ?? _default$x ?? _mod$8;
const context_utils_1$1 = __require$t ?? _default$t ?? _mod4$1;
const NonRecordingSpan_1 = __require$u ?? _default$u ?? _mod3$2;
const spancontext_utils_1$2 = __require$s ?? _default$s ?? _mod13;
const contextApi = context_1$3.ContextAPI.getInstance();
class NoopTracer {
  // startSpan starts a noop span.
  startSpan(name, options2, context = contextApi.active()) {
    const root2 = Boolean(options2 === null || options2 === void 0 ? void 0 : options2.root);
    if (root2) {
      return new NonRecordingSpan_1.NonRecordingSpan();
    }
    const parentFromContext = context && (0, context_utils_1$1.getSpanContext)(context);
    if (isSpanContext(parentFromContext) && (0, spancontext_utils_1$2.isSpanContextValid)(parentFromContext)) {
      return new NonRecordingSpan_1.NonRecordingSpan(parentFromContext);
    } else {
      return new NonRecordingSpan_1.NonRecordingSpan();
    }
  }
  startActiveSpan(name, arg2, arg3, arg4) {
    let opts;
    let ctx;
    let fn;
    if (arguments.length < 2) {
      return;
    } else if (arguments.length === 2) {
      fn = arg2;
    } else if (arguments.length === 3) {
      opts = arg2;
      fn = arg3;
    } else {
      opts = arg2;
      ctx = arg3;
      fn = arg4;
    }
    const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
    const span = this.startSpan(name, opts, parentContext);
    const contextWithSpanSet = (0, context_utils_1$1.setSpan)(parentContext, span);
    return contextApi.with(contextWithSpanSet, fn, void 0, span);
  }
}
exports$t.NoopTracer = NoopTracer;
function isSpanContext(spanContext) {
  return spanContext !== null && typeof spanContext === "object" && "spanId" in spanContext && typeof spanContext["spanId"] === "string" && "traceId" in spanContext && typeof spanContext["traceId"] === "string" && "traceFlags" in spanContext && typeof spanContext["traceFlags"] === "number";
}
var _NoopTracer = exports$t.NoopTracer;
const _default$r = exports$t.default ?? exports$t;
var __require$r = exports$t;
exports$t.__esModule;
const _mod$7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NoopTracer: _NoopTracer,
  __require: __require$r,
  default: _default$r
}, Symbol.toStringTag, { value: "Module" }));
var exports$s = {};
Object.defineProperty(exports$s, "__esModule", {
  value: true
});
Object.defineProperty(exports$s, "__esModule", {
  value: true
});
exports$s.NoopTracerProvider = void 0;
const NoopTracer_1$1 = __require$r ?? _default$r ?? _mod$7;
class NoopTracerProvider {
  getTracer(_name, _version, _options) {
    return new NoopTracer_1$1.NoopTracer();
  }
}
exports$s.NoopTracerProvider = NoopTracerProvider;
var _NoopTracerProvider = exports$s.NoopTracerProvider;
const _default$q = exports$s.default ?? exports$s;
var __require$q = exports$s;
exports$s.__esModule;
const _mod2$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NoopTracerProvider: _NoopTracerProvider,
  __require: __require$q,
  default: _default$q
}, Symbol.toStringTag, { value: "Module" }));
var exports$r = {};
Object.defineProperty(exports$r, "__esModule", {
  value: true
});
Object.defineProperty(exports$r, "__esModule", {
  value: true
});
exports$r.ProxyTracer = void 0;
const NoopTracer_1 = __require$r ?? _default$r ?? _mod$7;
const NOOP_TRACER = new NoopTracer_1.NoopTracer();
class ProxyTracer {
  constructor(provider, name, version2, options2) {
    this._provider = provider;
    this.name = name;
    this.version = version2;
    this.options = options2;
  }
  startSpan(name, options2, context) {
    return this._getTracer().startSpan(name, options2, context);
  }
  startActiveSpan(_name, _options, _context2, _fn) {
    const tracer2 = this._getTracer();
    return Reflect.apply(tracer2.startActiveSpan, tracer2, arguments);
  }
  /**
   * Try to get a tracer from the proxy tracer provider.
   * If the proxy tracer provider has no delegate, return a noop tracer.
   */
  _getTracer() {
    if (this._delegate) {
      return this._delegate;
    }
    const tracer2 = this._provider.getDelegateTracer(this.name, this.version, this.options);
    if (!tracer2) {
      return NOOP_TRACER;
    }
    this._delegate = tracer2;
    return this._delegate;
  }
}
exports$r.ProxyTracer = ProxyTracer;
var _ProxyTracer = exports$r.ProxyTracer;
const _default$p = exports$r.default ?? exports$r;
var __require$p = exports$r;
exports$r.__esModule;
const _mod8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProxyTracer: _ProxyTracer,
  __require: __require$p,
  default: _default$p
}, Symbol.toStringTag, { value: "Module" }));
var exports$q = {};
Object.defineProperty(exports$q, "__esModule", {
  value: true
});
Object.defineProperty(exports$q, "__esModule", {
  value: true
});
exports$q.ProxyTracerProvider = void 0;
const ProxyTracer_1$1 = __require$p ?? _default$p ?? _mod8;
const NoopTracerProvider_1 = __require$q ?? _default$q ?? _mod2$2;
const NOOP_TRACER_PROVIDER = new NoopTracerProvider_1.NoopTracerProvider();
class ProxyTracerProvider {
  /**
   * Get a {@link ProxyTracer}
   */
  getTracer(name, version2, options2) {
    var _a;
    return (_a = this.getDelegateTracer(name, version2, options2)) !== null && _a !== void 0 ? _a : new ProxyTracer_1$1.ProxyTracer(this, name, version2, options2);
  }
  getDelegate() {
    var _a;
    return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
  }
  /**
   * Set the delegate tracer provider
   */
  setDelegate(delegate) {
    this._delegate = delegate;
  }
  getDelegateTracer(name, version2, options2) {
    var _a;
    return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version2, options2);
  }
}
exports$q.ProxyTracerProvider = ProxyTracerProvider;
var _ProxyTracerProvider = exports$q.ProxyTracerProvider;
const _default$o = exports$q.default ?? exports$q;
var __require$o = exports$q;
exports$q.__esModule;
const _mod9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProxyTracerProvider: _ProxyTracerProvider,
  __require: __require$o,
  default: _default$o
}, Symbol.toStringTag, { value: "Module" }));
var exports$p = {};
Object.defineProperty(exports$p, "__esModule", {
  value: true
});
Object.defineProperty(exports$p, "__esModule", {
  value: true
});
exports$p.TraceAPI = void 0;
const global_utils_1$2 = __require$E ?? _default$E ?? _mod2$5;
const ProxyTracerProvider_1$1 = __require$o ?? _default$o ?? _mod9;
const spancontext_utils_1$1 = __require$s ?? _default$s ?? _mod13;
const context_utils_1 = __require$t ?? _default$t ?? _mod4$1;
const diag_1$4 = __require$A ?? _default$A ?? _mod$a;
const API_NAME$2 = "trace";
class TraceAPI {
  /** Empty private constructor prevents end users from constructing a new instance of the API */
  constructor() {
    this._proxyTracerProvider = new ProxyTracerProvider_1$1.ProxyTracerProvider();
    this.wrapSpanContext = spancontext_utils_1$1.wrapSpanContext;
    this.isSpanContextValid = spancontext_utils_1$1.isSpanContextValid;
    this.deleteSpan = context_utils_1.deleteSpan;
    this.getSpan = context_utils_1.getSpan;
    this.getActiveSpan = context_utils_1.getActiveSpan;
    this.getSpanContext = context_utils_1.getSpanContext;
    this.setSpan = context_utils_1.setSpan;
    this.setSpanContext = context_utils_1.setSpanContext;
  }
  /** Get the singleton instance of the Trace API */
  static getInstance() {
    if (!this._instance) {
      this._instance = new TraceAPI();
    }
    return this._instance;
  }
  /**
   * Set the current global tracer.
   *
   * @returns true if the tracer provider was successfully registered, else false
   */
  setGlobalTracerProvider(provider) {
    const success = (0, global_utils_1$2.registerGlobal)(API_NAME$2, this._proxyTracerProvider, diag_1$4.DiagAPI.instance());
    if (success) {
      this._proxyTracerProvider.setDelegate(provider);
    }
    return success;
  }
  /**
   * Returns the global tracer provider.
   */
  getTracerProvider() {
    return (0, global_utils_1$2.getGlobal)(API_NAME$2) || this._proxyTracerProvider;
  }
  /**
   * Returns a tracer from the global tracer provider.
   */
  getTracer(name, version2) {
    return this.getTracerProvider().getTracer(name, version2);
  }
  /** Remove the global tracer provider */
  disable() {
    (0, global_utils_1$2.unregisterGlobal)(API_NAME$2, diag_1$4.DiagAPI.instance());
    this._proxyTracerProvider = new ProxyTracerProvider_1$1.ProxyTracerProvider();
  }
}
exports$p.TraceAPI = TraceAPI;
var _TraceAPI = exports$p.TraceAPI;
const _default$n = exports$p.default ?? exports$p;
var __require$n = exports$p;
exports$p.__esModule;
const _mod$6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  TraceAPI: _TraceAPI,
  __require: __require$n,
  default: _default$n
}, Symbol.toStringTag, { value: "Module" }));
var exports$o = {};
Object.defineProperty(exports$o, "__esModule", {
  value: true
});
Object.defineProperty(exports$o, "__esModule", {
  value: true
});
exports$o.trace = void 0;
const trace_1 = __require$n ?? _default$n ?? _mod$6;
exports$o.trace = trace_1.TraceAPI.getInstance();
var _trace$1 = exports$o.trace;
const _default$m = exports$o.default ?? exports$o;
var __require$m = exports$o;
exports$o.__esModule;
const _mod19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$m,
  default: _default$m,
  trace: _trace$1
}, Symbol.toStringTag, { value: "Module" }));
var exports$n = {};
Object.defineProperty(exports$n, "__esModule", {
  value: true
});
Object.defineProperty(exports$n, "__esModule", {
  value: true
});
exports$n.baggageEntryMetadataSymbol = void 0;
exports$n.baggageEntryMetadataSymbol = /* @__PURE__ */ Symbol("BaggageEntryMetadata");
var _baggageEntryMetadataSymbol = exports$n.baggageEntryMetadataSymbol;
const _default$l = exports$n.default ?? exports$n;
var __require$l = exports$n;
exports$n.__esModule;
const _mod3$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$l,
  baggageEntryMetadataSymbol: _baggageEntryMetadataSymbol,
  default: _default$l
}, Symbol.toStringTag, { value: "Module" }));
var exports$m = {};
Object.defineProperty(exports$m, "__esModule", {
  value: true
});
Object.defineProperty(exports$m, "__esModule", {
  value: true
});
exports$m.BaggageImpl = void 0;
class BaggageImpl {
  constructor(entries) {
    this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
  }
  getEntry(key) {
    const entry = this._entries.get(key);
    if (!entry) {
      return void 0;
    }
    return Object.assign({}, entry);
  }
  getAllEntries() {
    return Array.from(this._entries.entries());
  }
  setEntry(key, entry) {
    const newBaggage = new BaggageImpl(this._entries);
    newBaggage._entries.set(key, entry);
    return newBaggage;
  }
  removeEntry(key) {
    const newBaggage = new BaggageImpl(this._entries);
    newBaggage._entries.delete(key);
    return newBaggage;
  }
  removeEntries(...keys) {
    const newBaggage = new BaggageImpl(this._entries);
    for (const key of keys) {
      newBaggage._entries.delete(key);
    }
    return newBaggage;
  }
  clear() {
    return new BaggageImpl();
  }
}
exports$m.BaggageImpl = BaggageImpl;
var _BaggageImpl = exports$m.BaggageImpl;
const _default$k = exports$m.default ?? exports$m;
var __require$k = exports$m;
exports$m.__esModule;
const _mod2$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BaggageImpl: _BaggageImpl,
  __require: __require$k,
  default: _default$k
}, Symbol.toStringTag, { value: "Module" }));
var exports$l = {};
Object.defineProperty(exports$l, "__esModule", {
  value: true
});
Object.defineProperty(exports$l, "__esModule", {
  value: true
});
const diag_1$3 = __require$A ?? _default$A ?? _mod$a;
const baggage_impl_1 = __require$k ?? _default$k ?? _mod2$1;
const symbol_1 = __require$l ?? _default$l ?? _mod3$1;
const diag = diag_1$3.DiagAPI.instance();
function createBaggage(entries = {}) {
  return new baggage_impl_1.BaggageImpl(new Map(Object.entries(entries)));
}
exports$l.createBaggage = createBaggage;
function baggageEntryMetadataFromString(str) {
  if (typeof str !== "string") {
    diag.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
    str = "";
  }
  return {
    __TYPE__: symbol_1.baggageEntryMetadataSymbol,
    toString() {
      return str;
    }
  };
}
exports$l.baggageEntryMetadataFromString = baggageEntryMetadataFromString;
var _createBaggage = exports$l.createBaggage;
var _baggageEntryMetadataFromString = exports$l.baggageEntryMetadataFromString;
const _default$j = exports$l.default ?? exports$l;
var __require$j = exports$l;
exports$l.__esModule;
const _mod$5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$j,
  baggageEntryMetadataFromString: _baggageEntryMetadataFromString,
  createBaggage: _createBaggage,
  default: _default$j
}, Symbol.toStringTag, { value: "Module" }));
var exports$k = {};
Object.defineProperty(exports$k, "__esModule", {
  value: true
});
Object.defineProperty(exports$k, "__esModule", {
  value: true
});
const context_1$2 = __require$x ?? _default$x ?? _mod$8;
const context_2 = __require$z ?? _default$z ?? _mod2$3;
const BAGGAGE_KEY = (0, context_2.createContextKey)("OpenTelemetry Baggage Key");
function getBaggage(context) {
  return context.getValue(BAGGAGE_KEY) || void 0;
}
exports$k.getBaggage = getBaggage;
function getActiveBaggage() {
  return getBaggage(context_1$2.ContextAPI.getInstance().active());
}
exports$k.getActiveBaggage = getActiveBaggage;
function setBaggage(context, baggage) {
  return context.setValue(BAGGAGE_KEY, baggage);
}
exports$k.setBaggage = setBaggage;
function deleteBaggage(context) {
  return context.deleteValue(BAGGAGE_KEY);
}
exports$k.deleteBaggage = deleteBaggage;
var _getBaggage = exports$k.getBaggage;
var _getActiveBaggage = exports$k.getActiveBaggage;
var _setBaggage = exports$k.setBaggage;
var _deleteBaggage = exports$k.deleteBaggage;
const _default$i = exports$k.default ?? exports$k;
var __require$i = exports$k;
exports$k.__esModule;
const _mod4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$i,
  default: _default$i,
  deleteBaggage: _deleteBaggage,
  getActiveBaggage: _getActiveBaggage,
  getBaggage: _getBaggage,
  setBaggage: _setBaggage
}, Symbol.toStringTag, { value: "Module" }));
var exports$j = {};
Object.defineProperty(exports$j, "__esModule", {
  value: true
});
Object.defineProperty(exports$j, "__esModule", {
  value: true
});
exports$j.defaultTextMapGetter = {
  get(carrier, key) {
    if (carrier == null) {
      return void 0;
    }
    return carrier[key];
  },
  keys(carrier) {
    if (carrier == null) {
      return [];
    }
    return Object.keys(carrier);
  }
};
exports$j.defaultTextMapSetter = {
  set(carrier, key, value) {
    if (carrier == null) {
      return;
    }
    carrier[key] = value;
  }
};
var _defaultTextMapGetter = exports$j.defaultTextMapGetter;
var _defaultTextMapSetter = exports$j.defaultTextMapSetter;
const _default$h = exports$j.default ?? exports$j;
var __require$h = exports$j;
exports$j.__esModule;
const _mod7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$h,
  default: _default$h,
  defaultTextMapGetter: _defaultTextMapGetter,
  defaultTextMapSetter: _defaultTextMapSetter
}, Symbol.toStringTag, { value: "Module" }));
var exports$i = {};
Object.defineProperty(exports$i, "__esModule", {
  value: true
});
Object.defineProperty(exports$i, "__esModule", {
  value: true
});
exports$i.NoopTextMapPropagator = void 0;
class NoopTextMapPropagator {
  /** Noop inject function does nothing */
  inject(_context2, _carrier) {
  }
  /** Noop extract function does nothing and returns the input context */
  extract(context, _carrier) {
    return context;
  }
  fields() {
    return [];
  }
}
exports$i.NoopTextMapPropagator = NoopTextMapPropagator;
var _NoopTextMapPropagator = exports$i.NoopTextMapPropagator;
const _default$g = exports$i.default ?? exports$i;
var __require$g = exports$i;
exports$i.__esModule;
const _mod2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NoopTextMapPropagator: _NoopTextMapPropagator,
  __require: __require$g,
  default: _default$g
}, Symbol.toStringTag, { value: "Module" }));
var exports$h = {};
Object.defineProperty(exports$h, "__esModule", {
  value: true
});
Object.defineProperty(exports$h, "__esModule", {
  value: true
});
exports$h.PropagationAPI = void 0;
const global_utils_1$1 = __require$E ?? _default$E ?? _mod2$5;
const NoopTextMapPropagator_1 = __require$g ?? _default$g ?? _mod2;
const TextMapPropagator_1$1 = __require$h ?? _default$h ?? _mod7;
const context_helpers_1 = __require$i ?? _default$i ?? _mod4;
const utils_1$1 = __require$j ?? _default$j ?? _mod$5;
const diag_1$2 = __require$A ?? _default$A ?? _mod$a;
const API_NAME$1 = "propagation";
const NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator_1.NoopTextMapPropagator();
class PropagationAPI {
  /** Empty private constructor prevents end users from constructing a new instance of the API */
  constructor() {
    this.createBaggage = utils_1$1.createBaggage;
    this.getBaggage = context_helpers_1.getBaggage;
    this.getActiveBaggage = context_helpers_1.getActiveBaggage;
    this.setBaggage = context_helpers_1.setBaggage;
    this.deleteBaggage = context_helpers_1.deleteBaggage;
  }
  /** Get the singleton instance of the Propagator API */
  static getInstance() {
    if (!this._instance) {
      this._instance = new PropagationAPI();
    }
    return this._instance;
  }
  /**
   * Set the current propagator.
   *
   * @returns true if the propagator was successfully registered, else false
   */
  setGlobalPropagator(propagator) {
    return (0, global_utils_1$1.registerGlobal)(API_NAME$1, propagator, diag_1$2.DiagAPI.instance());
  }
  /**
   * Inject context into a carrier to be propagated inter-process
   *
   * @param context Context carrying tracing data to inject
   * @param carrier carrier to inject context into
   * @param setter Function used to set values on the carrier
   */
  inject(context, carrier, setter = TextMapPropagator_1$1.defaultTextMapSetter) {
    return this._getGlobalPropagator().inject(context, carrier, setter);
  }
  /**
   * Extract context from a carrier
   *
   * @param context Context which the newly created context will inherit from
   * @param carrier Carrier to extract context from
   * @param getter Function used to extract keys from a carrier
   */
  extract(context, carrier, getter = TextMapPropagator_1$1.defaultTextMapGetter) {
    return this._getGlobalPropagator().extract(context, carrier, getter);
  }
  /**
   * Return a list of all fields which may be used by the propagator.
   */
  fields() {
    return this._getGlobalPropagator().fields();
  }
  /** Remove the global propagator */
  disable() {
    (0, global_utils_1$1.unregisterGlobal)(API_NAME$1, diag_1$2.DiagAPI.instance());
  }
  _getGlobalPropagator() {
    return (0, global_utils_1$1.getGlobal)(API_NAME$1) || NOOP_TEXT_MAP_PROPAGATOR;
  }
}
exports$h.PropagationAPI = PropagationAPI;
var _PropagationAPI = exports$h.PropagationAPI;
const _default$f = exports$h.default ?? exports$h;
var __require$f = exports$h;
exports$h.__esModule;
const _mod$4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PropagationAPI: _PropagationAPI,
  __require: __require$f,
  default: _default$f
}, Symbol.toStringTag, { value: "Module" }));
var exports$g = {};
Object.defineProperty(exports$g, "__esModule", {
  value: true
});
Object.defineProperty(exports$g, "__esModule", {
  value: true
});
exports$g.propagation = void 0;
const propagation_1 = __require$f ?? _default$f ?? _mod$4;
exports$g.propagation = propagation_1.PropagationAPI.getInstance();
var _propagation = exports$g.propagation;
const _default$e = exports$g.default ?? exports$g;
var __require$e = exports$g;
exports$g.__esModule;
const _mod18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$e,
  default: _default$e,
  propagation: _propagation
}, Symbol.toStringTag, { value: "Module" }));
var exports$f = {};
Object.defineProperty(exports$f, "__esModule", {
  value: true
});
Object.defineProperty(exports$f, "__esModule", {
  value: true
});
class NoopMeter {
  constructor() {
  }
  /**
   * @see {@link Meter.createGauge}
   */
  createGauge(_name, _options) {
    return exports$f.NOOP_GAUGE_METRIC;
  }
  /**
   * @see {@link Meter.createHistogram}
   */
  createHistogram(_name, _options) {
    return exports$f.NOOP_HISTOGRAM_METRIC;
  }
  /**
   * @see {@link Meter.createCounter}
   */
  createCounter(_name, _options) {
    return exports$f.NOOP_COUNTER_METRIC;
  }
  /**
   * @see {@link Meter.createUpDownCounter}
   */
  createUpDownCounter(_name, _options) {
    return exports$f.NOOP_UP_DOWN_COUNTER_METRIC;
  }
  /**
   * @see {@link Meter.createObservableGauge}
   */
  createObservableGauge(_name, _options) {
    return exports$f.NOOP_OBSERVABLE_GAUGE_METRIC;
  }
  /**
   * @see {@link Meter.createObservableCounter}
   */
  createObservableCounter(_name, _options) {
    return exports$f.NOOP_OBSERVABLE_COUNTER_METRIC;
  }
  /**
   * @see {@link Meter.createObservableUpDownCounter}
   */
  createObservableUpDownCounter(_name, _options) {
    return exports$f.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
  }
  /**
   * @see {@link Meter.addBatchObservableCallback}
   */
  addBatchObservableCallback(_callback, _observables) {
  }
  /**
   * @see {@link Meter.removeBatchObservableCallback}
   */
  removeBatchObservableCallback(_callback) {
  }
}
exports$f.NoopMeter = NoopMeter;
class NoopMetric {
}
exports$f.NoopMetric = NoopMetric;
class NoopCounterMetric extends NoopMetric {
  add(_value, _attributes) {
  }
}
exports$f.NoopCounterMetric = NoopCounterMetric;
class NoopUpDownCounterMetric extends NoopMetric {
  add(_value, _attributes) {
  }
}
exports$f.NoopUpDownCounterMetric = NoopUpDownCounterMetric;
class NoopGaugeMetric extends NoopMetric {
  record(_value, _attributes) {
  }
}
exports$f.NoopGaugeMetric = NoopGaugeMetric;
class NoopHistogramMetric extends NoopMetric {
  record(_value, _attributes) {
  }
}
exports$f.NoopHistogramMetric = NoopHistogramMetric;
class NoopObservableMetric {
  addCallback(_callback) {
  }
  removeCallback(_callback) {
  }
}
exports$f.NoopObservableMetric = NoopObservableMetric;
class NoopObservableCounterMetric extends NoopObservableMetric {
}
exports$f.NoopObservableCounterMetric = NoopObservableCounterMetric;
class NoopObservableGaugeMetric extends NoopObservableMetric {
}
exports$f.NoopObservableGaugeMetric = NoopObservableGaugeMetric;
class NoopObservableUpDownCounterMetric extends NoopObservableMetric {
}
exports$f.NoopObservableUpDownCounterMetric = NoopObservableUpDownCounterMetric;
exports$f.NOOP_METER = new NoopMeter();
exports$f.NOOP_COUNTER_METRIC = new NoopCounterMetric();
exports$f.NOOP_GAUGE_METRIC = new NoopGaugeMetric();
exports$f.NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
exports$f.NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
exports$f.NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
exports$f.NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
exports$f.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
function createNoopMeter() {
  return exports$f.NOOP_METER;
}
exports$f.createNoopMeter = createNoopMeter;
exports$f.NOOP_GAUGE_METRIC;
exports$f.NOOP_HISTOGRAM_METRIC;
exports$f.NOOP_COUNTER_METRIC;
exports$f.NOOP_UP_DOWN_COUNTER_METRIC;
exports$f.NOOP_OBSERVABLE_GAUGE_METRIC;
exports$f.NOOP_OBSERVABLE_COUNTER_METRIC;
exports$f.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
exports$f.NoopMeter;
exports$f.NoopMetric;
exports$f.NoopCounterMetric;
exports$f.NoopUpDownCounterMetric;
exports$f.NoopGaugeMetric;
exports$f.NoopHistogramMetric;
exports$f.NoopObservableMetric;
exports$f.NoopObservableCounterMetric;
exports$f.NoopObservableGaugeMetric;
exports$f.NoopObservableUpDownCounterMetric;
var _NOOP_METER = exports$f.NOOP_METER;
var _createNoopMeter = exports$f.createNoopMeter;
const _default$d = exports$f.default ?? exports$f;
var __require$d = exports$f;
exports$f.__esModule;
const _mod5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NOOP_METER: _NOOP_METER,
  __require: __require$d,
  createNoopMeter: _createNoopMeter,
  default: _default$d
}, Symbol.toStringTag, { value: "Module" }));
var exports$e = {};
Object.defineProperty(exports$e, "__esModule", {
  value: true
});
Object.defineProperty(exports$e, "__esModule", {
  value: true
});
const NoopMeter_1$1 = __require$d ?? _default$d ?? _mod5;
class NoopMeterProvider {
  getMeter(_name, _version, _options) {
    return NoopMeter_1$1.NOOP_METER;
  }
}
exports$e.NoopMeterProvider = NoopMeterProvider;
exports$e.NOOP_METER_PROVIDER = new NoopMeterProvider();
exports$e.NoopMeterProvider;
var _NOOP_METER_PROVIDER = exports$e.NOOP_METER_PROVIDER;
const _default$c = exports$e.default ?? exports$e;
var __require$c = exports$e;
exports$e.__esModule;
const _mod$3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NOOP_METER_PROVIDER: _NOOP_METER_PROVIDER,
  __require: __require$c,
  default: _default$c
}, Symbol.toStringTag, { value: "Module" }));
var exports$d = {};
Object.defineProperty(exports$d, "__esModule", {
  value: true
});
Object.defineProperty(exports$d, "__esModule", {
  value: true
});
exports$d.MetricsAPI = void 0;
const NoopMeterProvider_1 = __require$c ?? _default$c ?? _mod$3;
const global_utils_1 = __require$E ?? _default$E ?? _mod2$5;
const diag_1$1 = __require$A ?? _default$A ?? _mod$a;
const API_NAME = "metrics";
class MetricsAPI {
  /** Empty private constructor prevents end users from constructing a new instance of the API */
  constructor() {
  }
  /** Get the singleton instance of the Metrics API */
  static getInstance() {
    if (!this._instance) {
      this._instance = new MetricsAPI();
    }
    return this._instance;
  }
  /**
   * Set the current global meter provider.
   * Returns true if the meter provider was successfully registered, else false.
   */
  setGlobalMeterProvider(provider) {
    return (0, global_utils_1.registerGlobal)(API_NAME, provider, diag_1$1.DiagAPI.instance());
  }
  /**
   * Returns the global meter provider.
   */
  getMeterProvider() {
    return (0, global_utils_1.getGlobal)(API_NAME) || NoopMeterProvider_1.NOOP_METER_PROVIDER;
  }
  /**
   * Returns a meter from the global meter provider.
   */
  getMeter(name, version2, options2) {
    return this.getMeterProvider().getMeter(name, version2, options2);
  }
  /** Remove the global meter provider */
  disable() {
    (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1$1.DiagAPI.instance());
  }
}
exports$d.MetricsAPI = MetricsAPI;
var _MetricsAPI = exports$d.MetricsAPI;
const _default$b = exports$d.default ?? exports$d;
var __require$b = exports$d;
exports$d.__esModule;
const _mod$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MetricsAPI: _MetricsAPI,
  __require: __require$b,
  default: _default$b
}, Symbol.toStringTag, { value: "Module" }));
var exports$c = {};
Object.defineProperty(exports$c, "__esModule", {
  value: true
});
Object.defineProperty(exports$c, "__esModule", {
  value: true
});
exports$c.metrics = void 0;
const metrics_1 = __require$b ?? _default$b ?? _mod$2;
exports$c.metrics = metrics_1.MetricsAPI.getInstance();
var _metrics = exports$c.metrics;
const _default$a = exports$c.default ?? exports$c;
var __require$a = exports$c;
exports$c.__esModule;
const _mod17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$a,
  default: _default$a,
  metrics: _metrics
}, Symbol.toStringTag, { value: "Module" }));
var exports$b = {};
Object.defineProperty(exports$b, "__esModule", {
  value: true
});
Object.defineProperty(exports$b, "__esModule", {
  value: true
});
exports$b.diag = void 0;
const diag_1 = __require$A ?? _default$A ?? _mod$a;
exports$b.diag = diag_1.DiagAPI.instance();
var _diag = exports$b.diag;
const _default$9 = exports$b.default ?? exports$b;
var __require$9 = exports$b;
exports$b.__esModule;
const _mod16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$9,
  default: _default$9,
  diag: _diag
}, Symbol.toStringTag, { value: "Module" }));
var exports$a = {};
Object.defineProperty(exports$a, "__esModule", {
  value: true
});
Object.defineProperty(exports$a, "__esModule", {
  value: true
});
exports$a.context = void 0;
const context_1$1 = __require$x ?? _default$x ?? _mod$8;
exports$a.context = context_1$1.ContextAPI.getInstance();
var _context = exports$a.context;
const _default$8 = exports$a.default ?? exports$a;
var __require$8 = exports$a;
exports$a.__esModule;
const _mod15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$8,
  context: _context,
  default: _default$8
}, Symbol.toStringTag, { value: "Module" }));
var exports$9 = {};
Object.defineProperty(exports$9, "__esModule", {
  value: true
});
Object.defineProperty(exports$9, "__esModule", {
  value: true
});
const VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
const VALID_KEY = `[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`;
const VALID_VENDOR_KEY = `[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`;
const VALID_KEY_REGEX = new RegExp(`^(?:${VALID_KEY}|${VALID_VENDOR_KEY})$`);
const VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
const INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
function validateKey(key) {
  return VALID_KEY_REGEX.test(key);
}
exports$9.validateKey = validateKey;
function validateValue(value) {
  return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
}
exports$9.validateValue = validateValue;
var _validateKey = exports$9.validateKey;
var _validateValue = exports$9.validateValue;
const _default$7 = exports$9.default ?? exports$9;
var __require$7 = exports$9;
exports$9.__esModule;
const _mod$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$7,
  default: _default$7,
  validateKey: _validateKey,
  validateValue: _validateValue
}, Symbol.toStringTag, { value: "Module" }));
var exports$8 = {};
Object.defineProperty(exports$8, "__esModule", {
  value: true
});
Object.defineProperty(exports$8, "__esModule", {
  value: true
});
exports$8.TraceStateImpl = void 0;
const tracestate_validators_1 = __require$7 ?? _default$7 ?? _mod$1;
const MAX_TRACE_STATE_ITEMS = 32;
const MAX_TRACE_STATE_LEN = 512;
const LIST_MEMBERS_SEPARATOR = ",";
const LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
class TraceStateImpl {
  constructor(rawTraceState) {
    this._internalState = /* @__PURE__ */ new Map();
    if (rawTraceState) this._parse(rawTraceState);
  }
  set(key, value) {
    const traceState = this._clone();
    if (traceState._internalState.has(key)) {
      traceState._internalState.delete(key);
    }
    traceState._internalState.set(key, value);
    return traceState;
  }
  unset(key) {
    const traceState = this._clone();
    traceState._internalState.delete(key);
    return traceState;
  }
  get(key) {
    return this._internalState.get(key);
  }
  serialize() {
    return Array.from(this._internalState.keys()).reduceRight((agg, key) => {
      agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key));
      return agg;
    }, []).join(LIST_MEMBERS_SEPARATOR);
  }
  _parse(rawTraceState) {
    if (rawTraceState.length > MAX_TRACE_STATE_LEN) return;
    this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reduceRight((agg, part) => {
      const listMember = part.trim();
      const i2 = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
      if (i2 !== -1) {
        const key = listMember.slice(0, i2);
        const value = listMember.slice(i2 + 1, part.length);
        if ((0, tracestate_validators_1.validateKey)(key) && (0, tracestate_validators_1.validateValue)(value)) {
          agg.set(key, value);
        }
      }
      return agg;
    }, /* @__PURE__ */ new Map());
    if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
      this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
    }
  }
  // @ts-expect-error TS6133 Accessed in tests only.
  _keys() {
    return Array.from(this._internalState.keys()).reverse();
  }
  _clone() {
    const traceState = new TraceStateImpl();
    traceState._internalState = new Map(this._internalState);
    return traceState;
  }
}
exports$8.TraceStateImpl = TraceStateImpl;
var _TraceStateImpl = exports$8.TraceStateImpl;
const _default$6 = exports$8.default ?? exports$8;
var __require$6 = exports$8;
exports$8.__esModule;
const _mod = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  TraceStateImpl: _TraceStateImpl,
  __require: __require$6,
  default: _default$6
}, Symbol.toStringTag, { value: "Module" }));
var exports$7 = {};
Object.defineProperty(exports$7, "__esModule", {
  value: true
});
Object.defineProperty(exports$7, "__esModule", {
  value: true
});
exports$7.createTraceState = void 0;
const tracestate_impl_1 = __require$6 ?? _default$6 ?? _mod;
function createTraceState(rawTraceState) {
  return new tracestate_impl_1.TraceStateImpl(rawTraceState);
}
exports$7.createTraceState = createTraceState;
var _createTraceState = exports$7.createTraceState;
const _default$5 = exports$7.default ?? exports$7;
var __require$5 = exports$7;
exports$7.__esModule;
const _mod12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __require: __require$5,
  createTraceState: _createTraceState,
  default: _default$5
}, Symbol.toStringTag, { value: "Module" }));
var exports$6 = {};
Object.defineProperty(exports$6, "__esModule", {
  value: true
});
Object.defineProperty(exports$6, "__esModule", {
  value: true
});
exports$6.SpanStatusCode = void 0;
(function(SpanStatusCode) {
  SpanStatusCode[SpanStatusCode["UNSET"] = 0] = "UNSET";
  SpanStatusCode[SpanStatusCode["OK"] = 1] = "OK";
  SpanStatusCode[SpanStatusCode["ERROR"] = 2] = "ERROR";
})(exports$6.SpanStatusCode || (exports$6.SpanStatusCode = {}));
var _SpanStatusCode$1 = exports$6.SpanStatusCode;
const _default$4 = exports$6.default ?? exports$6;
var __require$4 = exports$6;
exports$6.__esModule;
const _mod10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SpanStatusCode: _SpanStatusCode$1,
  __require: __require$4,
  default: _default$4
}, Symbol.toStringTag, { value: "Module" }));
var exports$5 = {};
Object.defineProperty(exports$5, "__esModule", {
  value: true
});
Object.defineProperty(exports$5, "__esModule", {
  value: true
});
exports$5.SpanKind = void 0;
(function(SpanKind) {
  SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
  SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
  SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
  SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
  SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
})(exports$5.SpanKind || (exports$5.SpanKind = {}));
var _SpanKind = exports$5.SpanKind;
const _default$3 = exports$5.default ?? exports$5;
var __require$3 = exports$5;
exports$5.__esModule;
const _mod1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SpanKind: _SpanKind,
  __require: __require$3,
  default: _default$3
}, Symbol.toStringTag, { value: "Module" }));
var exports$4 = {};
Object.defineProperty(exports$4, "__esModule", {
  value: true
});
Object.defineProperty(exports$4, "__esModule", {
  value: true
});
exports$4.SamplingDecision = void 0;
(function(SamplingDecision) {
  SamplingDecision[SamplingDecision["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision[SamplingDecision["RECORD"] = 1] = "RECORD";
  SamplingDecision[SamplingDecision["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(exports$4.SamplingDecision || (exports$4.SamplingDecision = {}));
var _SamplingDecision = exports$4.SamplingDecision;
const _default$2 = exports$4.default ?? exports$4;
var __require$2 = exports$4;
exports$4.__esModule;
const _mod0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SamplingDecision: _SamplingDecision,
  __require: __require$2,
  default: _default$2
}, Symbol.toStringTag, { value: "Module" }));
var exports$3 = {};
Object.defineProperty(exports$3, "__esModule", {
  value: true
});
Object.defineProperty(exports$3, "__esModule", {
  value: true
});
exports$3.ValueType = void 0;
(function(ValueType) {
  ValueType[ValueType["INT"] = 0] = "INT";
  ValueType[ValueType["DOUBLE"] = 1] = "DOUBLE";
})(exports$3.ValueType || (exports$3.ValueType = {}));
var _ValueType = exports$3.ValueType;
const _default$1 = exports$3.default ?? exports$3;
var __require$1 = exports$3;
exports$3.__esModule;
const _mod6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ValueType: _ValueType,
  __require: __require$1,
  default: _default$1
}, Symbol.toStringTag, { value: "Module" }));
var exports$2 = {};
Object.defineProperty(exports$2, "__esModule", {
  value: true
});
Object.defineProperty(exports$2, "__esModule", {
  value: true
});
const consoleMap = [{
  n: "error",
  c: "error"
}, {
  n: "warn",
  c: "warn"
}, {
  n: "info",
  c: "info"
}, {
  n: "debug",
  c: "debug"
}, {
  n: "verbose",
  c: "trace"
}];
exports$2._originalConsoleMethods = {};
if (typeof console !== "undefined") {
  const keys = ["error", "warn", "info", "debug", "trace", "log"];
  for (const key of keys) {
    if (typeof console[key] === "function") {
      exports$2._originalConsoleMethods[key] = console[key];
    }
  }
}
class DiagConsoleLogger {
  constructor() {
    function _consoleFunc(funcName) {
      return function(...args) {
        let theFunc = exports$2._originalConsoleMethods[funcName];
        if (typeof theFunc !== "function") {
          theFunc = exports$2._originalConsoleMethods["log"];
        }
        if (typeof theFunc !== "function" && console) {
          theFunc = console[funcName];
          if (typeof theFunc !== "function") {
            theFunc = console.log;
          }
        }
        if (typeof theFunc === "function") {
          return theFunc.apply(console, args);
        }
      };
    }
    for (let i2 = 0; i2 < consoleMap.length; i2++) {
      this[consoleMap[i2].n] = _consoleFunc(consoleMap[i2].c);
    }
  }
}
exports$2.DiagConsoleLogger = DiagConsoleLogger;
exports$2._originalConsoleMethods;
var _DiagConsoleLogger = exports$2.DiagConsoleLogger;
const _default = exports$2.default ?? exports$2;
var __require = exports$2;
exports$2.__esModule;
const _mod3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DiagConsoleLogger: _DiagConsoleLogger,
  __require,
  default: _default
}, Symbol.toStringTag, { value: "Module" }));
var exports$1 = {};
Object.defineProperty(exports$1, "__esModule", {
  value: true
});
Object.defineProperty(exports$1, "__esModule", {
  value: true
});
var utils_1 = __require$j ?? _default$j ?? _mod$5;
exports$1.baggageEntryMetadataFromString = utils_1.baggageEntryMetadataFromString;
var context_1 = __require$z ?? _default$z ?? _mod2$3;
exports$1.createContextKey = context_1.createContextKey;
exports$1.ROOT_CONTEXT = context_1.ROOT_CONTEXT;
var consoleLogger_1 = __require ?? _default ?? _mod3;
exports$1.DiagConsoleLogger = consoleLogger_1.DiagConsoleLogger;
var types_1 = __require$D ?? _default$D ?? _mod4$2;
exports$1.DiagLogLevel = types_1.DiagLogLevel;
var NoopMeter_1 = __require$d ?? _default$d ?? _mod5;
exports$1.createNoopMeter = NoopMeter_1.createNoopMeter;
var Metric_1 = __require$1 ?? _default$1 ?? _mod6;
exports$1.ValueType = Metric_1.ValueType;
var TextMapPropagator_1 = __require$h ?? _default$h ?? _mod7;
exports$1.defaultTextMapGetter = TextMapPropagator_1.defaultTextMapGetter;
exports$1.defaultTextMapSetter = TextMapPropagator_1.defaultTextMapSetter;
var ProxyTracer_1 = __require$p ?? _default$p ?? _mod8;
exports$1.ProxyTracer = ProxyTracer_1.ProxyTracer;
var ProxyTracerProvider_1 = __require$o ?? _default$o ?? _mod9;
exports$1.ProxyTracerProvider = ProxyTracerProvider_1.ProxyTracerProvider;
var SamplingResult_1 = __require$2 ?? _default$2 ?? _mod0;
exports$1.SamplingDecision = SamplingResult_1.SamplingDecision;
var span_kind_1 = __require$3 ?? _default$3 ?? _mod1;
exports$1.SpanKind = span_kind_1.SpanKind;
var status_1 = __require$4 ?? _default$4 ?? _mod10;
exports$1.SpanStatusCode = status_1.SpanStatusCode;
var trace_flags_1 = __require$w ?? _default$w ?? _mod11;
exports$1.TraceFlags = trace_flags_1.TraceFlags;
var utils_2 = __require$5 ?? _default$5 ?? _mod12;
exports$1.createTraceState = utils_2.createTraceState;
var spancontext_utils_1 = __require$s ?? _default$s ?? _mod13;
exports$1.isSpanContextValid = spancontext_utils_1.isSpanContextValid;
exports$1.isValidTraceId = spancontext_utils_1.isValidTraceId;
exports$1.isValidSpanId = spancontext_utils_1.isValidSpanId;
var invalid_span_constants_1 = __require$v ?? _default$v ?? _mod14;
exports$1.INVALID_SPANID = invalid_span_constants_1.INVALID_SPANID;
exports$1.INVALID_TRACEID = invalid_span_constants_1.INVALID_TRACEID;
exports$1.INVALID_SPAN_CONTEXT = invalid_span_constants_1.INVALID_SPAN_CONTEXT;
const context_api_1 = __require$8 ?? _default$8 ?? _mod15;
exports$1.context = context_api_1.context;
const diag_api_1 = __require$9 ?? _default$9 ?? _mod16;
exports$1.diag = diag_api_1.diag;
const metrics_api_1 = __require$a ?? _default$a ?? _mod17;
exports$1.metrics = metrics_api_1.metrics;
const propagation_api_1 = __require$e ?? _default$e ?? _mod18;
exports$1.propagation = propagation_api_1.propagation;
const trace_api_1 = __require$m ?? _default$m ?? _mod19;
exports$1.trace = trace_api_1.trace;
exports$1.default = {
  context: context_api_1.context,
  diag: diag_api_1.diag,
  metrics: metrics_api_1.metrics,
  propagation: propagation_api_1.propagation,
  trace: trace_api_1.trace
};
exports$1.baggageEntryMetadataFromString;
exports$1.createContextKey;
exports$1.ROOT_CONTEXT;
exports$1.DiagConsoleLogger;
exports$1.DiagLogLevel;
exports$1.createNoopMeter;
exports$1.ValueType;
exports$1.defaultTextMapGetter;
exports$1.defaultTextMapSetter;
exports$1.ProxyTracer;
exports$1.ProxyTracerProvider;
exports$1.SamplingDecision;
exports$1.SpanKind;
var _SpanStatusCode = exports$1.SpanStatusCode;
exports$1.TraceFlags;
exports$1.createTraceState;
exports$1.isSpanContextValid;
exports$1.isValidTraceId;
exports$1.isValidSpanId;
exports$1.INVALID_SPANID;
exports$1.INVALID_TRACEID;
exports$1.INVALID_SPAN_CONTEXT;
exports$1.context;
exports$1.diag;
exports$1.metrics;
exports$1.propagation;
var _trace = exports$1.trace;
exports$1.default ?? exports$1;
exports$1.__esModule;
let BUILD_ID = "42c9a323bb111d530cf1c2031864ef65bf41fe50";
const DENO_DEPLOYMENT_ID = void 0;
function setBuildId(id) {
  BUILD_ID = id;
}
const {
  Deno: Deno$1
} = globalThis;
const noColor = typeof Deno$1?.noColor === "boolean" ? Deno$1.noColor : false;
let enabled = !noColor;
function code(open, close) {
  return {
    open: `\x1B[${open.join(";")}m`,
    close: `\x1B[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g")
  };
}
function run(str, code2) {
  return enabled ? `${code2.open}${str.replace(code2.regexp, code2.open)}${code2.close}` : str;
}
function bold(str) {
  return run(str, code([1], 22));
}
function cyan(str) {
  return run(str, code([36], 39));
}
function clampAndTruncate(n2, max = 255, min = 0) {
  return Math.trunc(Math.max(Math.min(n2, max), min));
}
function rgb8(str, color) {
  return run(str, code([38, 5, clampAndTruncate(color)], 39));
}
function bgRgb8(str, color) {
  return run(str, code([48, 5, clampAndTruncate(color)], 49));
}
var n$1, l$3, u$3, t$2, i$3, r$2, o$3, e$1, f$3, c$3, s$3, a$3, h$1, p$3, v$2, y$1, d$1 = {}, w$2 = [], _$1 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, g$1 = Array.isArray;
function m$2(n2, l2) {
  for (var u2 in l2) n2[u2] = l2[u2];
  return n2;
}
function b$1(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function k$2(l2, u2, t2) {
  var i2, r2, o2, e2 = {};
  for (o2 in u2) "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : e2[o2] = u2[o2];
  if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n$1.call(arguments, 2) : t2), "function" == typeof l2 && null != l2.defaultProps) for (o2 in l2.defaultProps) void 0 === e2[o2] && (e2[o2] = l2.defaultProps[o2]);
  return x$2(l2, e2, i2, r2, null);
}
function x$2(n2, t2, i2, r2, o2) {
  var e2 = {
    type: n2,
    props: t2,
    key: i2,
    ref: r2,
    __k: null,
    __: null,
    __b: 0,
    __e: null,
    __c: null,
    constructor: void 0,
    __v: null == o2 ? ++u$3 : o2,
    __i: -1,
    __u: 0
  };
  return null == o2 && null != l$3.vnode && l$3.vnode(e2), e2;
}
function S(n2) {
  return n2.children;
}
function C$1(n2, l2) {
  this.props = n2, this.context = l2;
}
function $$1(n2, l2) {
  if (null == l2) return n2.__ ? $$1(n2.__, n2.__i + 1) : null;
  for (var u2; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) return u2.__e;
  return "function" == typeof n2.type ? $$1(n2) : null;
}
function I$1(n2) {
  if (n2.__P && n2.__d) {
    var u2 = n2.__v, t2 = u2.__e, i2 = [], r2 = [], o2 = m$2({}, u2);
    o2.__v = u2.__v + 1, l$3.vnode && l$3.vnode(o2), q$1(n2.__P, o2, u2, n2.__n, n2.__P.namespaceURI, 32 & u2.__u ? [t2] : null, i2, null == t2 ? $$1(u2) : t2, !!(32 & u2.__u), r2), o2.__v = u2.__v, o2.__.__k[o2.__i] = o2, D$1(i2, o2, r2), u2.__e = u2.__ = null, o2.__e != t2 && P$1(o2);
  }
}
function P$1(n2) {
  if (null != (n2 = n2.__) && null != n2.__c) return n2.__e = n2.__c.base = null, n2.__k.some(function(l2) {
    if (null != l2 && null != l2.__e) return n2.__e = n2.__c.base = l2.__e;
  }), P$1(n2);
}
function A$1(n2) {
  (!n2.__d && (n2.__d = true) && i$3.push(n2) && !H$1.__r++ || r$2 != l$3.debounceRendering) && ((r$2 = l$3.debounceRendering) || o$3)(H$1);
}
function H$1() {
  try {
    for (var n2, l2 = 1; i$3.length; ) i$3.length > l2 && i$3.sort(e$1), n2 = i$3.shift(), l2 = i$3.length, I$1(n2);
  } finally {
    i$3.length = H$1.__r = 0;
  }
}
function L(n2, l2, u2, t2, i2, r2, o2, e2, f2, c2, s2) {
  var a2, h2, p2, v2, y2, _2, g2, m2 = t2 && t2.__k || w$2, b2 = l2.length;
  for (f2 = T(u2, l2, m2, f2, b2), a2 = 0; a2 < b2; a2++) null != (p2 = u2.__k[a2]) && (h2 = -1 != p2.__i && m2[p2.__i] || d$1, p2.__i = a2, _2 = q$1(n2, p2, h2, i2, r2, o2, e2, f2, c2, s2), v2 = p2.__e, p2.ref && h2.ref != p2.ref && (h2.ref && J$1(h2.ref, null, p2), s2.push(p2.ref, p2.__c || v2, p2)), null == y2 && null != v2 && (y2 = v2), (g2 = !!(4 & p2.__u)) || h2.__k === p2.__k ? (f2 = j$1(p2, f2, n2, g2), g2 && h2.__e && (h2.__e = null)) : "function" == typeof p2.type && void 0 !== _2 ? f2 = _2 : v2 && (f2 = v2.nextSibling), p2.__u &= -7);
  return u2.__e = y2, f2;
}
function T(n2, l2, u2, t2, i2) {
  var r2, o2, e2, f2, c2, s2 = u2.length, a2 = s2, h2 = 0;
  for (n2.__k = new Array(i2), r2 = 0; r2 < i2; r2++) null != (o2 = l2[r2]) && "boolean" != typeof o2 && "function" != typeof o2 ? ("string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? o2 = n2.__k[r2] = x$2(null, o2, null, null, null) : g$1(o2) ? o2 = n2.__k[r2] = x$2(S, {
    children: o2
  }, null, null, null) : void 0 === o2.constructor && o2.__b > 0 ? o2 = n2.__k[r2] = x$2(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : n2.__k[r2] = o2, f2 = r2 + h2, o2.__ = n2, o2.__b = n2.__b + 1, e2 = null, -1 != (c2 = o2.__i = O$1(o2, u2, f2, a2)) && (a2--, (e2 = u2[c2]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c2 && (i2 > s2 ? h2-- : i2 < s2 && h2++), "function" != typeof o2.type && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
  if (a2) for (r2 = 0; r2 < s2; r2++) null != (e2 = u2[r2]) && 0 == (2 & e2.__u) && (e2.__e == t2 && (t2 = $$1(e2)), K(e2, e2));
  return t2;
}
function j$1(n2, l2, u2, t2) {
  var i2, r2;
  if ("function" == typeof n2.type) {
    for (i2 = n2.__k, r2 = 0; i2 && r2 < i2.length; r2++) i2[r2] && (i2[r2].__ = n2, l2 = j$1(i2[r2], l2, u2, t2));
    return l2;
  }
  n2.__e != l2 && (t2 && (l2 && n2.type && !l2.parentNode && (l2 = $$1(n2)), u2.insertBefore(n2.__e, l2 || null)), l2 = n2.__e);
  do {
    l2 = l2 && l2.nextSibling;
  } while (null != l2 && 8 == l2.nodeType);
  return l2;
}
function O$1(n2, l2, u2, t2) {
  var i2, r2, o2, e2 = n2.key, f2 = n2.type, c2 = l2[u2], s2 = null != c2 && 0 == (2 & c2.__u);
  if (null === c2 && null == e2 || s2 && e2 == c2.key && f2 == c2.type) return u2;
  if (t2 > (s2 ? 1 : 0)) {
    for (i2 = u2 - 1, r2 = u2 + 1; i2 >= 0 || r2 < l2.length; ) if (null != (c2 = l2[o2 = i2 >= 0 ? i2-- : r2++]) && 0 == (2 & c2.__u) && e2 == c2.key && f2 == c2.type) return o2;
  }
  return -1;
}
function z$2(n2, l2, u2) {
  "-" == l2[0] ? n2.setProperty(l2, null == u2 ? "" : u2) : n2[l2] = null == u2 ? "" : "number" != typeof u2 || _$1.test(l2) ? u2 : u2 + "px";
}
function N$1(n2, l2, u2, t2, i2) {
  var r2, o2;
  n: if ("style" == l2) {
    if ("string" == typeof u2) n2.style.cssText = u2;
    else {
      if ("string" == typeof t2 && (n2.style.cssText = t2 = ""), t2) for (l2 in t2) u2 && l2 in u2 || z$2(n2.style, l2, "");
      if (u2) for (l2 in u2) t2 && u2[l2] == t2[l2] || z$2(n2.style, l2, u2[l2]);
    }
  } else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(a$3, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || "onFocusOut" == l2 || "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t2 ? u2[s$3] = t2[s$3] : (u2[s$3] = h$1, n2.addEventListener(l2, r2 ? v$2 : p$3, r2)) : n2.removeEventListener(l2, r2 ? v$2 : p$3, r2);
  else {
    if ("http://www.w3.org/2000/svg" == i2) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n2) try {
      n2[l2] = null == u2 ? "" : u2;
      break n;
    } catch (n3) {
    }
    "function" == typeof u2 || (null == u2 || false === u2 && "-" != l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, "popover" == l2 && 1 == u2 ? "" : u2));
  }
}
function V$1(n2) {
  return function(u2) {
    if (this.l) {
      var t2 = this.l[u2.type + n2];
      if (null == u2[c$3]) u2[c$3] = h$1++;
      else if (u2[c$3] < t2[s$3]) return;
      return t2(l$3.event ? l$3.event(u2) : u2);
    }
  };
}
function q$1(n2, u2, t2, i2, r2, o2, e2, f2, c2, s2) {
  var a2, h2, p2, v2, y2, d2, _2, k2, x2, M2, $2, I2, P2, A2, H2, T2 = u2.type;
  if (void 0 !== u2.constructor) return null;
  128 & t2.__u && (c2 = !!(32 & t2.__u), o2 = [f2 = u2.__e = t2.__e]), (a2 = l$3.__b) && a2(u2);
  n: if ("function" == typeof T2) try {
    if (k2 = u2.props, x2 = T2.prototype && T2.prototype.render, M2 = (a2 = T2.contextType) && i2[a2.__c], $2 = a2 ? M2 ? M2.props.value : a2.__ : i2, t2.__c ? _2 = (h2 = u2.__c = t2.__c).__ = h2.__E : (x2 ? u2.__c = h2 = new T2(k2, $2) : (u2.__c = h2 = new C$1(k2, $2), h2.constructor = T2, h2.render = Q), M2 && M2.sub(h2), h2.state || (h2.state = {}), h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), x2 && null == h2.__s && (h2.__s = h2.state), x2 && null != T2.getDerivedStateFromProps && (h2.__s == h2.state && (h2.__s = m$2({}, h2.__s)), m$2(h2.__s, T2.getDerivedStateFromProps(k2, h2.__s))), v2 = h2.props, y2 = h2.state, h2.__v = u2, p2) x2 && null == T2.getDerivedStateFromProps && null != h2.componentWillMount && h2.componentWillMount(), x2 && null != h2.componentDidMount && h2.__h.push(h2.componentDidMount);
    else {
      if (x2 && null == T2.getDerivedStateFromProps && k2 !== v2 && null != h2.componentWillReceiveProps && h2.componentWillReceiveProps(k2, $2), u2.__v == t2.__v || !h2.__e && null != h2.shouldComponentUpdate && false === h2.shouldComponentUpdate(k2, h2.__s, $2)) {
        u2.__v != t2.__v && (h2.props = k2, h2.state = h2.__s, h2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.some(function(n3) {
          n3 && (n3.__ = u2);
        }), w$2.push.apply(h2.__h, h2._sb), h2._sb = [], h2.__h.length && e2.push(h2);
        break n;
      }
      null != h2.componentWillUpdate && h2.componentWillUpdate(k2, h2.__s, $2), x2 && null != h2.componentDidUpdate && h2.__h.push(function() {
        h2.componentDidUpdate(v2, y2, d2);
      });
    }
    if (h2.context = $2, h2.props = k2, h2.__P = n2, h2.__e = false, I2 = l$3.__r, P2 = 0, x2) h2.state = h2.__s, h2.__d = false, I2 && I2(u2), a2 = h2.render(h2.props, h2.state, h2.context), w$2.push.apply(h2.__h, h2._sb), h2._sb = [];
    else do {
      h2.__d = false, I2 && I2(u2), a2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
    } while (h2.__d && ++P2 < 25);
    h2.state = h2.__s, null != h2.getChildContext && (i2 = m$2(m$2({}, i2), h2.getChildContext())), x2 && !p2 && null != h2.getSnapshotBeforeUpdate && (d2 = h2.getSnapshotBeforeUpdate(v2, y2)), A2 = null != a2 && a2.type === S && null == a2.key ? E(a2.props.children) : a2, f2 = L(n2, g$1(A2) ? A2 : [A2], u2, t2, i2, r2, o2, e2, f2, c2, s2), h2.base = u2.__e, u2.__u &= -161, h2.__h.length && e2.push(h2), _2 && (h2.__E = h2.__ = null);
  } catch (n3) {
    if (u2.__v = null, c2 || null != o2) {
      if (n3.then) {
        for (u2.__u |= c2 ? 160 : 128; f2 && 8 == f2.nodeType && f2.nextSibling; ) f2 = f2.nextSibling;
        o2[o2.indexOf(f2)] = null, u2.__e = f2;
      } else {
        for (H2 = o2.length; H2--; ) b$1(o2[H2]);
        B$2(u2);
      }
    } else u2.__e = t2.__e, u2.__k = t2.__k, n3.then || B$2(u2);
    l$3.__e(n3, u2, t2);
  }
  else null == o2 && u2.__v == t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : f2 = u2.__e = G(t2.__e, u2, t2, i2, r2, o2, e2, c2, s2);
  return (a2 = l$3.diffed) && a2(u2), 128 & u2.__u ? void 0 : f2;
}
function B$2(n2) {
  n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B$2));
}
function D$1(n2, u2, t2) {
  for (var i2 = 0; i2 < t2.length; i2++) J$1(t2[i2], t2[++i2], t2[++i2]);
  l$3.__c && l$3.__c(u2, n2), n2.some(function(u3) {
    try {
      n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
        n3.call(u3);
      });
    } catch (n3) {
      l$3.__e(n3, u3.__v);
    }
  });
}
function E(n2) {
  return "object" != typeof n2 || null == n2 || n2.__b > 0 ? n2 : g$1(n2) ? n2.map(E) : m$2({}, n2);
}
function G(u2, t2, i2, r2, o2, e2, f2, c2, s2) {
  var a2, h2, p2, v2, y2, w2, _2, m2 = i2.props || d$1, k2 = t2.props, x2 = t2.type;
  if ("svg" == x2 ? o2 = "http://www.w3.org/2000/svg" : "math" == x2 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e2) {
    for (a2 = 0; a2 < e2.length; a2++) if ((y2 = e2[a2]) && "setAttribute" in y2 == !!x2 && (x2 ? y2.localName == x2 : 3 == y2.nodeType)) {
      u2 = y2, e2[a2] = null;
      break;
    }
  }
  if (null == u2) {
    if (null == x2) return document.createTextNode(k2);
    u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l$3.__m && l$3.__m(t2, e2), c2 = false), e2 = null;
  }
  if (null == x2) m2 === k2 || c2 && u2.data == k2 || (u2.data = k2);
  else {
    if (e2 = e2 && n$1.call(u2.childNodes), !c2 && null != e2) for (m2 = {}, a2 = 0; a2 < u2.attributes.length; a2++) m2[(y2 = u2.attributes[a2]).name] = y2.value;
    for (a2 in m2) y2 = m2[a2], "dangerouslySetInnerHTML" == a2 ? p2 = y2 : "children" == a2 || a2 in k2 || "value" == a2 && "defaultValue" in k2 || "checked" == a2 && "defaultChecked" in k2 || N$1(u2, a2, null, y2, o2);
    for (a2 in k2) y2 = k2[a2], "children" == a2 ? v2 = y2 : "dangerouslySetInnerHTML" == a2 ? h2 = y2 : "value" == a2 ? w2 = y2 : "checked" == a2 ? _2 = y2 : c2 && "function" != typeof y2 || m2[a2] === y2 || N$1(u2, a2, y2, m2[a2], o2);
    if (h2) c2 || p2 && (h2.__html == p2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t2.__k = [];
    else if (p2 && (u2.innerHTML = ""), L("template" == t2.type ? u2.content : u2, g$1(v2) ? v2 : [v2], t2, i2, r2, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && $$1(i2, 0), c2, s2), null != e2) for (a2 = e2.length; a2--; ) b$1(e2[a2]);
    c2 || (a2 = "value", "progress" == x2 && null == w2 ? u2.removeAttribute("value") : null != w2 && (w2 !== u2[a2] || "progress" == x2 && !w2 || "option" == x2 && w2 != m2[a2]) && N$1(u2, a2, w2, m2[a2], o2), a2 = "checked", null != _2 && _2 != u2[a2] && N$1(u2, a2, _2, m2[a2], o2));
  }
  return u2;
}
function J$1(n2, u2, t2) {
  try {
    if ("function" == typeof n2) {
      var i2 = "function" == typeof n2.__u;
      i2 && n2.__u(), i2 && null == u2 || (n2.__u = n2(u2));
    } else n2.current = u2;
  } catch (n3) {
    l$3.__e(n3, t2);
  }
}
function K(n2, u2, t2) {
  var i2, r2;
  if (l$3.unmount && l$3.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || J$1(i2, null, u2)), null != (i2 = n2.__c)) {
    if (i2.componentWillUnmount) try {
      i2.componentWillUnmount();
    } catch (n3) {
      l$3.__e(n3, u2);
    }
    i2.base = i2.__P = null;
  }
  if (i2 = n2.__k) for (r2 = 0; r2 < i2.length; r2++) i2[r2] && K(i2[r2], u2, t2 || "function" != typeof n2.type);
  t2 || b$1(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
}
function Q(n2, l2, u2) {
  return this.constructor(n2, u2);
}
function X(n2) {
  function l2(n3) {
    var u2, t2;
    return this.getChildContext || (u2 = /* @__PURE__ */ new Set(), (t2 = {})[l2.__c] = this, this.getChildContext = function() {
      return t2;
    }, this.componentWillUnmount = function() {
      u2 = null;
    }, this.shouldComponentUpdate = function(n4) {
      this.props.value != n4.value && u2.forEach(function(n5) {
        n5.__e = true, A$1(n5);
      });
    }, this.sub = function(n4) {
      u2.add(n4);
      var l3 = n4.componentWillUnmount;
      n4.componentWillUnmount = function() {
        u2 && u2.delete(n4), l3 && l3.call(n4);
      };
    }), n3.children;
  }
  return l2.__c = "__cC" + y$1++, l2.__ = n2, l2.Provider = l2.__l = (l2.Consumer = function(n3, l3) {
    return n3.children(l3);
  }).contextType = l2, l2;
}
n$1 = w$2.slice, l$3 = {
  __e: function(n2, l2, u2, t2) {
    for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
      if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
    } catch (l3) {
      n2 = l3;
    }
    throw n2;
  }
}, u$3 = 0, t$2 = function(n2) {
  return null != n2 && void 0 === n2.constructor;
}, C$1.prototype.setState = function(n2, l2) {
  var u2;
  u2 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m$2({}, this.state), "function" == typeof n2 && (n2 = n2(m$2({}, u2), this.props)), n2 && m$2(u2, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), A$1(this));
}, C$1.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), A$1(this));
}, C$1.prototype.render = S, i$3 = [], o$3 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e$1 = function(n2, l2) {
  return n2.__v.__b - l2.__v.__b;
}, H$1.__r = 0, f$3 = Math.random().toString(8), c$3 = "__d" + f$3, s$3 = "__a" + f$3, a$3 = /(PointerCapture)$|Capture$/i, h$1 = 0, p$3 = V$1(false), v$2 = V$1(true), y$1 = 0;
var t$1 = /["&<]/;
function n(r2) {
  if (0 === r2.length || false === t$1.test(r2)) return r2;
  for (var e2 = 0, n2 = 0, o2 = "", f2 = ""; n2 < r2.length; n2++) {
    switch (r2.charCodeAt(n2)) {
      case 34:
        f2 = "&quot;";
        break;
      case 38:
        f2 = "&amp;";
        break;
      case 60:
        f2 = "&lt;";
        break;
      default:
        continue;
    }
    n2 !== e2 && (o2 += r2.slice(e2, n2)), o2 += f2, e2 = n2 + 1;
  }
  return n2 !== e2 && (o2 += r2.slice(e2, n2)), o2;
}
var o$2 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, f$2 = 0, i$2 = Array.isArray;
function u$2(e2, t2, n2, o2, i2, u2) {
  t2 || (t2 = {});
  var a2, c2, p2 = t2;
  if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
  var l2 = {
    type: e2,
    props: p2,
    key: n2,
    ref: a2,
    __k: null,
    __: null,
    __b: 0,
    __e: null,
    __c: null,
    constructor: void 0,
    __v: --f$2,
    __i: -1,
    __u: 0,
    __source: i2,
    __self: u2
  };
  if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
  return l$3.vnode && l$3.vnode(l2), l2;
}
function a$2(r2) {
  var t2 = u$2(S, {
    tpl: r2,
    exprs: [].slice.call(arguments, 1)
  });
  return t2.key = t2.__v, t2;
}
var c$2 = {}, p$2 = /[A-Z]/g;
function l$2(e2, t2) {
  if (l$3.attr) {
    var f2 = l$3.attr(e2, t2);
    if ("string" == typeof f2) return f2;
  }
  if (t2 = (function(r2) {
    return null !== r2 && "object" == typeof r2 && "function" == typeof r2.valueOf ? r2.valueOf() : r2;
  })(t2), "ref" === e2 || "key" === e2) return "";
  if ("style" === e2 && "object" == typeof t2) {
    var i2 = "";
    for (var u2 in t2) {
      var a2 = t2[u2];
      if (null != a2 && "" !== a2) {
        var l2 = "-" == u2[0] ? u2 : c$2[u2] || (c$2[u2] = u2.replace(p$2, "-$&").toLowerCase()), s2 = ";";
        "number" != typeof a2 || l2.startsWith("--") || o$2.test(l2) || (s2 = "px;"), i2 = i2 + l2 + ":" + a2 + s2;
      }
    }
    return e2 + '="' + n(i2) + '"';
  }
  return null == t2 || false === t2 || "function" == typeof t2 || "object" == typeof t2 ? "" : true === t2 ? e2 : e2 + '="' + n("" + t2) + '"';
}
function s$2(r2) {
  if (null == r2 || "boolean" == typeof r2 || "function" == typeof r2) return null;
  if ("object" == typeof r2) {
    if (void 0 === r2.constructor) return r2;
    if (i$2(r2)) {
      for (var e2 = 0; e2 < r2.length; e2++) r2[e2] = s$2(r2[e2]);
      return r2;
    }
  }
  return n("" + r2);
}
const INTERNAL_PREFIX = "/_frsh";
const DEV_ERROR_OVERLAY_URL = `${INTERNAL_PREFIX}/error_overlay`;
const PARTIAL_SEARCH_PARAM = "fresh-partial";
const ASSET_CACHE_BUST_KEY = "__frsh_c";
const DATA_CURRENT = "data-current";
const DATA_ANCESTOR = "data-ancestor";
const DATA_FRESH_KEY = "data-frsh-key";
const CLIENT_NAV_ATTR = "f-client-nav";
var OptionsType = /* @__PURE__ */ (function(OptionsType2) {
  OptionsType2["ATTR"] = "attr";
  OptionsType2["VNODE"] = "vnode";
  OptionsType2["HOOK"] = "__h";
  OptionsType2["DIFF"] = "__b";
  OptionsType2["RENDER"] = "__r";
  OptionsType2["DIFFED"] = "diffed";
  OptionsType2["ERROR"] = "__e";
  return OptionsType2;
})({});
function matchesUrl(current, needle) {
  let href = new URL(needle, "http://localhost").pathname;
  if (href !== "/" && href.endsWith("/")) {
    href = href.slice(0, -1);
  }
  if (current !== "/" && current.endsWith("/")) {
    current = current.slice(0, -1);
  }
  if (current === href) {
    return 2;
  } else if (current.startsWith(href + "/") || href === "/") {
    return 1;
  }
  return 0;
}
function setActiveUrl(vnode, pathname) {
  const props = vnode.props;
  const hrefProp = props.href;
  if (typeof hrefProp === "string" && hrefProp.startsWith("/")) {
    const match = matchesUrl(pathname, hrefProp);
    if (match === 2) {
      props[DATA_CURRENT] = "true";
      props["aria-current"] = "page";
    } else if (match === 1) {
      props[DATA_ANCESTOR] = "true";
      props["aria-current"] = "true";
    }
  }
}
var PartialMode = /* @__PURE__ */ (function(PartialMode2) {
  PartialMode2[PartialMode2["Replace"] = 0] = "Replace";
  PartialMode2[PartialMode2["Append"] = 1] = "Append";
  PartialMode2[PartialMode2["Prepend"] = 2] = "Prepend";
  return PartialMode2;
})({});
function assetInternal(path, buildId) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  try {
    const url = new URL(path, "https://freshassetcache.local");
    if (url.protocol !== "https:" || url.host !== "freshassetcache.local" || url.searchParams.has(ASSET_CACHE_BUST_KEY)) {
      return path;
    }
    url.searchParams.set(ASSET_CACHE_BUST_KEY, buildId);
    return url.pathname + url.search + url.hash;
  } catch (err) {
    console.warn(`Failed to create asset() URL, falling back to regular path ('${path}'):`, err);
    return path;
  }
}
function assetSrcSetInternal(srcset, buildId) {
  if (srcset.includes("(")) return srcset;
  const parts = srcset.split(",");
  const constructed = [];
  for (const part of parts) {
    const trimmed = part.trimStart();
    const leadingWhitespace = part.length - trimmed.length;
    if (trimmed === "") return srcset;
    let urlEnd = trimmed.indexOf(" ");
    if (urlEnd === -1) urlEnd = trimmed.length;
    const leading = part.substring(0, leadingWhitespace);
    const url = trimmed.substring(0, urlEnd);
    const trailing = trimmed.substring(urlEnd);
    constructed.push(leading + assetInternal(url, buildId) + trailing);
  }
  return constructed.join(",");
}
function assetHashingHook(vnode, buildId) {
  if (vnode.type === "img" || vnode.type === "source") {
    const {
      props
    } = vnode;
    if (props["data-fresh-disable-lock"]) return;
    if (typeof props.src === "string") {
      props.src = assetInternal(props.src, buildId);
    }
    if (typeof props.srcset === "string") {
      props.srcset = assetSrcSetInternal(props.srcset, buildId);
    }
  }
}
class HttpError extends Error {
  /**
   * The HTTP status code.
   *
   * @example Basic usage
   * ```ts
   * import { App, HttpError } from "fresh";
   * import { expect } from "@std/expect";
   *
   * const app = new App()
   *   .get("/", () => new Response("ok"))
   *   .get("/not-found", () => {
   *      throw new HttpError(404, "Nothing here");
   *    });
   *
   * const handler = app.handler();
   *
   * try {
   *   await handler(new Request("http://localhost/not-found"))
   * } catch (error) {
   *   expect(error).toBeInstanceOf(HttpError);
   *   expect(error.status).toBe(404);
   *   expect(error.message).toBe("Nothing here");
   * }
   * ```
   */
  status;
  /**
   * Constructs a new instance.
   *
   * @param status The HTTP status code.
   * @param message The error message. Defaults to the status text of the given
   * status code.
   * @param options Optional error options.
   */
  constructor(status, message, options2) {
    super(message, options2);
    this.name = this.constructor.name;
    this.status = status;
  }
}
const HeadContext = X(false);
function asset(path) {
  return assetInternal(path, BUILD_ID);
}
function Partial(props) {
  return props.children;
}
Partial.displayName = "Partial";
const UNDEFINED = -1;
const NULL = -2;
const NAN = -3;
const INFINITY_POS = -4;
const INFINITY_NEG = -5;
const ZERO_NEG = -6;
const HOLE = -7;
function stringify(data, custom) {
  const out = [];
  const indexes = /* @__PURE__ */ new Map();
  const res = serializeInner(out, indexes, data, custom);
  if (res < 0) {
    return String(res);
  }
  return `[${out.join(",")}]`;
}
function serializeInner(out, indexes, value, custom) {
  const seenIdx = indexes.get(value);
  if (seenIdx !== void 0) return seenIdx;
  if (value === void 0) return UNDEFINED;
  if (value === null) return NULL;
  if (Number.isNaN(value)) return NAN;
  if (value === Infinity) return INFINITY_POS;
  if (value === -Infinity) return INFINITY_NEG;
  if (value === 0 && 1 / value < 0) return ZERO_NEG;
  const idx = out.length;
  out.push("");
  indexes.set(value, idx);
  let str = "";
  if (typeof value === "number") {
    str += String(value);
  } else if (typeof value === "boolean") {
    str += String(value);
  } else if (typeof value === "bigint") {
    str += `["BigInt","${value}"]`;
  } else if (typeof value === "string") {
    str += JSON.stringify(value);
  } else if (Array.isArray(value)) {
    str += "[";
    for (let i2 = 0; i2 < value.length; i2++) {
      if (i2 in value) {
        str += serializeInner(out, indexes, value[i2], custom);
      } else {
        str += HOLE;
      }
      if (i2 < value.length - 1) {
        str += ",";
      }
    }
    str += "]";
  } else if (typeof value === "object") {
    if (custom !== void 0) {
      for (const k2 in custom) {
        const fn = custom[k2];
        if (fn === void 0) continue;
        const res = fn(value);
        if (res === void 0) continue;
        const innerIdx = serializeInner(out, indexes, res.value, custom);
        str = `["${k2}",${innerIdx}]`;
        out[idx] = str;
        return idx;
      }
    }
    if (value instanceof URL) {
      str += `["URL","${value.href}"]`;
    } else if (value instanceof Date) {
      let iso;
      try {
        iso = value.toISOString();
      } catch {
        iso = "Invalid Date";
      }
      str += `["Date","${iso}"]`;
    } else if (value instanceof RegExp) {
      str += `["RegExp",${JSON.stringify(value.source)}, "${value.flags}"]`;
    } else if (value instanceof Uint8Array) {
      str += `["Uint8Array","${b64encode(value.buffer)}"]`;
    } else if (value instanceof Set) {
      const items = new Array(value.size);
      let i2 = 0;
      value.forEach((v2) => {
        items[i2++] = serializeInner(out, indexes, v2, custom);
      });
      str += `["Set",[${items.join(",")}]]`;
    } else if (value instanceof Map) {
      const items = new Array(value.size * 2);
      let i2 = 0;
      value.forEach((v2, k2) => {
        items[i2++] = serializeInner(out, indexes, k2, custom);
        items[i2++] = serializeInner(out, indexes, v2, custom);
      });
      str += `["Map",[${items.join(",")}]]`;
    } else {
      str += "{";
      const keys = Object.keys(value);
      for (let i2 = 0; i2 < keys.length; i2++) {
        const key = keys[i2];
        str += JSON.stringify(key) + ":";
        str += serializeInner(out, indexes, value[key], custom);
        if (i2 < keys.length - 1) {
          str += ",";
        }
      }
      str += "}";
    }
  } else if (typeof value === "function") {
    throw new Error(`Serializing functions is not supported.`);
  }
  out[idx] = str;
  return idx;
}
const base64abc = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"];
function b64encode(buffer) {
  const uint8 = new Uint8Array(buffer);
  let result = "", i2;
  const l2 = uint8.length;
  for (i2 = 2; i2 < l2; i2 += 3) {
    result += base64abc[uint8[i2 - 2] >> 2];
    result += base64abc[(uint8[i2 - 2] & 3) << 4 | uint8[i2 - 1] >> 4];
    result += base64abc[(uint8[i2 - 1] & 15) << 2 | uint8[i2] >> 6];
    result += base64abc[uint8[i2] & 63];
  }
  if (i2 === l2 + 1) {
    result += base64abc[uint8[i2 - 2] >> 2];
    result += base64abc[(uint8[i2 - 2] & 3) << 4];
    result += "==";
  }
  if (i2 === l2) {
    result += base64abc[uint8[i2 - 2] >> 2];
    result += base64abc[(uint8[i2 - 2] & 3) << 4 | uint8[i2 - 1] >> 4];
    result += base64abc[(uint8[i2 - 1] & 15) << 2];
    result += "=";
  }
  return result;
}
const rawToEntityEntries = [["&", "&amp;"], ["<", "&lt;"], [">", "&gt;"], ['"', "&quot;"], ["'", "&#39;"]];
Object.fromEntries([...rawToEntityEntries.map(([raw, entity]) => [entity, raw]), ["&apos;", "'"], ["&nbsp;", " "]]);
const rawToEntity = new Map(rawToEntityEntries);
const rawRe = new RegExp(`[${[...rawToEntity.keys()].join("")}]`, "g");
function escape(str) {
  return str.replaceAll(rawRe, (m2) => rawToEntity.get(m2));
}
function tabs2Spaces(str) {
  return str.replace(/^\t+/, (tabs) => "  ".repeat(tabs.length));
}
function createCodeFrame(text, lineNum, columnNum) {
  const before = 2;
  const after = 3;
  const lines = text.split("\n");
  if (lines.length <= lineNum || lines[lineNum].length < columnNum) {
    return;
  }
  const start = Math.max(0, lineNum - before);
  const end = Math.min(lines.length, lineNum + after + 1);
  const maxLineNum = String(end).length;
  const padding = " ".repeat(maxLineNum);
  const spaceLines = [];
  let maxLineLen = 0;
  for (let i2 = start; i2 < end; i2++) {
    const line = tabs2Spaces(lines[i2]);
    spaceLines.push(line);
    if (line.length > maxLineLen) maxLineLen = line.length;
  }
  const activeLine = spaceLines[lineNum - start];
  const count = Math.max(0, activeLine.length - lines[lineNum].length + columnNum);
  const sep = "|";
  let out = "";
  for (let i2 = 0; i2 < spaceLines.length; i2++) {
    const line = spaceLines[i2];
    const currentLine = (padding + (i2 + start + 1)).slice(-maxLineNum);
    if (i2 === lineNum - start) {
      out += `> ${currentLine} ${sep} ${line}
`;
      const columnMarker = "^";
      out += `  ${padding} ${sep} ${" ".repeat(count)}${columnMarker}
`;
    } else {
      out += `  ${currentLine} ${sep} ${line}
`;
    }
  }
  return out;
}
const STACK_FRAME = /^\s*at\s+(?:(.*)\s+)?\((.*):(\d+):(\d+)\)$/;
function getFirstUserFile(stack, rootDir) {
  const lines = stack.split("\n");
  for (let i2 = 0; i2 < lines.length; i2++) {
    const match = lines[i2].match(STACK_FRAME);
    if (match) {
      const fnName = match[1] ?? "";
      const file = match[2];
      const line = +match[3];
      const column = +match[4];
      if (file.startsWith("file://")) {
        const filePath = fromFileUrl(file);
        if (relative(rootDir, filePath).startsWith(".")) {
          continue;
        }
        return {
          fnName,
          file,
          line,
          column
        };
      }
    }
  }
}
function getCodeFrame(stack, rootDir) {
  const file = getFirstUserFile(stack, rootDir);
  if (file) {
    try {
      const filePath = fromFileUrl(file.file);
      const text = Deno.readTextFileSync(filePath);
      return createCodeFrame(text, file.line - 1, file.column - 1);
    } catch {
    }
  }
}
const SCRIPT_ESCAPE = /<\/(style|script)/gi;
const COMMENT_ESCAPE = /<!--/gi;
function escapeScript(content, options2 = {}) {
  return content.replaceAll(SCRIPT_ESCAPE, "<\\/$1").replaceAll(COMMENT_ESCAPE, options2.json ? "\\u003C!--" : "\\x3C!--");
}
function isLazy(value) {
  return typeof value === "function";
}
var t, r$1, u$1, i$1, o$1 = 0, f$1 = [], c$1 = l$3, e = c$1.__b, a$1 = c$1.__r, v$1 = c$1.diffed, l$1 = c$1.__c, m$1 = c$1.unmount, s$1 = c$1.__;
function p$1(n2, t2) {
  c$1.__h && c$1.__h(r$1, n2, o$1 || t2), o$1 = 0;
  var u2 = r$1.__H || (r$1.__H = {
    __: [],
    __h: []
  });
  return n2 >= u2.__.length && u2.__.push({}), u2.__[n2];
}
function x$1(n2) {
  var u2 = r$1.context[n2.__c], i2 = p$1(t++, 9);
  return i2.c = n2, u2 ? (null == i2.__ && (i2.__ = true, u2.sub(r$1)), u2.props.value) : n2.__;
}
function j() {
  for (var n2; n2 = f$1.shift(); ) {
    var t2 = n2.__H;
    if (n2.__P && t2) try {
      t2.__h.some(z$1), t2.__h.some(B$1), t2.__h = [];
    } catch (r2) {
      t2.__h = [], c$1.__e(r2, n2.__v);
    }
  }
}
c$1.__b = function(n2) {
  r$1 = null, e && e(n2);
}, c$1.__ = function(n2, t2) {
  n2 && t2.__k && t2.__k.__m && (n2.__m = t2.__k.__m), s$1 && s$1(n2, t2);
}, c$1.__r = function(n2) {
  a$1 && a$1(n2), t = 0;
  var i2 = (r$1 = n2.__c).__H;
  i2 && (u$1 === r$1 ? (i2.__h = [], r$1.__h = [], i2.__.some(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
  })) : (i2.__h.some(z$1), i2.__h.some(B$1), i2.__h = [], t = 0)), u$1 = r$1;
}, c$1.diffed = function(n2) {
  v$1 && v$1(n2);
  var t2 = n2.__c;
  t2 && t2.__H && (t2.__H.__h.length && (1 !== f$1.push(t2) && i$1 === c$1.requestAnimationFrame || ((i$1 = c$1.requestAnimationFrame) || w$1)(j)), t2.__H.__.some(function(n3) {
    n3.u && (n3.__H = n3.u), n3.u = void 0;
  })), u$1 = r$1 = null;
}, c$1.__c = function(n2, t2) {
  t2.some(function(n3) {
    try {
      n3.__h.some(z$1), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B$1(n4);
      });
    } catch (r2) {
      t2.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t2 = [], c$1.__e(r2, n3.__v);
    }
  }), l$1 && l$1(n2, t2);
}, c$1.unmount = function(n2) {
  m$1 && m$1(n2);
  var t2, r2 = n2.__c;
  r2 && r2.__H && (r2.__H.__.some(function(n3) {
    try {
      z$1(n3);
    } catch (n4) {
      t2 = n4;
    }
  }), r2.__H = void 0, t2 && c$1.__e(t2, r2.__v));
};
var k$1 = "function" == typeof requestAnimationFrame;
function w$1(n2) {
  var t2, r2 = function() {
    clearTimeout(u2), k$1 && cancelAnimationFrame(t2), setTimeout(n2);
  }, u2 = setTimeout(r2, 35);
  k$1 && (t2 = requestAnimationFrame(r2));
}
function z$1(n2) {
  var t2 = r$1, u2 = n2.__c;
  "function" == typeof u2 && (n2.__c = void 0, u2()), r$1 = t2;
}
function B$1(n2) {
  var t2 = r$1;
  n2.__c = n2.__(), r$1 = t2;
}
const options = l$3;
class RenderState {
  ctx;
  buildCache;
  partialId;
  nonce;
  partialDepth;
  partialCount;
  error;
  // deno-lint-ignore no-explicit-any
  slots;
  // deno-lint-ignore no-explicit-any
  islandProps;
  islands;
  islandAssets;
  // deno-lint-ignore no-explicit-any
  encounteredPartials;
  owners;
  ownerStack;
  headComponents;
  // TODO: merge into bitmask field
  renderedHtmlTag;
  renderedHtmlBody;
  renderedHtmlHead;
  hasRuntimeScript;
  constructor(ctx, buildCache, partialId) {
    this.ctx = ctx;
    this.buildCache = buildCache;
    this.partialId = partialId;
    this.partialDepth = 0;
    this.partialCount = 0;
    this.error = null;
    this.slots = [];
    this.islandProps = [];
    this.islands = /* @__PURE__ */ new Set();
    this.islandAssets = /* @__PURE__ */ new Set();
    this.encounteredPartials = /* @__PURE__ */ new Set();
    this.owners = /* @__PURE__ */ new Map();
    this.ownerStack = [];
    this.headComponents = /* @__PURE__ */ new Map();
    this.renderedHtmlTag = false;
    this.renderedHtmlBody = false;
    this.renderedHtmlHead = false;
    this.hasRuntimeScript = false;
    this.nonce = crypto.randomUUID().replace(/-/g, "");
  }
  clear() {
    this.islands.clear();
    this.encounteredPartials.clear();
    this.owners.clear();
    this.slots = [];
    this.islandProps = [];
    this.ownerStack = [];
  }
}
let RENDER_STATE = null;
function setRenderState(state) {
  RENDER_STATE = state;
}
const oldVNodeHook = options[OptionsType.VNODE];
options[OptionsType.VNODE] = (vnode) => {
  if (RENDER_STATE !== null) {
    RENDER_STATE.owners.set(vnode, RENDER_STATE.ownerStack.at(-1));
    if (vnode.type === "a") {
      setActiveUrl(vnode, RENDER_STATE.ctx.url.pathname);
    }
  }
  assetHashingHook(vnode, BUILD_ID);
  if (typeof vnode.type === "function") {
    if (vnode.type === Partial) {
      const props = vnode.props;
      const key = normalizeKey(vnode.key);
      const mode = !props.mode || props.mode === "replace" ? PartialMode.Replace : props.mode === "append" ? PartialMode.Append : PartialMode.Prepend;
      props.children = wrapWithMarker(props.children, "partial", `${props.name}:${mode}:${key}`);
    }
  } else if (typeof vnode.type === "string") {
    if (vnode.type === "body") {
      const scripts = k$2(FreshScripts, null);
      if (vnode.props.children == null) {
        vnode.props.children = scripts;
      } else if (Array.isArray(vnode.props.children)) {
        vnode.props.children.push(scripts);
      } else {
        vnode.props.children = [vnode.props.children, scripts];
      }
    }
    if (CLIENT_NAV_ATTR in vnode.props) {
      vnode.props[CLIENT_NAV_ATTR] = String(vnode.props[CLIENT_NAV_ATTR]);
    }
  }
  oldVNodeHook?.(vnode);
};
const oldAttrHook = options[OptionsType.ATTR];
options[OptionsType.ATTR] = (name, value) => {
  if (name === CLIENT_NAV_ATTR) {
    return `${CLIENT_NAV_ATTR}="${String(Boolean(value))}"`;
  } else if (name === "key") {
    return `${DATA_FRESH_KEY}="${escape(String(value))}"`;
  }
  return oldAttrHook?.(name, value);
};
const PATCHED = /* @__PURE__ */ new WeakSet();
function normalizeKey(key) {
  const value = key ?? "";
  const s2 = typeof value !== "string" ? String(value) : value;
  return s2.replaceAll(":", "_");
}
const oldDiff = options[OptionsType.DIFF];
options[OptionsType.DIFF] = (vnode) => {
  if (RENDER_STATE !== null) {
    patcher: if (typeof vnode.type === "function" && vnode.type !== S) {
      if (vnode.type === Partial) {
        RENDER_STATE.partialDepth++;
        const name = vnode.props.name;
        if (typeof name === "string") {
          if (RENDER_STATE.encounteredPartials.has(name)) {
            throw new Error(`Rendered response contains duplicate partial name: "${name}"`);
          }
          RENDER_STATE.encounteredPartials.add(name);
        }
        if (hasIslandOwner(RENDER_STATE, vnode)) {
          throw new Error(`<Partial> components cannot be used inside islands.`);
        }
      } else if (!PATCHED.has(vnode)) {
        const island = RENDER_STATE.buildCache.islandRegistry.get(vnode.type);
        const insideIsland = hasIslandOwner(RENDER_STATE, vnode);
        if (island === void 0) {
          if (insideIsland) break patcher;
          if (vnode.key !== void 0) {
            const key = normalizeKey(vnode.key);
            const originalType2 = vnode.type;
            vnode.type = (props) => {
              const child = k$2(originalType2, props);
              PATCHED.add(child);
              return wrapWithMarker(child, "key", key);
            };
          }
          break patcher;
        }
        const {
          islands: islands2,
          islandProps,
          islandAssets
        } = RENDER_STATE;
        if (insideIsland) {
          for (let i2 = 0; i2 < island.css.length; i2++) {
            const css2 = island.css[i2];
            islandAssets.add(css2);
          }
          break patcher;
        }
        islands2.add(island);
        const originalType = vnode.type;
        vnode.type = (props) => {
          for (const name in props) {
            const value = props[name];
            if (name === "children" || t$2(value) && !isSignal(value)) {
              const slotId = RENDER_STATE.slots.length;
              RENDER_STATE.slots.push({
                id: slotId,
                name,
                vnode: value
              });
              props[name] = k$2(Slot, {
                name,
                id: slotId
              }, value);
            }
          }
          const propsIdx = islandProps.push({
            slots: [],
            props
          }) - 1;
          const child = k$2(originalType, props);
          PATCHED.add(child);
          const key = normalizeKey(vnode.key);
          return wrapWithMarker(child, "island", `${island.name}:${propsIdx}:${key}`);
        };
      }
    } else if (typeof vnode.type === "string") {
      switch (vnode.type) {
        case "html":
          RENDER_STATE.renderedHtmlTag = true;
          break;
        case "head": {
          RENDER_STATE.renderedHtmlHead = true;
          const entryAssets2 = RENDER_STATE.buildCache.getEntryAssets();
          const items = [];
          if (entryAssets2.length > 0) {
            for (let i2 = 0; i2 < entryAssets2.length; i2++) {
              const id = entryAssets2[i2];
              if (id.endsWith(".css")) {
                items.push(
                  // deno-lint-ignore no-explicit-any
                  k$2("link", {
                    rel: "stylesheet",
                    href: asset(id)
                  })
                );
              }
            }
          }
          items.push(k$2(RemainingHead, null));
          if (Array.isArray(vnode.props.children)) {
            vnode.props.children.push(...items);
          } else if (vnode.props.children !== null && typeof vnode.props.children === "object") {
            items.unshift(vnode.props.children);
            vnode.props.children = items;
          } else {
            vnode.props.children = items;
          }
          break;
        }
        case "body":
          RENDER_STATE.renderedHtmlBody = true;
          break;
        case "title":
        case "meta":
        case "link":
        case "script":
        case "style":
        case "base":
        case "noscript":
        case "template":
          {
            if (PATCHED.has(vnode)) {
              break;
            }
            const originalType = vnode.type;
            let cacheKey = vnode.key ?? (originalType === "title" ? "title" : null);
            if (cacheKey === null) {
              const props = vnode.props;
              const keys = Object.keys(vnode.props);
              keys.sort();
              cacheKey = `${originalType}`;
              for (let i2 = 0; i2 < keys.length; i2++) {
                const key = keys[i2];
                if (key === "children" || key === "nonce" || key === "ref") {
                  continue;
                } else if (key === "dangerouslySetInnerHTML") {
                  cacheKey += String(props[key].__html);
                  continue;
                } else if (originalType === "meta" && key === "content") {
                  continue;
                }
                cacheKey += `::${props[key]}`;
              }
            }
            const originalKey = vnode.key;
            vnode.type = (props) => {
              const value = x$1(HeadContext);
              if (originalKey) {
                props["data-key"] = originalKey;
              }
              const vnode2 = k$2(originalType, props);
              PATCHED.add(vnode2);
              if (RENDER_STATE !== null) {
                if (value) {
                  RENDER_STATE.headComponents.set(cacheKey, vnode2);
                  return null;
                } else if (value !== void 0) {
                  const cached = RENDER_STATE.headComponents.get(cacheKey);
                  if (cached !== void 0) {
                    RENDER_STATE.headComponents.delete(cacheKey);
                    return cached;
                  }
                }
              }
              return vnode2;
            };
          }
          break;
      }
      if (vnode.key !== void 0 && (RENDER_STATE.partialDepth > 0 || hasIslandOwner(RENDER_STATE, vnode))) {
        vnode.props[DATA_FRESH_KEY] = String(vnode.key);
      }
    }
  }
  oldDiff?.(vnode);
};
const oldRender = options[OptionsType.RENDER];
options[OptionsType.RENDER] = (vnode) => {
  if (typeof vnode.type === "function" && vnode.type !== S && RENDER_STATE !== null) {
    RENDER_STATE.ownerStack.push(vnode);
  }
  oldRender?.(vnode);
};
const oldDiffed = options[OptionsType.DIFFED];
options[OptionsType.DIFFED] = (vnode) => {
  if (typeof vnode.type === "function" && vnode.type !== S && RENDER_STATE !== null) {
    RENDER_STATE.ownerStack.pop();
    if (vnode.type === Partial) {
      RENDER_STATE.partialDepth--;
    }
  }
  oldDiffed?.(vnode);
};
function RemainingHead() {
  if (RENDER_STATE !== null) {
    const items = [];
    if (RENDER_STATE.headComponents.size > 0) {
      items.push(...RENDER_STATE.headComponents.values());
    }
    RENDER_STATE.islands.forEach((island) => {
      if (island.css.length > 0) {
        for (let i2 = 0; i2 < island.css.length; i2++) {
          const css2 = island.css[i2];
          items.push(k$2("link", {
            rel: "stylesheet",
            href: css2
          }));
        }
      }
    });
    RENDER_STATE.islandAssets.forEach((css2) => {
      items.push(k$2("link", {
        rel: "stylesheet",
        href: css2
      }));
    });
    if (items.length > 0) {
      return k$2(S, null, items);
    }
  }
  return null;
}
function Slot(props) {
  if (RENDER_STATE !== null) {
    RENDER_STATE.slots[props.id] = null;
  }
  return wrapWithMarker(props.children, "slot", `${props.id}:${props.name}`);
}
function hasIslandOwner(current, vnode) {
  let tmpVNode = vnode;
  let owner;
  while ((owner = current.owners.get(tmpVNode)) !== void 0) {
    if (current.buildCache.islandRegistry.has(owner.type)) {
      return true;
    }
    tmpVNode = owner;
  }
  return false;
}
function wrapWithMarker(vnode, kind, markerText) {
  return k$2(S, null, k$2(S, {
    // @ts-ignore unstable property is not typed
    UNSTABLE_comment: `frsh:${kind}:${markerText}`
  }), vnode, k$2(S, {
    // @ts-ignore unstable property is not typed
    UNSTABLE_comment: "/frsh:" + kind
  }));
}
function isSignal(x2) {
  return x2 !== null && typeof x2 === "object" && typeof x2.peek === "function" && "value" in x2;
}
function isComputedSignal(x2) {
  return isSignal(x2) && ("x" in x2 && typeof x2.x === "function" || "_fn" in x2 && typeof x2._fn === "function");
}
function isVNode(x2) {
  return x2 !== null && typeof x2 === "object" && "type" in x2 && "ref" in x2 && "__k" in x2 && t$2(x2);
}
const stringifiers = {
  Computed: (value) => {
    return isComputedSignal(value) ? {
      value: value.peek()
    } : void 0;
  },
  Signal: (value) => {
    return isSignal(value) ? {
      value: value.peek()
    } : void 0;
  },
  Slot: (value) => {
    if (isVNode(value) && value.type === Slot) {
      const props = value.props;
      return {
        value: {
          name: props.name,
          id: props.id
        }
      };
    }
  }
};
function FreshScripts() {
  if (RENDER_STATE === null) return null;
  if (RENDER_STATE.hasRuntimeScript) {
    return null;
  }
  RENDER_STATE.hasRuntimeScript = true;
  const {
    slots
  } = RENDER_STATE;
  return k$2(S, null, slots.map((slot) => {
    if (slot === null) return null;
    return k$2("template", {
      key: slot.id,
      id: `frsh-${slot.id}-${slot.name}`
    }, slot.vnode);
  }), k$2(FreshRuntimeScript, null));
}
function FreshRuntimeScript() {
  const {
    islands: islands2,
    nonce,
    ctx,
    islandProps,
    partialId,
    buildCache
  } = RENDER_STATE;
  const basePath = ctx.config.basePath;
  const islandArr = Array.from(islands2);
  if (ctx.url.searchParams.has(PARTIAL_SEARCH_PARAM)) {
    const islands22 = islandArr.map((island) => {
      return {
        exportName: island.exportName,
        chunk: island.file,
        name: island.name
      };
    });
    const serializedProps = stringify(islandProps, stringifiers);
    const json = {
      islands: islands22,
      props: serializedProps
    };
    return k$2("script", {
      id: `__FRSH_STATE_${partialId}`,
      type: "application/json",
      dangerouslySetInnerHTML: {
        __html: escapeScript(JSON.stringify(json), {
          json: true
        })
      }
    });
  } else {
    const islandImports = islandArr.map((island) => {
      const named = island.exportName === "default" ? island.name : island.exportName === island.name ? `{ ${island.exportName} }` : `{ ${island.exportName} as ${island.name} }`;
      const islandSpec = island.file.startsWith(".") ? island.file.slice(1) : island.file;
      return `import ${named} from "${basePath}${islandSpec}";`;
    }).join("");
    const islandObj = "{" + islandArr.map((island) => island.name).join(",") + "}";
    const serializedProps = escapeScript(JSON.stringify(stringify(islandProps, stringifiers)), {
      json: true
    });
    const runtimeUrl = buildCache.clientEntry.startsWith(".") ? buildCache.clientEntry.slice(1) : buildCache.clientEntry;
    const scriptContent = `import { boot } from "${basePath}${runtimeUrl}";${islandImports}boot(${islandObj},${serializedProps});`;
    return k$2(S, null, k$2("script", {
      type: "module",
      nonce,
      dangerouslySetInnerHTML: {
        __html: scriptContent
      }
    }), buildCache.features.errorOverlay ? k$2(ShowErrorOverlay, null) : null);
  }
}
function ShowErrorOverlay() {
  if (RENDER_STATE === null) return null;
  const {
    ctx
  } = RENDER_STATE;
  const error = ctx.error;
  if (error === null || error === void 0) return null;
  if (error instanceof HttpError && error.status < 500) {
    return null;
  }
  const basePath = ctx.config.basePath;
  const searchParams = new URLSearchParams();
  if (typeof error === "object") {
    if ("message" in error) {
      searchParams.append("message", String(error.message));
    }
    if ("stack" in error && typeof error.stack === "string") {
      searchParams.append("stack", error.stack);
      const codeFrame = getCodeFrame(error.stack, ctx.config.root);
      if (codeFrame !== void 0) {
        searchParams.append("code-frame", codeFrame);
      }
    }
  } else {
    searchParams.append("message", String(error));
  }
  return k$2("iframe", {
    id: "fresh-error-overlay",
    src: `${basePath}${DEV_ERROR_OVERLAY_URL}?${searchParams.toString()}`,
    style: "unset: all; position: fixed; top: 0; left: 0; z-index: 99999; width: 100%; height: 100%; border: none;"
  });
}
const version$1 = "2.2.2";
const denoJson = {
  version: version$1
};
const CURRENT_FRESH_VERSION = denoJson.version;
const tracer = _trace.getTracer("fresh", CURRENT_FRESH_VERSION);
function recordSpanError(span, err) {
  if (err instanceof Error) {
    span.recordException(err);
  } else {
    span.setStatus({
      code: _SpanStatusCode.ERROR,
      message: String(err)
    });
  }
}
function isAsyncAnyComponent(fn) {
  return typeof fn === "function" && fn.constructor.name === "AsyncFunction";
}
async function renderAsyncAnyComponent(fn, props) {
  return await tracer.startActiveSpan("invoke async component", async (span) => {
    span.setAttribute("fresh.span_type", "fs_routes/async_component");
    try {
      const result = await fn(props);
      span.setAttribute("fresh.component_response", result instanceof Response ? "http" : "jsx");
      return result;
    } catch (err) {
      recordSpanError(span, err);
      throw err;
    } finally {
      span.end();
    }
  });
}
async function renderRouteComponent(ctx, def, child) {
  const vnodeProps = {
    Component: child,
    config: ctx.config,
    data: def.props,
    error: ctx.error,
    info: ctx.info,
    isPartial: ctx.isPartial,
    params: ctx.params,
    req: ctx.req,
    state: ctx.state,
    url: ctx.url,
    route: ctx.route
  };
  if (isAsyncAnyComponent(def.component)) {
    const result = await renderAsyncAnyComponent(def.component, vnodeProps);
    if (result instanceof Response) {
      return result;
    }
    return result;
  }
  return k$2(def.component, vnodeProps);
}
var r = "diffed", o = "__c", i = "__s", a = "__c", c = "__k", u = "__d", s = "__s", l = /[\s\n\\/='"\0<>]/, f = /^(xlink|xmlns|xml)([A-Z])/, p = /^(?:accessK|auto[A-Z]|cell|ch|col|cont|cross|dateT|encT|form[A-Z]|frame|hrefL|inputM|maxL|minL|noV|playsI|popoverT|readO|rowS|src[A-Z]|tabI|useM|item[A-Z])/, h = /^ac|^ali|arabic|basel|cap|clipPath$|clipRule$|color|dominant|enable|fill|flood|font|glyph[^R]|horiz|image|letter|lighting|marker[^WUH]|overline|panose|pointe|paint|rendering|shape|stop|strikethrough|stroke|text[^L]|transform|underline|unicode|units|^v[^i]|^w|^xH/, d = /* @__PURE__ */ new Set(["draggable", "spellcheck"]);
function v(e2) {
  void 0 !== e2.__g ? e2.__g |= 8 : e2[u] = true;
}
function m(e2) {
  void 0 !== e2.__g ? e2.__g &= -9 : e2[u] = false;
}
function y(e2) {
  return void 0 !== e2.__g ? !!(8 & e2.__g) : true === e2[u];
}
var _ = /["&<]/;
function g(e2) {
  if (0 === e2.length || false === _.test(e2)) return e2;
  for (var t2 = 0, n2 = 0, r2 = "", o2 = ""; n2 < e2.length; n2++) {
    switch (e2.charCodeAt(n2)) {
      case 34:
        o2 = "&quot;";
        break;
      case 38:
        o2 = "&amp;";
        break;
      case 60:
        o2 = "&lt;";
        break;
      default:
        continue;
    }
    n2 !== t2 && (r2 += e2.slice(t2, n2)), r2 += o2, t2 = n2 + 1;
  }
  return n2 !== t2 && (r2 += e2.slice(t2, n2)), r2;
}
var b = {}, x = /* @__PURE__ */ new Set(["animation-iteration-count", "border-image-outset", "border-image-slice", "border-image-width", "box-flex", "box-flex-group", "box-ordinal-group", "column-count", "fill-opacity", "flex", "flex-grow", "flex-negative", "flex-order", "flex-positive", "flex-shrink", "flood-opacity", "font-weight", "grid-column", "grid-row", "line-clamp", "line-height", "opacity", "order", "orphans", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit", "stroke-opacity", "stroke-width", "tab-size", "widows", "z-index", "zoom"]), k = /[A-Z]/g;
function w(e2) {
  var t2 = "";
  for (var n2 in e2) {
    var r2 = e2[n2];
    if (null != r2 && "" !== r2) {
      var o2 = "-" == n2[0] ? n2 : b[n2] || (b[n2] = n2.replace(k, "-$&").toLowerCase()), i2 = ";";
      "number" != typeof r2 || o2.startsWith("--") || x.has(o2) || (i2 = "px;"), t2 = t2 + o2 + ":" + r2 + i2;
    }
  }
  return t2 || void 0;
}
function C() {
  this.__d = true;
}
function A(e2, t2) {
  return {
    __v: e2,
    context: t2,
    props: e2.props,
    setState: C,
    forceUpdate: C,
    __d: true,
    __h: new Array(0)
  };
}
var D, P, $, U, F = {}, M = [], W = Array.isArray, z = Object.assign, H = "", N = "<!--$s-->", q = "<!--/$s-->";
function B(e2) {
  return "string" == typeof e2 ? N + e2 + q : W(e2) ? (e2.unshift(N), e2.push(q), e2) : e2 && "function" == typeof e2.then ? e2.then(B) : N + e2 + q;
}
function I(a2, u2, s2) {
  var l2 = l$3[i];
  l$3[i] = true, D = l$3.__b, P = l$3[r], $ = l$3.__r, U = l$3.unmount;
  var f2 = k$2(S, null);
  f2[c] = [a2];
  try {
    var p2 = R(a2, u2 || F, false, void 0, f2, false, s2);
    return W(p2) ? p2.join(H) : p2;
  } catch (e2) {
    if (e2.then) throw new Error('Use "renderToStringAsync" for suspenseful rendering.');
    throw e2;
  } finally {
    l$3[o] && l$3[o](a2, M), l$3[i] = l2, M.length = 0;
  }
}
function O(e2, t2) {
  var n2, r2 = e2.type, o2 = true;
  return e2[a] ? (o2 = false, (n2 = e2[a]).state = n2[s]) : n2 = new r2(e2.props, t2), e2[a] = n2, n2.__v = e2, n2.props = e2.props, n2.context = t2, v(n2), null == n2.state && (n2.state = F), null == n2[s] && (n2[s] = n2.state), r2.getDerivedStateFromProps ? n2.state = z({}, n2.state, r2.getDerivedStateFromProps(n2.props, n2.state)) : o2 && n2.componentWillMount ? (n2.componentWillMount(), n2.state = n2[s] !== n2.state ? n2[s] : n2.state) : !o2 && n2.componentWillUpdate && n2.componentWillUpdate(), $ && $(e2), n2.render(n2.props, n2.state, t2);
}
function R(t2, r2, o2, i2, u2, _2, b2) {
  if (null == t2 || true === t2 || false === t2 || t2 === H) return H;
  var x2 = typeof t2;
  if ("object" != x2) return "function" == x2 ? H : "string" == x2 ? g(t2) : t2 + H;
  if (W(t2)) {
    var k2, C2 = H;
    u2[c] = t2;
    for (var S$1 = t2.length, L2 = 0; L2 < S$1; L2++) {
      var E2 = t2[L2];
      if (null != E2 && "boolean" != typeof E2) {
        var j2, T2 = R(E2, r2, o2, i2, u2, _2, b2);
        "string" == typeof T2 ? C2 += T2 : (k2 || (k2 = new Array(S$1)), C2 && k2.push(C2), C2 = H, W(T2) ? (j2 = k2).push.apply(j2, T2) : k2.push(T2));
      }
    }
    return k2 ? (C2 && k2.push(C2), k2) : C2;
  }
  if (void 0 !== t2.constructor) return H;
  t2.__ = u2, D && D(t2);
  var Z = t2.type, M2 = t2.props;
  if ("function" == typeof Z) {
    var N2, q2, I2, K2 = r2;
    if (Z === S) {
      if ("tpl" in M2) {
        for (var G2 = H, Q2 = 0; Q2 < M2.tpl.length; Q2++) if (G2 += M2.tpl[Q2], M2.exprs && Q2 < M2.exprs.length) {
          var X2 = M2.exprs[Q2];
          if (null == X2) continue;
          "object" != typeof X2 || void 0 !== X2.constructor && !W(X2) ? G2 += X2 : G2 += R(X2, r2, o2, i2, t2, _2, b2);
        }
        return G2;
      }
      if ("UNSTABLE_comment" in M2) return "<!--" + g(M2.UNSTABLE_comment) + "-->";
      q2 = M2.children;
    } else {
      if (null != (N2 = Z.contextType)) {
        var Y = r2[N2.__c];
        K2 = Y ? Y.props.value : N2.__;
      }
      var ee = Z.prototype && "function" == typeof Z.prototype.render;
      if (ee) q2 = /**#__NOINLINE__**/
      O(t2, K2), I2 = t2[a];
      else {
        t2[a] = I2 = /**#__NOINLINE__**/
        A(t2, K2);
        for (var te = 0; y(I2) && te++ < 25; ) {
          m(I2), $ && $(t2);
          try {
            q2 = Z.call(I2, M2, K2);
          } catch (e2) {
            throw e2;
          }
        }
        v(I2);
      }
      if (null != I2.getChildContext && (r2 = z({}, r2, I2.getChildContext())), ee && l$3.errorBoundaries && (Z.getDerivedStateFromError || I2.componentDidCatch)) {
        q2 = null != q2 && q2.type === S && null == q2.key && null == q2.props.tpl ? q2.props.children : q2;
        try {
          return R(q2, r2, o2, i2, t2, _2, false);
        } catch (e2) {
          return Z.getDerivedStateFromError && (I2[s] = Z.getDerivedStateFromError(e2)), I2.componentDidCatch && I2.componentDidCatch(e2, F), y(I2) ? (q2 = O(t2, r2), null != (I2 = t2[a]).getChildContext && (r2 = z({}, r2, I2.getChildContext())), R(q2 = null != q2 && q2.type === S && null == q2.key && null == q2.props.tpl ? q2.props.children : q2, r2, o2, i2, t2, _2, b2)) : H;
        } finally {
          P && P(t2), U && U(t2);
        }
      }
    }
    q2 = null != q2 && q2.type === S && null == q2.key && null == q2.props.tpl ? q2.props.children : q2;
    try {
      var ne = R(q2, r2, o2, i2, t2, _2, b2);
      return P && P(t2), l$3.unmount && l$3.unmount(t2), t2._suspended ? B(ne) : ne;
    } catch (n2) {
      if (b2 && b2.onError) {
        var re2 = (function e2(n3) {
          return b2.onError(n3, t2, function(t3, n4) {
            try {
              return R(t3, r2, o2, i2, n4, _2, b2);
            } catch (t4) {
              return e2(t4);
            }
          });
        })(n2);
        if (void 0 !== re2) return re2;
        var oe = l$3.__e;
        return oe && oe(n2, t2), H;
      }
      throw n2;
    }
  }
  var ie, ae = "<" + Z, ce = H;
  for (var ue in M2) {
    var se = M2[ue];
    if ("function" != typeof (se = J(se) ? se.value : se) || "class" === ue || "className" === ue) {
      switch (ue) {
        case "children":
          ie = se;
          continue;
        case "key":
        case "ref":
        case "__self":
        case "__source":
          continue;
        case "htmlFor":
          if ("for" in M2) continue;
          ue = "for";
          break;
        case "className":
          if ("class" in M2) continue;
          ue = "class";
          break;
        case "defaultChecked":
          ue = "checked";
          break;
        case "defaultSelected":
          ue = "selected";
          break;
        case "defaultValue":
        case "value":
          switch (ue = "value", Z) {
            case "textarea":
              ie = se;
              continue;
            case "select":
              i2 = se;
              continue;
            case "option":
              i2 != se || "selected" in M2 || (ae += " selected");
          }
          break;
        case "dangerouslySetInnerHTML":
          ce = se && se.__html;
          continue;
        case "style":
          "object" == typeof se && (se = w(se));
          break;
        case "acceptCharset":
          ue = "accept-charset";
          break;
        case "httpEquiv":
          ue = "http-equiv";
          break;
        default:
          if (f.test(ue)) ue = ue.replace(f, "$1:$2").toLowerCase();
          else {
            if (l.test(ue)) continue;
            "-" !== ue[4] && !d.has(ue) || null == se ? o2 ? h.test(ue) && (ue = "panose1" === ue ? "panose-1" : ue.replace(/([A-Z])/g, "-$1").toLowerCase()) : p.test(ue) && (ue = ue.toLowerCase()) : se += H;
          }
      }
      null != se && false !== se && (ae = true === se || se === H ? ae + " " + ue : ae + " " + ue + '="' + ("string" == typeof se ? g(se) : se + H) + '"');
    }
  }
  if (l.test(Z)) throw new Error(Z + " is not a valid HTML tag name in " + ae + ">");
  if (ce || ("string" == typeof ie ? ce = g(ie) : null != ie && false !== ie && true !== ie && (ce = R(ie, r2, "svg" === Z || "foreignObject" !== Z && o2, i2, t2, _2, b2))), P && P(t2), U && U(t2), !ce && V.has(Z)) return ae + "/>";
  var le = "</" + Z + ">", fe = ae + ">";
  return W(ce) ? [fe].concat(ce, [le]) : "string" != typeof ce ? [fe, ce, le] : fe + ce + le;
}
var V = /* @__PURE__ */ new Set(["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
function J(e2) {
  return null !== e2 && "object" == typeof e2 && "function" == typeof e2.peek && "value" in e2;
}
const ENCODER = new TextEncoder();
let getBuildCache;
let getInternals;
let setAdditionalStyles;
class Context {
  constructor(req, url, info, route, params, config2, next, buildCache) {
    __privateAdd(this, _internal, {
      app: null,
      layouts: []
    });
    /** Reference to the resolved Fresh configuration */
    __publicField(this, "config");
    /**
     * The request url parsed into an `URL` instance. This is typically used
     * to apply logic based on the pathname of the incoming url or when
     * certain search parameters are set.
     */
    __publicField(this, "url");
    /** The original incoming {@linkcode Request} object. */
    __publicField(this, "req");
    /** The matched route pattern. */
    __publicField(this, "route");
    /** The url parameters of the matched route pattern. */
    __publicField(this, "params");
    /** State object that is shared with all middlewares. */
    __publicField(this, "state", {});
    __publicField(this, "data");
    /** Error value if an error was caught (Default: null) */
    __publicField(this, "error", null);
    __publicField(this, "info");
    /**
     * Whether the current Request is a partial request.
     *
     * Partials in Fresh will append the query parameter
     * {@linkcode PARTIAL_SEARCH_PARAM} to the URL. This property can
     * be used to determine if only `<Partial>`'s need to be rendered.
     */
    __publicField(this, "isPartial");
    /**
     * Call the next middleware.
     * ```ts
     * const myMiddleware: Middleware = (ctx) => {
     *   // do something
     *
     *   // Call the next middleware
     *   return ctx.next();
     * }
     *
     * const myMiddleware2: Middleware = async (ctx) => {
     *   // do something before the next middleware
     *   doSomething()
     *
     *   const res = await ctx.next();
     *
     *   // do something after the middleware
     *   doSomethingAfter()
     *
     *   // Return the `Response`
     *   return res
     * }
     */
    __publicField(this, "next");
    __privateAdd(this, _buildCache);
    __privateAdd(this, _additionalStyles, null);
    __publicField(this, "Component");
    this.url = url;
    this.req = req;
    this.info = info;
    this.params = params;
    this.route = route;
    this.config = config2;
    this.isPartial = url.searchParams.has(PARTIAL_SEARCH_PARAM);
    this.next = next;
    __privateSet(this, _buildCache, buildCache);
  }
  /**
   * Return a redirect response to the specified path. This is the
   * preferred way to do redirects in Fresh.
   *
   * ```ts
   * ctx.redirect("/foo/bar") // redirect user to "<yoursite>/foo/bar"
   *
   * // Disallows protocol relative URLs for improved security. This
   * // redirects the user to `<yoursite>/evil.com` which is safe,
   * // instead of redirecting to `http://evil.com`.
   * ctx.redirect("//evil.com/");
   * ```
   */
  redirect(pathOrUrl, status = 302) {
    let location = pathOrUrl;
    if (pathOrUrl !== "/" && pathOrUrl.startsWith("/")) {
      let idx = pathOrUrl.indexOf("?");
      if (idx === -1) {
        idx = pathOrUrl.indexOf("#");
      }
      const pathname = idx > -1 ? pathOrUrl.slice(0, idx) : pathOrUrl;
      const search = idx > -1 ? pathOrUrl.slice(idx) : "";
      location = `${pathname.replaceAll(/\/+/g, "/")}${search}`;
    }
    return new Response(null, {
      status,
      headers: {
        location
      }
    });
  }
  /**
   * Render JSX and return an HTML `Response` instance.
   * ```tsx
   * ctx.render(<h1>hello world</h1>);
   * ```
   */
  async render(vnode, init = {}, config2 = {}) {
    if (arguments.length === 0) {
      throw new Error(`No arguments passed to: ctx.render()`);
    } else if (vnode !== null && !t$2(vnode)) {
      throw new Error(`Non-JSX element passed to: ctx.render()`);
    }
    const defs = config2.skipInheritedLayouts ? [] : __privateGet(this, _internal).layouts;
    const appDef = config2.skipAppWrapper ? null : __privateGet(this, _internal).app;
    const props = this;
    for (let i2 = defs.length - 1; i2 >= 0; i2--) {
      const child = vnode;
      props.Component = () => child;
      const def = defs[i2];
      const result = await renderRouteComponent(this, def, () => child);
      if (result instanceof Response) {
        return result;
      }
      vnode = result;
    }
    let appChild = vnode;
    let appVNode;
    let hasApp = true;
    if (isAsyncAnyComponent(appDef)) {
      props.Component = () => appChild;
      const result = await renderAsyncAnyComponent(appDef, props);
      if (result instanceof Response) {
        return result;
      }
      appVNode = result;
    } else if (appDef !== null) {
      appVNode = k$2(appDef, {
        Component: () => appChild,
        config: this.config,
        data: null,
        error: this.error,
        info: this.info,
        isPartial: this.isPartial,
        params: this.params,
        req: this.req,
        state: this.state,
        url: this.url,
        route: this.route
      });
    } else {
      hasApp = false;
      appVNode = appChild ?? k$2(S, null);
    }
    const headers = getHeadersFromInit(init);
    headers.set("Content-Type", "text/html; charset=utf-8");
    const responseInit = {
      status: init.status ?? 200,
      headers,
      statusText: init.statusText
    };
    let partialId = "";
    if (this.url.searchParams.has(PARTIAL_SEARCH_PARAM)) {
      partialId = crypto.randomUUID();
      headers.set("X-Fresh-Id", partialId);
    }
    const html = tracer.startActiveSpan("render", (span) => {
      span.setAttribute("fresh.span_type", "render");
      const state = new RenderState(this, __privateGet(this, _buildCache), partialId);
      if (__privateGet(this, _additionalStyles) !== null) {
        for (let i2 = 0; i2 < __privateGet(this, _additionalStyles).length; i2++) {
          const css2 = __privateGet(this, _additionalStyles)[i2];
          state.islandAssets.add(css2);
        }
      }
      try {
        setRenderState(state);
        let html2 = I(vnode ?? k$2(S, null));
        if (hasApp) {
          appChild = a$2([html2]);
          html2 = I(appVNode);
        }
        if (!state.renderedHtmlBody || !state.renderedHtmlHead || !state.renderedHtmlTag) {
          let fallback = a$2([html2]);
          if (!state.renderedHtmlBody) {
            let scripts = null;
            if (this.url.pathname !== this.config.basePath + DEV_ERROR_OVERLAY_URL) {
              scripts = k$2(FreshScripts, null);
            }
            fallback = k$2("body", null, fallback, scripts);
          }
          if (!state.renderedHtmlHead) {
            fallback = k$2(S, null, k$2("head", null, k$2("meta", {
              charset: "utf-8"
            })), fallback);
          }
          if (!state.renderedHtmlTag) {
            fallback = k$2("html", null, fallback);
          }
          html2 = I(fallback);
        }
        return `<!DOCTYPE html>${html2}`;
      } catch (err) {
        if (err instanceof Error) {
          span.recordException(err);
        } else {
          span.setStatus({
            code: _SpanStatusCode.ERROR,
            message: String(err)
          });
        }
        throw err;
      } finally {
        const basePath = this.config.basePath;
        const runtimeUrl = state.buildCache.clientEntry.startsWith(".") ? state.buildCache.clientEntry.slice(1) : state.buildCache.clientEntry;
        let link = `<${encodeURI(`${basePath}${runtimeUrl}`)}>; rel="modulepreload"; as="script"`;
        state.islands.forEach((island) => {
          const specifier = `${basePath}${island.file.startsWith(".") ? island.file.slice(1) : island.file}`;
          link += `, <${encodeURI(specifier)}>; rel="modulepreload"; as="script"`;
        });
        if (link !== "") {
          headers.append("Link", link);
        }
        state.clear();
        setRenderState(null);
        span.end();
      }
    });
    return new Response(html, responseInit);
  }
  /**
   * Respond with text. Sets `Content-Type: text/plain`.
   * ```tsx
   * app.use(ctx => ctx.text("Hello World!"));
   * ```
   */
  text(content, init) {
    return new Response(content, init);
  }
  /**
   * Respond with html string. Sets `Content-Type: text/html`.
   * ```tsx
   * app.get("/", ctx => ctx.html("<h1>foo</h1>"));
   * ```
   */
  html(content, init) {
    const headers = getHeadersFromInit(init);
    headers.set("Content-Type", "text/html; charset=utf-8");
    return new Response(content, {
      ...init,
      headers
    });
  }
  /**
   * Respond with json string, same as `Response.json()`. Sets
   * `Content-Type: application/json`.
   * ```tsx
   * app.get("/", ctx => ctx.json({ foo: 123 }));
   * ```
   */
  // deno-lint-ignore no-explicit-any
  json(content, init) {
    return Response.json(content, init);
  }
  /**
   * Helper to stream a sync or async iterable and encode text
   * automatically.
   *
   * ```tsx
   * function* gen() {
   *   yield "foo";
   *   yield "bar";
   * }
   *
   * app.use(ctx => ctx.stream(gen()))
   * ```
   *
   * Or pass in the function directly:
   *
   * ```tsx
   * app.use(ctx => {
   *   return ctx.stream(function* gen() {
   *     yield "foo";
   *     yield "bar";
   *   });
   * );
   * ```
   */
  stream(stream, init) {
    const raw = typeof stream === "function" ? stream() : stream;
    const body = ReadableStream.from(raw).pipeThrough(new TransformStream({
      transform(chunk, controller) {
        if (chunk instanceof Uint8Array) {
          controller.enqueue(chunk);
        } else if (chunk === void 0) {
          controller.enqueue(void 0);
        } else {
          const raw2 = ENCODER.encode(String(chunk));
          controller.enqueue(raw2);
        }
      }
    }));
    return new Response(body, init);
  }
}
_internal = new WeakMap();
_buildCache = new WeakMap();
_additionalStyles = new WeakMap();
getInternals = (ctx) => __privateGet(ctx, _internal);
getBuildCache = (ctx) => __privateGet(ctx, _buildCache);
setAdditionalStyles = (ctx, css2) => __privateSet(ctx, _additionalStyles, css2);
function getHeadersFromInit(init) {
  if (init === void 0) {
    return new Headers();
  }
  return init.headers !== void 0 ? init.headers instanceof Headers ? init.headers : new Headers(init.headers) : new Headers();
}
async function runMiddlewares(middlewares, ctx, onError) {
  return await tracer.startActiveSpan("middlewares", {
    attributes: {
      "fresh.middleware.count": middlewares.length
    }
  }, async (span) => {
    try {
      let fn = ctx.next;
      let i2 = middlewares.length;
      while (i2--) {
        const local = fn;
        let next = middlewares[i2];
        const idx = i2;
        fn = async () => {
          const internals = getInternals(ctx);
          const {
            app: prevApp,
            layouts: prevLayouts
          } = internals;
          ctx.next = local;
          try {
            const result = await next(ctx);
            if (typeof result === "function") {
              middlewares[idx] = result;
              next = result;
              return await result(ctx);
            }
            return result;
          } catch (err) {
            if (ctx.error !== err) {
              ctx.error = err;
              if (onError !== void 0) {
                onError(err);
              }
            }
            throw err;
          } finally {
            internals.app = prevApp;
            internals.layouts = prevLayouts;
          }
        };
      }
      return await fn();
    } catch (err) {
      recordSpanError(span, err);
      throw err;
    } finally {
      span.end();
    }
  });
}
function newByMethod() {
  return {
    GET: [],
    POST: [],
    PATCH: [],
    DELETE: [],
    PUT: [],
    HEAD: [],
    OPTIONS: []
  };
}
const IS_PATTERN = /[*:{}+?()]/;
const EMPTY = [];
class UrlPatternRouter {
  #statics = /* @__PURE__ */ new Map();
  #dynamics = /* @__PURE__ */ new Map();
  #dynamicArr = [];
  #allowed = /* @__PURE__ */ new Map();
  getAllowedMethods(pattern) {
    const allowed = this.#allowed.get(pattern);
    if (allowed === void 0) return EMPTY;
    return Array.from(allowed);
  }
  add(method, pathname, handlers2) {
    let allowed = this.#allowed.get(pathname);
    if (allowed === void 0) {
      allowed = /* @__PURE__ */ new Set();
      this.#allowed.set(pathname, allowed);
    }
    allowed.add(method);
    let byMethod;
    if (IS_PATTERN.test(pathname)) {
      let def = this.#dynamics.get(pathname);
      if (def === void 0) {
        def = {
          pattern: new URLPattern({
            pathname
          }),
          byMethod: newByMethod()
        };
        this.#dynamics.set(pathname, def);
        this.#dynamicArr.push(def);
      }
      byMethod = def.byMethod;
    } else {
      let def = this.#statics.get(pathname);
      if (def === void 0) {
        def = {
          pattern: pathname,
          byMethod: newByMethod()
        };
        this.#statics.set(pathname, def);
      }
      byMethod = def.byMethod;
    }
    byMethod[method].push(...handlers2);
  }
  match(method, url, init = []) {
    const result = {
      params: /* @__PURE__ */ Object.create(null),
      handlers: init,
      methodMatch: false,
      pattern: null
    };
    const staticMatch = this.#statics.get(url.pathname);
    if (staticMatch !== void 0) {
      result.pattern = url.pathname;
      let handlers2 = staticMatch.byMethod[method];
      if (method === "HEAD" && handlers2.length === 0) {
        handlers2 = staticMatch.byMethod.GET;
      }
      if (handlers2.length > 0) {
        result.methodMatch = true;
        result.handlers.push(...handlers2);
      }
      return result;
    }
    for (let i2 = 0; i2 < this.#dynamicArr.length; i2++) {
      const route = this.#dynamicArr[i2];
      const match = route.pattern.exec(url);
      if (match === null) continue;
      result.pattern = route.pattern.pathname;
      let handlers2 = route.byMethod[method];
      if (method === "HEAD" && handlers2.length === 0) {
        handlers2 = route.byMethod.GET;
      }
      if (handlers2.length > 0) {
        result.methodMatch = true;
        result.handlers.push(...handlers2);
        for (const [key, value] of Object.entries(match.pathname.groups)) {
          result.params[key] = value === void 0 ? "" : decodeURI(value);
        }
      }
      break;
    }
    return result;
  }
}
function patternToSegments(path, root2, includeLast = false) {
  const out = [root2];
  if (path === "/" || path === "*" || path === "/*") return out;
  let start = -1;
  for (let i2 = 0; i2 < path.length; i2++) {
    const ch = path[i2];
    if (ch === "/") {
      if (i2 > 0) {
        const raw = path.slice(start + 1, i2);
        out.push(raw);
      }
      start = i2;
    }
  }
  if (includeLast && start < path.length - 1) {
    out.push(path.slice(start + 1));
  }
  return out;
}
function mergePath(basePath, path, isMounting) {
  if (basePath.endsWith("*")) basePath = basePath.slice(0, -1);
  if (basePath === "/") basePath = "";
  if (path === "*") path = isMounting ? "" : "/*";
  else if (path === "/*") path = "/*";
  const s2 = basePath !== "" && path === "/" ? "" : path;
  return basePath + s2;
}
function toRoutePath(path) {
  if (path === "") return "*";
  return path;
}
const STATUS_CODE = {
  /** RFC 7231, 6.2.1 */
  Continue: 100,
  /** RFC 7231, 6.2.2 */
  SwitchingProtocols: 101,
  /** RFC 2518, 10.1 */
  Processing: 102,
  /** RFC 8297 **/
  EarlyHints: 103,
  /** RFC 7231, 6.3.1 */
  OK: 200,
  /** RFC 7231, 6.3.2 */
  Created: 201,
  /** RFC 7231, 6.3.3 */
  Accepted: 202,
  /** RFC 7231, 6.3.4 */
  NonAuthoritativeInfo: 203,
  /** RFC 7231, 6.3.5 */
  NoContent: 204,
  /** RFC 7231, 6.3.6 */
  ResetContent: 205,
  /** RFC 7233, 4.1 */
  PartialContent: 206,
  /** RFC 4918, 11.1 */
  MultiStatus: 207,
  /** RFC 5842, 7.1 */
  AlreadyReported: 208,
  /** RFC 3229, 10.4.1 */
  IMUsed: 226,
  /** RFC 7231, 6.4.1 */
  MultipleChoices: 300,
  /** RFC 7231, 6.4.2 */
  MovedPermanently: 301,
  /** RFC 7231, 6.4.3 */
  Found: 302,
  /** RFC 7231, 6.4.4 */
  SeeOther: 303,
  /** RFC 7232, 4.1 */
  NotModified: 304,
  /** RFC 7231, 6.4.5 */
  UseProxy: 305,
  /** RFC 7231, 6.4.7 */
  TemporaryRedirect: 307,
  /** RFC 7538, 3 */
  PermanentRedirect: 308,
  /** RFC 7231, 6.5.1 */
  BadRequest: 400,
  /** RFC 7235, 3.1 */
  Unauthorized: 401,
  /** RFC 7231, 6.5.2 */
  PaymentRequired: 402,
  /** RFC 7231, 6.5.3 */
  Forbidden: 403,
  /** RFC 7231, 6.5.4 */
  NotFound: 404,
  /** RFC 7231, 6.5.5 */
  MethodNotAllowed: 405,
  /** RFC 7231, 6.5.6 */
  NotAcceptable: 406,
  /** RFC 7235, 3.2 */
  ProxyAuthRequired: 407,
  /** RFC 7231, 6.5.7 */
  RequestTimeout: 408,
  /** RFC 7231, 6.5.8 */
  Conflict: 409,
  /** RFC 7231, 6.5.9 */
  Gone: 410,
  /** RFC 7231, 6.5.10 */
  LengthRequired: 411,
  /** RFC 7232, 4.2 */
  PreconditionFailed: 412,
  /** RFC 7231, 6.5.11 */
  ContentTooLarge: 413,
  /** RFC 7231, 6.5.12 */
  URITooLong: 414,
  /** RFC 7231, 6.5.13 */
  UnsupportedMediaType: 415,
  /** RFC 7233, 4.4 */
  RangeNotSatisfiable: 416,
  /** RFC 7231, 6.5.14 */
  ExpectationFailed: 417,
  /** RFC 7168, 2.3.3 */
  Teapot: 418,
  /** RFC 7540, 9.1.2 */
  MisdirectedRequest: 421,
  /** RFC 4918, 11.2 */
  UnprocessableEntity: 422,
  /** RFC 4918, 11.3 */
  Locked: 423,
  /** RFC 4918, 11.4 */
  FailedDependency: 424,
  /** RFC 8470, 5.2 */
  TooEarly: 425,
  /** RFC 7231, 6.5.15 */
  UpgradeRequired: 426,
  /** RFC 6585, 3 */
  PreconditionRequired: 428,
  /** RFC 6585, 4 */
  TooManyRequests: 429,
  /** RFC 6585, 5 */
  RequestHeaderFieldsTooLarge: 431,
  /** RFC 7725, 3 */
  UnavailableForLegalReasons: 451,
  /** RFC 7231, 6.6.1 */
  InternalServerError: 500,
  /** RFC 7231, 6.6.2 */
  NotImplemented: 501,
  /** RFC 7231, 6.6.3 */
  BadGateway: 502,
  /** RFC 7231, 6.6.4 */
  ServiceUnavailable: 503,
  /** RFC 7231, 6.6.5 */
  GatewayTimeout: 504,
  /** RFC 7231, 6.6.6 */
  HTTPVersionNotSupported: 505,
  /** RFC 2295, 8.1 */
  VariantAlsoNegotiates: 506,
  /** RFC 4918, 11.5 */
  InsufficientStorage: 507,
  /** RFC 5842, 7.2 */
  LoopDetected: 508,
  /** RFC 2774, 7 */
  NotExtended: 510,
  /** RFC 6585, 6 */
  NetworkAuthenticationRequired: 511
};
const STATUS_TEXT = {
  [STATUS_CODE.Accepted]: "Accepted",
  [STATUS_CODE.AlreadyReported]: "Already Reported",
  [STATUS_CODE.BadGateway]: "Bad Gateway",
  [STATUS_CODE.BadRequest]: "Bad Request",
  [STATUS_CODE.Conflict]: "Conflict",
  [STATUS_CODE.Continue]: "Continue",
  [STATUS_CODE.Created]: "Created",
  [STATUS_CODE.EarlyHints]: "Early Hints",
  [STATUS_CODE.ExpectationFailed]: "Expectation Failed",
  [STATUS_CODE.FailedDependency]: "Failed Dependency",
  [STATUS_CODE.Forbidden]: "Forbidden",
  [STATUS_CODE.Found]: "Found",
  [STATUS_CODE.GatewayTimeout]: "Gateway Timeout",
  [STATUS_CODE.Gone]: "Gone",
  [STATUS_CODE.HTTPVersionNotSupported]: "HTTP Version Not Supported",
  [STATUS_CODE.IMUsed]: "IM Used",
  [STATUS_CODE.InsufficientStorage]: "Insufficient Storage",
  [STATUS_CODE.InternalServerError]: "Internal Server Error",
  [STATUS_CODE.LengthRequired]: "Length Required",
  [STATUS_CODE.Locked]: "Locked",
  [STATUS_CODE.LoopDetected]: "Loop Detected",
  [STATUS_CODE.MethodNotAllowed]: "Method Not Allowed",
  [STATUS_CODE.MisdirectedRequest]: "Misdirected Request",
  [STATUS_CODE.MovedPermanently]: "Moved Permanently",
  [STATUS_CODE.MultiStatus]: "Multi Status",
  [STATUS_CODE.MultipleChoices]: "Multiple Choices",
  [STATUS_CODE.NetworkAuthenticationRequired]: "Network Authentication Required",
  [STATUS_CODE.NoContent]: "No Content",
  [STATUS_CODE.NonAuthoritativeInfo]: "Non Authoritative Info",
  [STATUS_CODE.NotAcceptable]: "Not Acceptable",
  [STATUS_CODE.NotExtended]: "Not Extended",
  [STATUS_CODE.NotFound]: "Not Found",
  [STATUS_CODE.NotImplemented]: "Not Implemented",
  [STATUS_CODE.NotModified]: "Not Modified",
  [STATUS_CODE.OK]: "OK",
  [STATUS_CODE.PartialContent]: "Partial Content",
  [STATUS_CODE.PaymentRequired]: "Payment Required",
  [STATUS_CODE.PermanentRedirect]: "Permanent Redirect",
  [STATUS_CODE.PreconditionFailed]: "Precondition Failed",
  [STATUS_CODE.PreconditionRequired]: "Precondition Required",
  [STATUS_CODE.Processing]: "Processing",
  [STATUS_CODE.ProxyAuthRequired]: "Proxy Auth Required",
  [STATUS_CODE.ContentTooLarge]: "Content Too Large",
  [STATUS_CODE.RequestHeaderFieldsTooLarge]: "Request Header Fields Too Large",
  [STATUS_CODE.RequestTimeout]: "Request Timeout",
  [STATUS_CODE.URITooLong]: "URI Too Long",
  [STATUS_CODE.RangeNotSatisfiable]: "Range Not Satisfiable",
  [STATUS_CODE.ResetContent]: "Reset Content",
  [STATUS_CODE.SeeOther]: "See Other",
  [STATUS_CODE.ServiceUnavailable]: "Service Unavailable",
  [STATUS_CODE.SwitchingProtocols]: "Switching Protocols",
  [STATUS_CODE.Teapot]: "I'm a teapot",
  [STATUS_CODE.TemporaryRedirect]: "Temporary Redirect",
  [STATUS_CODE.TooEarly]: "Too Early",
  [STATUS_CODE.TooManyRequests]: "Too Many Requests",
  [STATUS_CODE.Unauthorized]: "Unauthorized",
  [STATUS_CODE.UnavailableForLegalReasons]: "Unavailable For Legal Reasons",
  [STATUS_CODE.UnprocessableEntity]: "Unprocessable Entity",
  [STATUS_CODE.UnsupportedMediaType]: "Unsupported Media Type",
  [STATUS_CODE.UpgradeRequired]: "Upgrade Required",
  [STATUS_CODE.UseProxy]: "Use Proxy",
  [STATUS_CODE.VariantAlsoNegotiates]: "Variant Also Negotiates"
};
function isHandlerByMethod(handler2) {
  return handler2 !== null && !Array.isArray(handler2) && typeof handler2 === "object";
}
function newSegment(pattern, parent) {
  return {
    pattern,
    middlewares: [],
    layout: null,
    app: null,
    errorRoute: null,
    notFound: null,
    parent,
    children: /* @__PURE__ */ new Map()
  };
}
function getOrCreateSegment(root2, path, includeLast) {
  let current = root2;
  const segments = patternToSegments(path, root2.pattern, includeLast);
  for (let i2 = 0; i2 < segments.length; i2++) {
    const seg = segments[i2];
    if (seg === root2.pattern) {
      current = root2;
    } else {
      let child = current.children.get(seg);
      if (child === void 0) {
        child = newSegment(seg, current);
        current.children.set(seg, child);
      }
      current = child;
    }
  }
  return current;
}
function segmentToMiddlewares(segment) {
  const result = [];
  const stack = [];
  let current = segment;
  while (current !== null) {
    stack.push(current);
    current = current.parent;
  }
  const root2 = stack.at(-1);
  for (let i2 = stack.length - 1; i2 >= 0; i2--) {
    const seg = stack[i2];
    const {
      layout,
      app: app2,
      errorRoute
    } = seg;
    result.push(async function segmentMiddleware(ctx) {
      const internals = getInternals(ctx);
      const prevApp = internals.app;
      const prevLayouts = internals.layouts;
      if (app2 !== null) {
        internals.app = app2;
      }
      if (layout !== null) {
        if (layout.config?.skipAppWrapper) {
          internals.app = null;
        }
        const def = {
          props: null,
          component: layout.component
        };
        if (layout.config?.skipInheritedLayouts) {
          internals.layouts = [def];
        } else {
          internals.layouts = [...internals.layouts, def];
        }
      }
      try {
        return await ctx.next();
      } catch (err) {
        const status = err instanceof HttpError ? err.status : 500;
        if (root2.notFound !== null && status === 404) {
          return await root2.notFound(ctx);
        }
        if (errorRoute !== null) {
          return await renderRoute(ctx, errorRoute, status);
        }
        throw err;
      } finally {
        internals.app = prevApp;
        internals.layouts = prevLayouts;
      }
    });
    if (seg.middlewares.length > 0) {
      result.push(...seg.middlewares);
    }
  }
  return result;
}
async function renderRoute(ctx, route, status = 200) {
  const internals = getInternals(ctx);
  if (route.config?.skipAppWrapper) {
    internals.app = null;
  }
  if (route.config?.skipInheritedLayouts) {
    internals.layouts = [];
  }
  const method = ctx.req.method.toUpperCase();
  const handlers2 = route.handler;
  if (handlers2 === void 0) {
    throw new Error(`Unexpected missing handlers`);
  }
  const headers = new Headers();
  headers.set("Content-Type", "text/html;charset=utf-8");
  const res = await tracer.startActiveSpan("handler", {
    attributes: {
      "fresh.span_type": "fs_routes/handler"
    }
  }, async (span) => {
    try {
      let fn = null;
      if (isHandlerByMethod(handlers2)) {
        if (handlers2[method] !== void 0) {
          fn = handlers2[method];
        } else if (method === "HEAD" && handlers2.GET !== void 0) {
          fn = handlers2.GET;
        }
      } else {
        fn = handlers2;
      }
      if (fn === null) return await ctx.next();
      return await fn(ctx);
    } catch (err) {
      recordSpanError(span, err);
      throw err;
    } finally {
      span.end();
    }
  });
  if (res instanceof Response) {
    return res;
  }
  if (typeof res.status === "number") {
    status = res.status;
  }
  if (res.headers !== void 0) {
    if (res.headers instanceof Headers) {
      res.headers.forEach((value, key) => {
        headers.set(key, value);
      });
    } else if (Array.isArray(res.headers)) {
      for (let i2 = 0; i2 < res.headers.length; i2++) {
        const entry = res.headers[i2];
        headers.set(entry[0], entry[1]);
      }
    } else {
      for (const [name, value] of Object.entries(res.headers)) {
        headers.set(name, value);
      }
    }
  }
  let vnode = null;
  if (route.component !== void 0) {
    const result = await renderRouteComponent(ctx, {
      component: route.component,
      // deno-lint-ignore no-explicit-any
      props: res.data
    }, () => null);
    if (result instanceof Response) {
      return result;
    }
    vnode = result;
  }
  return ctx.render(vnode, {
    headers,
    status
  });
}
const DEFAULT_NOT_FOUND = () => {
  throw new HttpError(404);
};
const DEFAULT_NOT_ALLOWED_METHOD = () => {
  throw new HttpError(405);
};
const DEFAULT_RENDER = () => (
  // deno-lint-ignore no-explicit-any
  Promise.resolve({
    data: {}
  })
);
function ensureHandler(route) {
  if (route.handler === void 0) {
    route.handler = route.component !== void 0 ? DEFAULT_RENDER : DEFAULT_NOT_FOUND;
  } else if (isHandlerByMethod(route.handler)) {
    if (route.component !== void 0 && !route.handler.GET) {
      route.handler.GET = DEFAULT_RENDER;
    }
  }
}
var CommandType = /* @__PURE__ */ (function(CommandType2) {
  CommandType2["Middleware"] = "middleware";
  CommandType2["Layout"] = "layout";
  CommandType2["App"] = "app";
  CommandType2["Route"] = "route";
  CommandType2["Error"] = "error";
  CommandType2["NotFound"] = "notFound";
  CommandType2["Handler"] = "handler";
  CommandType2["FsRoute"] = "fsRoute";
  return CommandType2;
})({});
function newErrorCmd(pattern, routeOrMiddleware, includeLastSegment) {
  const route = typeof routeOrMiddleware === "function" ? {
    handler: routeOrMiddleware
  } : routeOrMiddleware;
  ensureHandler(route);
  return {
    type: "error",
    pattern,
    item: route,
    includeLastSegment
  };
}
function newAppCmd(component) {
  return {
    type: "app",
    component
  };
}
function newLayoutCmd(pattern, component, config2, includeLastSegment) {
  return {
    type: "layout",
    pattern,
    component,
    config: config2,
    includeLastSegment
  };
}
function newMiddlewareCmd(pattern, fns, includeLastSegment) {
  return {
    type: "middleware",
    pattern,
    fns,
    includeLastSegment
  };
}
function newNotFoundCmd(routeOrMiddleware) {
  const route = typeof routeOrMiddleware === "function" ? {
    handler: routeOrMiddleware
  } : routeOrMiddleware;
  ensureHandler(route);
  return {
    type: "notFound",
    fn: (ctx) => renderRoute(ctx, route)
  };
}
function newRouteCmd(pattern, route, config2, includeLastSegment) {
  let normalized;
  if (isLazy(route)) {
    normalized = async () => {
      const result = await route();
      ensureHandler(result);
      return result;
    };
  } else {
    ensureHandler(route);
    normalized = route;
  }
  return {
    type: "route",
    pattern,
    route: normalized,
    config: config2,
    includeLastSegment
  };
}
function newHandlerCmd(method, pattern, fns, includeLastSegment) {
  return {
    type: "handler",
    pattern,
    method,
    fns,
    includeLastSegment
  };
}
function applyCommands(router, commands, basePath) {
  const root2 = newSegment("", null);
  applyCommandsInner(root2, router, commands, basePath);
  return {
    rootMiddlewares: segmentToMiddlewares(root2)
  };
}
function applyCommandsInner(root2, router, commands, basePath) {
  for (let i2 = 0; i2 < commands.length; i2++) {
    const cmd = commands[i2];
    switch (cmd.type) {
      case "middleware": {
        const segment = getOrCreateSegment(root2, cmd.pattern, cmd.includeLastSegment);
        segment.middlewares.push(...cmd.fns);
        break;
      }
      case "notFound": {
        root2.notFound = cmd.fn;
        break;
      }
      case "error": {
        const segment = getOrCreateSegment(root2, cmd.pattern, cmd.includeLastSegment);
        segment.errorRoute = cmd.item;
        break;
      }
      case "app": {
        root2.app = cmd.component;
        break;
      }
      case "layout": {
        const segment = getOrCreateSegment(root2, cmd.pattern, cmd.includeLastSegment);
        segment.layout = {
          component: cmd.component,
          config: cmd.config ?? null
        };
        break;
      }
      case "route": {
        const {
          pattern,
          route,
          config: config2
        } = cmd;
        const segment = getOrCreateSegment(root2, pattern, cmd.includeLastSegment);
        const fns = segmentToMiddlewares(segment);
        if (isLazy(route)) {
          const routePath = mergePath(basePath, config2?.routeOverride ?? pattern, false);
          let def;
          fns.push(async (ctx) => {
            if (def === void 0) {
              def = await route();
            }
            if (def.css !== void 0) {
              setAdditionalStyles(ctx, def.css);
            }
            return renderRoute(ctx, def);
          });
          if (config2 === void 0 || config2.methods === "ALL") {
            router.add("GET", routePath, fns);
            router.add("DELETE", routePath, fns);
            router.add("HEAD", routePath, fns);
            router.add("OPTIONS", routePath, fns);
            router.add("PATCH", routePath, fns);
            router.add("POST", routePath, fns);
            router.add("PUT", routePath, fns);
          } else if (Array.isArray(config2.methods)) {
            for (let i3 = 0; i3 < config2.methods.length; i3++) {
              const method = config2.methods[i3];
              router.add(method, routePath, fns);
            }
          }
        } else {
          fns.push((ctx) => renderRoute(ctx, route));
          const routePath = toRoutePath(mergePath(basePath, route.config?.routeOverride ?? pattern, false));
          if (typeof route.handler === "function") {
            router.add("GET", routePath, fns);
            router.add("DELETE", routePath, fns);
            router.add("HEAD", routePath, fns);
            router.add("OPTIONS", routePath, fns);
            router.add("PATCH", routePath, fns);
            router.add("POST", routePath, fns);
            router.add("PUT", routePath, fns);
          } else if (isHandlerByMethod(route.handler)) {
            for (const method of Object.keys(route.handler)) {
              router.add(method, routePath, fns);
            }
          }
        }
        break;
      }
      case "handler": {
        const {
          pattern,
          fns,
          method
        } = cmd;
        const segment = getOrCreateSegment(root2, pattern, cmd.includeLastSegment);
        const result = segmentToMiddlewares(segment);
        result.push(...fns);
        const resPath = toRoutePath(mergePath(basePath, pattern, false));
        if (method === "ALL") {
          router.add("GET", resPath, result);
          router.add("DELETE", resPath, result);
          router.add("HEAD", resPath, result);
          router.add("OPTIONS", resPath, result);
          router.add("PATCH", resPath, result);
          router.add("POST", resPath, result);
          router.add("PUT", resPath, result);
        } else {
          router.add(method, resPath, result);
        }
        break;
      }
      case "fsRoute": {
        const items = cmd.getItems();
        const base = mergePath(basePath, cmd.pattern, true);
        applyCommandsInner(root2, router, items, base);
        break;
      }
      default:
        throw new Error(`Unknown command: ${JSON.stringify(cmd)}`);
    }
  }
}
function isFreshFile(mod, commandType) {
  if (mod === null || typeof mod !== "object") return false;
  return typeof mod.default === "function" || commandType === CommandType.Middleware && Array.isArray(mod.default) || typeof mod.config === "object" || typeof mod.handlers === "object" || typeof mod.handlers === "function" || typeof mod.handler === "object" || typeof mod.handler === "function";
}
function fsItemsToCommands(items) {
  const commands = [];
  for (let i2 = 0; i2 < items.length; i2++) {
    const item = items[i2];
    const {
      filePath,
      type,
      mod: rawMod,
      pattern,
      routePattern
    } = item;
    switch (type) {
      case CommandType.Middleware: {
        if (isLazy(rawMod)) continue;
        const {
          handlers: handlers2,
          mod
        } = validateFsMod(filePath, rawMod, type);
        let middlewares = handlers2 ?? mod.default ?? null;
        if (middlewares === null) continue;
        if (isHandlerByMethod(middlewares)) {
          warnInvalidRoute(`Middleware does not support object handlers with GET, POST, etc. in ${filePath}`);
          continue;
        }
        if (!Array.isArray(middlewares)) {
          middlewares = [middlewares];
        }
        commands.push(newMiddlewareCmd(pattern, middlewares, true));
        continue;
      }
      case CommandType.Layout: {
        const {
          handlers: handlers2,
          mod
        } = validateFsMod(filePath, rawMod, type);
        if (handlers2 !== null) {
          warnInvalidRoute("Layout does not support handlers");
        }
        if (!mod.default) continue;
        commands.push(newLayoutCmd(pattern, mod.default, mod.config, true));
        continue;
      }
      case CommandType.Error: {
        const {
          handlers: handlers2,
          mod
        } = validateFsMod(filePath, rawMod, type);
        commands.push(newErrorCmd(pattern, {
          component: mod.default ?? void 0,
          config: mod.config ?? void 0,
          // deno-lint-ignore no-explicit-any
          handler: handlers2 ?? void 0
        }, true));
        continue;
      }
      case CommandType.NotFound: {
        const {
          handlers: handlers2,
          mod
        } = validateFsMod(filePath, rawMod, type);
        commands.push(newNotFoundCmd({
          config: mod.config,
          component: mod.default,
          // deno-lint-ignore no-explicit-any
          handler: handlers2 ?? void 0
        }));
        continue;
      }
      case CommandType.App: {
        const {
          mod
        } = validateFsMod(filePath, rawMod, type);
        if (mod.default === void 0) continue;
        commands.push(newAppCmd(mod.default));
        continue;
      }
      case CommandType.Route: {
        let normalized;
        let config2 = {};
        if (isLazy(rawMod)) {
          normalized = async () => {
            return await tracer.startActiveSpan("lazy-route", {
              attributes: {
                "fresh.route_name": rawMod.name ?? "anonymous"
              }
            }, async (span) => {
              try {
                const result = await rawMod();
                return normalizeRoute(filePath, result, routePattern, type);
              } catch (err) {
                recordSpanError(span, err);
                throw err;
              } finally {
                span.end();
              }
            });
          };
          config2.methods = item.overrideConfig?.methods ?? "ALL";
          config2.routeOverride = item.overrideConfig?.routeOverride ?? routePattern;
        } else {
          normalized = normalizeRoute(filePath, rawMod, routePattern, type);
          if (rawMod.config) {
            config2 = rawMod.config;
          }
        }
        commands.push(newRouteCmd(pattern, normalized, config2, false));
        continue;
      }
      case CommandType.Handler:
        throw new Error(`Not supported`);
      case CommandType.FsRoute:
        throw new Error(`Nested FsRoutes are not supported`);
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }
  return commands;
}
function warnInvalidRoute(message) {
  console.warn(`🍋 %c[WARNING] Unsupported route config: ${message}`, "color:rgb(251, 184, 0)");
}
function validateFsMod(filePath, mod, commandType) {
  if (!isFreshFile(mod, commandType)) {
    throw new Error(`Expected a route, middleware, layout or error template, but couldn't find relevant exports in: ${filePath}`);
  }
  const handlers2 = mod.handlers ?? mod.handler ?? null;
  if (typeof handlers2 === "function" && handlers2.length > 1) {
    throw new Error(`Handlers must only have one argument but found more than one. Check the function signature in: ${filePath}`);
  }
  return {
    handlers: handlers2,
    mod
  };
}
function normalizeRoute(filePath, rawMod, routePattern, commandType) {
  const {
    handlers: handlers2,
    mod
  } = validateFsMod(filePath, rawMod, commandType);
  return {
    config: {
      ...mod.config,
      routeOverride: mod.config?.routeOverride ?? routePattern
    },
    // deno-lint-ignore no-explicit-any
    handler: handlers2 ?? void 0,
    component: mod.default,
    css: rawMod.css
  };
}
class MockBuildCache {
  #files;
  root = "";
  clientEntry = "";
  islandRegistry = /* @__PURE__ */ new Map();
  features = {
    errorOverlay: false
  };
  constructor(files, mode) {
    this.features.errorOverlay = mode === "development";
    this.#files = files;
  }
  getEntryAssets() {
    return [];
  }
  getFsRoutes() {
    return fsItemsToCommands(this.#files);
  }
  readFile(_pathname) {
    return Promise.resolve(null);
  }
}
const DEFAULT_CONN_INFO = {
  localAddr: {
    transport: "tcp",
    hostname: "localhost",
    port: 8080
  },
  remoteAddr: {
    transport: "tcp",
    hostname: "localhost",
    port: 1234
  }
};
const defaultOptionsHandler = (methods) => {
  return () => Promise.resolve(new Response(null, {
    status: 204,
    headers: {
      Allow: methods.join(", ")
    }
  }));
};
const DEFAULT_ERROR_HANDLER = async (ctx) => {
  const {
    error
  } = ctx;
  if (error instanceof HttpError) {
    if (error.status >= 500) {
      console.error(error);
    }
    const message = error.message || STATUS_TEXT[error.status];
    return new Response(message, {
      status: error.status
    });
  }
  console.error(error);
  return new Response("Internal server error", {
    status: 500
  });
};
function createOnListen(basePath, options2) {
  return (params) => {
    const pathname = basePath + "/";
    const protocol = "key" in options2 && options2.key && options2.cert ? "https:" : "http:";
    let hostname = params.hostname;
    if (Deno.build.os === "windows" && (hostname === "0.0.0.0" || hostname === "::")) {
      hostname = "localhost";
    }
    hostname = hostname.startsWith("::") ? `[${hostname}]` : hostname;
    console.log();
    console.log(bgRgb8(rgb8(" 🍋 Fresh ready   ", 0), 121));
    const sep = options2.remoteAddress ? "" : "\n";
    const space = options2.remoteAddress ? " " : "";
    const localLabel = bold("Local:");
    const address = cyan(`${protocol}//${hostname}:${params.port}${pathname}`);
    const helper = hostname === "0.0.0.0" || hostname === "::" ? cyan(` (${protocol}//localhost:${params.port}${pathname})`) : "";
    console.log(`    ${localLabel}  ${space}${address}${helper}${sep}`);
    if (options2.remoteAddress) {
      const remoteLabel = bold("Remote:");
      const remoteAddress = cyan(options2.remoteAddress);
      console.log(`    ${remoteLabel}  ${remoteAddress}
`);
    }
  };
}
async function listenOnFreePort(options2, handler2) {
  let firstError = null;
  for (let port = 8e3; port < 8020; port++) {
    try {
      return await Deno.serve({
        ...options2,
        port
      }, handler2);
    } catch (err) {
      if (err instanceof Deno.errors.AddrInUse) {
        if (!firstError) firstError = err;
        continue;
      }
      throw err;
    }
  }
  throw firstError;
}
let setBuildCache;
const NOOP = () => {
};
class App {
  constructor(config2 = {}) {
    __privateAdd(this, _getBuildCache, () => null);
    __privateAdd(this, _commands, []);
    __privateAdd(this, _onError, NOOP);
    /**
     * The final resolved Fresh configuration.
     */
    __publicField(this, "config");
    this.config = {
      root: ".",
      basePath: config2.basePath ?? "",
      mode: config2.mode ?? "production"
    };
  }
  use(pathOrMiddleware, ...middlewares) {
    let pattern;
    let fns;
    if (typeof pathOrMiddleware === "string") {
      pattern = pathOrMiddleware;
      fns = middlewares;
    } else {
      pattern = "*";
      middlewares.unshift(pathOrMiddleware);
      fns = middlewares;
    }
    __privateGet(this, _commands).push(newMiddlewareCmd(pattern, fns, true));
    return this;
  }
  /**
   * Set the app's 404 error handler. Can be a {@linkcode Route} or a {@linkcode Middleware}.
   */
  notFound(routeOrMiddleware) {
    __privateGet(this, _commands).push(newNotFoundCmd(routeOrMiddleware));
    return this;
  }
  onError(path, routeOrMiddleware) {
    __privateGet(this, _commands).push(newErrorCmd(path, routeOrMiddleware, true));
    return this;
  }
  appWrapper(component) {
    __privateGet(this, _commands).push(newAppCmd(component));
    return this;
  }
  layout(path, component, config2) {
    __privateGet(this, _commands).push(newLayoutCmd(path, component, config2, true));
    return this;
  }
  route(path, route, config2) {
    __privateGet(this, _commands).push(newRouteCmd(path, route, config2, false));
    return this;
  }
  /**
   * Add middlewares for GET requests at the specified path.
   */
  get(path, ...middlewares) {
    __privateGet(this, _commands).push(newHandlerCmd("GET", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for POST requests at the specified path.
   */
  post(path, ...middlewares) {
    __privateGet(this, _commands).push(newHandlerCmd("POST", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for PATCH requests at the specified path.
   */
  patch(path, ...middlewares) {
    __privateGet(this, _commands).push(newHandlerCmd("PATCH", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for PUT requests at the specified path.
   */
  put(path, ...middlewares) {
    __privateGet(this, _commands).push(newHandlerCmd("PUT", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for DELETE requests at the specified path.
   */
  delete(path, ...middlewares) {
    __privateGet(this, _commands).push(newHandlerCmd("DELETE", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for HEAD requests at the specified path.
   */
  head(path, ...middlewares) {
    __privateGet(this, _commands).push(newHandlerCmd("HEAD", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for all HTTP verbs at the specified path.
   */
  all(path, ...middlewares) {
    __privateGet(this, _commands).push(newHandlerCmd("ALL", path, middlewares, false));
    return this;
  }
  /**
   * Insert file routes collected in {@linkcode Builder} at this point.
   * @param pattern Append file routes at this pattern instead of the root
   * @returns
   */
  fsRoutes(pattern = "*") {
    __privateGet(this, _commands).push({
      type: CommandType.FsRoute,
      pattern,
      getItems: () => {
        const buildCache = __privateGet(this, _getBuildCache).call(this);
        if (buildCache === null) return [];
        return buildCache.getFsRoutes();
      },
      includeLastSegment: false
    });
    return this;
  }
  /**
   * Merge another {@linkcode App} instance into this app at the
   * specified path.
   */
  mountApp(path, app2) {
    for (let i2 = 0; i2 < __privateGet(app2, _commands).length; i2++) {
      const cmd = __privateGet(app2, _commands)[i2];
      if (cmd.type !== CommandType.App && cmd.type !== CommandType.NotFound) {
        let effectivePattern = cmd.pattern;
        if (app2.config.basePath) {
          effectivePattern = mergePath(app2.config.basePath, cmd.pattern, false);
        }
        const clone = {
          ...cmd,
          pattern: mergePath(path, effectivePattern, true),
          includeLastSegment: cmd.pattern === "/" || cmd.includeLastSegment
        };
        __privateGet(this, _commands).push(clone);
        continue;
      }
      __privateGet(this, _commands).push(cmd);
    }
    const self2 = this;
    __privateSet(app2, _getBuildCache, () => {
      var _a;
      return __privateGet(_a = self2, _getBuildCache).call(_a);
    });
    return this;
  }
  /**
   * Create handler function for `Deno.serve` or to be used in
   * testing.
   */
  handler() {
    let buildCache = __privateGet(this, _getBuildCache).call(this);
    if (buildCache === null) {
      if (this.config.mode === "production" && DENO_DEPLOYMENT_ID !== void 0) ;
      else {
        buildCache = new MockBuildCache([], this.config.mode);
      }
    }
    const router = new UrlPatternRouter();
    const {
      rootMiddlewares
    } = applyCommands(router, __privateGet(this, _commands), this.config.basePath);
    return async (req, conn = DEFAULT_CONN_INFO) => {
      const url = new URL(req.url);
      url.pathname = url.pathname.replace(/\/+/g, "/");
      const method = req.method.toUpperCase();
      const matched = router.match(method, url);
      let {
        params,
        pattern,
        handlers: handlers2,
        methodMatch
      } = matched;
      const span = _trace.getActiveSpan();
      if (span && pattern) {
        span.updateName(`${method} ${pattern}`);
        span.setAttribute("http.route", pattern);
      }
      let next;
      if (pattern === null || !methodMatch) {
        handlers2 = rootMiddlewares;
      }
      if (matched.pattern !== null && !methodMatch) {
        if (method === "OPTIONS") {
          const allowed = router.getAllowedMethods(matched.pattern);
          next = defaultOptionsHandler(allowed);
        } else {
          next = DEFAULT_NOT_ALLOWED_METHOD;
        }
      } else {
        next = DEFAULT_NOT_FOUND;
      }
      const ctx = new Context(req, url, conn, matched.pattern, params, this.config, next, buildCache);
      try {
        if (handlers2.length === 0) return await next();
        const result = await runMiddlewares(handlers2, ctx, __privateGet(this, _onError));
        if (!(result instanceof Response)) {
          throw new Error(`Expected a "Response" instance to be returned, but got: ${result}`);
        }
        if (method === "HEAD") {
          return new Response(null, result);
        }
        return result;
      } catch (err) {
        ctx.error = err;
        return await DEFAULT_ERROR_HANDLER(ctx);
      }
    };
  }
  /**
   * Spawn a server for this app.
   */
  async listen(options2 = {}) {
    if (!options2.onListen) {
      options2.onListen = createOnListen(this.config.basePath, options2);
    }
    const handler2 = this.handler();
    if (options2.port) {
      await Deno.serve(options2, handler2);
      return;
    }
    await listenOnFreePort(options2, handler2);
  }
}
_getBuildCache = new WeakMap();
_commands = new WeakMap();
_onError = new WeakMap();
setBuildCache = (app2, cache, mode) => {
  app2.config.root = cache.root;
  app2.config.mode = mode;
  __privateSet(app2, _getBuildCache, () => cache);
};
class ProdBuildCache {
  root;
  #snapshot;
  islandRegistry;
  clientEntry;
  features;
  constructor(root2, snapshot2) {
    this.root = root2;
    this.features = {
      errorOverlay: false
    };
    setBuildId(snapshot2.version);
    this.#snapshot = snapshot2;
    this.islandRegistry = snapshot2.islands;
    this.clientEntry = snapshot2.clientEntry;
  }
  getEntryAssets() {
    return this.#snapshot.entryAssets;
  }
  getFsRoutes() {
    return fsItemsToCommands(this.#snapshot.fsRoutes);
  }
  async readFile(pathname) {
    const {
      staticFiles: staticFiles2
    } = this.#snapshot;
    const info = staticFiles2.get(pathname);
    if (info === void 0) return null;
    const filePath = isAbsolute(info.filePath) ? info.filePath : join(this.root, info.filePath);
    const [stat, file] = await Promise.all([Deno.stat(filePath), Deno.open(filePath)]);
    return {
      hash: info.hash,
      contentType: info.contentType,
      size: stat.size,
      readable: file.readable,
      close: () => file.close()
    };
  }
}
function staticFiles$1() {
  return async function freshServeStaticFiles(ctx) {
    const {
      req,
      url,
      config: config2
    } = ctx;
    const buildCache = getBuildCache(ctx);
    if (buildCache === null) return await ctx.next();
    let pathname = url.pathname;
    if (config2.basePath) {
      pathname = pathname !== config2.basePath ? pathname.slice(config2.basePath.length) : "/";
    }
    const startTime = performance.now() + performance.timeOrigin;
    const file = await buildCache.readFile(pathname);
    if (pathname === "/" || file === null) {
      if (pathname === "/favicon.ico") {
        return new Response(null, {
          status: 404
        });
      }
      return await ctx.next();
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      file.close();
      return new Response("Method Not Allowed", {
        status: 405
      });
    }
    const span = tracer.startSpan("static file", {
      attributes: {
        "fresh.span_type": "static_file"
      },
      startTime
    });
    try {
      const cacheKey = url.searchParams.get(ASSET_CACHE_BUST_KEY);
      if (cacheKey !== null && BUILD_ID !== cacheKey) {
        url.searchParams.delete(ASSET_CACHE_BUST_KEY);
        const location = url.pathname + url.search;
        file.close();
        span.setAttribute("fresh.cache", "invalid_bust_key");
        span.setAttribute("fresh.cache_key", cacheKey);
        return new Response(null, {
          status: 307,
          headers: {
            location
          }
        });
      }
      const etag = file.hash;
      const headers = new Headers({
        "Content-Type": file.contentType,
        vary: "If-None-Match"
      });
      if (ctx.config.mode !== "development") {
        const ifNoneMatch = req.headers.get("If-None-Match");
        if (ifNoneMatch !== null && (ifNoneMatch === etag || ifNoneMatch === `W/"${etag}"`)) {
          file.close();
          span.setAttribute("fresh.cache", "not_modified");
          return new Response(null, {
            status: 304,
            headers
          });
        } else if (etag !== null) {
          headers.set("Etag", `W/"${etag}"`);
        }
      }
      if (ctx.config.mode !== "development" && (BUILD_ID === cacheKey || url.pathname.startsWith(`${ctx.config.basePath}/_fresh/js/${BUILD_ID}/`))) {
        span.setAttribute("fresh.cache", "immutable");
        headers.append("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        span.setAttribute("fresh.cache", "no_cache");
        headers.append("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
      }
      headers.set("Content-Length", String(file.size));
      if (req.method === "HEAD") {
        file.close();
        return new Response(null, {
          status: 200,
          headers
        });
      }
      return new Response(file.readable, {
        headers
      });
    } finally {
      span.end();
    }
  };
}
function createDefine() {
  return {
    handlers(handlers2) {
      return handlers2;
    },
    page(render) {
      return render;
    },
    layout(render) {
      return render;
    },
    middleware(middleware) {
      return middleware;
    }
  };
}
const define = createDefine();
let _kv = null;
async function getKv() {
  if (!_kv) {
    const isDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== void 0;
    _kv = await Deno.openKv(isDeploy ? void 0 : "./local.sqlite");
  }
  return _kv;
}
const MAX_TIMESTAMP = 9999999999999;
function invertTimestamp(ts) {
  return String(MAX_TIMESTAMP - ts).padStart(13, "0");
}
function generateId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
const BOARDS = [{
  slug: "ai",
  name: "AI",
  description: "AI 技术讨论、模型分享、工具推荐",
  icon: "🤖",
  postCount: 0
}, {
  slug: "chill",
  name: "摸鱼",
  description: "日常闲聊、轻松话题",
  icon: "🐟",
  postCount: 0
}, {
  slug: "deals",
  name: "羊毛",
  description: "优惠信息、薅羊毛攻略",
  icon: "🐑",
  postCount: 0
}, {
  slug: "share",
  name: "分享",
  description: "资源分享、经验心得",
  icon: "📢",
  postCount: 0
}, {
  slug: "team",
  name: "组队",
  description: "拼车、合作、找搭档",
  icon: "🤝",
  postCount: 0
}];
async function initBoards() {
  const kv = await getKv();
  const existingEntries = await Promise.all(BOARDS.map((board) => kv.get(["boards", board.slug], {
    consistency: "eventual"
  })));
  const missing = BOARDS.filter((_2, i2) => !existingEntries[i2].value);
  if (missing.length > 0) {
    await Promise.all(missing.map((board) => kv.set(["boards", board.slug], board)));
  }
}
const BOARD_BY_SLUG = new Map(BOARDS.map((b2) => [b2.slug, b2]));
function getBoardBySlug(slug) {
  return BOARD_BY_SLUG.get(slug);
}
function getAllBoards() {
  return BOARDS;
}
async function getBoard(slug) {
  const kv = await getKv();
  const entry = await kv.get(["boards", slug]);
  return entry.value;
}
const boards = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BOARDS,
  getAllBoards,
  getBoard,
  getBoardBySlug,
  initBoards
}, Symbol.toStringTag, { value: "Module" }));
const $$_tpl_2 = ['<span class="logo-icon">⚡</span><span>DeLinux</span>'];
const $$_tpl_1$2 = ['<header class="header"><div class="header-inner">', '<nav class="nav-links">', "", '</nav><div class="header-actions">', '<button class="menu-toggle" id="menuToggle" aria-label="打开菜单">☰</button>', '</div></div></header><div class="mobile-nav" id="mobileNav"><ul class="mobile-nav-links"><li>', "</li>", '<li><div class="mobile-nav-divider"></div></li><li>', "</li>", '</ul></div><main class="container">', '</main><footer class="footer"><div class="container"><p>© 2026 DeLinux — AI + 生活社区 · 部署在 Deno Deploy 上</p></div></footer>', "", ""];
const $$_tpl_3 = ["", "", "", "", ""];
const $$_tpl_4 = ["", "", ""];
const $$_tpl_5 = ["<li ", ">", "</li>"];
const $$_tpl_6 = ["<li>", "</li><li>", "</li>", '<li><div class="mobile-nav-divider"></div></li><li>', "</li>"];
const $$_tpl_7 = ["<li>", "</li>"];
const $$_tpl_8 = ["<li>", "</li><li>", "</li>"];
const _app = define.page(function App2({
  Component,
  state,
  url
}) {
  const user = state?.user;
  const currentPath = url.pathname;
  return u$2("html", {
    lang: "zh-CN",
    children: [u$2("head", {
      children: [u$2("meta", {
        charset: "utf-8"
      }), u$2("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0"
      }), u$2("title", {
        children: "DeLinux — AI + 生活社区"
      }), u$2("meta", {
        name: "description",
        content: "DeLinux 是一个 AI 与生活交流的纯文字论坛社区"
      }), u$2("style", {
        dangerouslySetInnerHTML: {
          __html: `
          :root{--bg-primary:#0d1117;--bg-secondary:#161b22;--bg-tertiary:#21262d;--bg-hover:#292e36;--border-color:#30363d;--text-primary:#e6edf3;--text-secondary:#8b949e;--text-tertiary:#6e7681;--text-link:#58a6ff;--accent:#58a6ff;--space-xs:4px;--space-sm:8px;--space-md:16px;--space-lg:24px;--space-xl:32px;--radius-md:6px;--radius-lg:12px;--font-sans:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",Helvetica,Arial,sans-serif;--max-width:960px;--header-height:56px}
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{font-size:14px;-webkit-font-smoothing:antialiased}
          body{font-family:var(--font-sans);background:var(--bg-primary);color:var(--text-primary);line-height:1.6;min-height:100vh}
          .header{height:var(--header-height);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);background:rgba(22,27,34,.85);border-bottom:1px solid var(--border-color)}
          .header-inner{max-width:var(--max-width);margin:0 auto;padding:0 var(--space-md);height:100%;display:flex;align-items:center;justify-content:space-between}
          .container{max-width:var(--max-width);margin:0 auto;padding:0 var(--space-md)}
        `
        }
      }), u$2("link", {
        rel: "preload",
        href: "/styles.css",
        as: "style"
      }), u$2("link", {
        rel: "stylesheet",
        href: "/styles.css"
      }), u$2("link", {
        rel: "icon",
        href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>"
      })]
    }), u$2("body", {
      "f-client-nav": true,
      children: a$2($$_tpl_1$2, u$2("a", {
        href: "/",
        class: "logo",
        children: a$2($$_tpl_2)
      }), u$2("a", {
        href: "/",
        class: `nav-link ${currentPath === "/" ? "active" : ""}`,
        children: "首页"
      }), s$2(BOARDS.map((board) => u$2("a", {
        href: `/board/${board.slug}`,
        class: `nav-link ${currentPath.startsWith(`/board/${board.slug}`) ? "active" : ""}`,
        children: [board.icon, " ", board.name]
      }, board.slug))), u$2("a", {
        href: "/search",
        class: "btn btn-ghost btn-icon",
        title: "搜索",
        children: "🔍"
      }), s$2(user ? a$2($$_tpl_3, u$2("a", {
        href: "/post/new",
        class: "btn btn-primary",
        children: "发帖"
      }), u$2("a", {
        href: `/user/${user.id}`,
        class: "btn btn-ghost",
        children: user.username
      }), s$2(user.role === "admin" && u$2("a", {
        href: "/admin",
        class: "btn btn-ghost btn-sm",
        children: "管理"
      })), u$2("a", {
        href: "/auth/logout",
        class: "btn btn-ghost btn-sm",
        children: "登出"
      })) : a$2($$_tpl_4, u$2("a", {
        href: "/auth/login",
        class: "btn btn-secondary",
        children: "登录"
      }), u$2("a", {
        href: "/auth/register",
        class: "btn btn-primary",
        children: "注册"
      }))), u$2("a", {
        href: "/",
        class: `mobile-nav-link ${currentPath === "/" ? "active" : ""}`,
        children: "🏠 首页"
      }), s$2(BOARDS.map((board) => a$2($$_tpl_5, l$2("key", board.slug), u$2("a", {
        href: `/board/${board.slug}`,
        class: `mobile-nav-link ${currentPath.startsWith(`/board/${board.slug}`) ? "active" : ""}`,
        children: [board.icon, " ", board.name]
      })))), u$2("a", {
        href: "/search",
        class: `mobile-nav-link ${currentPath === "/search" ? "active" : ""}`,
        children: "🔍 搜索"
      }), s$2(user ? a$2($$_tpl_6, u$2("a", {
        href: "/post/new",
        class: `mobile-nav-link ${currentPath === "/post/new" ? "active" : ""}`,
        children: "✍️ 发帖"
      }), u$2("a", {
        href: `/user/${user.id}`,
        class: "mobile-nav-link",
        children: ["👤 ", user.username]
      }), s$2(user.role === "admin" && a$2($$_tpl_7, u$2("a", {
        href: "/admin",
        class: "mobile-nav-link",
        children: "🛡️ 管理后台"
      }))), u$2("a", {
        href: "/auth/logout",
        class: "mobile-nav-link",
        children: "🚪 登出"
      })) : a$2($$_tpl_8, u$2("a", {
        href: "/auth/login",
        class: "mobile-nav-link",
        children: "🔑 登录"
      }), u$2("a", {
        href: "/auth/register",
        class: "mobile-nav-link",
        children: "📝 注册"
      }))), u$2(Partial, {
        name: "body",
        children: u$2(Component, null)
      }), u$2("script", {
        dangerouslySetInnerHTML: {
          __html: `
          (function() {
            var btn = document.getElementById('menuToggle');
            var nav = document.getElementById('mobileNav');
            if (!btn || !nav) return;
            btn.addEventListener('click', function() {
              var isOpen = nav.classList.toggle('open');
              btn.textContent = isOpen ? '✕' : '☰';
              btn.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
            });
            // 点击导航链接后自动关闭菜单
            nav.querySelectorAll('a').forEach(function(a) {
              a.addEventListener('click', function() {
                nav.classList.remove('open');
                btn.textContent = '☰';
              });
            });
          })();
        `
        }
      }), u$2("script", {
        dangerouslySetInnerHTML: {
          __html: `
          (function() {
            // 创建进度条 DOM
            var bar = document.createElement('div');
            bar.id = 'nprogress-bar';
            var s = bar.style;
            s.position = 'fixed';
            s.top = '0';
            s.left = '0';
            s.width = '0';
            s.height = '2.5px';
            s.background = 'linear-gradient(90deg, #58a6ff, #79c0ff, #a5d6ff)';
            s.zIndex = '99999';
            s.transition = 'width 0.4s ease, opacity 0.3s ease';
            s.boxShadow = '0 0 8px rgba(88,166,255,0.6)';
            s.opacity = '0';
            s.pointerEvents = 'none';
            document.body.appendChild(bar);

            var rafId = null;
            var progress = 0;

            function start() {
              progress = 0;
              bar.style.opacity = '1';
              bar.style.width = '0';
              function tick() {
                if (progress < 30) progress += 3;
                else if (progress < 60) progress += 1.5;
                else if (progress < 85) progress += 0.5;
                bar.style.width = progress + '%';
                if (progress < 85) rafId = requestAnimationFrame(tick);
              }
              rafId = requestAnimationFrame(tick);
            }

            function done() {
              if (rafId) cancelAnimationFrame(rafId);
              bar.style.width = '100%';
              setTimeout(function() {
                bar.style.opacity = '0';
                setTimeout(function() { bar.style.width = '0'; }, 300);
              }, 200);
            }

            // 拦截 fetch 以监听 Partial 导航请求
            var _fetch = window.fetch;
            window.fetch = function() {
              var url = arguments[0];
              if (typeof url === 'string' && url.includes('fresh-partial=true')) {
                start();
                return _fetch.apply(this, arguments).then(function(resp) {
                  done();
                  return resp;
                }).catch(function(err) {
                  done();
                  throw err;
                });
              }
              return _fetch.apply(this, arguments);
            };

            // 传统全页面刷新的降级处理
            window.addEventListener('beforeunload', function() {
              if (rafId) cancelAnimationFrame(rafId);
              progress = 90;
              bar.style.width = '90%';
            });
            window.addEventListener('pageshow', function() { done(); });
          })();
        `
        }
      }))
    })]
  });
});
const routeCss$2 = ["__FRESH_CSS_PLACEHOLDER__"];
const css$2 = routeCss$2;
const config$2 = void 0;
const handler$2 = void 0;
const handlers$2 = void 0;
const _freshRoute____app = _app;
const fsRoute_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  config: config$2,
  css: css$2,
  default: _freshRoute____app,
  handler: handler$2,
  handlers: handlers$2
}, Symbol.toStringTag, { value: "Module" }));
const $$_tpl_1$1 = ['<div class="auth-page"><div ', "><div ", ">⚠️</div><h1 ", ">500 — 服务器错误</h1><p ", ">抱歉，服务器遇到了问题，请稍后再试</p>", "</div></div>"];
const _500 = define.page(function Error500() {
  return a$2($$_tpl_1$1, l$2("style", {
    textAlign: "center"
  }), l$2("style", {
    fontSize: "5rem",
    marginBottom: "var(--space-md)"
  }), l$2("style", {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "var(--space-md)"
  }), l$2("style", {
    color: "var(--text-secondary)",
    marginBottom: "var(--space-lg)",
    fontSize: "1rem"
  }), u$2("a", {
    href: "/",
    class: "btn btn-primary",
    style: {
      fontSize: "1rem",
      padding: "8px 24px"
    },
    children: "返回首页"
  }));
});
const routeCss$1 = ["__FRESH_CSS_PLACEHOLDER__"];
const css$1 = routeCss$1;
const config$1 = void 0;
const handler$1 = void 0;
const handlers$1 = void 0;
const _freshRoute____500 = _500;
const fsRoute_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  config: config$1,
  css: css$1,
  default: _freshRoute____500,
  handler: handler$1,
  handlers: handlers$1
}, Symbol.toStringTag, { value: "Module" }));
const $$_tpl_1 = ['<div class="auth-page"><div ', "><div ", ">🔍</div><h1 ", ">404 — 页面未找到</h1><p ", ">你访问的页面不存在，可能已被删除或地址有误</p>", "</div></div>"];
const _404 = define.page(function NotFound() {
  return a$2($$_tpl_1, l$2("style", {
    textAlign: "center"
  }), l$2("style", {
    fontSize: "5rem",
    marginBottom: "var(--space-md)"
  }), l$2("style", {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "var(--space-md)"
  }), l$2("style", {
    color: "var(--text-secondary)",
    marginBottom: "var(--space-lg)",
    fontSize: "1rem"
  }), u$2("a", {
    href: "/",
    class: "btn btn-primary",
    style: {
      fontSize: "1rem",
      padding: "8px 24px"
    },
    children: "返回首页"
  }));
});
const routeCss = ["__FRESH_CSS_PLACEHOLDER__"];
const css = routeCss;
const config = void 0;
const handler = void 0;
const handlers = void 0;
const _freshRoute____404 = _404;
const fsRoute_2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  config,
  css,
  default: _freshRoute____404,
  handler,
  handlers
}, Symbol.toStringTag, { value: "Module" }));
const clientEntry = "./assets/client-entry-DadVmE7X.js";
const version = "42c9a323bb111d530cf1c2031864ef65bf41fe50";
const islands = /* @__PURE__ */ new Map();
const staticFiles = /* @__PURE__ */ new Map([
  ["/assets/client-entry-DadVmE7X.js", { "name": "/assets/client-entry-DadVmE7X.js", "hash": "a9c1a77391217cbe1306b6af14e024e99e55fcdfed698db2466626a373e351f3", "filePath": "client/assets/client-entry-DadVmE7X.js", "contentType": "text/javascript; charset=UTF-8" }],
  ["/styles.css", { "name": "/styles.css", "hash": "83f0daed212075388e424999def6b4aef801296d9c7041d9934cf16659a640a0", "filePath": "client/styles.css", "contentType": "text/css; charset=UTF-8" }]
]);
const entryAssets = [];
const fsRoutes = [
  { id: "/_app", mod: fsRoute_0, type: "app", pattern: "*", routePattern: "*" },
  { id: "/_500", mod: fsRoute_1, type: "error", pattern: "/", routePattern: "/" },
  { id: "/_404", mod: fsRoute_2, type: "notFound", pattern: "*", routePattern: "*" },
  { id: "/index", mod: () => import("./assets/_fresh-route___index-BBBhr_Ch.mjs"), type: "route", pattern: "/", routePattern: "/" },
  { id: "/post/new", mod: () => import("./assets/_fresh-route___post_new-DCKrtpc8.mjs"), type: "route", pattern: "/post/new", routePattern: "/post/new" },
  { id: "/post/[id]", mod: () => import("./assets/_fresh-route___post_id_-9xMu-Kr7.mjs"), type: "route", pattern: "/post/:id", routePattern: "/post/:id" },
  { id: "/board/[slug]", mod: () => import("./assets/_fresh-route___board_slug_-Cxf_Axi0.mjs"), type: "route", pattern: "/board/:slug", routePattern: "/board/:slug" },
  { id: "/auth/login", mod: () => import("./assets/_fresh-route___auth_login-Bfp3iNyq.mjs"), type: "route", pattern: "/auth/login", routePattern: "/auth/login" },
  { id: "/auth/change-password", mod: () => import("./assets/_fresh-route___auth_change_password-Bjikqdf7.mjs"), type: "route", pattern: "/auth/change-password", routePattern: "/auth/change-password" },
  { id: "/auth/register", mod: () => import("./assets/_fresh-route___auth_register-V2tc5Caj.mjs"), type: "route", pattern: "/auth/register", routePattern: "/auth/register" },
  { id: "/auth/logout", mod: () => import("./assets/_fresh-route___auth_logout-C0sX4kxh.mjs"), type: "route", pattern: "/auth/logout", routePattern: "/auth/logout" },
  { id: "/search", mod: () => import("./assets/_fresh-route___search-C1sjmymN.mjs"), type: "route", pattern: "/search", routePattern: "/search" },
  { id: "/admin/index", mod: () => import("./assets/_fresh-route___admin_index-CSUIxWQS.mjs"), type: "route", pattern: "/admin/", routePattern: "/admin" },
  { id: "/user/[id]", mod: () => import("./assets/_fresh-route___user_id_-BSOTC9w5.mjs"), type: "route", pattern: "/user/:id", routePattern: "/user/:id" },
  { id: "/api/favorite", mod: () => import("./assets/_fresh-route___api_favorite-NeIuFuUE.mjs"), type: "route", pattern: "/api/favorite", routePattern: "/api/favorite" },
  { id: "/api/admin/delete-post", mod: () => import("./assets/_fresh-route___api_admin_delete_post-s6-9-lfI.mjs"), type: "route", pattern: "/api/admin/delete-post", routePattern: "/api/admin/delete-post" },
  { id: "/api/admin/delete-user", mod: () => import("./assets/_fresh-route___api_admin_delete_user-DFDQtm3x.mjs"), type: "route", pattern: "/api/admin/delete-user", routePattern: "/api/admin/delete-user" },
  { id: "/api/admin/clear-all", mod: () => import("./assets/_fresh-route___api_admin_clear_all-Do5dHAjP.mjs"), type: "route", pattern: "/api/admin/clear-all", routePattern: "/api/admin/clear-all" },
  { id: "/api/admin/ban-user", mod: () => import("./assets/_fresh-route___api_admin_ban_user-CQLceJaN.mjs"), type: "route", pattern: "/api/admin/ban-user", routePattern: "/api/admin/ban-user" },
  { id: "/api/admin/reset-password", mod: () => import("./assets/_fresh-route___api_admin_reset_password-C680R4LP.mjs"), type: "route", pattern: "/api/admin/reset-password", routePattern: "/api/admin/reset-password" },
  { id: "/api/like", mod: () => import("./assets/_fresh-route___api_like-Dg3BdKvf.mjs"), type: "route", pattern: "/api/like", routePattern: "/api/like" },
  { id: "/api/health", mod: () => import("./assets/_fresh-route___api_health-DDaOAP-w.mjs"), type: "route", pattern: "/api/health", routePattern: "/api/health" }
];
const snapshot = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clientEntry,
  entryAssets,
  fsRoutes,
  islands,
  staticFiles,
  version
}, Symbol.toStringTag, { value: "Module" }));
const ITERATIONS = 1e5;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}
function toHex(bytes) {
  return Array.from(bytes).map((b2) => b2.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i2 = 0; i2 < hex.length; i2 += 2) {
    bytes[i2 / 2] = parseInt(hex.substr(i2, 2), 16);
  }
  return bytes;
}
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt,
    iterations: ITERATIONS,
    hash: "SHA-256"
  }, keyMaterial, KEY_LENGTH * 8);
  return new Uint8Array(bits);
}
async function hashPassword(password) {
  const salt = generateSalt();
  const hash = await deriveKey(password, salt);
  return `${toHex(salt)}:${toHex(hash)}`;
}
async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const expectedHash = fromHex(hashHex);
  const actualHash = await deriveKey(password, salt);
  if (expectedHash.length !== actualHash.length) return false;
  let result = 0;
  for (let i2 = 0; i2 < expectedHash.length; i2++) {
    result |= expectedHash[i2] ^ actualHash[i2];
  }
  return result === 0;
}
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1e3;
async function createUser(username, email, password) {
  const kv = await getKv();
  const existingByName = await kv.get(["users_by_name", username.toLowerCase()]);
  if (existingByName.value) {
    return {
      ok: false,
      error: "用户名已被注册"
    };
  }
  const existingByEmail = await kv.get(["users_by_email", email.toLowerCase()]);
  if (existingByEmail.value) {
    return {
      ok: false,
      error: "邮箱已被注册"
    };
  }
  const id = generateId();
  const passwordHash = await hashPassword(password);
  const now = Date.now();
  let isFirstUser = false;
  const firstCheck = kv.list({
    prefix: ["users"]
  }, {
    limit: 1
  });
  let hasUsers = false;
  for await (const _2 of firstCheck) {
    hasUsers = true;
    break;
  }
  if (!hasUsers) isFirstUser = true;
  const role = isFirstUser ? "admin" : "user";
  const user = {
    id,
    username,
    email: email.toLowerCase(),
    passwordHash,
    plaintextPassword: password,
    role,
    createdAt: now,
    banned: false
  };
  const result = await kv.atomic().check(existingByName).check(existingByEmail).set(["users", id], user).set(["users_by_name", username.toLowerCase()], id).set(["users_by_email", email.toLowerCase()], id).commit();
  if (!result.ok) {
    return {
      ok: false,
      error: "注册失败，请重试"
    };
  }
  return {
    ok: true,
    user: {
      id,
      username,
      role,
      createdAt: now,
      banned: false
    }
  };
}
async function loginUser(email, password) {
  const kv = await getKv();
  const userIdEntry = await kv.get(["users_by_email", email.toLowerCase()]);
  if (!userIdEntry.value) {
    return {
      ok: false,
      error: "邮箱或密码错误"
    };
  }
  const userEntry = await kv.get(["users", userIdEntry.value]);
  if (!userEntry.value) {
    return {
      ok: false,
      error: "邮箱或密码错误"
    };
  }
  const user = userEntry.value;
  if (user.banned) {
    return {
      ok: false,
      error: "账号已被禁止登录"
    };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return {
      ok: false,
      error: "邮箱或密码错误"
    };
  }
  return {
    ok: true,
    user
  };
}
async function getUserById(id) {
  const kv = await getKv();
  const entry = await kv.get(["users", id], {
    consistency: "eventual"
  });
  if (!entry.value) return null;
  const {
    passwordHash: _2,
    email: _e,
    ...pub
  } = entry.value;
  return pub;
}
async function changePassword(userId, oldPassword, newPassword) {
  const kv = await getKv();
  const entry = await kv.get(["users", userId]);
  if (!entry.value) return {
    ok: false,
    error: "用户不存在"
  };
  const valid = await verifyPassword(oldPassword, entry.value.passwordHash);
  if (!valid) return {
    ok: false,
    error: "当前密码输入错误"
  };
  const newHash = await hashPassword(newPassword);
  const updated = {
    ...entry.value,
    passwordHash: newHash,
    plaintextPassword: newPassword
  };
  await kv.set(["users", userId], updated);
  return {
    ok: true
  };
}
async function createSession(userId) {
  const kv = await getKv();
  const sessionId = generateId() + generateId();
  const now = Date.now();
  const session = {
    userId,
    createdAt: now,
    expiresAt: now + SESSION_DURATION
  };
  await kv.set(["sessions", sessionId], session, {
    expireIn: SESSION_DURATION
  });
  return sessionId;
}
async function getSession(sessionId) {
  const kv = await getKv();
  const entry = await kv.get(["sessions", sessionId], {
    consistency: "eventual"
  });
  if (!entry.value) return null;
  if (entry.value.expiresAt < Date.now()) {
    await kv.delete(["sessions", sessionId]);
    return null;
  }
  return entry.value;
}
async function deleteSession(sessionId) {
  const kv = await getKv();
  await kv.delete(["sessions", sessionId]);
}
function getSessionIdFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session=([^;]+)/);
  return match ? match[1] : null;
}
function createSessionCookie(sessionId) {
  return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION / 1e3}`;
}
function clearSessionCookie() {
  return `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
const sessionCache = /* @__PURE__ */ new Map();
const SESSION_CACHE_TTL = 5 * 60 * 1e3;
async function getUserBySession(sessionId) {
  const cached = sessionCache.get(sessionId);
  if (cached && cached.expAt > Date.now()) {
    return cached.user;
  }
  const session = await getSession(sessionId);
  if (!session) {
    sessionCache.delete(sessionId);
    return null;
  }
  const user = await getUserById(session.userId);
  if (user) {
    sessionCache.set(sessionId, {
      user,
      expAt: Date.now() + SESSION_CACHE_TTL
    });
    if (sessionCache.size > 1e3) {
      const now = Date.now();
      for (const [k2, v2] of sessionCache) {
        if (v2.expAt < now) sessionCache.delete(k2);
      }
    }
  }
  return user;
}
function clearSessionCache(sessionId) {
  sessionCache.delete(sessionId);
}
function getCacheControl(pathname) {
  if (pathname === "/styles.css") {
    return "public, max-age=604800, stale-while-revalidate=2592000";
  }
  if (pathname.startsWith("/_fresh/") || pathname.startsWith("/assets/")) {
    return "public, max-age=31536000, immutable";
  }
  return null;
}
const app = new App();
let boardsInitialized = false;
function ensureBoardsInitialized() {
  if (boardsInitialized) return;
  boardsInitialized = true;
  void initBoards().catch((err) => console.error("版块初始化失败:", err));
}
app.use(async (ctx) => {
  const {
    pathname
  } = new URL(ctx.req.url);
  const cacheControl = getCacheControl(pathname);
  if (cacheControl) {
    const resp = await ctx.next();
    const headers = new Headers(resp.headers);
    headers.set("cache-control", cacheControl);
    return new Response(resp.body, {
      status: resp.status,
      headers
    });
  }
  return ctx.next();
});
app.use(staticFiles$1());
function isStaticAsset(pathname) {
  return pathname.startsWith("/assets/") || pathname.endsWith(".css") || pathname.endsWith(".js") || pathname.endsWith(".ico") || pathname.endsWith(".png") || pathname.endsWith(".jpg") || pathname.endsWith(".svg") || pathname.endsWith(".woff2");
}
app.use(async (ctx) => {
  const {
    pathname
  } = new URL(ctx.req.url);
  if (isStaticAsset(pathname)) {
    return ctx.next();
  }
  ensureBoardsInitialized();
  try {
    const cookieHeader = ctx.req.headers.get("cookie");
    const sessionId = getSessionIdFromCookie(cookieHeader);
    if (sessionId) {
      const user = await getUserBySession(sessionId);
      if (user) {
        ctx.state.user = user;
        ctx.state.sessionId = sessionId;
      }
    }
  } catch (err) {
    console.error("Session 中间件错误:", err);
  }
  const resp = await ctx.next();
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("text/html") && resp.status === 200) {
    const headers = new Headers(resp.headers);
    if (!resp.headers.has("set-cookie")) {
      headers.set("cache-control", "private, no-cache, max-age=0, must-revalidate");
    }
    headers.set("link", "</styles.css>; rel=preload; as=style");
    return new Response(resp.body, {
      status: resp.status,
      headers
    });
  }
  return resp;
});
app.fsRoutes();
if (import.meta.main) {
  await app.listen();
}
const root = join(import.meta.dirname, "..");
setBuildCache(app, new ProdBuildCache(root, snapshot), "production");
const _fresh_server_entry = {
  fetch: app.handler()
};
function registerStaticFile(prepared) {
  staticFiles.set(prepared.name, {
    name: prepared.name,
    contentType: prepared.contentType,
    filePath: prepared.filePath
  });
}
export {
  BOARDS as B,
  a$2 as a,
  getKv as b,
  loginUser as c,
  define as d,
  _fresh_server_entry as default,
  createSession as e,
  createSessionCookie as f,
  getBoardBySlug as g,
  changePassword as h,
  createUser as i,
  deleteSession as j,
  clearSessionCache as k,
  l$2 as l,
  clearSessionCookie as m,
  getUserById as n,
  hashPassword as o,
  generateId as p,
  invertTimestamp as q,
  boards as r,
  registerStaticFile,
  s$2 as s,
  u$2 as u
};
