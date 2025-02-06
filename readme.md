# SISO (Structured input, structured output)

Structured input, structured output

UI interface web app aiming to provide a fast and intuitive way to provide LLM different blocks and types of inputs, define the output blocks and types of outputs. Mainly for project scaffolding, potentially some other use cases.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python (v3.7 or later)
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/structured.git
   cd structured
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

### Running the App

Start the backend and frontend:
```
npm start
```

This will start both the Python backend and React frontend concurrently.

### Building for Production

Build the React app:
```
npm run build
```

This will create an optimized build of the React app in the `build` folder.

### Running the Production Build


This will create a production-ready build in the `build` folder.

## Environment Setup

1. Set up your Python environment (venv, conda, etc.)
2. Activate your Python environment
3. Run the following command to set your Python path:
   ```
   npm run set-python-path
   ```
   This will create or update a `.env.local` file with your Python path.

4. Create a `.env` file in the root directory and add:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   Replace the placeholder with your actual OpenAI API key.

The app will use the Python path from `.env.local` if available, otherwise it will use 'python' and rely on your system PATH.

## Python Environment Management

For better dependency management and project isolation, it's recommended to use a virtual environment for Python. Here are some options:

### Using venv (built-in)

1. Create a virtual environment:
   ```
   python -m venv myenv
   ```

2. Activate the environment:
   - On Windows: `myenv\Scripts\activate`
   - On macOS and Linux: `source myenv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

### Using Conda

1. Create a new environment:
   ```
   conda create --name myenv python=3.9
   ```

2. Activate the environment:
   ```
   conda activate myenv
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

Remember to activate your chosen environment before running the Python backend or installing dependencies.
