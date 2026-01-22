import './App.css'
import Navbar from './pages/Navbar'
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Intern from './pages/Intern';
import Admin from './pages/Admin';
import Analysis from './pages/Analysis';
import History from './pages/History';
import NotFound from './pages/NotFound';

function App() {

  return (
    <>
      <div className="app-content">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          //dodati ogranicenja za rute
          <Route path="/intern" element={<Intern />} />
          <Route path="/admin"  element={<Admin />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

      </div>
    </>
  )
}

export default App
