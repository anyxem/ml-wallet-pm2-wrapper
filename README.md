# Wallet pm2 wrapper

## Overview
This repository hosts an application designed to act as a wrapper for a wallet, addressing the challenge of autorun functionality. Additionally, it integrates the capability to send Telegram notifications, contingent upon providing the necessary credentials. This solution is crafted for Linux servers and requires Node.js version 20, npm, and PM2 to be installed globally.

## Features
1. **Autorun**: Addresses the issue of autorun functionality, ensuring the wallet application launches reliably upon server startup or reboot.

2. **Telegram Notifications**: Incorporates the ability to send notifications via Telegram, enhancing user communication and alerting capabilities.

## Prerequisites
- **Node.js 20**: Node.js version 20 or higher must be installed.
- **PM2**: PM2, a process manager for Node.js applications, needs to be installed globally for efficient process management.

If you are using Remote access to server make sure you created separate user and passwordless access to the server.

## Setup node-daemon as a service

Check instructions [here](https://gist.github.com/anyxem/084e413167c283d42e7d7f4ad403c3ec)

## Installation
1. **Clone Repository**: Clone this repository to your local environment.
   ```bash
   git clone <repository_url>

2. **Env file**: Navigate to the root directory of the cloned repository and copy environment variables file.
   ```bash
   cd <repository_name>
   cp .env.example .env
   ```
   
3. **Configuration**: Open the `.env` file and *configure* the following environment variables according to your setup:
   ```env
   PATH_WALLET_CLI=/home/safeuser/mintlayer/wallet-cli
   PATH_WALLET=/home/safeuser/mintlayer/wallet/wallet_file
   NETWORK=testnet
   CHAT_ID=123456789
   TELEGRAM_TOKEN=123456789:ABCDEF
   ```

4. **Start app with pm2**
    ```bash
    pm2 start ecosystem.config.js
    ```
   
5. **Check logs**
    ```bash
    pm2 logs wallet
    ```
   
6. **Save pm2 app list**
    ```bash
    pm2 save
    ```
