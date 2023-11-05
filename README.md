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

4. Install [redis](https://redis.io/docs/install/install-redis/). 

## Running Star Command
1. Run your redis server.
```
  redis-server
```
2.  (Optional) Issues with running server. <br>
If you are facing issues running the redis server, especially if you downloaded redis with the .msi installer, it could be due to your default port 6379 being in use. Follow these steps to fix:
```
1. cd to the bin directory of Redis, and run:
   a. redis-cli.exe
   b. shutdown
   c. exit
2. open another cmd window, cd to the bin directory of Redis, and run:
   a. redis-server.exe
```

3.  Run main server.
```
  uvicorn app.main:app --reload 
```

# Project Structure
Our project structure lends it's form from FastAPI's recommendations [here](https://fastapi.tiangolo.com/tutorial/bigger-applications/).

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
