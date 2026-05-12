// Course code generation + validation.
// Generator output is constrained to a 31-char unambiguous alphabet (no 0/O/1/I/L
// — easy to confuse), so real codes never contain those chars. The validator
// however accepts ANY 6-char alphanumeric input — that way a user mistyping
// "O" for "0" (or "L" for "1") just fails the course lookup with a clear
// "code_not_found", not a frustrating "invalid format" at the input step.

const GENERATOR_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 chars

export function generateCourseCode(): string {
  let code = "";
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 6; i++) {
    const byte = buf[i] ?? 0;
    code += GENERATOR_ALPHABET[byte % GENERATOR_ALPHABET.length];
  }
  return code;
}

const VALID_CODE = /^[A-Z0-9]{6}$/;

export function normalizeCourseCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isValidCourseCode(input: string): boolean {
  return VALID_CODE.test(normalizeCourseCode(input));
}
