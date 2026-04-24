import { useEffect, useState } from "react";
import { analyseColorPair } from "../utils/colorAnalysis";

export function useColorAnalysis(beforeUrl, afterUrl) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!beforeUrl || !afterUrl) {
      setAnalysis(null);
      setIsAnalysing(false);
      setError("");
      return undefined;
    }

    setIsAnalysing(true);
    setError("");

    analyseColorPair(beforeUrl, afterUrl)
      .then((result) => {
        if (!cancelled) setAnalysis(result);
      })
      .catch(() => {
        if (!cancelled) {
          setAnalysis(null);
          setError("Analisis warna gagal. Coba gunakan foto lain dengan format valid.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsAnalysing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [beforeUrl, afterUrl]);

  return { analysis, isAnalysing, error };
}
