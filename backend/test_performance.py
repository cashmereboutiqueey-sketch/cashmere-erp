import time
import requests
import statistics

API_URL = "http://127.0.0.1:8000/api/brand/products/"

def measure_response_time(n=5):
    times = []
    print(f"Measuring {API_URL} over {n} requests...")
    
    for i in range(n):
        start = time.time()
        try:
            response = requests.get(API_URL)
            response.raise_for_status()
            duration = time.time() - start
            times.append(duration)
            print(f"Request {i+1}: {duration:.4f}s - {len(response.json())} items")
        except Exception as e:
            print(f"Request {i+1} failed: {e}")
            
    if times:
        avg = statistics.mean(times)
        print(f"\nAverage Time: {avg:.4f}s")
        print(f"Min Time: {min(times):.4f}s")
        print(f"Max Time: {max(times):.4f}s")
    else:
        print("No successful requests.")

if __name__ == "__main__":
    measure_response_time()
