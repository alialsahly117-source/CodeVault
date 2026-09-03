import { useEffect } from "react";

function setMetaTag(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const fullTitle = `${title} | CodeVault`;
    document.title = fullTitle;
    if (description) {
      setMetaTag("description", description);
      setMetaTag("og:title", fullTitle, "property");
      setMetaTag("og:description", description, "property");
      setMetaTag("twitter:title", fullTitle);
      setMetaTag("twitter:description", description);
    }
  }, [title, description]);
}
