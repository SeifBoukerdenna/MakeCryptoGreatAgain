import numpy as np
import matplotlib.pyplot as plt

# Simulation parameters
DAYS = 1
SECONDS = DAYS * 24 * 3600  # 7 days in seconds = 604,800 seconds
TRADES_PER_SECOND = 20  # A stable but still active trade frequency
PRINT_INTERVAL = 3600  # Print every hour

TOTAL_SUPPLY = 1_000_000_000
USER_TOKENS = 15_000_000.0

# Initial Liquidity
usd_reserve = 15_000.0
token_reserve = 985_000_000.0

# Entities
NUM_ENTITIES = 1100
entities = []
for _ in range(NUM_ENTITIES):
    start_usd = np.random.lognormal(mean=4, sigma=1.5)
    start_usd = min(start_usd, 20_000)
    entities.append([start_usd, 0.0])  # [usd, tokens]

def tokens_per_usd(usd, tokens):
    return tokens / usd if usd > 0 else 1e9

def trade_amm(usd_r, token_r, amount, buy=True):
    k = usd_r * token_r
    if buy:
        # Buy: Add USD, remove tokens
        new_usd = usd_r + amount
        new_token = k / new_usd
        tokens_bought = token_r - new_token
        return new_usd, new_token, tokens_bought
    else:
        # Sell: Remove USD, add tokens
        if amount > 0.9 * usd_r:
            amount = 0.9 * usd_r
        new_usd = usd_r - amount
        new_token = k / new_usd
        tokens_sold = new_token - token_r
        return new_usd, new_token, tokens_sold

def get_trade_size():
    # Controlled trade sizes
    size = np.random.lognormal(mean=2, sigma=1)
    size = min(max(size, 1), 1000)  # Cap at 1000
    return size

# Rug pull probability
RUG_PULL_PROB = 0.002
# Liquidity floor
MIN_USD = 500
MIN_TOKEN = 500_000

def add_liquidity_if_needed():
    global usd_reserve, token_reserve
    if usd_reserve < MIN_USD:
        add_usd = MIN_USD - usd_reserve + 1000
        add_tokens = (add_usd * token_reserve / usd_reserve) if usd_reserve > 0 else MIN_TOKEN
        usd_reserve += add_usd
        token_reserve += add_tokens
    if token_reserve < MIN_TOKEN:
        add_tokens = MIN_TOKEN - token_reserve + 50_000
        add_usd = (add_tokens * usd_reserve / token_reserve) if token_reserve > 0 else 5000
        usd_reserve += add_usd
        token_reserve += add_tokens

def pick_entity(prob_buy, usd_reserve, token_reserve):
    for _ in range(10):
        idx = np.random.randint(0, NUM_ENTITIES)
        usd_bal, token_bal = entities[idx]
        trade_amount = get_trade_size()
        if np.random.rand() < prob_buy:
            # BUY
            if usd_bal >= trade_amount:
                return idx, trade_amount, True
        else:
            # SELL
            current_ratio = tokens_per_usd(usd_reserve, token_reserve)
            tokens_needed = trade_amount * current_ratio
            if token_bal >= tokens_needed:
                return idx, trade_amount, False

    # Force a small trade if no suitable entity found
    idx = np.random.randint(0, NUM_ENTITIES)
    usd_bal, token_bal = entities[idx]
    trade_amount = min(get_trade_size(), usd_bal if usd_bal > 1 else 1)
    if usd_bal > trade_amount:
        return idx, trade_amount, True
    else:
        current_ratio = tokens_per_usd(usd_reserve, token_reserve)
        tokens_needed = trade_amount * current_ratio
        if token_bal > tokens_needed:
            return idx, trade_amount, False
        trade_amount = min(usd_bal, 1)
        return idx, trade_amount, True

# Initialize price metrics
current_ratio = tokens_per_usd(usd_reserve, token_reserve)
user_bag_value = USER_TOKENS * (1/current_ratio)
ratios = [current_ratio]
bag_values = [user_bag_value]
market_caps = [TOTAL_SUPPLY * (1/current_ratio)]

buy_count = 0
sell_count = 0
buy_volume = 0.0
sell_volume = 0.0

FOMO_WINDOW = 100
recent_ratios = [current_ratio]*FOMO_WINDOW

print("Starting 7-day simulation with hourly reporting...")

