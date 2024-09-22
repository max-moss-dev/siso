# SISO

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

1. Start the backend and frontend without Electron:
   ```
   npm start
   ```

2. To run with Electron in development mode:
   ```
   npm run dev
   ```

### Building for Production

1. Build the React app and Electron app:
   ```
   npm run build
   ```

   This will create a distributable version of your app in the `dist` folder.

### Scripts

- `npm run start-react`: Start the React frontend
- `npm run start-python`: Start the Python backend
- `npm start`: Start both backend and frontend without Electron
- `npm run electron`: Run the Electron app
- `npm run dev`: Run backend, frontend, and Electron in development mode
- `npm run build-react`: Build the React app
- `npm run build-electron`: Build the Electron app
- `npm run build`: Build both React and Electron apps

### Attaching to System

#### macOS
1. After building, locate the `.app` file in the `dist` folder.
2. Drag the `.app` file to your Applications folder.

#### Windows
1. After building, locate the `.exe` file in the `dist` folder.
2. Right-click the `.exe` file and select "Create shortcut".
3. Move the shortcut to your desktop or Start menu.

#### Linux
1. After building, locate the AppImage or .deb file in the `dist` folder.
2. For AppImage:
   - Make it executable: `chmod +x yourapp.AppImage`
   - Move it to a convenient location, e.g., `~/Applications`
   - Create a desktop entry file to make it show up in your application menu
3. For .deb file:
   - Install it using: `sudo dpkg -i yourapp.deb`

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

For more information on venv, see the [official documentation](https://docs.python.org/3/library/venv.html).

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

For more information on Conda, visit the [Conda documentation](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html).

### Additional Resources

- [Python Virtual Environments: A Primer](https://realpython.com/python-virtual-environments-a-primer/)
- [The Hitchhiker's Guide to Python: Virtual Environments](https://docs.python-guide.org/dev/virtualenvs/)

Remember to activate your chosen environment before running the Python backend or installing dependencies.

### Python Dependencies

Install Python dependencies: