import { NavLink } from "react-router-dom";

export default function Navbar() {
    const linkStyle = (isActive) => ({
        marginRight: '15px',
        color: 'white',
        fontWeight: isActive? "700" : "400",
        fontSize: isActive? "larger" : "large",
        width: '100%',
    });

    return (
        <nav className="navbar" style={{ 
            backgroundColor: 'rgb(34 34 84)', 
            width: '100%', 
            paddingTop: '10px', 
            paddingBottom: '10px', 
        }}>
            <NavLink to="/" style={linkStyle}>Home</NavLink>
            <NavLink to="/intern" style={linkStyle}>Internista</NavLink>
            <NavLink to="/admin" style={linkStyle}>Admin</NavLink>
            <NavLink to="/analysis" style={linkStyle}>Analiza</NavLink>
            <NavLink to="/history" style={linkStyle}>Istorija</NavLink>
        </nav>
    );
}