export const getShareTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (hash.includes("share=")) {
    const match = hash.match(/share=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }
  if (hash.includes("/share/")) {
    const parts = hash.split("/share/");
    if (parts[1]) return parts[1].split("&")[0].split("?")[0];
  }

  const pathname = window.location.pathname;
  if (pathname.startsWith("/share/")) {
    const parts = pathname.split("/share/");
    if (parts[1]) return parts[1].split("/")[0];
  }

  return null;
};
