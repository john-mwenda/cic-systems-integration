import amqplib from 'amqplib';
import log from '../utils/logger.js';
import dotenv from 'dotenv';
import axios from 'axios';
import config from '../../config/config.cjs';
import moment from 'moment-timezone';


axios.defaults.headers.post['Authorization'] = `Bearer ${config.smstoken}`;


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
            return response
        }else {
            log.error('SMS sending failed:');
            return response
        }
    } catch (error) {
        log.error(`Error sending SMS:${error}`);
        throw error;
    }
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
                log.error(`SMS sending failed Paradox error: ${JSON.stringify(err)}`);

                // channel.nack(msg, false, false); // Send to DLX
                //channel.ack(msg);
            }
        } catch (err) {
            log.error(`Processing error: ${JSON.stringify(err)}`);
            log.error('Sending to DLX...');
            // channel.nack(msg, false, false); // Send to DLX
        }
    } else {
        log.warn('Consumer cancelled by server');
    }
}

handleMessage({to:"254719512216", body: "CIC = Your application was Successful"})