import { Navigate, useLocation } from "react-router-dom";
import { isAdminLoggedIn } from "../helpers/auth";

export default function RequireAdmin({ children }) {
  const location = useLocation();

  if (!isAdminLoggedIn()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
