import sqlite3
import os

# Nombre del archivo de base de datos
db_name = 'consejos.db'

# Opcional: Eliminar el archivo físico antes de empezar para asegurar limpieza total
if os.path.exists(db_name):
    os.remove(db_name)
    print("Base de datos anterior eliminada.")

conn = sqlite3.connect(db_name)
cursor = conn.cursor()

print("1. Reiniciando tablas...")

# --- PASO CRÍTICO: BORRAR TABLAS SI EXISTEN ---
# Esto evita que los datos se dupliquen si corres el script varias veces
cursor.execute("DROP TABLE IF EXISTS Consejos")
cursor.execute("DROP TABLE IF EXISTS Usuarios")

print("2. Creando tablas nuevas...")

# --- TABLA DE CONSEJOS ---
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

# --- TABLA DE USUARIOS (Login/Registro) ---
cursor.execute('''
    CREATE TABLE Usuarios (
        carnet TEXT PRIMARY KEY,
        password TEXT NOT NULL
    )
''')

print("3. Insertando datos...")

# Insertar Usuario de Prueba
cursor.execute("INSERT INTO Usuarios (carnet, password) VALUES (?, ?)", ('2023001', 'upana123'))

# Insertar Consejos de Bienestar
consejos_lista = [
    # FEAR
    ('FEAR', 'Respiración', 'Respiración 4-7-8', 'Inhala por 4s, sostén 7s, exhala por 8s.', '2 min'),
    ('FEAR', 'Grounding', '5-4-3-2-1', 'Identifica 5 cosas que ves, 4 que tocas y 3 que oyes.', '3 min'),

    # CALM
    ('CALM', 'Enfoque', 'Checklist Rápido', 'Escribe las 3 prioridades del día.', '1 min'),
    ('CALM', 'Sereno', 'Mantener', 'No entres en situaciones que te alteren', '3 min'),

    # ANGRY
    ('ANGRY', 'Físico', 'Descarga', 'Aprieta una pelota antiestrés o tensa y relaja puños.', '1 min'),
    ('ANGRY', 'Físico', 'Movimiento Controlado', 'Realiza 10 sentadillas para liberar tensión de forma segura.', '2 min'),

    # SAD
    ('SAD', 'Ánimo', 'Caminata', 'Da una vuelta corta para cambiar de aire.', '5 min'),
    ('SAD', 'Ánimo', 'Conexión', 'Envía un mensaje breve a alguien de confianza para sentirte acompañado.', '3 min'),

    # HAPPY
    ('HAPPY', 'Celebración', 'Agradecimiento', 'Anota algo bueno que pasó hoy.', '1 min'),
    ('HAPPY', 'Celebración', 'Compartir', 'Comparte tu buena noticia o estado con alguien cercano.', '2 min'),

    # SURPRISED
    ('SURPRISED', 'Pausa', 'Respiración Profunda', 'Toma tres respiraciones profundas para asimilar.', '1 min'),
    ('SURPRISED', 'Pausa', 'Observación', 'Identifica tres cosas a tu alrededor para orientarte al presente.', '1 min'),

    # NEUTRAL
    ('NEUTRAL', 'Activación', 'Estiramiento', 'Estira brazos y cuello suavemente.', '2 min'),
    ('NEUTRAL', 'Activación', 'Hidratación', 'Bebe un vaso de agua para refrescar cuerpo y mente.', '1 min'),
]

cursor.executemany('''
    INSERT INTO Consejos (emocion, categoria, titulo, texto, duracion) 
    VALUES (?, ?, ?, ?, ?)
''', consejos_lista)

conn.commit()
conn.close()

print(f"¡Listo! Base de datos '{db_name}' regenerada sin duplicados.")