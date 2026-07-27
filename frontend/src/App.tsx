import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Estoque from "./pages/Estoque";
import Propriedade from "./pages/Propriedade";
import Financeiro from "./pages/Financeiro";
import Metas from "./pages/Metas";
import Producao from "./pages/Producao";
import Relatorios from "./pages/Relatorios";
import Perfil from "./pages/Perfil";
import AnaliseFoliar from "./pages/AnaliseFoliar";
import QuarentenasFoliares from "./pages/QuarentenasFoliares";
import VistoriasFoliares from "./pages/VistoriasFoliares";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/esqueci-senha" element={<ForgotPassword />} />
                <Route path="/redefinir-senha" element={<ResetPassword />} />
                <Route path="/dashboard" element= {<Dashboard />} />
                <Route path="/estoque" element={<Estoque />} />
                <Route path="/propriedade" element={<Propriedade />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/meta" element={<Metas />} />
                <Route path="/producao" element={<Producao />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/analise-foliar" element={<AnaliseFoliar />} />
                <Route path="/analise-foliar/quarentenas" element={<QuarentenasFoliares />} />
                <Route path="/analise-foliar/vistorias" element={<VistoriasFoliares />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
