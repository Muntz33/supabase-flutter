#!/usr/bin/env python3
"""
Dr Ethergreen YKY Hub - Backend API Testing
Comprehensive test suite for all backend endpoints
"""
import requests
import sys
import json
from datetime import datetime
import time

class YKYHubAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_health_check(self):
        """Test health check endpoint"""
        result = self.run_test("Health Check", "GET", "/api/health", 200)
        return result is not None

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "birth_date": "1990-01-01"
        }
        
        result = self.run_test("User Registration", "POST", "/api/auth/register", 200, user_data)
        if result and 'token' in result:
            self.token = result['token']
            self.user_id = result['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.token:
            return False
            
        # Create a new user for login test
        timestamp = int(time.time()) + 1
        user_data = {
            "email": f"login_test_{timestamp}@example.com",
            "password": "LoginTest123!",
            "name": f"Login Test {timestamp}",
            "birth_date": "1985-05-15"
        }
        
        # Register first
        reg_result = self.run_test("Login Test - Registration", "POST", "/api/auth/register", 200, user_data)
        if not reg_result:
            return False
            
        # Now test login
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        result = self.run_test("User Login", "POST", "/api/auth/login", 200, login_data)
        return result is not None and 'token' in result

    def test_get_user_profile(self):
        """Test getting current user profile"""
        if not self.token:
            return False
            
        result = self.run_test("Get User Profile", "GET", "/api/auth/me", 200)
        return result is not None

    def test_get_soulprint(self):
        """Test getting user soulprint"""
        if not self.token:
            return False
            
        result = self.run_test("Get Soulprint", "GET", "/api/profile/soulprint", 200)
        return result is not None

    def test_oracle_chat(self):
        """Test Oracle chat functionality"""
        if not self.token:
            return False
            
        message_data = {
            "message": "What guidance do you have for me today?",
            "context": {"test": True}
        }
        
        result = self.run_test("Oracle Chat", "POST", "/api/oracle/chat", 200, message_data)
        return result is not None and 'response' in result

    def test_oracle_speak(self):
        """Test Oracle TTS functionality"""
        if not self.token:
            return False
            
        message_data = {
            "message": "Hello Oracle, speak to me."
        }
        
        result = self.run_test("Oracle TTS", "POST", "/api/oracle/speak", 200, message_data)
        return result is not None and 'audio_base64' in result

    def test_tarot_draw(self):
        """Test tarot card drawing"""
        if not self.token:
            return False
            
        tarot_data = {
            "spread_type": "single",
            "question": "What should I focus on today?"
        }
        
        result = self.run_test("Tarot Draw", "POST", "/api/tarot/draw", 200, tarot_data)
        return result is not None and 'cards' in result

    def test_tarot_history(self):
        """Test getting tarot reading history"""
        if not self.token:
            return False
            
        result = self.run_test("Tarot History", "GET", "/api/tarot/history", 200)
        return result is not None

    def test_community_post(self):
        """Test creating a community post"""
        if not self.token:
            return False
            
        post_data = {
            "content": "This is a test post for the community.",
            "category": "general"
        }
        
        result = self.run_test("Create Community Post", "POST", "/api/community/post", 200, post_data)
        return result is not None

    def test_community_feed(self):
        """Test getting community feed"""
        result = self.run_test("Get Community Feed", "GET", "/api/community/feed", 200)
        return result is not None and 'posts' in result

    def test_database_search(self):
        """Test database search functionality"""
        result = self.run_test("Database Search - Ashwagandha", "GET", "/api/database/search?query=ashwagandha", 200)
        if result and 'results' in result:
            # Test another search
            result2 = self.run_test("Database Search - BPC-157", "GET", "/api/database/search?query=BPC-157", 200)
            return result2 is not None
        return False

    def test_premium_checkout(self):
        """Test premium checkout creation (without actual payment)"""
        if not self.token:
            return False
            
        checkout_data = {
            "package_id": "premium_monthly",
            "origin_url": "https://demobackend.emergentagent.com"
        }
        
        result = self.run_test("Premium Checkout", "POST", "/api/payments/checkout", 200, checkout_data)
        return result is not None and 'url' in result

    def run_all_tests(self):
        """Run all backend tests"""
        print("🐉 Starting Dr Ethergreen YKY Hub Backend Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Core functionality tests
        self.test_health_check()
        
        # Authentication tests
        if self.test_user_registration():
            self.test_user_login()
            self.test_get_user_profile()
            self.test_get_soulprint()
            
            # Feature tests (require authentication)
            self.test_oracle_chat()
            self.test_oracle_speak()
            self.test_tarot_draw()
            self.test_tarot_history()
            self.test_community_post()
            self.test_premium_checkout()
        
        # Public endpoint tests
        self.test_community_feed()
        self.test_database_search()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = YKYHubAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())