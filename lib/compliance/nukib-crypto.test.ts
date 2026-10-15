import { describe, expect, test } from "bun:test";
import {
  type CryptoAlgorithmEntry,
  getDefaultPolicyConfig,
} from "./policy-config-defaults";
import { POLICY_CONFIG_SCHEMAS } from "./policy-config-schemas";

/**
 * NÚKIB, „Minimální požadavky na kryptografické algoritmy“, verze 4.1 ze 4. března 2026, chapters 2
 * to 6: every numbered item and every sentence that sets a parameter, verbatim, by chapter, without
 * the footnote marks. Exponents are printed as in the PDF.
 * https://portal.nukib.gov.cz/informacni-servis/podpurne-materialy/69a82264c32c1c948f0686a4
 */
const NUKIB_V4_1: Readonly<Record<string, readonly string[]>> = {
  "2": [
    "Advanced Encryption Standard (AES) s délkou klíčů 128, 192 a 256 bitů",
    "Twofish s délkou klíčů 128 až 256 bitů",
    "Camellia s délkou klíčů 128, 192 a 256 bitů",
    "Serpent s délkou klíčů 128, 192 a 256 bitů",
    "SNOW 2.0, SNOW 3G s délkou klíčů 128 a 256 bitů",
    "ChaCha20 s délkou klíče 256 bitů a se zatížením klíče menším než 256 GB",
    "CCM",
    "EAX",
    "OCB1 a OCB3, doporučujeme preferovat OCB3 před OCB1",
    "GCM s inicializačním vektorem dlouhým 96 bitů a s tagem dlouhým 128 bitů",
    "ChaCha20 + Poly1305 se zatížením klíče menším než 256 GB",
    "Složená schémata typu „Encrypt-then-MAC“",
    "CTR",
    "OFB",
    "CBC (rovněž CBC-CS)",
    "CFB",
    "Samostatné použití módů šifrování mimo schémata typu „Encrypt-then-MAC“ není schváleno.",
    "HMAC pouze s hašovací funkcí z kapitoly 5",
    "CMAC",
    "KMAC",
    "GMAC s inicializačním vektorem dlouhým 96 bitů a s tagem dlouhým 128 bitů",
    "EMAC",
    "UMAC",
    "XTS – délka jednotky dat (sektoru) nesmí přesáhnout 2²⁰ bloků šifry (v případě šifry se 128bitovým blokem je to zhruba 16 MB)",
    "EME2",
  ],
  "3": [
    "Digital Signature Algorithm (DSA) s délkou klíčů 3072 bitů a více, s délkou parametru cyklické podgrupy 256 bitů a více",
    "Elliptic Curve Digital Signature Algorithm (EC-DSA) s délkou klíčů 256 bitů a více",
    "Rivest-Shamir-Adleman Probabilistic Signature Scheme (RSA-PSS) s délkou klíčů 3072 bitů a více",
    "Elliptic Curve Schnorr Signature Algorithm (EC-Schnorr) s délkou klíčů 256 bitů a více",
    "Diffie-Hellman (DH) s délkou klíčů 3072 bitů a více, s délkou parametru cyklické podgrupy 256 bitů a více",
    "Elliptic Curve Diffie-Hellman (ECDH) s délkou klíčů 256 bitů a více",
    "Elliptic Curve Integrated Encryption System – Key Encapsulation Mechanism (ECIESKEM) s délkou klíčů 256 bitů a více",
    "Provably Secure Elliptic Curve – Key Encapsulation Mechanism (PSEC-KEM) s délkou klíčů 256 bitů a více",
    "Advanced Cryptographic Engine – Key Encapsulation Mechanism (ACE-KEM) s délkou klíčů 256 bitů a více",
    "Rivest Shamir Adleman – Optimal Asymmetric Encryption Padding (RSA-OAEP) s délkou klíčů 3072 bitů a více",
    "Rivest Shamir Adleman – Key Encapsulation Mechanism (RSA-KEM) s délkou klíčů 3072 bitů a více",
  ],
  "4": [
    "ML-KEM-1024",
    "ML-KEM-1024/Kyber-1024, ML-KEM-768/Kyber-768",
    "FrodoKEM-1344, FrodoKEM-976",
    "mceliece8192128, mceliece6688128, mceliece460896, mceliece8192128f, mceliece6688128f, mceliece460896f",
    "s některým z klasických algoritmů pro ustanovení klíčů z kapitoly 3 písm. b), a to takovým způsobem, že bezpečnost hybridní kombinace zůstane zachována i v případě, kdy bude jedna z jejích složek prolomena.",
    "LMS",
    "XMSS",
    "Použití těchto algoritmů doporučujeme pouze pro ochranu integrity firmwaru a softwaru.",
    "ML-DSA-87",
    "SLH-DSA",
    "Pro samostatné použití algoritmu SLH-DSA schvalujeme bezpečnostní úrovně NIST 3 a 5 (viz standard NIST FIPS 205).",
    "ML-DSA/CRYSTALS-Dilithium",
    "SLH-DSA/SPHINCS+",
    "Falcon",
    "Pro ML-DSA v hybridní kombinaci schvalujeme varianty ML-DSA-87 a ML-DSA-65.",
  ],
  "5": [
    "SHA-256",
    "SHA-384",
    "SHA-512",
    "SHA-512/256",
    "SHA3-256",
    "SHA3-384",
    "SHA3-512",
    "SHAKE128",
    "SHAKE256",
    "Whirlpool",
    "BLAKE2",
    "Všechny schválené hašovací funkce musí mít délku výstupu alespoň 256 bitů.",
  ],
  "6": [
    "Argon2 s volenou funkcí Argon2id a parametry alespoň",
    "t = 1, m = 2²¹ (2 GiB of RAM), p = 4",
    "t = 3, m = 2¹⁶ (64 MiB of RAM), p = 4 pro prostředí s omezenou pamětí",
    "scrypt s parametry alespoň N = 131072 (2¹⁷), r = 8 a p = 1",
    "PBKDF2",
    "HMAC-SHA-256 s počtem iterací alespoň 600 000",
    "HMAC-SHA-512 s počtem iterací alespoň 210 000",
  ],
};

