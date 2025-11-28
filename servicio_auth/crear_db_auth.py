import sqlite3
conn = sqlite3.connect('servicio_auth/usuarios.db')
cursor = conn.cursor()
cursor.execute('CREATE TABLE IF NOT EXISTS Usuarios (carnet TEXT PRIMARY KEY, password TEXT NOT NULL)')
cursor.execute("INSERT OR REPLACE INTO Usuarios (carnet, password) VALUES (?, ?)", ('2023001', 'upana123'))
conn.commit()
conn.close()
print("¡usuarios.db creado!")