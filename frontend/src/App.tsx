import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Estoque from "./pages/Estoque";
import Propriedade from "./pages/Propriedade";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element= {<Dashboard />} />
                <Route path="/estoque" element={<Estoque />} />
                <Route path="/propriedade" element={<Propriedade />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;