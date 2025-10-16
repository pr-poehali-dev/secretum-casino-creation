'''
Business: Mini-games (CoinFlip, Crash, Mines, Cards) logic and payouts
Args: event with httpMethod, body with game type and bet details
Returns: HTTP response with game results
'''

import json
import os
import psycopg2
from typing import Dict, Any
import random

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
        user_id = body.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing user_id'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if action == 'coinflip':
            amount = body.get('amount', 0)
            choice = body.get('choice')
            
            if amount < 35:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Minimum bet is 35'})
                }
            
            cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
            balance = cur.fetchone()
            
            if not balance or balance[0] < amount:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Insufficient balance'})
                }
            
            result = 'heads' if random.random() < 0.5 else 'tails'
            won = result == choice
            payout = amount * 2 if won else 0
            
            cur.execute(
                "UPDATE users SET balance = balance - %s + %s WHERE id = %s RETURNING balance",
                (amount, payout, user_id)
            )
            new_balance = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'won': won,
                    'result': result,
                    'payout': float(payout),
                    'new_balance': float(new_balance)
                })
            }
        
        if action == 'crash_bet':
            amount = body.get('amount', 0)
            
            if amount < 10:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Minimum bet is 10'})
                }
            
            cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
            balance = cur.fetchone()
            
            if not balance or balance[0] < amount:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Insufficient balance'})
                }
            
            cur.execute(
                "UPDATE users SET balance = balance - %s WHERE id = %s RETURNING balance",
                (amount, user_id)
            )
            new_balance = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'new_balance': float(new_balance)})
            }
        
        if action == 'crash_cashout':
            amount = body.get('amount', 0)
            multiplier = body.get('multiplier', 1.0)
            
            payout = amount * multiplier
            
            cur.execute(
                "UPDATE users SET balance = balance + %s WHERE id = %s RETURNING balance",
                (payout, user_id)
            )
            new_balance = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'payout': float(payout),
                    'new_balance': float(new_balance)
                })
            }
        
        if action == 'mines_bet':
            amount = body.get('amount', 0)
            
            if amount < 15:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Minimum bet is 15'})
                }
            
            cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
            balance = cur.fetchone()
            
            if not balance or balance[0] < amount:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Insufficient balance'})
                }
            
            cur.execute(
                "UPDATE users SET balance = balance - %s WHERE id = %s RETURNING balance",
                (amount, user_id)
            )
            new_balance = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'new_balance': float(new_balance)})
            }
        
        if action == 'mines_reveal':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'isMine': False,
                    'multiplier': 1.4
                })
            }
        
        if action == 'mines_cashout':
            amount = body.get('amount', 0)
            multiplier = body.get('multiplier', 1.0)
            
            payout = amount * multiplier
            
            cur.execute(
                "UPDATE users SET balance = balance + %s WHERE id = %s RETURNING balance",
                (payout, user_id)
            )
            new_balance = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'payout': float(payout),
                    'new_balance': float(new_balance)
                })
            }
        
        if action == 'cards':
            amount = body.get('amount', 0)
            choice = body.get('choice')
            
            if amount < 50:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Minimum bet is 50'})
                }
            
            cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
            balance = cur.fetchone()
            
            if not balance or balance[0] < amount:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Insufficient balance'})
                }
            
            dealer_card = random.randint(2, 14)
            won = random.random() < 0.5
            payout = amount * 2 if won else 0
            
            cur.execute(
                "UPDATE users SET balance = balance - %s + %s WHERE id = %s RETURNING balance",
                (amount, payout, user_id)
            )
            new_balance = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'won': won,
                    'dealerCard': dealer_card,
                    'payout': float(payout),
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
