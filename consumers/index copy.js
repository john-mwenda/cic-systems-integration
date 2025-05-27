import amqplib from 'amqplib';
import log from './utils/logger.js';
import dotenv from 'dotenv';
import axios from 'axios';
import * as config from './config/config.cjs';
dotenv.config();

// Get environment variables
const { NODE_ENV } = process.env;
const Config = config[NODE_ENV];

const queue = 'sms'; // 'smslist'
const retryQueue = 'sms-retry'; // 'smslist-retry'    
const rabbitmqUrl = `amqp://${Config.rabbitmquser}:${Config.rabbitmqpassword}@${Config.rabbitmqhost}:${Config.rabbitmqport}`;
//const rabbitmqUrl = Config.rabbitmqhost;
const retryDelay = 60000; // 1 minute in milliseconds

let connection, channel;

async function connectRabbitMQ() {
    log.info('Connecting to RabbitMQ...');
    connection = await amqplib.connect(rabbitmqUrl);
    log.info('Connected to RabbitMQ');
    channel = await connection.createChannel();

    // Assert the main queue
    log.info('Asserting queues...');
    await channel.assertQueue(queue, {
        deadLetterExchange: '',
        durable: true,
        deadLetterRoutingKey: retryQueue
    });

    // Assert the retry queue
    log.info('Asserting retry queues...');
    await channel.assertQueue(retryQueue, {
        messageTtl: retryDelay,
        deadLetterExchange: '',
        durable: true,
        deadLetterRoutingKey: queue
    });

    log.info('Queues asserted');
    channel.prefetch(1); // Fetch one message at a time
    log.info(`[*] Waiting for messages in ${queue}.`);
}

async function handleMessage(msg) {
    if (msg !== null) {
        try {
            const temp = JSON.parse(msg.content.toString());
            log.info('Received message');
            const response = await sendSMS(temp.to, temp.body);
            if (response.ResponseCode == "1001") {
                log.info('SMS sent successfully');
                return channel.ack(msg);
            }
            log.error('SMS sending failed:');
            log.error(response);
            channel.nack(msg, false, false); // Send to DLX
            //channel.ack(msg);
        } catch (err) {
            log.error(`Processing error: ${JSON.stringify(err)}`);
            log.error('Sending to DLX...');
            channel.nack(msg, false, false); // Send to DLX
        }
    } else {
        log.warn('Consumer cancelled by server');
    }
}

async function startConsumer() {
    try {
        await connectRabbitMQ();

        channel.consume(queue, async (msg) => {
            await handleMessage(msg);
        }, { noAck: false });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            log.info('Received SIGINT, closing connections...');
            await channel.close();
            await connection.close();
            process.exit(0);
        });

    } catch (error) {
        log.error('Connection error:');
        log.error(error);
        setTimeout(startConsumer, 5000); // Retry after 5 seconds
    }
}
log.info('Starting consumer...');
startConsumer();
//TODO: Save sms going out to the database
export async function sendSMS(to, message) {
    try {
        const response = await axios.post(Config.smsurl, {
            "AuthDetails": [{
                "UserID": Config.smsuserid,
                "Token": Config.smstoken,
                "Timestamp": new Date().toISOString()
            }],
            "MessageType": [2],
            "BatchType": [0],
            "SourceAddr": [Config.smssender],
            "MessagePayload": [{ "Text": message }],
            "DestinationAddr": [{
                "MSISDN": to,
                "LinkID": "",
                "SourceID": "2"
            }],
            "DeliveryRequest": [{
                "EndPoint": "https://kp.cic.co.ke/profile",
                "Correlator": new Date().getTime().toString()
            }]
        });

        log.info(`SMS response:${JSON.stringify(response.data[0])}`);
        return response.data[0];
    } catch (error) {
        log.error(`Error sending SMS:${JSON.stringify(error)}`);
        throw error;
    }
}
