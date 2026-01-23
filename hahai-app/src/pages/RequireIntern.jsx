import { Navigate, useLocation } from "react-router-dom";
import { getInternToken } from "../helpers/auth";

export default function RequireIntern({ children }) {
    const location = useLocation();
    const token = getInternToken();

    if(token)
        console.log("Intern token found:", token);
    else
        console.log("No intern token found.");

    
    if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
    }

    return children;
}
    