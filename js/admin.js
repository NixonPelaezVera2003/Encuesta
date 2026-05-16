// =========================================================================
// CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCakKGLdIFJ8CM0FFCPCsL7PQoI7W5ZlP0",
    authDomain: "encuestasspoch.firebaseapp.com",
    databaseURL: "https://encuestasspoch-default-rtdb.firebaseio.com",
    projectId: "encuestasspoch",
    storageBucket: "encuestasspoch.firebasestorage.app",
    messagingSenderId: "1006081354037",
    appId: "1:1006081354037:web:46e076cd516380cada447c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener("DOMContentLoaded", () => {
    
    const seccionLogin = document.getElementById('seccion-login');
    const seccionAdmin = document.getElementById('seccion-admin');
    
    const inputUsuario = document.getElementById('usuario');
    const inputPassword = document.getElementById('password');
    const btnLogin = document.getElementById('btn-login');
    const errorLogin = document.getElementById('error-login');

    const inputNuevaPregunta = document.getElementById('nueva-pregunta');
    const selectTipoPregunta = document.getElementById('tipo-pregunta');
    const contenedorCampoOpciones = document.getElementById('contenedor-campo-opciones');
    const inputOpcionesPregunta = document.getElementById('opciones-pregunta');
    const btnAgregar = document.getElementById('btn-agregar');
    const listaPreguntasAdmin = document.getElementById('lista-preguntas-admin');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    // CONTROL VISUAL: Ocultar o mostrar opciones según el tipo elegido
    selectTipoPregunta.addEventListener('change', () => {
        if (selectTipoPregunta.value === 'libre') {
            contenedorCampoOpciones.style.display = 'none'; // Esconde las opciones
        } else {
            contenedorCampoOpciones.style.display = 'block'; // Muestra las opciones
        }
    });

    // 1. CONTROL DE ACCESO
    btnLogin.addEventListener('click', () => {
        const usuario = inputUsuario.value.trim();
        const contrasena = inputPassword.value.trim();

        if (usuario === "Juan" && contrasena === "123") {
            seccionLogin.style.display = 'none';
            seccionAdmin.style.display = 'block';
            if (errorLogin) errorLogin.style.display = 'none';
            escucharPreguntasEnNube(); 
        } else {
            if (errorLogin) errorLogin.style.display = 'block';
        }
    });

    // 2. LEER LAS PREGUNTAS DESDE FIREBASE EN TIEMPO REAL
    function escucharPreguntasEnNube() {
        db.ref('preguntas').on('value', (snapshot) => {
            listaPreguntasAdmin.innerHTML = "";
            const datos = snapshot.val();
            
            if (!datos) {
                listaPreguntasAdmin.innerHTML = "<p style='color: #666; font-style: italic;'>No hay preguntas en internet todavía.</p>";
                return;
            }

            let index = 1;
            for (let idFirebase in datos) {
                const p = datos[idFirebase];
                const div = document.createElement('div');
                div.className = 'pregunta-item';
                div.style.margin = "10px 0";
                div.style.padding = "10px";
                div.style.border = "1px solid #ddd";
                div.style.borderRadius = "4px";

                // Mostrar de forma diferente si es libre o de opción
                const detalleTipo = p.tipo === "libre" ? "Respuesta Libre (Texto)" : `Opciones: ${p.opciones.join(', ')}`;

                div.innerHTML = `
                    <p style='margin: 0 0 8px 0;'><strong>${index}. ${p.pregunta}</strong> <br><small style='color:#555;'>Tipo: ${detalleTipo}</small></p>
                    <button class="btn-alt" style="background-color: #d9534f; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;" onclick="eliminarPregunta('${idFirebase}')">Eliminar</button>
                `;
                listaPreguntasAdmin.appendChild(div);
                index++;
            }
        });
    }

    // 3. FUNCIÓN PARA AGREGAR LA PREGUNTA CON SU TIPO
    btnAgregar.addEventListener('click', () => {
        const textoPregunta = inputNuevaPregunta.value.trim();
        const tipoSeleccionado = selectTipoPregunta.value;
        let opcionesArray = [];

        if (textoPregunta === "") {
            alert("Por favor, escribe la pregunta.");
            return;
        }

        // Si es de tipo opciones, validamos el campo de opciones
        if (tipoSeleccionado === "opciones") {
            const textoOpciones = inputOpcionesPregunta.value.trim();
            opcionesArray = textoOpciones.split(',').map(op => op.trim()).filter(op => op !== "");

            if (opcionesArray.length < 2) {
                alert("Por favor, ingresa al menos 2 opciones separadas por comas.");
                return;
            }
        }

        // Guardar estructura dinámica en Firebase
        db.ref('preguntas').push({
            pregunta: textoPregunta,
            tipo: tipoSeleccionado,
            opciones: opcionesArray // Irá vacío si es libre
        })
        .then(() => {
            inputNuevaPregunta.value = "";
            inputOpcionesPregunta.value = "";
            selectTipoPregunta.value = "opciones";
            contenedorCampoOpciones.style.display = 'block';
        })
        .catch((error) => {
            alert("Error de conexión con Firebase: " + error.message);
        });
    });

    // 4. FUNCIÓN PARA ELIMINAR PREGUNTAS
    window.eliminarPregunta = function(idFirebase) {
        if (confirm("¿Estás seguro de que deseas eliminar esta pregunta?")) {
            db.ref(`preguntas/${idFirebase}`).remove()
            .catch((error) => {
                alert("Error al eliminar: " + error.message);
            });
        }
    };

    // 5. CERRAR SESIÓN
    btnCerrarSesion.addEventListener('click', () => {
        inputUsuario.value = "";
        inputPassword.value = "";
        seccionAdmin.style.display = 'none';
        seccionLogin.style.display = 'block';
    });
});
