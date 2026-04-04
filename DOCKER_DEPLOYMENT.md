# Docker on AWS EC2 — Deployment Guide

## Architecture

```
Internet
   │
   ▼
EC2 Instance
   │
   ├── Docker Container: senyora-frontend (Nginx, port 80)
   │     └── serves React build + proxies nothing (API called directly)
   │
   └── Docker Container: senyora-backend (Node.js, port 5000)
         └── connects to MongoDB Atlas
```

---

## Files Added to Project

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Builds the Node.js backend image |
| `frontend/Dockerfile` | Builds the React app and serves it with Nginx |
| `frontend/nginx-spa.conf` | Nginx config inside the frontend container (SPA routing) |
| `docker-compose.yml` | Orchestrates both containers together |
| `backend/.dockerignore` | Excludes node_modules/.env from backend image |
| `frontend/.dockerignore` | Excludes node_modules/dist/.env from frontend image |

---

## Step 1 — Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Choose **Ubuntu Server 22.04 LTS**
3. Instance type: **t2.small** (recommended — Docker needs more RAM than t2.micro)
4. Create or select a **Key Pair** — download the `.pem` file
5. Security Group inbound rules:

| Port | Protocol | Source    | Purpose   |
|------|----------|-----------|-----------|
| 22   | TCP      | My IP     | SSH       |
| 80   | TCP      | 0.0.0.0/0 | Frontend  |
| 5000 | TCP      | 0.0.0.0/0 | Backend API |
| 443  | TCP      | 0.0.0.0/0 | HTTPS (optional) |

6. Launch and note your **Public IPv4 address**

---

## Step 2 — Connect via SSH

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

---

## Step 3 — Install Docker on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add ubuntu user to docker group (no sudo needed)
sudo usermod -aG docker ubuntu

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Reconnect so group change takes effect
exit
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Verify
docker --version
docker compose version
```

---

## Step 4 — Clone the Repository

```bash
sudo mkdir -p /var/www/senyora
sudo chown ubuntu:ubuntu /var/www/senyora
cd /var/www/senyora

git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

---

## Step 5 — Create Environment Files

### Backend `.env`

```bash
nano /var/www/senyora/backend/.env
```

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/company-mgmt
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://YOUR_EC2_IP
```

### Root `.env` (for docker-compose frontend build arg)

```bash
nano /var/www/senyora/.env
```

```env
VITE_API_BASE_URL=http://YOUR_EC2_IP:5000
```

> The frontend calls the backend directly on port 5000.
> Replace `YOUR_EC2_IP` with your actual EC2 public IP.

---

## Step 6 — Build and Start Containers

```bash
cd /var/www/senyora

# Build images and start all containers
docker compose up -d --build
```

This will:
1. Build the backend Node.js image
2. Build the frontend (runs `npm run build` inside Docker)
3. Start both containers

---

## Step 7 — Verify

```bash
# Check both containers are running
docker compose ps

# Check backend logs
docker compose logs backend

# Check frontend logs
docker compose logs frontend

# Test backend health
curl http://localhost:5000/api/health
```

Open `http://YOUR_EC2_IP` in your browser — the app should load.

---

## Step 8 — Updating the App (Future Deploys)

```bash
cd /var/www/senyora

# Pull latest code
git pull

# Rebuild and restart containers
docker compose up -d --build
```

Docker only rebuilds what changed.

---

## Docker Cheat Sheet

| Command | Description |
|---------|-------------|
| `docker compose up -d --build` | Build and start all containers |
| `docker compose down` | Stop and remove containers |
| `docker compose ps` | Show running containers |
| `docker compose logs -f backend` | Follow backend logs live |
| `docker compose logs -f frontend` | Follow frontend logs live |
| `docker compose restart backend` | Restart only the backend |
| `docker system prune -f` | Clean up unused images/containers |

---

## Optional — Auto-start on EC2 Reboot

Docker containers with `restart: always` in `docker-compose.yml` start automatically when Docker starts. Enable Docker to start on boot:

```bash
sudo systemctl enable docker
```

---

## Optional — Add HTTPS with Certbot

If you have a domain pointed to your EC2 IP:

```bash
# Stop frontend container (Certbot needs port 80)
docker compose stop frontend

# Install Certbot
sudo apt install -y certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Then update `frontend/nginx-spa.conf` to add SSL, mount the cert files into the container, and update your `.env` files to use `https://`.
