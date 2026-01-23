import { NavLink, useNavigate } from "react-router-dom";
import { clearInternToken, getInternToken } from "../helpers/auth";

export default function Navbar() {
    const navigate = useNavigate();
    const token = getInternToken();

    const linkStyle = (isActive) => ({
        marginRight: '15px',
        color: 'white',
        fontWeight: isActive? "700" : "400",
        fontSize: isActive? "larger" : "large",
        width: '100%',
    });

    function handleLogout() {
        clearInternToken();
        navigate('/');
    }

    return (
        <nav className="navbar" style={{ 
            backgroundColor: 'rgb(34 34 84)', 
            width: "100%",
            paddingTop: "10px",
            paddingBottom: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: "16px",
            paddingRight: "16px",
        }}>
            <div>
                <NavLink to="/" style={linkStyle}>Home</NavLink>
                <NavLink to="/analysis" style={linkStyle}>Analiza</NavLink>
                <NavLink to="/history" style={linkStyle}>Istorija</NavLink>
                <NavLink to="/admin" style={linkStyle}>Admin</NavLink>
            </div>
            {token && (
            <button 
            onClick={handleLogout}
            disabled={!token}
            style={{
                background: "white",
                color: "rgb(34 34 84)",
                borderRadius: "10px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "large",
                fontWeight: 600,
            }}
            >
            Odjavi se
            </button>
        )}
        </nav>

        
    );
}