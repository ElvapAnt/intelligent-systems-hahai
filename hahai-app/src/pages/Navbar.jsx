import { NavLink, useNavigate } from "react-router-dom";
import { clearInternToken, isAnyoneLoggedIn, setAdminLoggedIn } from "../helpers/auth";

export default function Navbar() {
    const navigate = useNavigate();
    const loggedIn = isAnyoneLoggedIn();

    const linkStyle = ({isActive}) => ({
        marginRight: '15px',
        color: 'white',
        fontWeight: isActive? "700" : "600",
        fontSize: isActive? "larger" : "large",
        width: '100%',
        padding: '4px',
        border: isActive ? '1px solid white' : 'none',
        borderRadius: '10px',
    });

    function handleLogout() {
        clearInternToken();
        setAdminLoggedIn(false);
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
                <NavLink to="/" end style={linkStyle}>Home</NavLink>
                <NavLink to="/analysis" style={linkStyle}>Analiza</NavLink>
                <NavLink to="/history" style={linkStyle}>Istorija</NavLink>
                <NavLink to="/admin" style={linkStyle}>Admin</NavLink>
            </div>
            {loggedIn && (
            <button 
            onClick={handleLogout}
            disabled={!loggedIn}
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