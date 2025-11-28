// ==========================================
// ⚠️ PEGA AQUÍ LAS URLs DE TUS MICROSERVICIOS
const URL_AUTH = "https://hl4h72ulr7.execute-api.us-east-2.amazonaws.com/default/auth"; 
const URL_CORE = "https://hl4h72ulr7.execute-api.us-east-2.amazonaws.com/default/core"; 
// ==========================================

// Variables DOM
const pasoLogin = document.getElementById('pasoLogin');
const pasoConsentimiento = document.getElementById('pasoConsentimiento');
const pasoSeleccion = document.getElementById('pasoSeleccion');
const pasoCaptura = document.getElementById('pasoCaptura');
const resultadosDiv = document.getElementById('resultados');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

// Login Elements
const btnIngresar = document.getElementById('btnIngresar');
const linkAlternar = document.getElementById('linkAlternar');
const tituloLogin = document.getElementById('tituloLogin');
const errorLog = document.getElementById('errorLogin');
const exitoLog = document.getElementById('exitoLogin');
let esModoRegistro = false;

// Medios Elements
const video = document.getElementById('video');
const vistaPrevia = document.getElementById('vistaPrevia');
const canvas = document.getElementById('canvas');
const inputArchivo = document.getElementById('inputArchivo');
let streamCamara = null;
let imagenBase64Final = '';

// --- 1. LÓGICA DE LOGIN Y REGISTRO ---
linkAlternar.onclick = (e) => {
    e.preventDefault();
    esModoRegistro = !esModoRegistro;
    errorLog.style.display = 'none';
    exitoLog.style.display = 'none';
    
    if (esModoRegistro) {
        tituloLogin.innerText = "📝 Registro";
        btnIngresar.innerText = "Registrarme";
        document.getElementById('textoAlternar').innerText = "¿Ya tienes cuenta?";
        linkAlternar.innerText = "Inicia sesión";
    } else {
        tituloLogin.innerText = "🔐 Iniciar Sesión";
        btnIngresar.innerText = "Entrar";
        document.getElementById('textoAlternar').innerText = "¿No tienes cuenta?";
        linkAlternar.innerText = "Regístrate aquí";
    }
};

btnIngresar.onclick = async () => {
    const carnet = document.getElementById('inputCarnet').value;
    const pass = document.getElementById('inputPassword').value;
    if (!carnet || !pass) return alert("Llena los campos");

    btnIngresar.disabled = true;
    btnIngresar.innerText = "Procesando...";
    errorLog.style.display = 'none';

    try {
        const res = await fetch(URL_AUTH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: esModoRegistro ? 'registro' : 'login', carnet, password: pass })
        });
        const data = await res.json();

        if (res.ok && data.exito) {
            if (esModoRegistro) {
                exitoLog.style.display = 'block';
                setTimeout(() => linkAlternar.click(), 1500);
            } else {
                // LOGIN EXITOSO
                pasoLogin.style.display = 'none';
                pasoConsentimiento.style.display = 'block';
                btnCerrarSesion.style.display = 'block';
            }
        } else {
            errorLog.style.display = 'block';
            errorLog.innerText = data.mensaje || "Error";
        }
    } catch (e) {
        console.error(e);
        errorLog.style.display = 'block';
        errorLog.innerText = "Error de conexión";
    }
    btnIngresar.disabled = false;
    btnIngresar.innerText = esModoRegistro ? "Registrarme" : "Entrar";
};

// --- 2. LÓGICA DE CERRAR SESIÓN ---
btnCerrarSesion.onclick = () => {
    document.getElementById('inputCarnet').value = '';
    document.getElementById('inputPassword').value = '';
    resetearVista(); // Apaga cámara y limpia todo
    
    pasoLogin.style.display = 'block';
    btnCerrarSesion.style.display = 'none';
    pasoConsentimiento.style.display = 'none';
    pasoSeleccion.style.display = 'none';
};

// --- 3. FLUJO PRINCIPAL ---
document.getElementById('btnAceptar').onclick = () => {
    pasoConsentimiento.style.display = 'none';
    pasoSeleccion.style.display = 'block';
};

document.getElementById('btnOpcionCamara').onclick = async () => {
    mostrarCaptura('camara');
    try {
        streamCamara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = streamCamara;
        video.style.display = 'block';
    } catch (e) { alert("Error cámara"); resetearVista(); }
};

document.getElementById('btnOpcionSubir').onclick = () => {
    mostrarCaptura('archivo');
    inputArchivo.click();
};

function mostrarCaptura(modo) {
    pasoSeleccion.style.display = 'none';
    pasoCaptura.style.display = 'block';
    if (modo === 'camara') {
        document.getElementById('controlesCamara').style.display = 'block';
    } else {
        document.getElementById('controlesSubida').style.display = 'block';
        vistaPrevia.style.display = 'block';
    }
}

// --- 4. CAPTURA DE IMAGEN ---
document.getElementById('btnCapturar').onclick = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    enviarImagen(canvas.toDataURL('image/jpeg'));
};

inputArchivo.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            vistaPrevia.src = ev.target.result;
            imagenBase64Final = ev.target.result;
            document.getElementById('btnAnalizarArchivo').style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
};

document.getElementById('btnAnalizarArchivo').onclick = () => enviarImagen(imagenBase64Final);

// --- 5. ENVÍO AL MICROSERVICIO CORE ---
async function enviarImagen(base64) {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('controlesCamara').style.display = 'none';
    document.getElementById('controlesSubida').style.display = 'none';
    document.getElementById('btnVolver').style.display = 'none'; 
    
    try {
        const res = await fetch(URL_CORE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }) 
        });
        const data = await res.json();
        mostrarResultados(data);
    } catch (e) {
        resultadosDiv.innerHTML = '<p style="color:red">Error al analizar.</p>';
        resultadosDiv.style.display = 'block';
        document.getElementById('btnReiniciar').style.display = 'inline-block';
    }
    document.getElementById('loader').style.display = 'none';
    pasoCaptura.style.display = 'none';
}

function mostrarResultados(data) {
    resultadosDiv.style.display = 'block';
    let html = `<h2>Estado: <span style="color:#0056b3">${data.emocion}</span> (${data.confianza})</h2>`;
    if(data.consejos.length > 0) html += '<p>Consejos para ti:</p>';
    data.consejos.forEach(c => {
        html += `<div class="consejo"><h3>${c.titulo} <span class="tag-duracion">${c.duracion}</span></h3><p>${c.texto}</p></div>`;
    });
    resultadosDiv.innerHTML = html;
    document.getElementById('btnReiniciar').style.display = 'inline-block';
}

// --- UTILIDADES ---
function resetearVista() {
    if (streamCamara) {
        streamCamara.getTracks().forEach(t => t.stop());
        streamCamara = null;
    }
    video.style.display = 'none';
    vistaPrevia.style.display = 'none';
    vistaPrevia.src = "";
    inputArchivo.value = ""; 
    
    resultadosDiv.style.display = 'none';
    pasoCaptura.style.display = 'none';
    document.getElementById('btnReiniciar').style.display = 'none';
    document.getElementById('loader').style.display = 'none';
    document.getElementById('btnAnalizarArchivo').style.display = 'none';
    document.getElementById('controlesCamara').style.display = 'none';
    document.getElementById('controlesSubida').style.display = 'none';
    
    document.getElementById('btnVolver').style.display = 'inline-block';
    pasoSeleccion.style.display = 'block';
}

document.getElementById('btnVolver').onclick = resetearVista;
document.getElementById('btnReiniciar').onclick = resetearVista;