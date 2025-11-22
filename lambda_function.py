import json
import base64
import boto3
import sqlite3
import os
import shutil

# Configuración de clientes
rekognition = boto3.client('rekognition')

# Ruta temporal (Lambda solo permite escribir/guardar nuevos usuarios en /tmp)
DB_PATH = '/tmp/consejos.db'

def lambda_handler(event, context):
    # Encabezados CORS universales
    headers_cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }

    try:
        # 1. Manejo del Preflight (OPTIONS)
        if event.get('httpMethod') == 'OPTIONS':
            return {'statusCode': 200, 'headers': headers_cors, 'body': ''}

        # 2. Preparar la Base de Datos (Copiar a /tmp para poder escribir nuevos usuarios)
        origen_db = os.environ.get('LAMBDA_TASK_ROOT', '/var/task') + '/consejos.db'
        
        # Si no existe en /tmp, la copiamos del paquete original
        if not os.path.exists(DB_PATH):
            shutil.copyfile(origen_db, DB_PATH)

        # 3. Leer la petición
        body = json.loads(event.get('body', '{}'))
        accion = body.get('accion') # login, registro, o analizar

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # ==========================================
        # CASO A: REGISTRO DE USUARIO
        # ==========================================
        if accion == 'registro':
            carnet = body.get('carnet')
            password = body.get('password')
            
            # Verificar duplicados
            cursor.execute("SELECT * FROM Usuarios WHERE carnet=?", (carnet,))
            if cursor.fetchone():
                conn.close()
                return {'statusCode': 409, 'headers': headers_cors, 'body': json.dumps({'autorizado': False, 'mensaje': 'El usuario ya existe'})}

            try:
                cursor.execute("INSERT INTO Usuarios (carnet, password) VALUES (?, ?)", (carnet, password))
                conn.commit()
                conn.close()
                return {'statusCode': 200, 'headers': headers_cors, 'body': json.dumps({'autorizado': True, 'mensaje': 'Usuario creado'})}
            except Exception as e:
                return {'statusCode': 500, 'headers': headers_cors, 'body': json.dumps({'autorizado': False, 'mensaje': 'Error al guardar'})}

        # ==========================================
        # CASO B: LOGIN (INICIO DE SESIÓN)
        # ==========================================
        elif accion == 'login':
            carnet = body.get('carnet')
            password = body.get('password')
            
            cursor.execute("SELECT * FROM Usuarios WHERE carnet=? AND password=?", (carnet, password))
            usuario = cursor.fetchone()
            conn.close()

            if usuario:
                return {'statusCode': 200, 'headers': headers_cors, 'body': json.dumps({'autorizado': True, 'mensaje': 'Bienvenido'})}
            else:
                return {'statusCode': 401, 'headers': headers_cors, 'body': json.dumps({'autorizado': False, 'mensaje': 'Credenciales incorrectas'})}

        # ==========================================
        # CASO C: ANÁLISIS DE EMOCIÓN (Por defecto)
        # ==========================================
        
        image_base64 = body.get('image')
        if not image_base64:
            return {'statusCode': 400, 'headers': headers_cors, 'body': json.dumps('Falta imagen')}

        # Decodificar imagen
        try:
            image_bytes = base64.b64decode(image_base64.split(',')[1])
        except:
            image_bytes = base64.b64decode(image_base64)

        # Enviar a AWS Rekognition
        response = rekognition.detect_faces(Image={'Bytes': image_bytes}, Attributes=['ALL'])
        
        if not response['FaceDetails']:
            return {'statusCode': 200, 'headers': headers_cors, 'body': json.dumps({'emocion': 'No detectada', 'consejos': []})}

        # Procesar emoción
        face = response['FaceDetails'][0]
        emocion_dominante = sorted(face['Emotions'], key=lambda e: e['Confidence'], reverse=True)[0]
        emocion_tipo = emocion_dominante['Type']
        
        # Buscar consejos
        cursor.execute("SELECT titulo, texto, duracion FROM Consejos WHERE emocion = ? ORDER BY RANDOM() LIMIT 3", (emocion_tipo,))
        datos = cursor.fetchall()
        conn.close()

        # Respuesta final
        mapa = {"FEAR": "ANSIEDAD", "CALM": "CALMA", "ANGRY": "ENOJO", "SAD": "TRISTEZA", "HAPPY": "ALEGRÍA", "SURPRISED": "SORPRESA"}
        resultado = {
            'emocion': mapa.get(emocion_tipo, emocion_tipo),
            'confianza': f"{emocion_dominante['Confidence']:.0f}%",
            'consejos': [{'titulo': r[0], 'texto': r[1], 'duracion': r[2]} for r in datos]
        }

        return {'statusCode': 200, 'headers': headers_cors, 'body': json.dumps(resultado)}

    except Exception as e:
        return {'statusCode': 500, 'headers': headers_cors, 'body': json.dumps(f"Error Interno: {str(e)}")}