// ==========================================
// ⚠️ TUS URLs DE MICROSERVICIOS
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
    mostrarPaso(pasoLogin);
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
                ocultarPaso(pasoLogin);
                mostrarPaso(pasoConsentimiento);
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
        mostrarElemento(video);
        if(placeholderCamara) ocultarElemento(placeholderCamara);
    } catch (e) { 
        alert("Error al acceder a la cámara. Verifica los permisos."); 
        resetearVista(); 
    }
}

function seleccionarArchivo() {
    mostrarCaptura('archivo');
    inputArchivo.click();
}

// ⚠️ AQUÍ ESTÁ EL ARREGLO IMPORTANTE PARA QUE NO SE MEZCLEN
function mostrarCaptura(modo) {
    ocultarPaso(pasoSeleccion);
    mostrarPaso(pasoCaptura);
    
    if (modo === 'camara') {
        // MODO CÁMARA
        mostrarElemento(document.getElementById('controlesCamara'));
        mostrarElemento(video);
        
        // Ocultar cosas de Archivo
        ocultarElemento(document.getElementById('controlesSubida'));
        ocultarElemento(vistaPrevia);
        vistaPrevia.src = ""; // Limpiar imagen vieja
    } else {
        // MODO ARCHIVO
        mostrarElemento(document.getElementById('controlesSubida'));
        
        // Ocultar cosas de Cámara
        ocultarElemento(document.getElementById('controlesCamara'));
        ocultarElemento(video);
        
        // Apagar cámara si estaba prendida
        if (streamCamara) {
            streamCamara.getTracks().forEach(t => t.stop());
            streamCamara = null;
        }
        
        if(placeholderCamara) ocultarElemento(placeholderCamara);
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
        if (!file.type.startsWith('image/')) return alert('Selecciona una imagen válida.');
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            vistaPrevia.src = ev.target.result;
            imagenBase64Final = ev.target.result;
            mostrarElemento(vistaPrevia); // Asegurarnos de que se vea la foto
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

// --- VISUALIZACIÓN DE RESULTADOS ---
function mostrarResultados(data) {
    const tarjetaResultados = resultadosDiv.querySelector('.tarjeta-resultados') || resultadosDiv;
    
    // CASO MULTI-PERSONA (Nuevo Backend)
    if (data.personas && data.personas.length > 0) {
        let html = `
            <div class="encabezado-tarjeta" style="margin-bottom: 20px;">
                <h2>Análisis Grupal Completado</h2>
                <p class="subtitulo">Hemos detectado <strong>${data.personas.length}</strong> persona(s)</p>
            </div>
            <div class="lista-personas" style="text-align: left;">
        `;

        data.personas.forEach(persona => {
            html += `
            <div class="persona-card" style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                
                <div style="border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="margin: 0; color: #333;">👤 Persona ${persona.id_persona}</h3>
                    <span style="background: #eef; color: #0056b3; padding: 4px 10px; border-radius: 15px; font-weight: bold; font-size: 0.9em;">
                        ${persona.emocion} (${persona.confianza})
                    </span>
                </div>

                <div class="recomendaciones">
                    <h4 style="font-size: 1em; color: #666; margin-bottom: 10px;">Recomendaciones personalizadas:</h4>
            `;

            if(persona.consejos && persona.consejos.length > 0) {
                persona.consejos.forEach(c => {
                    html += `
                        <div class="item-recomendacion" style="background: #f8f9fa; padding: 10px; margin-bottom: 8px; border-radius: 5px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <h5 style="margin: 0; color: #0056b3;">${c.titulo}</h5>
                                <span class="duracion" style="font-size: 0.8em; background: #ddd; padding: 2px 6px; border-radius: 4px;">${c.duracion}</span>
                            </div>
                            <p style="margin: 0; font-size: 0.9em; color: #555;">${c.texto}</p>
                        </div>
                    `;
                });
            } else {
                html += `<p style="font-style: italic; color: #999;">No hay consejos específicos para esta emoción.</p>`;
            }

            html += `</div></div>`;
        });

        html += `</div>`;
        tarjetaResultados.innerHTML = html;

    } else if (data.emocion) {
        // CASO INDIVIDUAL (Fallback)
        tarjetaResultados.innerHTML = `<h3>${data.emocion} (${data.confianza})</h3>`;
    } else {
        // CASO ERROR / VACÍO
        tarjetaResultados.innerHTML = `
            <div class="encabezado-tarjeta">
                <h2>No se detectaron rostros</h2>
                <p>Intenta con una foto más clara.</p>
            </div>
        `;
    }
    
    mostrarPaso(resultadosDiv);
    mostrarElemento(document.getElementById('btnReiniciar'));
}

function mostrarErrorAnalisis() {
    const tarjetaResultados = resultadosDiv.querySelector('.tarjeta-resultados') || resultadosDiv;
    tarjetaResultados.innerHTML = `
        <div class="encabezado-tarjeta">
            <h2 style="color: #dc3545;">Error en el Análisis</h2>
            <p>No pudimos procesar tu imagen. Intenta de nuevo.</p>
        </div>
    `;
    mostrarPaso(resultadosDiv);
    mostrarElemento(document.getElementById('btnReiniciar'));
}

// --- UTILIDADES Y NAVEGACIÓN ---
function cerrarSesion() {
    document.getElementById('inputCarnet').value = '';
    document.getElementById('inputPassword').value = '';
    
    if (streamCamara) {
        streamCamara.getTracks().forEach(t => t.stop());
        streamCamara = null;
    }
    
    ocultarPaso(pasoConsentimiento);
    ocultarPaso(pasoSeleccion); 
    ocultarPaso(pasoCaptura);
    ocultarPaso(resultadosDiv);
    ocultarElemento(document.getElementById('btnReiniciar'));

    mostrarPaso(pasoLogin);
    ocultarElemento(btnCerrarSesion);
}

function resetearVista() {
    if (streamCamara) {
        streamCamara.getTracks().forEach(t => t.stop());
        streamCamara = null;
    }
    
    ocultarElemento(video);
    ocultarElemento(vistaPrevia);
    vistaPrevia.src = "";
    inputArchivo.value = "";
    
    ocultarPaso(resultadosDiv);
    ocultarPaso(pasoCaptura);
    ocultarElemento(document.getElementById('btnReiniciar'));
    ocultarElemento(document.getElementById('loader'));
    ocultarElemento(document.getElementById('btnAnalizarArchivo'));
    ocultarElemento(document.getElementById('controlesCamara'));
    ocultarElemento(document.getElementById('controlesSubida'));
    
    mostrarElemento(document.getElementById('btnVolver'));
    if(placeholderCamara) mostrarElemento(placeholderCamara);
    mostrarPaso(pasoSeleccion);
}

// Helpers de Visibilidad
function mostrarPaso(elemento) {
    if(elemento) {
        elemento.classList.remove('oculto');
        elemento.style.display = 'block';
    }
}
function ocultarPaso(elemento) {
    if(elemento) {
        elemento.classList.add('oculto');
        elemento.style.display = 'none';
    }
}
function mostrarElemento(elemento) {
    if(elemento) {
        elemento.classList.remove('oculto');
        elemento.style.display = 'block';
    }
}
function ocultarElemento(elemento) {
    if(elemento) {
        elemento.classList.add('oculto');
        elemento.style.display = 'none';
    }
}