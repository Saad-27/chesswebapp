# ChessGame
 
# How to Run the Chess Application Using Docker

1. Make sure you have Docker and Docker Compose installed on your machine.

2. Open a terminal in your project root directory (where the Dockerfile and docker-compose.yml are located).

3. Build and start the containers:
```bash
docker-compose up --build
```

4. Access the application:
- Backend will be available at: http://localhost:3001
- Frontend will be available at: http://localhost:3000

To stop the application:
```bash
# Press Ctrl+C in the terminal where docker-compose is running
# OR
docker-compose down
```

## Common Docker Commands

1. To rebuild the containers:
```bash
docker-compose build
```

2. To start containers in detached mode:
```bash
docker-compose up -d
```

3. To view logs:
```bash
docker-compose logs -f
```

4. To stop and remove containers:
```bash
docker-compose down
```

5. To view running containers:
```bash
docker ps
```

## Troubleshooting

If you encounter any issues:

1. Make sure all ports (3000 and 3001) are available and not used by other applications
2. Check if all environment variables are properly set in the .env file
3. Try rebuilding the containers with:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

4. To check container logs for errors:
```bash
docker-compose logs -f chess-app
```

## Project Structure Should Look Like:
```
ChessGameFinal/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/
│   ├── index.js
│   ├── package.json
│   └── ...
├── .env
├── .dockerignore
├── docker-compose.yml
└── Dockerfile
```