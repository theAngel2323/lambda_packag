import sqlite3
import os

# Nombre del archivo de base de datos para el servicio CORE
db_name = 'servicio_core/consejos.db'

# 1. Limpieza total: Eliminar el archivo físico si existe para empezar de cero
if os.path.exists(db_name):
    os.remove(db_name)
    print(f"Base de datos anterior '{db_name}' eliminada para regeneración limpia.")

conn = sqlite3.connect(db_name)
cursor = conn.cursor()

print("2. Creando tabla de Consejos...")

# --- TABLA DE CONSEJOS ---
# Solo creamos la tabla necesaria para este microservicio
cursor.execute('''
    CREATE TABLE Consejos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        emocion TEXT NOT NULL,
        categoria TEXT,
        titulo TEXT NOT NULL,
        texto TEXT NOT NULL,
        duracion TEXT 
    )
''')

print("3. Insertando catálogo de consejos...")

consejos_lista = [
    # FEAR (Enfoque: Regulación del Sistema Nervioso y Realidad)
    ('FEAR', 'Somático', 'Abrazo de Mariposa', 'Cruza brazos sobre el pecho y da golpecitos alternos en tus hombros.', '2 min'),
    ('FEAR', 'Cognitivo', 'Verificación de Realidad', 'Pregúntate: ¿Tengo pruebas reales de que esto pasará hoy?', '3 min'),
    ('FEAR', 'Visualización', 'Lugar Seguro', 'Cierra los ojos e imagina un sitio donde nada malo puede pasar.', '5 min'),

    # CALM (Enfoque: Profundización y Consciencia Plena)
    ('CALM', 'Mindfulness', 'Escaneo Corporal', 'Recorre mentalmente tu cuerpo de pies a cabeza soltando tensión.', '5 min'),
    ('CALM', 'Reflexión', 'Diario de Gratitud', 'Escribe 3 cosas simples por las que das gracias ahora mismo.', '4 min'),
    ('CALM', 'Presencia', 'Saboreo del Momento', 'Quédate quieto y disfruta conscientemente de no tener urgencias.', '2 min'),

    # ANGRY (Enfoque: Enfriamiento Fisiológico y Gestión de Impulsos)
    ('ANGRY', 'Fisiológico', 'Cambio de Temperatura', 'Lávate la cara o muñecas con agua muy fría para "resetear".', '2 min'),
    ('ANGRY', 'Expresión', 'Escritura Libre', 'Escribe todo lo que sientes sin filtro y luego rompe el papel.', '5 min'),
    ('ANGRY', 'Pausa', 'Tiempo Fuera', 'Aléjate físicamente de la situación hasta contar 20 respiraciones.', '3 min'),

    # SAD (Enfoque: Autocompasión y Activación Conductual Suave)
    ('SAD', 'Autocompasión', 'Mano en el Corazón', 'Pon tu mano en el pecho y repite: "Estoy aquí conmigo".', '2 min'),
    ('SAD', 'Sensorial', 'Ducha Consciente', 'Siente el agua tibia e imagina que limpia la pesadez emocional.', '10 min'),
    ('SAD', 'Acción', 'Micro-logro', 'Haz una tarea diminuta (ej. tender la cama) para ganar impulso.', '3 min'),

    # HAPPY (Enfoque: Anclaje y Expansión Social)
    ('HAPPY', 'Anclaje', 'Foto Mental', 'Detente y captura mentalmente los detalles de este momento.', '1 min'),
    ('HAPPY', 'Social', 'Elogio Sincero', 'Dile a alguien algo que realmente admiras de él/ella.', '2 min'),
    ('HAPPY', 'Creatividad', 'Playlist Positiva', 'Escucha o agrega una canción que te haga sentir invencible.', '4 min'),

    # SURPRISED (Enfoque: Orientación y Asimilación)
    ('SURPRISED', 'Cognitivo', 'Nombrar la Emoción', 'Di en voz alta: "Me siento sorprendido por..." para procesarlo.', '1 min'),
    ('SURPRISED', 'Grounding', 'Pies en Tierra', 'Pisa fuerte el suelo descalzo para volver a tu centro.', '2 min'),
    ('SURPRISED', 'Análisis', 'Pausa de Perspectiva', 'Antes de reaccionar, pregúntate: ¿Esto es amenaza u oportunidad?', '3 min'),

    # NEUTRAL (Enfoque: Intención y Curiosidad)
    ('NEUTRAL', 'Crecimiento', 'Curiosidad', 'Observa un objeto común como si fuera la primera vez que lo ves.', '3 min'),
    ('NEUTRAL', 'Propósito', 'Intención del Día', 'Define una palabra que guíe tus próximas horas (ej. "Paz").', '1 min'),
    ('NEUTRAL', 'Físico', 'Estiramiento Consciente', 'Estira los brazos hacia el cielo tratando de tocar el techo.', '2 min'),
]

cursor.executemany('''
    INSERT INTO Consejos (emocion, categoria, titulo, texto, duracion) 
    VALUES (?, ?, ?, ?, ?)
''', consejos_lista)

conn.commit()
conn.close()

print(f"¡Éxito! Base de datos '{db_name}' regenerada exclusivamente para el Microservicio Core.")