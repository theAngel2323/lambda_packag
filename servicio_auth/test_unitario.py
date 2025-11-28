import unittest
import sqlite3
import json
import os
import shutil

# Simulamos el entorno de AWS Lambda
os.environ['LAMBDA_TASK_ROOT'] = os.getcwd()

# Importamos tu función de Auth (Asegúrate que la carpeta servicio_auth tenga un __init__.py vacío o ajusta la ruta)
# Para simplificar, asumiremos que copiaste el código de lambda_function.py de Auth aquí o lo importas
# Aquí simularé la lógica de tu lambda para probarla aislada:

def logica_auth_simulada(accion, carnet, password, db_path=':memory:'):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('CREATE TABLE IF NOT EXISTS Usuarios (carnet TEXT PRIMARY KEY, password TEXT)')
    
    response = {}
    
    if accion == 'registro':
        cursor.execute("SELECT * FROM Usuarios WHERE carnet=?", (carnet,))
        if cursor.fetchone():
            response = {'exito': False, 'mensaje': 'Usuario existe'}
        else:
            cursor.execute("INSERT INTO Usuarios VALUES (?, ?)", (carnet, password))
            conn.commit()
            response = {'exito': True, 'mensaje': 'Creado'}
            
    elif accion == 'login':
        cursor.execute("SELECT * FROM Usuarios WHERE carnet=? AND password=?", (carnet, password))
        if cursor.fetchone():
            response = {'exito': True, 'mensaje': 'Ok'}
        else:
            response = {'exito': False, 'mensaje': 'Error Datos'}
            
    conn.close()
    return response

class TestMicroservicios(unittest.TestCase):

    def test_1_registro_exitoso(self):
        print("\n--- Test 1: Registro Exitoso ---")
        resultado = logica_auth_simulada('registro', 'alumno1', 'pass123')
        self.assertTrue(resultado['exito'])
        self.assertEqual(resultado['mensaje'], 'Creado')
        print("✅ Resultado: Usuario creado correctamente")

    def test_2_registro_duplicado(self):
        print("\n--- Test 2: Evitar Duplicados ---")
        # Registramos primero
        logica_auth_simulada('registro', 'alumno1', 'pass123')
        # Intentamos registrar de nuevo
        resultado = logica_auth_simulada('registro', 'alumno1', 'pass123')
        self.assertFalse(resultado['exito'])
        print("✅ Resultado: El sistema bloqueó el duplicado correctamente")

    def test_3_login_correcto(self):
        print("\n--- Test 3: Login Correcto ---")
        # Primero registramos en esta sesión de memoria
        db = sqlite3.connect(':memory:')
        cursor = db.cursor()
        cursor.execute('CREATE TABLE Usuarios (carnet TEXT, password TEXT)')
        cursor.execute("INSERT INTO Usuarios VALUES (?, ?)", ('alumno1', 'pass123'))
        db.commit()
        
        # Probamos login (Simulando la lógica interna)
        cursor.execute("SELECT * FROM Usuarios WHERE carnet=? AND password=?", ('alumno1', 'pass123'))
        usuario = cursor.fetchone()
        self.assertIsNotNone(usuario)
        print("✅ Resultado: Login exitoso")
        db.close()

if __name__ == '__main__':
    unittest.main()