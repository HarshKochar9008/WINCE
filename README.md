# Ahoum

A full-stack session booking platform built with Django REST Framework and React. Users can create and book sessions, with Google OAuth authentication.

## 🏗️ Architecture

- **Backend**: Django REST Framework with JWT authentication
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL (production) / SQLite (development)
- **Reverse Proxy**: Nginx
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ and npm (for local frontend development)

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ahoum
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your configuration values (see [Environment Variables](#environment-variables))

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Run migrations** (first time setup)
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

5. **Create a superuser** (optional)
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

6. **Access the application**
   - Frontend: http://localhost
   - Django Admin: http://localhost/api/admin/

### Local Development

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `backend/.env` file:
   ```env
   DJANGO_SECRET_KEY=your-secret-key-here
   DJANGO_DEBUG=1
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
   GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   CSRF_TRUSTED_ORIGINS=http://localhost,http://127.0.0.1
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

### Backend (.env or docker-compose.yml)

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key for cryptographic signing | `change-me` |
| `DJANGO_DEBUG` | Enable/disable debug mode | `1` (dev) / `0` (prod) |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hosts | `*` |
| `POSTGRES_HOST` | PostgreSQL host | `postgres` (Docker) / `localhost` (local) |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `ahoum` |
| `POSTGRES_USER` | Database user | `ahoum` |
| `POSTGRES_PASSWORD` | Database password | `ahoum` |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID | - |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated CSRF trusted origins | `http://localhost` |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `""` (relative) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | - |

## 📁 Project Structure

```
Ahoum/
├── backend/                 # Django backend
│   ├── bookings/           # Booking app
│   ├── config/             # Django settings
│   ├── sessions/           # Session app
│   ├── users/              # User app
│   ├── manage.py
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── state/         # State management
│   │   └── types.ts       # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── nginx/                  # Nginx configuration
├── docker-compose.yml      # Docker Compose configuration
└── README.md
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication with Google OAuth integration:

1. User signs in with Google on the frontend
2. Frontend receives Google ID token
3. Frontend sends ID token to backend `/api/auth/google/`
4. Backend verifies token and returns JWT access/refresh tokens
5. Frontend stores tokens and includes them in API requests

## 📚 API Endpoints

### Authentication
- `POST /api/auth/google/` - Authenticate with Google OAuth

### Sessions
- `GET /api/sessions/` - List all sessions
- `GET /api/sessions/:id/` - Get session details
- `POST /api/sessions/` - Create a new session (creator only)
- `PUT /api/sessions/:id/` - Update session (creator only)
- `DELETE /api/sessions/:id/` - Delete session (creator only)

### Bookings
- `GET /api/bookings/` - List user's bookings
- `POST /api/bookings/` - Create a booking
- `PUT /api/bookings/:id/` - Update booking status
- `DELETE /api/bookings/:id/` - Cancel booking

### Users
- `GET /api/users/me/` - Get current user profile

## 🧪 Development

### Running Tests

```bash
# Backend tests
docker-compose exec backend python manage.py test

# Or locally
cd backend
python manage.py test
```

### Database Migrations

```bash
# Create migrations
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate
```

### Frontend Linting

```bash
cd frontend
npm run lint
```

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Execute commands in containers
docker-compose exec backend python manage.py [command]
docker-compose exec frontend npm [command]

# Rebuild specific service
docker-compose build [service_name]

# Remove volumes (clean database)
docker-compose down -v
```

## 🚢 Production Deployment

1. **Set production environment variables**
   - Set `DJANGO_DEBUG=0`
   - Use strong `DJANGO_SECRET_KEY`
   - Configure proper `DJANGO_ALLOWED_HOSTS`
   - Set up PostgreSQL credentials
   - Configure `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`

2. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

3. **Collect static files**
   ```bash
   docker-compose exec backend python manage.py collectstatic --noinput
   ```

4. **Run migrations**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

[Add your license here]

## 👥 Authors

[Add author information here]

## 🐛 Troubleshooting

### Backend won't start
- Check database connection settings
- Ensure migrations are applied
- Verify environment variables are set correctly

### Frontend can't connect to backend
- Check `VITE_API_BASE_URL` is set correctly
- Verify CORS settings in backend
- Ensure backend is running

### Docker issues
- Ensure Docker and Docker Compose are installed and running
- Check port 80 is not already in use
- Try rebuilding containers: `docker-compose build --no-cache`
