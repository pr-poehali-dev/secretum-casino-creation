'''
Business: Casino game operations - promo codes, case openings, balance management
Args: event with httpMethod, body for game actions
Returns: HTTP response with game results
'''

import json
import os
import psycopg2
from typing import Dict, Any
import random

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

CASES = {
    'bomj': {
        'name': 'Бомж',
        'price': 30.00,
        'prizes': [
            {'amount': 100, 'chance': 50},
            {'amount': 200, 'chance': 24},
            {'amount': 250, 'chance': 23},
            {'amount': 300, 'chance': 20}
        ]
    },
    'rich': {
        'name': 'Богатый',
        'price': 560.00,
        'prizes': [
            {'amount': 350, 'chance': 75},
            {'amount': 400, 'chance': 50},
            {'amount': 1200, 'chance': 11},
            {'amount': 3000, 'chance': 10},
            {'amount': 15000, 'chance': 0.0001}
        ]
    }
}

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
        user_id = body.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing user_id'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if action == 'use_promo':
            promo_code = body.get('promo_code')
            
            if not promo_code:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing promo_code'})
                }
            
            cur.execute("SELECT id, amount, max_uses, current_uses FROM promo_codes WHERE code = %s", (promo_code,))
            promo = cur.fetchone()
            
            if not promo:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Promo code not found'})
                }
            
            promo_id, amount, max_uses, current_uses = promo
            
            cur.execute("SELECT COUNT(*) FROM user_promo_usage WHERE user_id = %s AND promo_code_id = %s", (user_id, promo_id))
            user_uses = cur.fetchone()[0]
            
            if current_uses >= max_uses:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Promo code limit reached'})
                }
            
            if user_uses > 0:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Already used this promo'})
                }
            
            cur.execute("INSERT INTO user_promo_usage (user_id, promo_code_id) VALUES (%s, %s)", (user_id, promo_id))
            cur.execute("UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = %s", (promo_id,))
            cur.execute("UPDATE users SET balance = balance + %s WHERE id = %s RETURNING balance", (amount, user_id))
            new_balance = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'amount': float(amount), 'new_balance': float(new_balance)})
            }
        
        if action == 'open_case':
            case_id = body.get('case_id')
            
            if not case_id or case_id not in CASES:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid case_id'})
                }
            
            case_data = CASES[case_id]
            
            cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
            user_balance = cur.fetchone()
            
            if not user_balance or user_balance[0] < case_data['price']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Insufficient balance'})
                }
            
            rand = random.random() * 100
            cumulative = 0
            won_amount = case_data['prizes'][0]['amount']
            
            for prize in case_data['prizes']:
                cumulative += prize['chance']
                if rand <= cumulative:
                    won_amount = prize['amount']
                    break
            
            cur.execute(
                "UPDATE users SET balance = balance - %s + %s WHERE id = %s RETURNING balance",
                (case_data['price'], won_amount, user_id)
            )
            new_balance = cur.fetchone()[0]
            
            cur.execute(
                "INSERT INTO case_openings (user_id, case_name, case_price, prize_amount) VALUES (%s, %s, %s, %s)",
                (user_id, case_data['name'], case_data['price'], won_amount)
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'won_amount': float(won_amount),
                    'new_balance': float(new_balance)
                })
            }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
