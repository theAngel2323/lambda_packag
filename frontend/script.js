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
const placeholderCamara = document.getElementById('placeholderCamara');
let streamCamara = null;
let imagenBase64Final = '';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar solo el paso de login al cargar
    mostrarPaso(pasoLogin);
    
    // Inicializar event listeners
    inicializarEventListeners();
});

function inicializarEventListeners() {
    // --- 1. LÓGICA DE LOGIN Y REGISTRO ---
    linkAlternar.onclick = (e) => {
        e.preventDefault();
        esModoRegistro = !esModoRegistro;
        ocultarElemento(errorLog);
        ocultarElemento(exitoLog);
        
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

    btnIngresar.onclick = manejarLogin;

    // --- 2. LÓGICA DE CERRAR SESIÓN ---
    btnCerrarSesion.onclick = cerrarSesion;

    // --- 3. FLUJO PRINCIPAL ---
    document.getElementById('btnAceptar').onclick = () => {
        ocultarPaso(pasoConsentimiento);
        mostrarPaso(pasoSeleccion);
    };

    document.getElementById('btnOpcionCamara').onclick = iniciarCamara;
    document.getElementById('btnOpcionSubir').onclick = seleccionarArchivo;

    // --- 4. CAPTURA DE IMAGEN ---
    document.getElementById('btnCapturar').onclick = capturarImagen;
    inputArchivo.onchange = manejarSeleccionArchivo;
    document.getElementById('btnAnalizarArchivo').onclick = () => enviarImagen(imagenBase64Final);

    // --- 5. NAVEGACIÓN ---
    document.getElementById('btnVolver').onclick = resetearVista;
    document.getElementById('btnReiniciar').onclick = resetearVista;
    document.getElementById('btnSeleccionarArchivo').onclick = () => inputArchivo.click();
}

// --- FUNCIONES DE LOGIN ---
async function manejarLogin() {
    const carnet = document.getElementById('inputCarnet').value;
    const pass = document.getElementById('inputPassword').value;
    if (!carnet || !pass) return alert("Por favor, llena todos los campos");

    btnIngresar.disabled = true;
    btnIngresar.innerText = "Procesando...";
    ocultarElemento(errorLog);

    try {
        const res = await fetch(URL_AUTH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                accion: esModoRegistro ? 'registro' : 'login', 
                carnet, 
                password: pass 
            })
        });
        const data = await res.json();

        if (res.ok && data.exito) {
            if (esModoRegistro) {
                mostrarElemento(exitoLog);
                setTimeout(() => linkAlternar.click(), 1500);
            } else {
                // LOGIN EXITOSO
                ocultarPaso(pasoLogin);
                mostrarPaso(pasoConsentimiento);
                // MUESTRA EL BOTÓN DE CERRAR SESIÓN
                mostrarElemento(btnCerrarSesion);
            }
        } else {
            mostrarElemento(errorLog);
            errorLog.innerText = data.mensaje || "Error en la autenticación";
        }
    } catch (e) {
        console.error('Error de conexión:', e);
        mostrarElemento(errorLog);
        errorLog.innerText = "Error de conexión con el servidor";
    }
    
    btnIngresar.disabled = false;
    btnIngresar.innerText = esModoRegistro ? "Registrarme" : "Entrar";
}

// --- FUNCIONES DE CÁMARA ---
async function iniciarCamara() {
    mostrarCaptura('camara');
    try {
        streamCamara = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
        });
        video.srcObject = streamCamara;
        // MUESTRA EL VIDEO
        mostrarElemento(video);
        ocultarElemento(placeholderCamara);
    } catch (e) { 
        alert("Error al acceder a la cámara. Por favor, verifica los permisos."); 
        resetearVista(); 
    }
}

function seleccionarArchivo() {
    mostrarCaptura('archivo');
    inputArchivo.click();
}

function mostrarCaptura(modo) {
    ocultarPaso(pasoSeleccion);
    mostrarPaso(pasoCaptura);
    
    if (modo === 'camara') {
        mostrarElemento(document.getElementById('controlesCamara'));
        ocultarElemento(document.getElementById('controlesSubida'));
    } else {
        mostrarElemento(document.getElementById('controlesSubida'));
        ocultarElemento(document.getElementById('controlesCamara'));
        // MUESTRA VISTA PREVIA VACÍA
        mostrarElemento(vistaPrevia);
        ocultarElemento(placeholderCamara);
    }
}

function capturarImagen() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    enviarImagen(canvas.toDataURL('image/jpeg'));
}

function manejarSeleccionArchivo(e) {
    const file = e.target.files[0];
    if (file) {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen válido.');
            return;
        }
        
        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            vistaPrevia.src = ev.target.result;
            imagenBase64Final = ev.target.result;
            mostrarElemento(document.getElementById('btnAnalizarArchivo'));
        };
        reader.readAsDataURL(file);
    }
}

// --- ENVÍO AL MICROSERVICIO CORE ---
async function enviarImagen(base64) {
    mostrarElemento(document.getElementById('loader'));
    ocultarElemento(document.getElementById('controlesCamara'));
    ocultarElemento(document.getElementById('controlesSubida'));
    ocultarElemento(document.getElementById('btnVolver'));
    
    try {
        const res = await fetch(URL_CORE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }) 
        });
        const data = await res.json();
        mostrarResultados(data);
    } catch (e) {
        console.error('Error al analizar imagen:', e);
        mostrarErrorAnalisis();
    }
    
    ocultarElemento(document.getElementById('loader'));
    ocultarPaso(pasoCaptura);
}

