To run the Simulation script, follow these steps:

1. Change directory to the `scripts` folder:
  ```sh
  cd scripts
  ```

2. Create a virtual environment:
  ```sh
  python -m venv venv
  ```

3. Activate the virtual environment:
  ```sh
  source venv/bin/activate
  ```

4. Install the required dependencies:
  ```sh
  pip install -r requirements.txt
  ```

5. Run the simulation script:
  ```sh
  python simulation.py
  ```

## Testing the Voice App

To test the voice app, you need to run the following command instead of `npm run dev`:

```sh
vercel dev
```

This will start the development server with Vercel's configuration.

## Wallet Connection (ON CHROME)

To connect your wallet, follow these steps:

1. **Create a Phantom Wallet**
  Download and install the Phantom Wallet extension for Chrome from [phantom.com](https://phantom.com/).

2. **Go to Settings**
  Open the Phantom extension and click on the gear icon to access settings.

3. **Developer Settings**
  Scroll down and select **Developer Settings**.

4. **Enable Testnet Mode**
  Toggle on the **Testnet Mode** option.

5. **Select Solana Devnet**
  Under network settings, choose **Solana Devnet**.

6. **Share Your Wallet Address**
  Copy your wallet address and share it to receive the necessary funds.