const LINES = Object.values(NUKIB_V4_1).flat();
const CHAPTERS = Object.values(NUKIB_V4_1).map((lines) => lines.join("\n"));

/** The document writes EC-DSA and ECIESKEM; a name matches either way. */
const unhyphened = (text: string) => text.replaceAll("-", "");
/** Whole words only, so SHA (SHA-1 in a suite name) is not found inside SHA-256, nor RSA in RSA-PSS. */
const wordsOf = (text: string) => new Set(text.split(/[\s,.()/„“]+/).map(unhyphened));
const firstWord = (e: CryptoAlgorithmEntry) => e.algorithm.split(" ")[0] ?? "";
const numbersIn = (text: string) => text.match(/\d+/g) ?? [];

/**
 * A suite's parts as the document names them: TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 is
 * ECDH used ephemerally, EC-DSA, AES with 256 bits, GCM and SHA-384.
 */
const suiteParts = (suite: string) =>
  suite
    .split("_")
    .filter((part) => part !== "TLS" && part !== "WITH")
    .map((part) => (part === "ECDHE" ? "ECDH" : part));

/**
 * An entry the document approves: its name (each of several joined by "/") and every number it
 * carries stand in one chapter; a TLS suite is made only of parts the document names.
 */
const inDocument = (e: CryptoAlgorithmEntry): boolean =>
  e.category === "tls"
    ? suiteParts(e.algorithm).every((part) =>
        wordsOf(CHAPTERS.join("\n")).has(unhyphened(part)),
      )
    : CHAPTERS.some(
        (chapter) =>
          firstWord(e)
            .split("/")
            .every((name) => wordsOf(chapter).has(unhyphened(name))) &&
          numbersIn(`${e.algorithm} ${e.keyLength ?? ""}`).every((n) =>
            chapter.includes(n),
          ),
      );

const same = (a: CryptoAlgorithmEntry, b: CryptoAlgorithmEntry) =>
  a.category === b.category &&
  a.algorithm === b.algorithm &&
  a.keyLength === b.keyLength &&
  a.status === b.status;

describe("the Czech crypto list follows NÚKIB's „Minimální požadavky na kryptografické algoritmy“", () => {
  const cs = getDefaultPolicyConfig("crypto", "cs");
  const de = getDefaultPolicyConfig("crypto", "de");

  test("fits the schema the editors save through", () => {
    expect(POLICY_CONFIG_SCHEMAS.crypto.safeParse(cs).success).toBe(true);
  });

  test("every accepted method is in the document, with the numbers it gives", () => {
    expect(
      cs.algorithms.filter((e) => e.status === "approved" && !inDocument(e)),
    ).toEqual([]);
  });

  test("nothing it bans is something the document approves", () => {
    const approvedByDocument = (e: CryptoAlgorithmEntry) => {
      const naming = LINES.filter((line) => line.includes(e.algorithm));
      const below = e.keyLength?.match(/^méně než (\d+)$/)?.[1];
      return (
        naming.length > 0 &&
        !(below && naming.every((line) => line.includes(`${below} bitů a více`)))
      );
    };
    expect(
      cs.algorithms.filter((e) => e.status === "prohibited" && approvedByDocument(e)),
    ).toEqual([]);
  });

  test("keeps nothing only for what exists: the document gives no transition period", () => {
    expect(cs.algorithms.filter((e) => e.status === "deprecated")).toEqual([]);
  });

  describe("differs from the German TR-02102 list only where the document says otherwise", () => {
    test("a German accepted method the document names stays as it is", () => {
      const named = de.algorithms.filter(
        (e) =>
          e.status === "approved" && LINES.some((line) => line.includes(e.algorithm)),
      );
      expect(named.length).toBeGreaterThan(0);
      expect(named.filter((e) => !cs.algorithms.some((c) => same(c, e)))).toEqual([]);
    });

    test("what the German list bans or keeps only for what exists, the Czech list bans", () => {
      const banned = (e: CryptoAlgorithmEntry) =>
        cs.algorithms.some(
          (c) =>
            c.status === "prohibited" &&
            c.category === e.category &&
            firstWord(c) === firstWord(e),
        );
      expect(de.algorithms.filter((e) => e.status !== "approved" && !banned(e))).toEqual(
        [],
      );
    });

    test("the same settings: the document sets no TLS version, rotation or review interval", () => {
      expect({ ...cs, algorithms: [] }).toEqual({ ...de, algorithms: [] });
    });
  });
});
