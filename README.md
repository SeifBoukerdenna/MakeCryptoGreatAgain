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

