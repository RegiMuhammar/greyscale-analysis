import { useCallback, useEffect, useRef, useState } from "react";
import { validateImageFile } from "../utils/image";

export function useImageUpload() {
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const currentUrl = useRef("");

  const setFile = useCallback((file) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setImage((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      const url = URL.createObjectURL(file);
      currentUrl.current = url;
      return {
        file,
        url,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setImage((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      currentUrl.current = "";
      return null;
    });
    setError("");
  }, []);

  useEffect(() => {
    return () => {
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    };
  }, []);

  return { image, error, setFile, reset };
}
