/**
 * Password rules, following NIST SP 800-63B: length plus a blocklist of
 * known-bad choices beats forced complexity rules (which mostly produce
 * "Passw0rd!"). A length minimum alone doesn't help when the password is
 * "12345678" or "password" — those are the first thing any real credential
 * stuffing attempt tries.
 *
 * This list is deliberately small and high-value (the passwords that show up
 * at the top of every breach corpus) rather than a multi-megabyte dictionary:
 * it catches the overwhelming majority of genuinely trivial choices without
 * shipping a large asset or adding a network lookup to the signup path.
 */
const COMMON_PASSWORDS = new Set(
  [
    "password", "password1", "password123", "passw0rd", "p@ssw0rd", "p@ssword",
    "12345678", "123456789", "1234567890", "123123123", "12341234", "11111111",
    "00000000", "87654321", "qwertyui", "qwerty123", "qwertyuiop", "asdfghjkl",
    "zxcvbnm1", "1q2w3e4r", "1qaz2wsx", "qazwsxedc", "iloveyou", "princess",
    "sunshine", "football", "baseball", "superman", "batman12", "trustno1",
    "welcome1", "welcome123", "abc12345", "abcd1234", "letmein1", "letmein123",
    "monkey12", "dragon12", "master12", "shadow12", "michael1", "jennifer",
    "computer", "internet", "starwars", "whatever", "samsung1", "google12",
    "facebook", "instagram", "administrator", "admin123", "admin1234",
    "root1234", "toor1234", "changeme", "changeme123", "default1", "secret12",
    "test1234", "testtest", "temp1234", "pass1234", "login123", "user1234",
    "codevault", "codevault123", "الله", "123456اa",
  ].map((p) => p.toLowerCase())
);

export interface PasswordProblem {
  message: string;
}

/**
 * Returns a problem when the password should be rejected, or null when it's
 * acceptable. `email` is optional — supplied at registration, where we can
 * also refuse a password built out of the account's own address.
 */
export function checkPassword(password: string, email?: string): PasswordProblem | null {
  const normalized = password.trim().toLowerCase();

  if (COMMON_PASSWORDS.has(normalized)) {
    return { message: "كلمة المرور هذه شائعة جدًا وسهلة التخمين. اختر كلمة مرور أخرى." };
  }

  // "aaaaaaaa", "11111111" and friends — length without any real entropy.
  if (new Set(normalized).size <= 2) {
    return { message: "كلمة المرور بسيطة جدًا (تكرار نفس الحروف). اختر كلمة مرور أقوى." };
  }

  if (email) {
    const localPart = email.split("@")[0]?.toLowerCase();
    if (localPart && localPart.length >= 3 && normalized.includes(localPart)) {
      return { message: "كلمة المرور يجب ألا تحتوي على بريدك الإلكتروني." };
    }
  }

  return null;
}
