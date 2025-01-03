import asyncio
import aiohttp
import time
import random
from typing import List, Dict
import json

class StressTest:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.test_wallets: List[Dict] = [
            {"address": f"test_wallet_{i}", "key": f"test_key_{i}"}
            for i in range(100)
        ]
        self.test_system_prompt = "You are a test assistant. Keep responses short."
        self.test_messages = [
            "What do you think about crypto?",
            "Tell me about blockchain",
            "What's your opinion on AI?",
            "How do you handle criticism?",
            "What's your greatest achievement?"
        ]

    async def simulate_gpt_stream(self, session: aiohttp.ClientSession, wallet: Dict) -> None:
        """Simulate a GPT streaming request"""
        try:
            message = random.choice(self.test_messages)
            conversation_history = json.dumps([
                {"sender": "user", "text": "Hello"},
                {"sender": "character", "text": "Hi there!"}
            ])

            url = f"{self.base_url}/api/stream-gpt"
            params = {
                "prompt": message,
                "systemPrompt": self.test_system_prompt,
                "conversationHistory": conversation_history
            }

            async with session.get(url, params=params) as response:
                if response.status != 200:
                    print(f"GPT stream failed: {response.status}")
                    return

                # Read the stream
                async for line in response.content:
                    if line:
                        decoded_line = line.decode('utf-8')
                        if decoded_line.startswith('data: '):
                            content = decoded_line[6:]
                            if content == '[DONE]':
                                break

        except Exception as e:
            print(f"Error in GPT stream simulation: {str(e)}")

    async def simulate_tts_request(self, session: aiohttp.ClientSession, wallet: Dict) -> None:
        """Simulate a text-to-speech request"""
        try:
            text = random.choice(self.test_messages)
            voice = "s3://voice-cloning-zero-shot/d8aa429b-f3a2-4447-81f4-476d2483d15a/original/manifest.json"

            async with session.post(
                f"{self.base_url}/api/tts",
                json={
                    "text": text,
                    "voice": voice,
                    "engine": "Play3.0-mini"
                },
                headers={
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status != 200:
                    print(f"TTS request failed: {response.status}")
                    return

                # Read the audio stream
                while True:
                    chunk = await response.content.read(1024)
                    if not chunk:
                        break

        except Exception as e:
            print(f"Error in TTS simulation: {str(e)}")

    async def run_load_test(
        self,
        num_users: int,
        duration: int,
        requests_per_second: int
    ) -> Dict:
        """
        Run a load test with specified parameters

        Args:
            num_users: Number of concurrent users
            duration: Test duration in seconds
            requests_per_second: Target requests per second per user
        """
        print(f"\nStarting load test with {num_users} users")
        print(f"Duration: {duration} seconds")
        print(f"Target RPS per user: {requests_per_second}")

        async with aiohttp.ClientSession() as session:
            start_time = time.time()
            total_requests = 0
            failed_requests = 0

            # Create tasks for each simulated user
            tasks = []
            for _ in range(num_users):
                wallet = random.choice(self.test_wallets)

                # Calculate delay between requests to achieve target RPS
                delay = 1 / requests_per_second

                while time.time() - start_time < duration:
                    # Randomly choose between GPT stream and TTS
                    if random.random() < 0.7:  # 70% GPT, 30% TTS
                        task = asyncio.create_task(
                            self.simulate_gpt_stream(session, wallet)
                        )
                    else:
                        task = asyncio.create_task(
                            self.simulate_tts_request(session, wallet)
                        )

                    tasks.append(task)
                    total_requests += 1

                    await asyncio.sleep(delay)

            # Wait for all tasks to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Count failed requests
            failed_requests = sum(
                1 for r in results if isinstance(r, Exception)
            )

            end_time = time.time()
            actual_duration = end_time - start_time

            # Calculate metrics
            actual_rps = total_requests / actual_duration if actual_duration > 0 else 0
            success_rate = ((total_requests - failed_requests) / total_requests * 100) if total_requests > 0 else 0

            metrics = {
                "total_requests": total_requests,
                "failed_requests": failed_requests,
                "actual_rps": round(actual_rps, 2),
                "success_rate": round(success_rate, 2),
                "duration": round(actual_duration, 2)
            }

            print("\nTest Results:")
            print(json.dumps(metrics, indent=2))

            return metrics

async def main():
    # Initialize stress test with your app's URL
    stress_test = StressTest("https://www.makecryptogreatagain.app")

    # Define test scenarios
    scenarios = [
        # Start with light load
        {"num_users": 10, "duration": 60, "requests_per_second": 1},

        # Medium load
        {"num_users": 50, "duration": 60, "requests_per_second": 1},

        # Heavy load
        {"num_users": 100, "duration": 60, "requests_per_second": 1},
    ]

    # Run scenarios
    for i, scenario in enumerate(scenarios, 1):
        print(f"\nRunning Scenario {i}")
        print("-" * 50)

        results = await stress_test.run_load_test(**scenario)

        # Cool down period between scenarios
        if i < len(scenarios):
            print("\nCooling down for 30 seconds...")
            await asyncio.sleep(30)

if __name__ == "__main__":
    asyncio.run(main())