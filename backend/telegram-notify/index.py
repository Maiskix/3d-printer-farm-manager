import json
import urllib.error
import urllib.request

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def handler(event: dict, context) -> dict:
    '''
    Отправка уведомлений в Telegram через Bot API.
    Принимает токен бота, chat_id и текст сообщения, отправляет запрос
    на api.telegram.org/bot<TOKEN>/sendMessage и возвращает результат отправки.
    '''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    resp_headers = {**CORS_HEADERS, 'Content-Type': 'application/json'}

    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        body = {}

    token = (body.get('token') or '').strip()
    chat_id = (body.get('chatId') or '').strip()
    text = (body.get('text') or '').strip()

    if not token or not chat_id:
        return {
            'statusCode': 400,
            'headers': resp_headers,
            'body': json.dumps({'ok': False, 'error': 'Токен бота или ID чата не указаны'}),
        }

    if not text:
        return {
            'statusCode': 400,
            'headers': resp_headers,
            'body': json.dumps({'ok': False, 'error': 'Текст сообщения пуст'}),
        }

    url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = json.dumps({'chat_id': chat_id, 'text': text}).encode('utf-8')

    try:
        req = urllib.request.Request(
            url,
            method='POST',
            headers={'Content-Type': 'application/json'},
            data=payload,
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))

        return {
            'statusCode': 200,
            'headers': resp_headers,
            'body': json.dumps({'ok': True, 'result': data}),
        }

    except urllib.error.HTTPError as e:
        try:
            error_body = json.loads(e.read().decode('utf-8'))
            description = error_body.get('description', str(e))
        except Exception:
            description = str(e)
        return {
            'statusCode': 200,
            'headers': resp_headers,
            'body': json.dumps({'ok': False, 'error': f'Telegram вернул ошибку: {description}'}),
        }
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': resp_headers,
            'body': json.dumps({'ok': False, 'error': str(e)}),
        }
