# Star Command
Star Command is the backend server that helps integrate our data as calls for our visualizer.

# Getting Started

## Installations
1. As usual, create a virtual environment to isolate the dependencies (don't worry, the `.venv` file has been .gitignored).
```
  python -m venv .venv
```

2. Activate the virtual environment.
```
  . .venv/bin/activate
```

3. Install the requirements.
```
  pip install -r requirements.txt
```

## Running Star Command
1.  To serve the server.
```
  uvicorn app.main:app --reload 
```

# Project Structure
This structure takes it's form from FastAPI's recommendations [here](https://fastapi.tiangolo.com/tutorial/bigger-applications/).

```
.
├── app
│   ├── __init__.py
│   ├── main.py
│   ├── dependencies.py
│   └── routers
│   │   ├── __init__.py
│   │   ├── items.py
│   │   └── users.py
│   └── internal
│       ├── __init__.py
│       └── admin.py

```