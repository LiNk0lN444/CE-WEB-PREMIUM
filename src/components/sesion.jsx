import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ceObtenerSesion, ceCerrarSesion, ceEsAdministrador, ceObtenerAvatar, ceAvatarKey } from "../services/auth";
import "../assets/css/sesion.css";

export default function Sesion() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(ceObtenerSesion());
    const [activeTab, setActiveTab] = useState("datos");
    const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    useEffect(() => {
        if (!usuario) {
            navigate("/login");
        }
    }, [usuario, navigate]);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    const mostrarToast = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            localStorage.setItem(ceAvatarKey(usuario), evt.target.result);
            setUsuario({ ...usuario });
            mostrarToast("Foto de perfil actualizada", "success");
        };
        reader.readAsDataURL(file);
    };

    const avatarUrl = ceObtenerAvatar(usuario);
    const iniciales = (usuario?.username || "U").substring(0, 2).toUpperCase();

    return (
        <div className="perfil-main">
            <nav className="navbar">
                <a href="/" className="logo">Constructora CE</a>
                <div className="acciones">
                    <button onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? "☀️" : "🌙"}
                    </button>
                </div>
            </nav>

            <div className="perfil-container">
                <aside className="perfil-sidebar">
                    <div className="perfil-avatar-box">
                        <div className="avatar-circle">
                            {avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : <span>{iniciales}</span>}
                        </div>
                        <input type="file" id="inputAvatar" hidden accept="image/*" onChange={handleAvatarUpload} />
                        <button type="button" className="btn-avatar" onClick={() => document.getElementById("inputAvatar").click()}>
                            Cambiar foto
                        </button>
                    </div>

                    <h3>{usuario?.username}</h3>
                    <p>{usuario?.email}</p>

                    <div className="perfil-tabs">
                        <button className={`tab-btn ${activeTab === "datos" ? "active" : ""}`} onClick={() => setActiveTab("datos")}>
                            👤 Datos Personales
                        </button>
                        <button className={`tab-btn ${activeTab === "seguridad" ? "active" : ""}`} onClick={() => setActiveTab("seguridad")}>
                            🔒 Seguridad
                        </button>
                    </div>

                    <button type="button" className="btn-logout" onClick={() => { ceCerrarSesion(); navigate("/login"); }}>
                        Cerrar Sesión
                    </button>
                </aside>

                <main className="perfil-content">
                    <div className={`tab-panel ${activeTab === "datos" ? "active" : ""}`}>
                        <h2>Datos Personales</h2>
                        <p><strong>Usuario:</strong> {usuario?.username}</p>
                        <p><strong>Correo:</strong> {usuario?.email}</p>
                        <p><strong>Teléfono:</strong> {usuario?.phone_number || "No registrado"}</p>
                    </div>
                </main>
            </div>

            <div className={`toast ${toast.show ? "show" : ""} toast-${toast.type}`}>
                {toast.msg}
            </div>
        </div>
    );
}