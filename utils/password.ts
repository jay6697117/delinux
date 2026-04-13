// 密码哈希与验证工具

// 使用 Web Crypto API 实现 PBKDF2 哈希（Deno Deploy 兼容）
const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

// 生成随机盐值
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

// 将 Uint8Array 转为 hex 字符串
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 将 hex 字符串转为 Uint8Array
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// PBKDF2 派生密钥
async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH * 8,
  );

  return new Uint8Array(bits);
}

// 哈希密码（返回 salt:hash 格式）
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const hash = await deriveKey(password, salt);
  return `${toHex(salt)}:${toHex(hash)}`;
}

// 验证密码
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = fromHex(saltHex);
  const expectedHash = fromHex(hashHex);
  const actualHash = await deriveKey(password, salt);

  // 定时比较，防止时序攻击
  if (expectedHash.length !== actualHash.length) return false;
  let result = 0;
  for (let i = 0; i < expectedHash.length; i++) {
    result |= expectedHash[i] ^ actualHash[i];
  }
  return result === 0;
}
