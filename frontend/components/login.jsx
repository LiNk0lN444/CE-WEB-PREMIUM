import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ceObtenerSesion, ceIniciarSesion, ceRegistrar } from "../services/auth";
import "../assets/login.css";

export default function Login() {
    const navigate = useNavigate();
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 850);

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    const [regNombre, setRegNombre] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regUsuario, setRegUsuario] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regError, setRegError] = useState("");

    const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

    useEffect(() => {
        if (ceObtenerSesion()) {
            navigate("/sesion");
        }

        const handleResize = () => setIsLargeScreen(window.innerWidth > 850);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [navigate]);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");

        if (!validarEmail(loginEmail)) {
            setLoginError("Ingresa un correo electrónico válido");
            return;
        }
        if (!loginPassword) {
            setLoginError("Ingresa tu contraseña");
            return;
        }

        const res = await ceIniciarSesion(loginEmail, loginPassword);
        if (!res.ok) {
            setLoginError(res.motivo);
            return;
        }
        navigate("/sesion");
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegError("");

        if (!validarEmail(regEmail)) {
            setRegError("Ingresa un correo electrónico válido");
            return;
        }
        if (regPassword.length < 8) {
            setRegError("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        const res = await ceRegistrar({ 
            nombre: regNombre, 
            email: regEmail, 
            usuario: regUsuario, 
            contrasena: regPassword 
        });
        
        if (!res.ok) {
            setRegError(res.motivo);
            return;
        }
        navigate("/sesion");
    };

    return (
        <div>
            <nav className="navbar">
                <a href="/" className="logo">Constructora CE</a>
                <div className="acciones">
                    <button onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? "☀️" : "🌙"}
                    </button>
                </div>
            </nav>

            <main>
                <div className="contenedor__todo">
                    <div className="caja__trasera">
                        <div className="caja__trasera-login" style={{ opacity: isRegisterMode && isLargeScreen ? 1 : 0 }}>
                            <h3>¿Ya tienes una cuenta?</h3>
                            <p>Inicia sesión para entrar en la página</p>
                            <button onClick={() => setIsRegisterMode(false)}>Iniciar Sesión</button>
                        </div>
                        <div className="caja__trasera-register" style={{ opacity: !isRegisterMode && isLargeScreen ? 1 : 0 }}>
                            <h3>¿Aún no tienes una cuenta?</h3>
                            <p>Regístrate para que puedas iniciar sesión</p>
                            <button onClick={() => setIsRegisterMode(true)}>Regístrarse</button>
                        </div>
                    </div>

                    <div className="contenedor__login-register" style={{
                        left: isLargeScreen ? (isRegisterMode ? "410px" : "10px") : "0px"
                    }}>
                        <form className="formulario__login" onSubmit={handleLoginSubmit}
                            style={{ display: !isRegisterMode || !isLargeScreen ? "block" : "none" }}>
                            <h2>Iniciar Sesión</h2>
                            <input type="email" placeholder="Correo Electrónico" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                            <input type="password" placeholder="Contraseña" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                            <button type="submit">Entrar</button>
                            <div className={`form-msg ${loginError ? "active" : ""}`}>{loginError}</div>
                        </form>

                        <form className="formulario__register" onSubmit={handleRegisterSubmit}
                            style={{ display: isRegisterMode || !isLargeScreen ? "block" : "none" }}>
                            <h2>Regístrarse</h2>
                            <input type="text" placeholder="Nombre completo" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} />
                            <input type="email" placeholder="Correo Electrónico" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                            <input type="text" placeholder="Usuario" value={regUsuario} onChange={(e) => setRegUsuario(e.target.value)} />
                            <input type="password" placeholder="Contraseña" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                            <button type="submit">Regístrarse</button>
                            <div className={`form-msg ${regError ? "active" : ""}`}>{regError}</div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}