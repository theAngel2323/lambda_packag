import json
import base64
import boto3
import sqlite3
import os

# Configuración de los clientes de AWS y la BD
# Boto3 (el SDK de AWS) usará automáticamente el rol de la Lambda
rekognition_client = boto3.client('rekognition')

# Ruta a la base de datos que subiremos junto con el código
DB_PATH = os.environ.get('LAMBDA_TASK_ROOT', '.') + '/consejos.db'

def lambda_handler(event, context):
    
    try:
        # 1. Recibir y decodificar la imagen
        # El frontend enviará la imagen como un string base64 en el cuerpo (body)
        # El body viene como un string, así que lo cargamos como JSON
        body = json.loads(event.get('body', '{}'))
        image_base64 = body.get('image')
        
        if not image_base64:
            return {'statusCode': 400, 'body': json.dumps('No se proporcionó imagen.')}
            
        # Decodificar la imagen (quitando el prefijo 'data:image/jpeg;base64,')
        image_bytes = base64.b64decode(image_base64.split(',')[1])
        
        # --- REQUISITO DE PRIVACIDAD CUMPLIDO ---
        # La imagen solo existe en memoria ('image_bytes')
        # No se almacena en disco en ningún momento [cite: 11]
        
        # 2. Enviar a AWS Rekognition para análisis [cite: 34]
        response = rekognition_client.detect_faces(
            Image={'Bytes': image_bytes},
            Attributes=['ALL']
        )
        
        # 3. Procesar el resultado de Rekognition
        if not response['FaceDetails']:
            return {'statusCode': 400, 'body': json.dumps('No se detectó ningún rostro.')}
            
        # Tomar la primera cara detectada
        face = response['FaceDetails'][0]
        
        # Encontrar la emoción dominante (con mayor confianza)
        emocion_dominante = sorted(face['Emotions'], key=lambda e: e['Confidence'], reverse=True)[0]
        
        emocion_tipo = emocion_dominante['Type'] # ej: 'FEAR'
        emocion_confianza = emocion_dominante['Confidence'] # ej: 83.0
        
        # Mapeo de inglés a español para la UI
        mapa_emociones = {
            "FEAR": "ANSIEDAD",
            "CALM": "CALMA",
            "ANGRY": "ENOJO",
            "SAD": "TRISTEZA",
            "HAPPY": "ALEGRÍA",
            "SURPRISED": "SORPRESA",
            "NEUTRAL": "NEUTRO",
            "DISGUSTED": "DISGUSTO",
            "CONFUSED": "CONFUSIÓN"
        }
        
        emocion_detectada_es = mapa_emociones.get(emocion_tipo, emocion_tipo)
        
        # 4. Consultar la Base de Datos Local (SQLite) 
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Seleccionar 3 consejos aleatorios para esa emoción
        cursor.execute(
            "SELECT titulo, texto, duracion FROM Consejos WHERE emocion = ? ORDER BY RANDOM() LIMIT 3",
            (emocion_tipo,)
        )
        consejos_db = cursor.fetchall()
        conn.close()
        
        # Formatear los consejos
        consejos = [
            {'titulo': r[0], 'texto': r[1], 'duracion': r[2]} 
            for r in consejos_db
        ]
        
        # 5. Devolver la respuesta al frontend
        resultado = {
            'emocion': emocion_detectada_es,
            'confianza': f"{emocion_confianza:.0f}%", # Formato "83%" [cite: 59]
            'consejos': consejos # [cite: 62]
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*', # Permitir acceso desde cualquier dominio
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps(resultado)
        }

    except Exception as e:
        print(f"Error: {e}")
        # AQUI ESTA LA MAGIA: Devolver headers de CORS incluso si hay error
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps(f'Error interno del servidor: {str(e)}')
        }