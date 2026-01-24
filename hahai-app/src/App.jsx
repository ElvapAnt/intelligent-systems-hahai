import './App.css'
import Navbar from './pages/Navbar'
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Analysis from './pages/Analysis';
import History from './pages/History';
import NotFound from './pages/NotFound';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';

function App() {

  return (
    <>
      <div className="app-content">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          //dodati ogranicenja za rute
          <Route path="/analysis" element={<RequireAuth><Analysis /></RequireAuth>} /> 
          <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
          <Route path="/admin"  element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="*" element={<NotFound />} />
        </Routes>

      </div>
    </>
  )
}

export default App
