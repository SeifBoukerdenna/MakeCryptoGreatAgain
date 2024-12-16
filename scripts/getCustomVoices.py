import requests
import json

url = "https://api.play.ht/api/v2/cloned-voices"

headers = {
    "accept": "application/json",
    "AUTHORIZATION": "198f8a8d41b641848ba289bee9418a2d",
    "X-USER-ID": "PLBxqtHtEvhmn4gSNdzcUX35yZu1"
}

response = requests.get(url, headers=headers)

print(response.text)
with open('./output.json', 'w') as json_file:
    json.dump(response.json(), json_file, indent=4)