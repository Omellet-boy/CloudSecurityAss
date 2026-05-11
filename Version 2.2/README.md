<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Alumni Portal - Secure Three-Tier Architecture

This repository contains everything you need to run the newly secured Alumni Portal locally.

*View the base AI app in AI Studio:* [https://ai.studio/apps/06435ee3-3b24-4914-9895-d4a2e6cc11c4](https://ai.studio/apps/06435ee3-3b24-4914-9895-d4a2e6cc11c4)

---

## 🏗️ Architecture Overview
1. **Presentation Tier:** React / Vite (Served via Node/Vite middleware)
2. **Application Tier:** Node.js / Express (Running on port 3000)
3. **Data Tier:** Microsoft SQL Server (Running in an isolated VirtualBox VM)
4. **Proxy/Security:** Nginx (Handles SSL termination on port 443 and forwards traffic to port 3000)

---

## 🛠️ Prerequisites
* [Node.js (LTS v22+)](https://nodejs.org/)
* [Oracle VirtualBox](https://www.virtualbox.org/) with Windows Server/10 and MS SQL Server installed.
* [Nginx for Windows](http://nginx.org/en/download.html)
* OpenSSL (usually included with Git Bash)
* A **Gemini API Key** from Google AI Studio.

---

## 1️⃣ Database Setup (VirtualBox VM)
To isolate the database from the application tier, we run MS SQL Server inside a VirtualBox VM.

### A. VM Network Configuration
1. In VirtualBox, go to your VM Settings -> **Network**.
2. Set "Attached to" to **Bridged Adapter** so the VM gets a local IP address on your network.
3. Start the VM, open Command Prompt, run `ipconfig`, and note the IPv4 Address (e.g., `192.168.0.141`).

### B. SQL Server Configuration
1. Open **SQL Server Configuration Manager** in the VM.
2. Go to **Protocols for MSSQLSERVER** -> Enable **TCP/IP**.
3. In TCP/IP Properties -> **IP Addresses** tab -> scroll to **IPAll**. Clear `TCP Dynamic Ports` and set `TCP Port` to **1433**.
4. **Restart** the SQL Server service.
5. In **Windows Defender Firewall** (inside the VM), create an Inbound Rule to allow TCP port `1433`.

### C. Create the Database & Tables
1. Open SQL Server Management Studio (SSMS) inside the VM.
2. Create a SQL Login named `Alumni sa` (Password: `AlumniDbAdmin123!`). Ensure mixed-mode (SQL & Windows) Authentication is enabled at the server level.
3. Run `CREATE DATABASE AlumniDB;`
4. Run `ALTER AUTHORIZATION ON DATABASE::AlumniDB TO [Alumni sa];`
5. Switch to `AlumniDB` (dropdown menu at the top) and execute the provided `CREATE TABLE` scripts to generate the `Users`, `Alumni`, `Donations`, and `AuditLogs` tables.

---

## 2️⃣ Backend Configuration
1. Open `server.ts` on your host machine.
2. Locate the `sqlConfig` object and update the `server` IP address to match your VM's Bridged IP:
   ```typescript
   const sqlConfig = {
     user: 'Alumni sa', 
     password: 'AlumniDbAdmin123!',
     database: 'AlumniDB',
     server: '192.168.0.141', // <-- CHANGE THIS TO YOUR VM'S IP
     options: { encrypt: true, trustServerCertificate: true }
   };


## 3 Admin access
1. change the role of the user in the users table in db to "admin" to access admin page
