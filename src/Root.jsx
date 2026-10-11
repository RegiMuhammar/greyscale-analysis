import { useEffect, useState } from "react";
import App from "./App.jsx";
import { Landing } from "./landing/Landing.jsx";
import { WORKSPACE_HASH } from "./routes.js";

function isWorkspaceHash(hash) {
  return hash === WORKSPACE_HASH || hash.startsWith(`${WORKSPACE_HASH}/`);
}

// Hash routing keeps the app a static Vite build (no rewrites on Vercel).
// In-page anchors like "#faq" are not routes, so they stay on the landing page.
export default function Root() {
  const [onWorkspace, setOnWorkspace] = useState(() => isWorkspaceHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      const next = isWorkspaceHash(window.location.hash);
      setOnWorkspace((previous) => {
        if (previous !== next) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    document.title = onWorkspace
      ? "Workspace analisis | Grey Scale Analyser"
      : "Grey Scale Analyser | Estimasi grade kelunturan warna kain";
  }, [onWorkspace]);

  return onWorkspace ? <App /> : <Landing />;
}
