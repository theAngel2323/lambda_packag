import sqlite3

# Nombre del archivo de base de datos
db_name = 'consejos.db'

conn = sqlite3.connect(db_name)
cursor = conn.cursor()

print("1. Creando tablas...")

# --- TABLA DE CONSEJOS ---
cursor.execute('''
    CREATE TABLE IF NOT EXISTS Consejos (
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
    CREATE TABLE IF NOT EXISTS Usuarios (
        carnet TEXT PRIMARY KEY,
        password TEXT NOT NULL
    )
''')

print("2. Insertando datos iniciales...")

# Insertar Usuario de Prueba
# Carnet: 2023001, Pass: upana123
cursor.execute("INSERT OR REPLACE INTO Usuarios (carnet, password) VALUES (?, ?)", ('2023001', 'upana123'))

# Insertar Consejos de Bienestar
consejos_lista = [
    ('FEAR', 'Respiración', 'Respiración 4-7-8', 'Inhala por 4s, sostén 7s, exhala por 8s.', '2 min'),
    ('FEAR', 'Grounding', '5-4-3-2-1', 'Identifica 5 cosas que ves, 4 que tocas, 3 que oyes...', '3 min'),
    ('CALM', 'Enfoque', 'Checklist Rápido', 'Escribe las 3 prioridades del día.', '1 min'),
    ('ANGRY', 'Físico', 'Descarga', 'Aprieta una pelota antiestrés o tensa y relaja puños.', '1 min'),
    ('SAD', 'Ánimo', 'Caminata', 'Da una vuelta corta para cambiar de aire.', '5 min'),
    ('HAPPY', 'Celebración', 'Agradecimiento', 'Anota algo bueno que pasó hoy.', '1 min'),
    ('SURPRISED', 'Pausa', 'Respiración Profunda', 'Toma tres respiraciones profundas para asimilar.', '1 min'),
    ('NEUTRAL', 'Activación', 'Estiramiento', 'Estira brazos y cuello suavemente.', '2 min')
]

cursor.executemany('''
    INSERT INTO Consejos (emocion, categoria, titulo, texto, duracion) 
    VALUES (?, ?, ?, ?, ?)
''', consejos_lista)

conn.commit()
conn.close()

print(f"¡Listo! Base de datos '{db_name}' creada exitosamente.")