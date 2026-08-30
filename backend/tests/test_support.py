import unittest
import sys
import os
import json

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, SupportTicket
from app.utils.auth import generate_token

class SupportTicketTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        # Create two test users and their tokens
        self.user_a = User(name="User A", email="usera@example.com", password_hash="hash", role="USER")
        self.user_b = User(name="User B", email="userb@example.com", password_hash="hash", role="USER")
        self.admin = User(name="Admin User", email="admin@example.com", password_hash="hash", role="ADMIN")
        db.session.add(self.user_a)
        db.session.add(self.user_b)
        db.session.add(self.admin)
        db.session.commit()

        self.token_a = generate_token(self.user_a.id)
        self.token_b = generate_token(self.user_b.id)
        self.token_admin = generate_token(self.admin.id)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_unauthenticated_request_rejected(self):
        """Test unauthenticated ticket creation and retrieval are rejected."""
        r_create = self.client.post('/api/v1/support/tickets', json={"subject": "Help", "message": "Text"})
        self.assertEqual(r_create.status_code, 401)

        r_get = self.client.get('/api/v1/support/tickets')
        self.assertEqual(r_get.status_code, 401)

    def test_create_ticket_validation(self):
        """Test validation rules when creating support tickets."""
        headers = {'Authorization': f'Bearer {self.token_a}'}

        # Subject and message missing
        r = self.client.post('/api/v1/support/tickets', json={}, headers=headers)
        self.assertEqual(r.status_code, 400)

        # Empty subject
        r = self.client.post('/api/v1/support/tickets', json={"subject": " ", "message": "Text"}, headers=headers)
        self.assertEqual(r.status_code, 400)

        # Empty message
        r = self.client.post('/api/v1/support/tickets', json={"subject": "Help", "message": "   "}, headers=headers)
        self.assertEqual(r.status_code, 400)

        # Excessively long subject (>255 chars)
        r = self.client.post('/api/v1/support/tickets', json={"subject": "A" * 256, "message": "Text"}, headers=headers)
        self.assertEqual(r.status_code, 400)

    def test_create_ticket_success_and_retrieval(self):
        """Test successful ticket creation and correct user isolation query logic."""
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        headers_b = {'Authorization': f'Bearer {self.token_b}'}

        # 1. User A creates a ticket
        r_create = self.client.post('/api/v1/support/tickets', json={
            "subject": "Payment Failure",
            "message": "My card was charged but scan didn't complete."
        }, headers=headers_a)
        self.assertEqual(r_create.status_code, 201)
        
        ticket_id = r_create.get_json()['data']['id']
        self.assertEqual(r_create.get_json()['data']['subject'], "Payment Failure")
        self.assertEqual(r_create.get_json()['data']['status'], "OPEN")

        # 2. User A retrieves their own tickets
        r_get_a = self.client.get('/api/v1/support/tickets', headers=headers_a)
        self.assertEqual(r_get_a.status_code, 200)
        self.assertEqual(len(r_get_a.get_json()['data']), 1)
        self.assertEqual(r_get_a.get_json()['data'][0]['id'], ticket_id)

        # 3. User B retrieves their own tickets (should be 0, showing isolation)
        r_get_b = self.client.get('/api/v1/support/tickets', headers=headers_b)
        self.assertEqual(r_get_b.status_code, 200)
        self.assertEqual(len(r_get_b.get_json()['data']), 0)

    def test_admin_get_and_update_tickets(self):
        """Test admin list, pagination, and status updates behavior."""
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        headers_admin = {'Authorization': f'Bearer {self.token_admin}'}

        # 1. Submit tickets from User A
        self.client.post('/api/v1/support/tickets', json={"subject": "T1", "message": "M1"}, headers=headers_a)
        r_c2 = self.client.post('/api/v1/support/tickets', json={"subject": "T2", "message": "M2"}, headers=headers_a)
        t2_id = r_c2.get_json()['data']['id']

        # 2. User gets 403 Forbidden on Admin endpoint
        r_user_admin = self.client.get('/api/v1/admin/support/tickets', headers=headers_a)
        self.assertEqual(r_user_admin.status_code, 403)

        # 3. Admin gets all tickets
        r_admin = self.client.get('/api/v1/admin/support/tickets', headers=headers_admin)
        self.assertEqual(r_admin.status_code, 200)
        data = r_admin.get_json()['data']
        self.assertEqual(data['pagination']['total'], 2)
        self.assertEqual(data['items'][0]['user_name'], "User A")
        self.assertEqual(data['items'][0]['user_email'], "usera@example.com")

        # 4. Admin updates ticket 2 status to IN_PROGRESS
        r_put = self.client.put(f'/api/v1/admin/support/tickets/{t2_id}', json={"status": "IN_PROGRESS"}, headers=headers_admin)
        self.assertEqual(r_put.status_code, 200)
        self.assertEqual(r_put.get_json()['data']['status'], "IN_PROGRESS")

        # 5. Invalid status updates are rejected
        r_put_invalid = self.client.put(f'/api/v1/admin/support/tickets/{t2_id}', json={"status": "COMPLETED"}, headers=headers_admin)
        self.assertEqual(r_put_invalid.status_code, 400)

        # 6. User gets 403 on update endpoint
        r_user_put = self.client.put(f'/api/v1/admin/support/tickets/{t2_id}', json={"status": "RESOLVED"}, headers=headers_a)
        self.assertEqual(r_user_put.status_code, 403)

        # 7. Updating non-existent ticket yields 404
        r_put_404 = self.client.put('/api/v1/admin/support/tickets/fake-uuid', json={"status": "RESOLVED"}, headers=headers_admin)
        self.assertEqual(r_put_404.status_code, 404)

if __name__ == '__main__':
    unittest.main()
