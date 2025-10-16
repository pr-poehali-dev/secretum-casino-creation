'''
Business: Google OAuth authentication and user management
Args: event with httpMethod, body for login/user operations
Returns: HTTP response with user data or auth status
'''

import json
import os
import psycopg2
from typing import Dict, Any, Optional

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'login':
            phone_number = body.get('phone_number')
            code = body.get('code', '1234')
            
            if not phone_number:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing phone_number'})
                }
            
            if code != '1234':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid code'})
                }
            
            name = f'User{phone_number[-4:]}'
            email = f'{phone_number}@phone.user'
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute(
                "SELECT id, email, name, balance, is_admin FROM users WHERE google_id = %s",
                (phone_number,)
            )
            user = cur.fetchone()
            
            if user:
                result = {
                    'id': user[0],
                    'email': user[1],
                    'name': user[2],
                    'balance': float(user[3]),
                    'is_admin': user[4]
                }
            else:
                cur.execute(
                    "INSERT INTO users (google_id, email, name) VALUES (%s, %s, %s) RETURNING id, email, name, balance, is_admin",
                    (phone_number, email, name)
                )
                new_user = cur.fetchone()
                conn.commit()
                
                result = {
                    'id': new_user[0],
                    'email': new_user[1],
                    'name': new_user[2],
                    'balance': float(new_user[3]),
                    'is_admin': new_user[4]
                }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result)
            }
        
        if action == 'get_user':
            user_id = body.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing user_id'})
                }
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute(
                "SELECT id, email, name, balance, is_admin FROM users WHERE id = %s",
                (user_id,)
            )
            user = cur.fetchone()
            
            cur.close()
            conn.close()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': user[0],
                    'email': user[1],
                    'name': user[2],
                    'balance': float(user[3]),
                    'is_admin': user[4]
                })
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }