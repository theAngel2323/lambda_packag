import json
import base64
import boto3
import sqlite3
import os
import shutil

rekognition = boto3.client('rekognition')
DB_PATH = '/tmp/consejos.db'

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    # Copiar DB a /tmp si no existe
    if not os.path.exists(DB_PATH):
        shutil.copyfile(os.environ.get('LAMBDA_TASK_ROOT', '/var/task') + '/consejos.db', DB_PATH)

    try:
        body = json.loads(event.get('body', '{}'))
        image_base64 = body.get('image')

        # Decodificar imagen
        if ',' in image_base64:
            image_bytes = base64.b64decode(image_base64.split(',')[1])
        else:
            image_bytes = base64.b64decode(image_base64)

        # 1. Llamar a Rekognition
        response = rekognition.detect_faces(Image={'Bytes': image_bytes}, Attributes=['ALL'])
        
        # Si no hay caras
        if not response['FaceDetails']:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'personas': []})}

        # 2. Preparar Base de Datos y Lista de Resultados
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        resultados_grupales = []
        mapa = {"FEAR": "ANSIEDAD", "CALM": "CALMA", "ANGRY": "ENOJO", "SAD": "TRISTEZA", "HAPPY": "ALEGRÍA", "SURPRISED": "SORPRESA"}

        # 3. BUCLE: Recorrer TODAS las caras detectadas (Aquí está el cambio clave)
        for i, face in enumerate(response['FaceDetails']):
            # Obtener emoción dominante de ESTA cara
            emocion_data = sorted(face['Emotions'], key=lambda e: e['Confidence'], reverse=True)[0]
            emocion_tipo = emocion_data['Type']
            
            # Buscar consejos para ESTA emoción
            cursor.execute("SELECT titulo, texto, duracion FROM Consejos WHERE emocion=? ORDER BY RANDOM() LIMIT 3", (emocion_tipo,))
            consejos_db = cursor.fetchall()
            
            consejos = [{'titulo': r[0], 'texto': r[1], 'duracion': r[2]} for r in consejos_db]

            # Agregar a la lista de resultados con un número de persona
            resultados_grupales.append({
                'id_persona': i + 1, # Persona 1, Persona 2...
                'emocion': mapa.get(emocion_tipo, emocion_tipo),
                'confianza': f"{emocion_data['Confidence']:.0f}%",
                'consejos': consejos
            })

        conn.close()

        # 4. Devolver la lista completa
        return {
            'statusCode': 200, 
            'headers': headers, 
            'body': json.dumps({'personas': resultados_grupales})
        }

    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}