/**
 * Common answers for where people report a vulnerability, read off the company's contact email:
 * a security@ address and a security.txt file at the same domain (RFC 9116 puts the file under
 * /.well-known/), and the contact address itself.
 */
export const contactSuggestions = (contactEmail: string | null): readonly string[] => {
  const email = contactEmail?.trim().toLowerCase() ?? "";
  const domain = email.split("@")[1] ?? "";
  if (!domain) return [];
  return [`security@${domain}`, `https://${domain}/.well-known/security.txt`, email];
};
