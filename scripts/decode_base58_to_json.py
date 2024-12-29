from base58 import b58decode
import json

private_key_base58 = "53Fi3E4WnK5WoejzHupJWGt6He5SSaU4ByyrrSo9ycUieeMfHWiBiFmsd9sKTtDseECRn2Fty9P19iEPfQ55egZU"
private_key_bytes = b58decode(private_key_base58)

with open("my-wallet.json", "w") as f:
    json.dump(list(private_key_bytes), f)

print("Keypair saved to my-wallet.json")
