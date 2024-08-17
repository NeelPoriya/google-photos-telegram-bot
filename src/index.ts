import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import chalk from "chalk";
import mongoose from "mongoose";
import { config } from "dotenv";
import MediaItem from "./models/MediaItem.model";
import { main } from "./test";
import { bot, getAllMovies } from "./lib/helper";
import Request from "./models/Request";

config();

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB", error);
  });

bot.onText(/\/start/, (msg: Message) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `Welcome to the Media Bot! You can use the following commands:
    /list - List all media items
    /refresh - Updates the database with the latest content.`
  );
});

bot.onText(/\/refresh/, async (msg: Message) => {
  await main();
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "The data is fresh and new!");
});

bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;

  const movies = await getAllMovies(); // Implement this function to retrieve movies
  const inlineKeyboard = movies.map((movie) => ({
    text: movie.title,
    callback_data: `movie_${movie.id}`, // Use movie id or title as unique identifier
  }));

  // Send the list of movies with inline keyboard
  bot.sendMessage(chatId, "Choose a movie:", {
    reply_markup: {
      inline_keyboard: [inlineKeyboard],
    },
  });
});

bot.onText(/\/search/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Enter the movie name:");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const movieName = msg.text;

  if (msg.text?.startsWith("/")) {
    return;
  }

  // fuzzy search for movie
  const aggregate = [
    {
      $search: {
        index: "filename_idx",
        autocomplete: {
          query: movieName,
          path: "filename",
          fuzzy: {
            maxEdits: 2,
            prefixLength: 0,
            maxExpansions: 50,
          },
        },
      },
    },
    {
      $project: {
        filename: 1,
        score: { $meta: "searchScore" },
      },
    },
  ];
  const movies = await MediaItem.aggregate(aggregate).sort({ score: -1 });

  if (movies.length === 0) {
    bot.sendMessage(chatId, "No movies found.");
    return;
  }

  let filtered_movies = movies.filter((item, ind) => ind < 5);

  const inlineKeyboard = filtered_movies.map((movie) => ({
    text: movie.filename,
    callback_data: `movie_${movie._id}`,
  }));

  bot.sendMessage(chatId, "Choose a movie:", {
    reply_markup: {
      inline_keyboard: [inlineKeyboard],
    },
  });
});

bot.on("callback_query", async (query) => {
  if (!query.message) {
    return;
  }
  const { message_id, chat } = query.message;
  const { data } = query;

  const info = data!.split("_"); // Assuming the callback data format is "movie_movieId"
  const type = info[0];
  const text = info[1];

  if (type === "movie") {
    const movie = await MediaItem.findById(text);
    if (!movie) {
      return;
    }

    const inlineKeyboard = [
      {
        text: "Original Video",
        callback_data: `video_${movie._id}`,
      },
      {
        text: "Processed Video",
        url: movie.baseUrl + "=dv",
      },
    ];

    bot.sendMessage(chat.id, `Choose any one...`, {
      reply_markup: {
        inline_keyboard: [inlineKeyboard],
      },
    });
  } else if (type === "video") {
    const movie = await MediaItem.findById(text);

    if (!movie) {
      return;
    }

    const request = await Request.create({
      chat_id: chat.id,
      message_id,
      request: movie.productUrl,
      status: "PENDING",
      title: movie.filename,
    });

    bot.sendMessage(
      chat.id,
      "We are processing your request. Please wait! Once the video is ready, you will receive a download link."
    );
  }
});

bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  {
    command: "/list",
    description: "List all media items",
  },
  {
    command: "/refresh",
    description: "Updates the database with the latest content.",
  },
  {
    command: "/search",
    description: "Search for a movie",
  },
  {
    command: "/logs",
    description: "Shows summary of movies list."
  }
]);

console.log("Telegram Bot Started");
