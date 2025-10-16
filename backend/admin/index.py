'''
Business: Admin panel operations - manage users, view statistics, manage promo codes
Args: event with httpMethod, body with admin actions
Returns: HTTP response with admin data
'''

import json
import os
import psycopg2
from typing import Dict, Any

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
        
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
        admin_check = cur.fetchone()
        
        if not admin_check or not admin_check[0]:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied'})
            }
        
        if action == 'get_stats':
            cur.execute("SELECT COUNT(*) FROM users")
            total_users = cur.fetchone()[0]
            
            cur.execute("SELECT SUM(balance) FROM users")
            total_balance = cur.fetchone()[0] or 0
            
            cur.execute("SELECT COUNT(*) FROM case_openings")
            total_cases = cur.fetchone()[0]
            
            cur.execute("SELECT SUM(prize_amount) FROM case_openings")
            total_winnings = cur.fetchone()[0] or 0
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'total_users': total_users,
                    'total_balance': float(total_balance),
                    'total_cases_opened': total_cases,
                    'total_winnings': float(total_winnings)
                })
            }
        
        if action == 'get_users':
            cur.execute(
                "SELECT id, email, name, balance, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 100"
            )
            users = cur.fetchall()
            
            result = [{
                'id': u[0],
                'email': u[1],
                'name': u[2],
                'balance': float(u[3]),
                'is_admin': u[4],
                'created_at': u[5].isoformat()
            } for u in users]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result)
            }
        
        if action == 'update_balance':
            target_user_id = body.get('target_user_id')
            new_balance = body.get('new_balance')
            
            if not target_user_id or new_balance is None:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing parameters'})
                }
            
            cur.execute("UPDATE users SET balance = %s WHERE id = %s RETURNING balance", (new_balance, target_user_id))
            updated_balance = cur.fetchone()
            
            if not updated_balance:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'new_balance': float(updated_balance[0])})
            }
        
        if action == 'make_admin':
            target_user_id = body.get('target_user_id')
            
            if not target_user_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing target_user_id'})
                }
            
            cur.execute("UPDATE users SET is_admin = TRUE WHERE id = %s RETURNING is_admin", (target_user_id,))
            result = cur.fetchone()
            
            if not result:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        cur.close()
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
