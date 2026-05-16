// =========================================================================
// CONFIGURACIÓN DE CREDENCIALES (FIREBASE Y EMAILJS)
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

const EMAILJS_PUBLIC_KEY = "qoQ8H1CxNqzUmihFW";   
const EMAILJS_SERVICE_ID = "service_ypmzpke";   
const EMAILJS_TEMPLATE_ID = "template_f6hicxi"; 

emailjs.init(EMAILJS_PUBLIC_KEY);

document.addEventListener("DOMContentLoaded", () => {
    
    const contenedor = document.getElementById('contenedor-preguntas');
    const form = document.getElementById('form-encuesta');
    const btnEnviar = document.getElementById('btn-enviar');

    let preguntasArrayGlobal = []; 

    // =========================================================================
    // LEER PREGUNTAS DESDE FIREBASE Y DIBUJAR LA INTERFAZ DINÁMICA
    // =========================================================================
    db.ref('preguntas').on('value', (snapshot) => {
        contenedor.innerHTML = ""; 
        const datos = snapshot.val();
        preguntasArrayGlobal = []; 

        if (!datos) {
            contenedor.innerHTML = "<p style='text-align:center; color:#666; font-style: italic;'>No hay preguntas disponibles en este momento.</p>";
            if (btnEnviar) btnEnviar.style.display = 'none';
            return;
        }

        if (btnEnviar) btnEnviar.style.display = 'block';

        let index = 1;
        
        for (let idFirebase in datos) {
            const p = datos[idFirebase];
            
            preguntasArrayGlobal.push({
                id: idFirebase,
                pregunta: p.pregunta
            });

            const div = document.createElement('div');
            div.className = 'form-group';
            div.style.marginBottom = "20px";
            
            let controlHTML = "";

            // LA MAGIA: Si el tipo es libre, dibuja un cuadro de texto. Si no, dibuja el select.
            if (p.tipo === "libre") {
                controlHTML = `
                    <input type="text" name="pregunta_${idFirebase}" required placeholder="Escribe tu respuesta aquí..." style="width:100%; padding:10px; border: 1px solid #ccc; border-radius:4px; font-size:14px; box-sizing: border-box;">
                `;
            } else {
                let opcionesHTML = `<option value="">-- Seleccione una opción --</option>`;
                if (p.opciones && Array.isArray(p.opciones)) {
                    p.opciones.forEach(op => {
                        opcionesHTML += `<option value="${op}">${op}</option>`;
                    });
                }
                controlHTML = `
                    <select name="pregunta_${idFirebase}" required style="width:100%; padding:10px; border: 1px solid #ccc; border-radius:4px; font-size:14px;">
                        ${opcionesHTML}
                    </select>
                `;
            }

            div.innerHTML = `
                <label style="display:block; margin-bottom:8px; font-weight:bold; color: #333;">${index}. ${p.pregunta}</label>
                ${controlHTML}
            `;
            
            contenedor.appendChild(div);
            index++;
        }
    });

    // =========================================================================
    // ENVIAR RESPUESTAS POR EMAILJS
    // =========================================================================
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); 

            let cuerpoMensaje = "RESULTADOS DE LA ENCUESTA INSTITUCIONAL:\n\n";
            
            preguntasArrayGlobal.forEach((p, index) => {
                // Captura el valor ya sea del select o del input de texto usando el mismo name unificado
                const elementoInput = document.querySelector(`[name="pregunta_${p.id}"]`);
                const respuesta = elementoInput ? elementoInput.value.trim() : "No respondida";
                cuerpoMensaje += `Pregunta ${index + 1}: ${p.pregunta}\nRespuesta: ${respuesta}\n\n`;
            });

            btnEnviar.innerText = "Enviando respuestas...";
            btnEnviar.disabled = true;

            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                mensaje: cuerpoMensaje,
                to_email: "mixonjavierpelaez@gmail.com"
            })
            .then(() => {
                alert("¡Encuesta enviada con éxito!");
                form.reset(); 
            })
            .catch((error) => {
                alert("Ocurrió un error al despachar los resultados.");
                console.error(error);
            })
            .finally(() => {
                btnEnviar.innerText = "Enviar Encuesta";
                btnEnviar.disabled = false;
            });
        });
    }
});
