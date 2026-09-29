/**
 * Whether an address is at a free mail provider rather than a company domain.
 *
 * For a B2B signup that is the useful "does this look real" signal: disposable
 * and brand-new domains are already refused at signup (./email-quality), so a
 * verified account is a real inbox, and the open question is whether it belongs
 * to a firm. The list is the providers our German, Dutch and international
 * signups actually use; an address at a provider missing here reads as a
 * company address, which is the harmless direction.
 */
const FREE_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "gmx.de",
  "gmx.net",
  "gmx.at",
  "gmx.ch",
  "gmx.com",
  "web.de",
  "t-online.de",
  "freenet.de",
  "arcor.de",
  "online.de",
  "posteo.de",
  "mailbox.org",
  "yahoo.com",
  "yahoo.de",
  "outlook.com",
  "outlook.de",
  "hotmail.com",
  "hotmail.de",
  "live.com",
  "live.de",
  "live.nl",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "mail.com",
  "ziggo.nl",
  "kpnmail.nl",
  "hetnet.nl",
  "planet.nl",
  "home.nl",
]);

export const isFreeMailAddress = (email: string): boolean =>
  FREE_MAIL_DOMAINS.has(email.slice(email.lastIndexOf("@") + 1).toLowerCase());
