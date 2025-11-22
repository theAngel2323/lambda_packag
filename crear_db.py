import sqlite3

# 1. Conectar (esto crea el archivo si no existe)
conn = sqlite3.connect('consejos.db')
cursor = conn.cursor()

# 2. Crear la tabla con código SQL
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

# 3. Insertar los datos (Los consejos)
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

# 4. Guardar cambios y cerrar
conn.commit()
conn.close()

print("¡Base de datos 'consejos.db' creada exitosamente!")