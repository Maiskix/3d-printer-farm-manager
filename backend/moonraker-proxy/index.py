import json
import socket
import urllib.error
import urllib.request

# Соответствие действия конечной точке Moonraker API
ДЕЙСТВИЯ = {
    'info': ('/printer/info', 'GET', None),
    'status': ('/printer/objects/query?extruder&heater_bed&print_stats&virtual_sdcard&toolhead', 'GET', None),
    'start': ('/printer/print/start', 'POST', {}),
    'pause': ('/printer/print/pause', 'POST', {}),
    'resume': ('/printer/print/resume', 'POST', {}),
    'cancel': ('/printer/print/cancel', 'POST', {}),
}

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def handler(event: dict, context) -> dict:
    '''
    Прокси для подключения к принтеру по Moonraker API.
    Принимает IP-адрес, порт, API-ключ и действие (info/status/start/pause/resume/cancel),
    делает запрос напрямую к принтеру и возвращает реальный статус или ошибку связи.
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

    resp_headers = {**CORS_HEADERS, 'Content-Type': 'application/json'}

    if not ip:
        return {
            'statusCode': 400,
            'headers': resp_headers,
            'body': json.dumps({'error': 'IP-адрес не указан'}),
        }

    if action not in ДЕЙСТВИЯ:
        return {
            'statusCode': 400,
            'headers': resp_headers,
            'body': json.dumps({'error': 'Неизвестное действие'}),
        }

    path, http_method, payload = ДЕЙСТВИЯ[action]
    url = f'http://{ip}:{port}{path}'

    req_headers = {'Content-Type': 'application/json'}
    if api_key:
        req_headers['X-Api-Key'] = api_key

    try:
        req = urllib.request.Request(url, method=http_method, headers=req_headers)
        if payload is not None and http_method == 'POST':
            req.data = json.dumps(payload).encode('utf-8')

        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode('utf-8'))

        return {
            'statusCode': 200,
            'headers': resp_headers,
            'body': json.dumps({'connected': True, 'data': data}),
        }

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
        return {
            'statusCode': 200,
            'headers': resp_headers,
            'body': json.dumps({'connected': False, 'error': str(e)}),
        }
