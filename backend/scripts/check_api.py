import requests
import sys

try:
    response = requests.get('http://127.0.0.1:8000/api/brand/products/')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success! Data received.")
        # print(response.json()[:2])
    else:
        print("Error response:")
        print(response.text[:200])
except Exception as e:
    print(f"Failed to connect: {e}")