for t in range(1, SECONDS + 1):
    # Update recent price history
    recent_ratios.pop(0)
    recent_ratios.append(current_ratio)

    avg_recent = np.mean(recent_ratios)
    # Slight FOMO
    if current_ratio < avg_recent:
        # token more expensive => slightly higher buy prob
        prob_buy = 0.55
    else:
        # token cheaper => slightly lower buy prob
        prob_buy = 0.45

    # Rug pull?
    if np.random.rand() < RUG_PULL_PROB:
        usd_reserve *= 0.5
        token_reserve *= 0.5
        add_liquidity_if_needed()

    # Multiple trades per second
    for _ in range(TRADES_PER_SECOND):
        idx, trade_amount, is_buy = pick_entity(prob_buy, usd_reserve, token_reserve)
        usd_bal, token_bal = entities[idx]
        current_ratio_tmp = tokens_per_usd(usd_reserve, token_reserve)

        if is_buy:
            # BUY
            if usd_bal >= trade_amount:
                usd_reserve, token_reserve, tokens_bought = trade_amm(usd_reserve, token_reserve, trade_amount, buy=True)
                buy_count += 1
                buy_volume += trade_amount
                entities[idx][0] = usd_bal - trade_amount
                entities[idx][1] = token_bal + tokens_bought
        else:
            # SELL
            tokens_needed = trade_amount * current_ratio_tmp
            if token_bal >= tokens_needed:
                usd_reserve, token_reserve, tokens_sold = trade_amm(usd_reserve, token_reserve, trade_amount, buy=False)
                sell_count += 1
                sell_volume += trade_amount
                entities[idx][0] = usd_bal + trade_amount
                entities[idx][1] = token_bal - tokens_needed

    # Update price after trades
    current_ratio = tokens_per_usd(usd_reserve, token_reserve)

    # Print every hour
    if t % PRINT_INTERVAL == 0:
        user_bag_value = USER_TOKENS * (1/current_ratio)
        mc = TOTAL_SUPPLY * (1/current_ratio)
        hours_passed = t // 3600
        print(f"Day {hours_passed//24} Hour {hours_passed%24}: ({t} sec)")
        print(f"Tokens/USD: {current_ratio:.10f}")
        print(f"Your bag value: ${user_bag_value:,.2f}")
        print(f"Market Cap: ${mc:,.2f}")
        print(f"Buys: {buy_count}, Sells: {sell_count}, Buy Vol: ${buy_volume:,.2f}, Sell Vol: ${sell_volume:,.2f}")
        print("-" * 40)

    ratios.append(current_ratio)
    bag_values.append(USER_TOKENS * (1/current_ratio))
    market_caps.append(TOTAL_SUPPLY * (1/current_ratio))

# Final stats after 7 days
final_ratio = ratios[-1]
final_bag_value = USER_TOKENS * (1/final_ratio)
total_trades = buy_count + sell_count
total_volume = buy_volume + sell_volume
buy_ratio = buy_count / total_trades if total_trades > 0 else 0

print("\nSimulation completed (7 days).")
print(f"Final Tokens/USD: {final_ratio:.10f}")
print(f"Your final bag value: ${final_bag_value:,.2f}")
print(f"Final Market Cap: ${market_caps[-1]:,.2f}")
print(f"Total trades: {total_trades}")
print(f"Buys: {buy_count}, Sells: {sell_count}")
print(f"Total volume: ${total_volume:,.2f} (Buy Vol: ${buy_volume:,.2f}, Sell Vol: ${sell_volume:,.2f})")
print(f"Buy ratio: {buy_ratio:.2f}")

# Visualization
time_minutes = np.arange(0, SECONDS + 1) / 60.0

plt.figure(figsize=(14,10))

# Tokens per USD over time
plt.subplot(3,1,1)
plt.plot(time_minutes, ratios, color='blue')
plt.title("Tokens per USD Over 7 Days (Hourly Reporting)")
plt.xlabel("Time (minutes)")
plt.ylabel("Tokens/USD")
plt.grid(True)

# User bag value over time
plt.subplot(3,1,2)
plt.plot(time_minutes, bag_values, color='green')
plt.title("Your Bag Value Over Time (USD)")
plt.xlabel("Time (minutes)")
plt.ylabel("Value (USD)")
plt.grid(True)

# Market Cap over time
plt.subplot(3,1,3)
plt.plot(time_minutes, market_caps, color='purple')
plt.title("Market Cap Over Time")
plt.xlabel("Time (minutes)")
plt.ylabel("Market Cap (USD)")
plt.grid(True)

plt.tight_layout()
plt.show()
