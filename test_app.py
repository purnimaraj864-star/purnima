#!/usr/bin/env python3
"""
Simple test script to verify the rainwater harvesting app is working
"""

import requests
import json
import time

def test_backend_server():
    """Test the backend server endpoints"""
    base_url = "http://localhost:5000"
    
    print("Testing backend server...")
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✓ Server is running")
        else:
            print(f"✗ Server returned status code: {response.status_code}")
            return False
    except requests.ConnectionError:
        print("✗ Could not connect to server. Make sure Flask app is running on port 5000")
        return False
    
    # Test 2: Test public calculation endpoint
    try:
        calculation_data = {
            "location": "New York",
            "country_code": "US",
            "roofArea": 150,
            "numPeople": 4,
            "availableSpace": 50,
            "roofType": "concrete",
            "soilType": "clay"
        }
        
        response = requests.post(
            f"{base_url}/api/calculate-public",
            json=calculation_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✓ Public calculation endpoint working")
                print(f"  - Collection potential: {result.get('calculation', {}).get('collection_potential')}")
                print(f"  - Feasibility score: {result.get('calculation', {}).get('feasibility_score')}")
            else:
                print(f"✗ Calculation failed: {result.get('error', 'Unknown error')}")
        else:
            print(f"✗ Calculation endpoint returned status code: {response.status_code}")
            print(f"  Response: {response.text}")
    except Exception as e:
        print(f"✗ Error testing calculation endpoint: {e}")
    
    # Test 3: Test CAPTCHA endpoint
    try:
        response = requests.get(f"{base_url}/api/captcha/test123")
        if response.status_code == 200:
            print("✓ CAPTCHA endpoint working")
        else:
            print(f"✗ CAPTCHA endpoint returned status code: {response.status_code}")
    except Exception as e:
        print(f"✗ Error testing CAPTCHA endpoint: {e}")
    
    # Test 4: Test location endpoint
    try:
        response = requests.post(
            f"{base_url}/api/location",
            json={"location": "London"},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✓ Location endpoint working")
                print(f"  - Coordinates: {result.get('coordinates')}")
            else:
                print(f"✗ Location lookup failed: {result.get('error', 'Unknown error')}")
        else:
            print(f"✗ Location endpoint returned status code: {response.status_code}")
    except Exception as e:
        print(f"✗ Error testing location endpoint: {e}")
    
    print("\nBackend server test completed!")
    return True

if __name__ == "__main__":
    test_backend_server()
