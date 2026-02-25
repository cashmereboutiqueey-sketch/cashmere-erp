import urllib.request
import json

try:
    print("Fetching jobs...")
    with urllib.request.urlopen('http://localhost:8000/api/factory/jobs/') as response:
        data = response.read()
        jobs = json.loads(data)
        
    pending_jobs = [j for j in jobs if j['status'] == 'PENDING']
    
    if not pending_jobs:
        print("No PENDING jobs found to test.")
        for j in jobs:
            print(f"Job {j['id']}: {j['status']}")
    else:
        job = pending_jobs[0]
        print(f"Attempting to START Job ID {job['id']} ({job['product_name']})...")
        
        url = f'http://localhost:8000/api/factory/jobs/{job["id"]}/start/'
        req = urllib.request.Request(url, method='POST')
        req.add_header('Content-Type', 'application/json')
        
        try:
            with urllib.request.urlopen(req) as response:
                print(f"Status: {response.status}")
                print(f"Response: {response.read().decode('utf-8')}")
        except urllib.error.HTTPError as e:
            print(f"HTTPError: {e.code}")
            print(f"Reason: {e.read().decode('utf-8')}")

except Exception as e:
    print(f"Exception: {e}")
