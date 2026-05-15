// =========================================================================
// 1. CONFIGURACIÓN DE CREDENCIALES (FIREBASE Y EMAILJS)
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

// Inicializar Firebase de forma global
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Credenciales de EmailJS
const EMAILJS_PUBLIC_KEY = "qoQ8H1CxNqzUmihFW";   
const EMAILJS_SERVICE_ID = "service_ypmzpke";   
const EMAILJS_TEMPLATE_ID = "template_f6hicxi"; 

// Inicializar la librería de EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Esperar a que todo el HTML esté completamente dibujado
document.addEventListener("DOMContentLoaded", () => {
    
    // Captura de los elementos de tu HTML real
    const contenedor = document.getElementById('contenedor-preguntas');
    const form = document.getElementById('form-encuesta');
    const btnEnviar = document.getElementById('btn-enviar');

    let preguntasArrayGlobal = []; // Array auxiliar para armar el correo de EmailJS

    // VALIDACIÓN DE SEGURIDAD INTERNA
    if (!contenedor) {
        console.error("ERROR: No se encontró el div id='contenedor-preguntas' en el HTML.");
        return;
    }

    // =========================================================================
    // 2. LEER LAS PREGUNTAS DESDE FIREBASE EN TIEMPO REAL
    // =========================================================================
    db.ref('preguntas').on('value', (snapshot) => {
        contenedor.innerHTML = ""; // Limpiamos lo que haya dentro del contenedor
        const datos = snapshot.val();
        preguntasArrayGlobal = []; // Reiniciamos el array temporal

        // Si la base de datos está vacía en internet
        if (!datos) {
            contenedor.innerHTML = "<p style='text-align:center; color:#666; font-style: italic;'>No hay preguntas disponibles en este momento. El administrador aún no las ha creado.</p>";
            if (btnEnviar) btnEnviar.style.display = 'none';
            return;
        }

        // Si hay preguntas, nos aseguramos de que el botón de enviar sea visible
        if (btnEnviar) btnEnviar.style.display = 'block';

        let index = 1;
        
        // Recorrer el árbol JSON que bajó de Firebase
        for (let idFirebase in datos) {
            const p = datos[idFirebase];
            
            // Guardamos la estructura en nuestro array global para mapear las respuestas después
            preguntasArrayGlobal.push({
                id: idFirebase,
                pregunta: p.pregunta
            });

            // Creamos el contenedor individual de la pregunta respetando tus clases CSS
            const div = document.createElement('div');
            div.className = 'form-group';
            div.style.marginBottom = "20px";
            
            // Construimos las opciones del select dinámicamente
            let opcionesHTML = `<option value="">-- Seleccione una opción --</option>`;
            if (p.opciones && Array.isArray(p.opciones)) {
                p.opciones.forEach(op => {
                    opcionesHTML += `<option value="${op}">${op}</option>`;
                });
            }

            // Inyectamos el diseño en tu HTML
            div.innerHTML = `
                <label style="display:block; margin-bottom:8px; font-weight:bold; color: #333;">${index}. ${p.pregunta}</label>
                <select name="pregunta_${idFirebase}" required style="width:100%; padding:10px; border: 1px solid #ccc; border-radius:4px; font-size:14px;">
                    ${opcionesHTML}
                </select>
            `;
            
            contenedor.appendChild(div);
            index++;
        }
    });

    // =========================================================================
    // 3. ENVIAR RESPUESTAS POR EMAILJS AL HACER SUBMIT
    // =========================================================================
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Evitamos que la página se recargue

            let cuerpoMensaje = "RESULTADOS DE LA ENCUESTA INSTITUCIONAL:\n\n";
            
            // Recolectamos el valor seleccionado en cada pregunta usando el id único de Firebase
            preguntasArrayGlobal.forEach((p, index) => {
                const selectElement = document.querySelector(`[name="pregunta_${p.id}"]`);
                const respuesta = selectElement ? selectElement.value : "No respondida";
                cuerpoMensaje += `Pregunta ${index + 1}: ${p.pregunta}\nRespuesta: ${respuesta}\n\n`;
            });

            // Bloquear el botón temporalmente para evitar múltiples envíos
            btnEnviar.innerText = "Enviando respuestas...";
            btnEnviar.disabled = true;

            // Disparar el paquete hacia EmailJS
            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                mensaje: cuerpoMensaje,
                to_email: "mixonjavierpelaez@gmail.com"
            })
            .then(() => {
                alert("¡Encuesta enviada con éxito! Las respuestas han sido remitidas al correo institucional.");
                form.reset(); // Limpiar todas las respuestas seleccionadas
            })
            .catch((error) => {
                alert("Ocurrió un error al despachar los resultados por correo.");
                console.error("Detalle del fallo en EmailJS:", error);
            })
            .finally(() => {
                // Restaurar el botón al estado original
                btnEnviar.innerText = "Enviar Encuesta";
                btnEnviar.disabled = false;
            });
        });
    }
});