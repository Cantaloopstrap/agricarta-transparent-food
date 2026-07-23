module.exports = {
  apps: [
    {
      name: 'agrikarta-backend',
      script: './backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'agrikarta-ml-engine',
      script: 'uvicorn',
      args: 'main:app --host 127.0.0.1 --port 8000',
      cwd: './ml-engine',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PYTHONUNBUFFERED: '1'
      }
    }
  ]
};
