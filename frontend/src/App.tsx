import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Estoque from "./pages/Estoque";
import Propriedade from "./pages/Propriedade";
import Financeiro from "./pages/Financeiro";
import Metas from "./pages/Metas";
import Producao from "./pages/Producao";
import Relatorios from "./pages/Relatorios";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element= {<Dashboard />} />
                <Route path="/estoque" element={<Estoque />} />
                <Route path="/propriedade" element={<Propriedade />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/meta" element={<Metas />} />
                <Route path="/producao" element={<Producao />} />
                <Route path="/relatorios" element={<Relatorios />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;