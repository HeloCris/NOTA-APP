import { useContext } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

import { AuthContext } from "../../contexts/AuthContext";

export function StoreMessagesPage() {
  const [searchParams] = useSearchParams();
  const authContext = useContext(AuthContext);

  let basePath = "/seller";
  const user = authContext?.user;
  if (user?.role === "BRAND_OWNER") {
    basePath = "/brand";
  } else if (!user) {
    try {
      const stored = localStorage.getItem("user");
      if (stored && JSON.parse(stored).role === "BRAND_OWNER") {
        basePath = "/brand";
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("tab", "messages");

  return <Navigate to={`${basePath}?${nextParams.toString()}`} replace />;
}
