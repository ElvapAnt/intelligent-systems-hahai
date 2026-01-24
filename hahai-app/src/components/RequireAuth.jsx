import { Navigate, useLocation } from "react-router-dom";
import { isAnyoneLoggedIn } from "../helpers/auth";

export default function RequireAuth({ children }) {
  const location = useLocation();

  if (!isAnyoneLoggedIn()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
