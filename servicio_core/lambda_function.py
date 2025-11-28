import json, base64, boto3, sqlite3, os, shutil

rekognition = boto3.client('rekognition')
DB_PATH = '/tmp/consejos.db'

def lambda_handler(event, context):
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS'}
    if event.get('httpMethod') == 'OPTIONS': return {'statusCode': 200, 'headers': headers, 'body': ''}

    if not os.path.exists(DB_PATH):
        shutil.copyfile(os.environ.get('LAMBDA_TASK_ROOT', '/var/task') + '/consejos.db', DB_PATH)

    try:
        body = json.loads(event.get('body', '{}'))
        img_bytes = base64.b64decode(body.get('image').split(',')[1] if ',' in body.get('image') else body.get('image'))
        
        resp = rekognition.detect_faces(Image={'Bytes': img_bytes}, Attributes=['ALL'])
        if not resp['FaceDetails']: return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'emocion': 'Nada', 'consejos': []})}
        
        emocion = sorted(resp['FaceDetails'][0]['Emotions'], key=lambda x: x['Confidence'], reverse=True)[0]
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT titulo, texto, duracion FROM Consejos WHERE emocion=? LIMIT 3", (emocion['Type'],))
        consejos = [{'titulo':r[0],'texto':r[1],'duracion':r[2]} for r in cursor.fetchall()]
        conn.close()

        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'emocion': emocion['Type'], 'confianza': f"{emocion['Confidence']:.0f}%", 'consejos': consejos})}
    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}