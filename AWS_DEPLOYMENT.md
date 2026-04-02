# AWS EC2 Deployment Guide — Senyora Management System

## Architecture

```
Internet
   │
   ▼
EC2 Instance (Ubuntu 22.04)
   │
   ├── Nginx (port 80/443)
   │     ├── / → serves frontend/dist (React build)
   │     └── /api/ → proxies to localhost:5000
   │
   └── Node.js / Express (port 5000, managed by PM2)
         └── connects to MongoDB Atlas
```

---

## Step 1 — Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Choose **Ubuntu Server 22.04 LTS**
3. Instance type: **t2.micro** (free tier) or **t2.small**
4. Create or select a **Key Pair** — download the `.pem` file (you need it to SSH in)
5. Under **Security Group**, add these inbound rules:

| Port | Protocol | Source    | Purpose        |
|------|----------|-----------|----------------|
| 22   | TCP      | My IP     | SSH access     |
| 80   | TCP      | 0.0.0.0/0 | HTTP           |
| 443  | TCP      | 0.0.0.0/0 | HTTPS (later)  |

6. Launch — note your **Public IPv4 address**

---

## Step 2 — Connect via SSH

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

---

## Step 3 — Install Server Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally (process manager for Node.js)
sudo npm install -g pm2

# Verify installations
node -v && npm -v && nginx -v && pm2 -v
```

---

## Step 4 — Clone & Configure the App

```bash
# Create app directory
sudo mkdir -p /var/www/senyora
sudo chown ubuntu:ubuntu /var/www/senyora

# Clone your repository
cd /var/www/senyora
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

### Backend `.env`

```bash
cd /var/www/senyora/backend
npm install
nano .env
```

Paste and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/company-mgmt
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://YOUR_EC2_IP
```

### Frontend `.env`

```bash
cd /var/www/senyora/frontend
npm install
nano .env
```

Paste:

```env
VITE_API_BASE_URL=http://YOUR_EC2_IP
```

```bash
# Build the React app
npm run build
```

> The built files will be at `frontend/dist/` — Nginx will serve these.

---

## Step 5 — Configure Nginx

```bash
# Copy the project's nginx config
sudo cp /var/www/senyora/nginx.conf /etc/nginx/sites-available/senyora

# Edit it — replace YOUR_EC2_PUBLIC_IP with your actual IP or domain
sudo nano /etc/nginx/sites-available/senyora

# Enable the site and remove the default
sudo ln -s /etc/nginx/sites-available/senyora /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test config and reload
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

---

## Step 6 — Start the Backend with PM2

```bash
# Copy the PM2 config to the backend folder
cp /var/www/senyora/ecosystem.config.cjs /var/www/senyora/backend/

# Start the app
cd /var/www/senyora/backend
pm2 start /var/www/senyora/ecosystem.config.cjs

# Save process list so PM2 restarts after server reboot
pm2 save

# Register PM2 as a system service (run the command it prints)
pm2 startup
```

---

## Step 7 — Verify Everything

```bash
# Check PM2 processes
pm2 status

# Check Nginx
sudo systemctl status nginx

# Test the backend health endpoint
curl http://localhost:5000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

Open `http://YOUR_EC2_IP` in your browser — the app should load.

---

## Step 8 — Updating the App (Future Deploys)

```bash
cd /var/www/senyora
git pull

# If backend changed
cd backend
npm install
pm2 restart senyora-backend

# If frontend changed
cd ../frontend
npm install
npm run build
# Nginx picks up the new dist/ automatically — no restart needed
```

---

## Optional — Add a Domain + Free HTTPS (SSL)

Point your domain's **A record** to your EC2 IP, then:

```bash
sudo apt install -y certbot python3-certbot-nginx

# Issue certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

After SSL is set up, update your environment variables:

- **Backend** `.env`: `CLIENT_URL=https://yourdomain.com`
- **Frontend** `.env`: `VITE_API_BASE_URL=https://yourdomain.com`

Then rebuild the frontend and restart the backend:

```bash
cd /var/www/senyora/frontend && npm run build
pm2 restart senyora-backend
```

---

## PM2 Cheat Sheet

| Command | Description |
|---------|-------------|
| `pm2 status` | Show all running processes |
| `pm2 logs senyora-backend` | View live backend logs |
| `pm2 restart senyora-backend` | Restart the backend |
| `pm2 stop senyora-backend` | Stop the backend |
| `pm2 monit` | Interactive process monitor |

---

## Nginx Cheat Sheet

| Command | Description |
|---------|-------------|
| `sudo nginx -t` | Test config for syntax errors |
| `sudo systemctl reload nginx` | Reload config without downtime |
| `sudo systemctl restart nginx` | Full restart |
| `sudo tail -f /var/log/nginx/error.log` | View error logs |

---

## Project Files Reference

| File | Purpose |
|------|---------|
| `nginx.conf` | Nginx site config — serves frontend + proxies `/api/` |
| `ecosystem.config.cjs` | PM2 config — keeps backend running and auto-restarts |
