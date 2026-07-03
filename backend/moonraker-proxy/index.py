import base64
import json
import socket
import urllib.error
import urllib.request
import uuid

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

# Простые действия без параметров: action -> (путь, HTTP-метод)
ПРОСТЫЕ_ДЕЙСТВИЯ = {
    'info': ('/printer/info', 'GET'),
    'status': ('/printer/objects/query?extruder&heater_bed&print_stats&virtual_sdcard&toolhead', 'GET'),
    'pause': ('/printer/print/pause', 'POST'),
    'resume': ('/printer/print/resume', 'POST'),
    'cancel': ('/printer/print/cancel', 'POST'),
    'list': ('/server/files/list', 'GET'),
}


def запрос_json(url: str, method: str, payload: dict, api_key: str, timeout: int = 4):
    '''Обычный JSON-запрос к Moonraker API'''
    headers = {'Content-Type': 'application/json'}
    if api_key:
        headers['X-Api-Key'] = api_key

    req = urllib.request.Request(url, method=method, headers=headers)
    if payload is not None and method == 'POST':
        req.data = json.dumps(payload).encode('utf-8')

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


def загрузить_файл(url: str, filename: str, file_content_b64: str, api_key: str, timeout: int = 25):
    '''Загрузка G-кода на принтер через multipart/form-data (Moonraker /server/files/upload)'''
    boundary = f'----poehali{uuid.uuid4().hex}'
    file_bytes = base64.b64decode(file_content_b64)

    body = bytearray()
    body += f'--{boundary}\r\n'.encode()
    body += f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode()
    body += b'Content-Type: application/octet-stream\r\n\r\n'
    body += file_bytes
    body += f'\r\n--{boundary}--\r\n'.encode()

    headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
    if api_key:
        headers['X-Api-Key'] = api_key

    req = urllib.request.Request(url, data=bytes(body), method='POST', headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


def handler(event: dict, context) -> dict:
    '''
    Прокси для подключения к принтеру по Moonraker API.
    Поддерживает: info, status, start (с filename), pause, resume, cancel,
    list (список файлов на принтере), delete (удаление файла), upload (загрузка G-кода).
    '''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        body = {}

    ip = (body.get('ip') or '').strip()
    port = str(body.get('port') or '7125').strip()
    api_key = (body.get('apiKey') or '').strip()
    action = body.get('action') or 'status'
    filename = (body.get('filename') or '').strip()
    file_content = body.get('fileContent')

    resp_headers = {**CORS_HEADERS, 'Content-Type': 'application/json'}

    if not ip:
        return {'statusCode': 400, 'headers': resp_headers, 'body': json.dumps({'error': 'IP-адрес не указан'})}

    base_url = f'http://{ip}:{port}'

    try:
        if action == 'upload':
            if not filename or not file_content:
                return {
                    'statusCode': 400,
                    'headers': resp_headers,
                    'body': json.dumps({'error': 'Не переданы имя файла или содержимое'}),
                }
            data = загрузить_файл(f'{base_url}/server/files/upload', filename, file_content, api_key)
            return {'statusCode': 200, 'headers': resp_headers, 'body': json.dumps({'connected': True, 'data': data})}

        if action == 'start':
            data = запрос_json(f'{base_url}/printer/print/start', 'POST', {'filename': filename} if filename else {}, api_key)
            return {'statusCode': 200, 'headers': resp_headers, 'body': json.dumps({'connected': True, 'data': data})}

        if action == 'delete':
            if not filename:
                return {'statusCode': 400, 'headers': resp_headers, 'body': json.dumps({'error': 'Не указано имя файла'})}
            data = запрос_json(f'{base_url}/server/files/gcodes/{filename}', 'DELETE', {}, api_key)
            return {'statusCode': 200, 'headers': resp_headers, 'body': json.dumps({'connected': True, 'data': data})}

        if action not in ПРОСТЫЕ_ДЕЙСТВИЯ:
            return {'statusCode': 400, 'headers': resp_headers, 'body': json.dumps({'error': 'Неизвестное действие'})}

        path, method = ПРОСТЫЕ_ДЕЙСТВИЯ[action]
        data = запрос_json(f'{base_url}{path}', method, {} if method == 'POST' else None, api_key)
        return {'statusCode': 200, 'headers': resp_headers, 'body': json.dumps({'connected': True, 'data': data})}

    except urllib.error.HTTPError as e:
        return {
            'statusCode': 200,
            'headers': resp_headers,
            'body': json.dumps({'connected': False, 'error': f'Принтер ответил ошибкой: {e.code}'}),
        }
    except (urllib.error.URLError, socket.timeout):
        return {
            'statusCode': 200,
            'headers': resp_headers,
            'body': json.dumps({
                'connected': False,
                'error': 'Принтер недоступен. Проверьте IP, порт, что Moonraker запущен и доступен из интернета.',
            }),
        }
    except Exception as e:
        return {'statusCode': 200, 'headers': resp_headers, 'body': json.dumps({'connected': False, 'error': str(e)})}
