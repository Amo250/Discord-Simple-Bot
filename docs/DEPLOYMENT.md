# Deployment Guide

This document explains how to deploy the bot using the command line.

## Requirements
- Linux server (Ubuntu recommended)
- Node.js 18+ (20 LTS recommended)
- npm, git, sqlite3
- build-essential, python3

## Install
```bash
npm install --omit=dev
```

## Environment
Create `shared/.env` and load it:
```bash
set -a
source shared/.env
set +a
```

## Register commands
```bash
npm run register
```

## Run
```bash
npx pm2 start src/index.js --name discord-role-bot
```
