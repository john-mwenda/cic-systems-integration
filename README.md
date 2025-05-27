# Communications service
This is a Nodejs application designed to handle communication services at CIC. The app is composed of two services
- Consumer service contained in `consumers`
- Webhook handler service contained in `webhook`
- Database contained in `database`

### Consumer Service
This are mostly node scripts that will process RabbitMQ message queues and send queued messages to different destinations, depending on message parameters. Check the included README.md

### Webhook handler Service
This is a lightweight Node.js Express application designed to receive **Delivery notification reports** from Paradox http://paradox.co.ke/ via webhooks. It listens for incoming HTTP POST requests and processes the delivery reports accordingly. Check the included README.md

### Database 
Contains database models and migrations 