function mostrarResultados(data) {
    const tarjetaResultados = resultadosDiv.querySelector('.tarjeta-resultados');
    
    let html = `
        <div class="encabezado-tarjeta">
            <h2>Resultados de tu Análisis</h2>
            <p class="subtitulo">Aquí tienes algunas sugerencias para sentirte mejor</p>
        </div>
        
        <div class="contenedor-resultado">
            <div class="resultado-emocion">
                <div class="emocion-icono">
                    <span class="material-symbols-outlined">sentiment_calm</span>
                </div>
                <div class="info-emocion">
                    <h3 class="emocion-titulo">${data.emocion || 'Emoción detectada'}</h3>
                    <p class="emocion-descripcion">Hemos detectado que puedes estar sintiendo ${(data.emocion || 'esta emoción').toLowerCase()}.</p>
                    <div class="barra-confianza">
                        <div class="etiqueta-confianza">
                            <span>Nivel de Confianza</span>
                            <span>${data.confianza || 'N/A'}</span>
                        </div>
                        <div class="barra-progreso">
                            <div class="progreso" style="width: ${parseConfianza(data.confianza)}"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="recomendaciones">
            <h3 class="titulo-recomendaciones">Recomendaciones para ti</h3>
    `;
    
    if(data.consejos && data.consejos.length > 0) {
        html += `<div class="lista-recomendaciones">`;
        data.consejos.forEach(c => {
            html += `
                <div class="item-recomendacion">
                    <div class="contenido-recomendacion">
                        <div class="icono-item">
                            <span class="material-symbols-outlined">self_improvement</span>
                        </div>
                        <div class="info-recomendacion">
                            <h4>${c.titulo || 'Consejo'}</h4>
                            <p>${c.texto || 'Descripción del consejo'}</p>
                        </div>
                    </div>
                    <div class="acciones-recomendacion">
                        <span class="duracion">${c.duracion || '5 min'}</span>
                        <button class="btn-comenzar">Comenzar</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    } else {
        html += `<p class="emocion-descripcion text-center">No hay consejos disponibles en este momento.</p>`;
    }
    
    html += `</div>`;
    tarjetaResultados.innerHTML = html;
    
    mostrarPaso(resultadosDiv);
    mostrarElemento(document.getElementById('btnReiniciar'));
}

function parseConfianza(confianza) {
    if (!confianza) return '50%';
    const porcentaje = confianza.replace('%', '');
    return isNaN(porcentaje) ? '50%' : `${porcentaje}%`;
}

function mostrarErrorAnalisis() {
    resultadosDiv.querySelector('.tarjeta-resultados').innerHTML = `
        <div class="encabezado-tarjeta">
            <h2>Error en el Análisis</h2>
            <p class="subtitulo">No pudimos procesar tu imagen</p>
        </div>
        <div class="contenedor-resultado">
            <p class="emocion-descripcion text-center">Por favor, intenta nuevamente con una imagen más clara o verifica tu conexión a internet.</p>
        </div>
    `;
    mostrarPaso(resultadosDiv);
    mostrarElemento(document.getElementById('btnReiniciar'));
}

// --- FUNCIONES DE UTILIDAD ---
function cerrarSesion() {
    // 1. Limpiar campos de login
    document.getElementById('inputCarnet').value = '';
    document.getElementById('inputPassword').value = '';
    
    // 2. Detener cámara si está activa (Limpia recursos)
    if (streamCamara) {
        streamCamara.getTracks().forEach(t => t.stop());
        streamCamara = null;
    }
    
    // 3. Ocultar todos los pasos excepto el login (¡CORRECCIÓN CLAVE AQUÍ!)
    ocultarPaso(pasoConsentimiento);
    ocultarPaso(pasoSeleccion); 
    ocultarPaso(pasoCaptura);
    ocultarPaso(resultadosDiv);
    ocultarElemento(document.getElementById('btnReiniciar'));

    // 4. Mostrar el paso de Login y ocultar el botón de Cerrar Sesión
    mostrarPaso(pasoLogin);
    ocultarElemento(btnCerrarSesion);
}

function resetearVista() {
    // Detener cámara si está activa
    if (streamCamara) {
        streamCamara.getTracks().forEach(t => t.stop());
        streamCamara = null;
    }
    
    // Limpiar elementos de captura
    ocultarElemento(video);
    ocultarElemento(vistaPrevia);
    vistaPrevia.src = "";
    inputArchivo.value = "";
    
    // Restablecer controles y ocultar elementos de captura/resultado
    ocultarPaso(resultadosDiv);
    ocultarPaso(pasoCaptura);
    ocultarElemento(document.getElementById('btnReiniciar'));
    ocultarElemento(document.getElementById('loader'));
    ocultarElemento(document.getElementById('btnAnalizarArchivo'));
    ocultarElemento(document.getElementById('controlesCamara'));
    ocultarElemento(document.getElementById('controlesSubida'));
    
    // Mostrar placeholder de cámara y botón Volver
    mostrarElemento(document.getElementById('btnVolver'));
    mostrarElemento(placeholderCamara);
    
    // Volver a selección (Propósito original de esta función)
    mostrarPaso(pasoSeleccion);
}

// -------------------------------------------------------------
// ⚠️ FUNCIONES DE MANEJO DE DOM CORREGIDAS PARA FORZAR VISIBILIDAD
// -------------------------------------------------------------
function mostrarPaso(elemento) {
    elemento.classList.remove('oculto');
    elemento.style.display = 'block'; 
}

function ocultarPaso(elemento) {
    elemento.classList.add('oculto');
    elemento.style.display = 'none'; 
}

function mostrarElemento(elemento) {
    elemento.classList.remove('oculto');
    elemento.style.display = 'block'; 
}

function ocultarElemento(elemento) {
    elemento.classList.add('oculto');
    elemento.style.display = 'none'; 
}