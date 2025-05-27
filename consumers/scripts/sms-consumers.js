import amqplib from 'amqplib';
import log from '../utils/logger.js';
import dotenv from 'dotenv';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as config from '../../config/config.cjs';
import defineSmsDeliveryReport from '../../database/models.js';
import sequelizeInstance  from '../../database/sequelize.js';

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
            log.info(`Received message ${msg.to} ${msg.body}`);
            const response = await sendSMS(msg.to, msg.body);
            console.log(response);
            if (response.status == "200") {
                log.info('SMS queue processed Successfully');
                return channel.ack(msg);
            }else {
                log.error('Sending to DLX...');
                // channel.nack(msg, false, false); // Send to DLX
                //channel.ack(msg);
            }
        } catch (err) {
            log.error('Sending to DLX...');
            // channel.nack(msg, false, false); // Send to DLX
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

async function savePendingSMS(phone, correlator, deliveryStatus ) {
    // Save Sent but pending messages, yet to be delivered from Paradox API 
    try {
        const SmsDeliveryReport = defineSmsDeliveryReport(sequelizeInstance);

        // Ensure the table exists (optional if already synced)
        await SmsDeliveryReport.sync();

        // Create a new record
        const newReport = await SmsDeliveryReport.create({
        // Fill in the fields defined in your model, for example:
            phone: phone,
            correlator: correlator,  // Example field
            delivery_status: deliveryStatus,  // Example field
        });
    } catch (error) {
        console.error('Error adding new report:', error);
    }

}

// log.info('Starting consumer...');
// startConsumer();
// //TODO: Save sms going out to the database
export async function sendSMS(to, message) {
    try {
        const response = await axios.post(`${config.smsurl}${'/send-sms'}`, {
            "sender": config.smssenderID,
            "message": message,
            "phone": to,
            "correlator": to + "_" + moment().format('YYYYMMDD'),
            "endpoint": config.callbackurl
        });
        log.info(`SMS response:${JSON.stringify(response.data)}`);
        if (response.status == "200") {
            log.info('SMS sent successfully');
            savePendingSMS(to, correlator, 'Pending');
            return response
        }else {
            log.error(`SMS sending failed Paradox error: ${JSON.stringify(err)}`);
            return response
        }
    } catch (error) {
        log.error(`Error sending SMS:${error}`);
        throw error;
    }
}


// sendSMS("254719512216", "CIC = Your application was Successful")
// saveSMS("254719512216", "f47ac10b-58cc-4372-a567-0e02b2c3d479", "Pending")