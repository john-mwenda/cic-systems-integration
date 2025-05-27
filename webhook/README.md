# SMS Delivery Webhook Service

This is a lightweight Node.js Express application designed to receive **SMS delivery notification reports** from Paradox http://paradox.co.ke/ via webhooks. It listens for incoming HTTP POST requests and processes the delivery reports accordingly. 


## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/CIC-INSURANCE-GROUP/smsservice.git
cd smsservice
```

### 2. Install dependencies
```bash
yarn install
```

### 3. Configure environment
Add a .env file with environment variables

### 4. Run servers
To locally run the consumer services run the following

```bash
npm run webhook:start:dev
```
