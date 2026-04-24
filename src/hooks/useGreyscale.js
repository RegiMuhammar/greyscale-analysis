import { useEffect, useState } from "react";
import { convertToGreyscale } from "../utils/greyscale";

export function useGreyscale(file) {
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!file) {
      setResult(null);
      setIsProcessing(false);
      setError("");
      return undefined;
    }

    setIsProcessing(true);
    setError("");

    convertToGreyscale(file)
      .then((nextResult) => {
        if (!cancelled) setResult(nextResult);
      })
      .catch(() => {
        if (!cancelled) {
          setResult(null);
          setError("Konversi greyscale gagal. Coba gunakan file gambar lain.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsProcessing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  return { result, isProcessing, error };
}
