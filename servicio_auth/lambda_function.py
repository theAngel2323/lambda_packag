import json
import sqlite3
import os
import shutil

DB_PATH = '/tmp/usuarios.db'

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    # Copiar DB a /tmp
    if not os.path.exists(DB_PATH):
        shutil.copyfile(os.environ.get('LAMBDA_TASK_ROOT', '/var/task') + '/usuarios.db', DB_PATH)

    body = json.loads(event.get('body', '{}'))
    accion = body.get('accion')
    carnet = body.get('carnet')
    password = body.get('password')

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        if accion == 'registro':
            cursor.execute("SELECT * FROM Usuarios WHERE carnet=?", (carnet,))
            if cursor.fetchone():
                return {'statusCode': 409, 'headers': headers, 'body': json.dumps({'exito': False, 'mensaje': 'Usuario existe'})}
            cursor.execute("INSERT INTO Usuarios VALUES (?, ?)", (carnet, password))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'exito': True, 'mensaje': 'Creado'})}

        elif accion == 'login':
            cursor.execute("SELECT * FROM Usuarios WHERE carnet=? AND password=?", (carnet, password))
            if cursor.fetchone():
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'exito': True, 'mensaje': 'Ok'})}
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'exito': False, 'mensaje': 'Error Datos'})}
            
    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'exito': False, 'mensaje': str(e)})}
    finally:
        conn.close()