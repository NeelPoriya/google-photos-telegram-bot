import winston from "winston";
import MediaItem from "../models/MediaItem.model";
import TelegramBot from "node-telegram-bot-api";
import { config } from "dotenv";
config();
const token = process.env.TELEGRAM_BOT_TOKEN!;
export const bot = new TelegramBot(token, { polling: true });

export const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({
      filename: "./logs/error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "./logs/combined.log" }),
  ],
});

export const getAllMovies = async () => {
  try {
    // randomly choose 10 items from MediaItem
    const data = await MediaItem.aggregate([{ $sample: { size: 24 } }]);
    console.log(data.length);
    return data.map((item) => {
      return { title: item.filename, id: item._id };
    });
  } catch (error) {
    logger.error(error);
    return [];
  }
};
