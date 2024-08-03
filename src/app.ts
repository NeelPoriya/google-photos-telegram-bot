import { config } from "dotenv";
import express, { Request, Response } from "express";
import mongoose, { startSession } from "mongoose";
import morgan from "morgan";
import MediaItemRequest from "./models/Request";
import { InlineKeyboardButton, Message } from "node-telegram-bot-api";
import { bot, getAllMovies } from "./lib/helper";
import MediaItem from "./models/MediaItem.model";
import { main, fetchUpdatedMediaItem } from "./test";
import cors from "cors";
import { Script, Utils } from "./scripts";
import MovieOption from "./models/MovieOption.model";
import MovieRequest from "./models/Request";
config();

const ADMIN_ID = [1215528849, 827547960];
const GROUP_CHAT_LINK = "https://t.me/+Ftc2iRW6fcEzM2E1";
const MAX_SEARCH_COUNT = 32;
const app = express();
const port = process.env.PORT || 3000;
const PAGE_SIZE = 8;
const AUTO_DELETE_TIME = 60 * 1000; // 1 minutes
const GROUP_CHAT_IDS = [-4211685027, -4257557696];

app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hello World!",
  });
});

app.get("/receive-link", async (req: Request, res: Response) => {
  const session = await startSession();
  session.startTransaction();

  const pendingRequest = await MediaItemRequest.find({ status: "PENDING" })
    .session(session)
    .limit(1)
    .exec();

  if (pendingRequest.length === 0) {
    await session.commitTransaction();
    session.endSession();
    return res.json({
      message: "No pending request",
      data: null,
    });
  }

  const request = pendingRequest[0];

  request.status = "IN_PROGRESS";
  await request.save({ session });

  await session.commitTransaction();

  res.json({
    message: "Request found",
    data: request,
  });
});

app.get("/reset-links", async (req: Request, res: Response) => {
  const session = await startSession();
  session.startTransaction();

  await MediaItemRequest.updateMany(
    { status: "IN_PROGRESS" },
    { status: "PENDING" }
  ).session(session);

  await session.commitTransaction();
  session.endSession();

  res.json({
    message: "All links have been reset",
  });
});

app.post("/save-data", async (req: Request, res: Response) => {
  const { id, download_url } = req.body;

  const request = await MediaItemRequest.findByIdAndUpdate(
    id,
    {
      status: "COMPLETED",
      download_url,
    },
    {
      new: true,
    }
  );

  if (!request) {
    return res.status(400).json({
      message: "Request not found",
    });
  }

  bot.sendMessage(
    request.chat_id,
    `Your video of ${request.title} is ready. Download it from [here](${request.download_url}).`,
    {
      parse_mode: "Markdown",
      reply_to_message_id: request.message_id || undefined,
    }
  );

  res.json({
    message: "Request updated",
    data: request,
  });
});

const checkRequest = (msg: Message) => {
  try {
    if (msg.chat.id < 0 && !GROUP_CHAT_IDS.includes(msg.chat.id)) {
      bot.sendMessage(
        msg.chat.id,
        "This bot should not be used here. Good thing is you can't😛"
      );
      return 1;
    }
  } catch (error) {
    return 1;
  }
  return 0;
};

bot.onText(/\/start/, async (msg: Message) => {
  const chatId = msg.chat.id;

  if (checkRequest(msg)) return;

  const user_id = msg.from?.id;

  // const pendingMovieOptions = await MovieOption.find({
  //   user_id,
  // });

  // if (pendingMovieOptions.length > 0) {
  //   pendingMovieOptions.map((item) => {
  //     const movie_id = item.movie_id;
  //     const inlineKeyboard = [
  //       {
  //         text: "Original Video",
  //         callback_data: JSON.stringify({
  //           query: "ORIGINAL_VIDEO",
  //           data: movie_id,
  //         }),
  //       },
  //       {
  //         text: "Compressed Video",
  //         callback_data: JSON.stringify({
  //           query: "COMPRESSED_VIDEO",
  //           data: movie_id,
  //         }),
  //       },
  //     ];

  //     bot.sendMessage(
  //       chatId,
  //       `You selected the movie: *${item.filename}*.\n\nPlease choose one option to continue...`,
  //       {
  //         reply_markup: {
  //           inline_keyboard: [inlineKeyboard],
  //         },
  //         parse_mode: "Markdown",
  //       }
  //     );
  //   });

  //   await MovieOption.deleteMany({
  //     user_id,
  //   });
  //   return;
  // }

  const txt = msg.text;

  if (!txt) {
    return;
  }

  const spaceSplitted = txt.split(" ");

  if (spaceSplitted.length > 1) {
    spaceSplitted.shift();

    const movie_text = spaceSplitted.join(" ").split("_");
    if (movie_text.length > 1) {
      const movie_id = movie_text[1];
      const movie = await MediaItem.findById(movie_id);

      if (movie) {
        const inlineKeyboard = [
          {
            text: "Original Video",
            callback_data: JSON.stringify({
              query: "ORIGINAL_VIDEO",
              data: movie_id,
            }),
          },
          {
            text: "Compressed Video",
            callback_data: JSON.stringify({
              query: "COMPRESSED_VIDEO",
              data: movie_id,
            }),
          },
        ];

        await bot.sendMessage(
          chatId,
          `You selected the movie: *${movie.filename}*.\n\nPlease choose one option to continue...`,
          {
            reply_markup: {
              inline_keyboard: [inlineKeyboard],
            },
            parse_mode: "Markdown",
          }
        );
      }
      return;
    }
  }

  const message = Script.getModifiedStartTxt(
    msg.from?.first_name as string,
    "Google_Photo_Links_Bot",
    "Google Photos Bot"
  );

  const inlineKeyboard = [
    [
      {
        text: "📿 Cʜᴀɴɴᴇʟ 📿",
        url: `https://t.me/+4opB2gPly184M2Zl`,
      },
    ],
    [
      {
        text: "⚜Mʏ Gʀᴏᴜᴘ⚜",
        url: "https://t.me/+Z2LwbQ8AbJ0yNWE9",
      },
    ],
    [
      {
        text: "👾 Aʙᴏᴜᴛ 👾",
        callback_data: JSON.stringify({
          query: "ABOUT",
        }),
      },
    ],
  ];

  bot.sendPhoto(
    chatId,
    Utils.photos[Math.floor(Math.random() * Utils.photos.length)],
    {
      caption: message,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inlineKeyboard as InlineKeyboardButton[][],
      },
    }
  );
});

bot.onText(/\/refresh/, async (msg: Message) => {
  const chatId = msg.chat.id;

  if (checkRequest(msg)) return;

  if (chatId > 0) {
    bot.sendMessage(
      chatId,
      `This command is only available in groups. Please join [here](${GROUP_CHAT_LINK}).`,
      {
        parse_mode: "Markdown",
      }
    );
    return;
  }

  if (msg.from?.id && !ADMIN_ID.includes(msg.from?.id)) {
    bot.sendMessage(
      chatId,
      "You are not authorized to use this command. Only boss can execute this command!",
      {
        reply_to_message_id: msg.message_id,
      }
    );
    return;
  }

  await main();
  const moviesCount = await MediaItem.find().countDocuments();
  bot.sendMessage(chatId, `The data is fresh and new! We have now ${moviesCount} files in our system.`, {
    reply_to_message_id: msg.message_id,
  });
});

bot.onText(/\/list/, async (msg) => {
  const {
    message_id: originalMessageId,
    chat: { id: chatId },
  } = msg;

  if (checkRequest(msg)) return;

  if (chatId > 0) {
    bot.sendMessage(
      chatId,
      `This command is only available in groups. Please join [here](${GROUP_CHAT_LINK}).`,
      {
        parse_mode: "Markdown",
        reply_to_message_id: originalMessageId,
      }
    );
    return;
  }

  const message = msg.text;
  let count = 16;
  if (message && message.split(" ").length > 1) {
    count = Math.min(MAX_SEARCH_COUNT, +message.split(" ")[1]);
  }

  const data = await MediaItem.aggregate([{ $sample: { size: count } }]);
  const movies = data.map((item) => {
    return { title: item.filename, id: item._id };
  });

  // create inline_keyboard in chunks of PAGE_SIZE elements
  // const inlineKeyboard: any = [];

  // for (let i = 0; i < movies.length; ++i) {
  //   if (i % PAGE_SIZE === 0) {
  //     inlineKeyboard.push([]);
  //   }

  //   const len = inlineKeyboard.length;

  //   inlineKeyboard[len - 1].push({
  //     text: `${i + 1}`,
  //     callback_data: `movie_${movies[i].id}`,
  //   });
  // }

  const markdown_message = movies
    .map((movie, index) => {
      const url = `https://t.me/Google_Photo_Links_Bot?start=movie_${movie.id}`;
      return `<a href="${url}">${index + 1}. ${movie.title}</a>`;
    })
    .join("\n\n");

  // Send the list of movies with inline keyboard
  bot.sendMessage(chatId, `Choose a movie:\n\n${markdown_message}`, {
    // reply_markup: {
    //   inline_keyboard: inlineKeyboard,
    // },
    parse_mode: "HTML",
    reply_to_message_id: originalMessageId,
  });
});

bot.onText(/\/search/, async (msg: Message) => {
  const {
    message_id: originalMessageId,
    chat: { id: chatId },
  } = msg;

  if (checkRequest(msg)) return;

  if (chatId > 0) {
    bot.sendMessage(
      chatId,
      `This command is only available in groups. Please join [here](${GROUP_CHAT_LINK}).`,
      {
        parse_mode: "Markdown",
      }
    );
    return;
  }

  const movieName = msg.text;

  if (!movieName) {
    bot.sendMessage(chatId, "Please enter a movie name.", {
      reply_to_message_id: originalMessageId,
    });
    return;
  }

  const movieNameArray = movieName.split(" ");
  if (movieNameArray.length === 1) {
    bot.sendMessage(
      chatId,
      "Please enter a movie name along with /search command.",
      {
        reply_to_message_id: originalMessageId,
      }
    );
    return;
  }

  // @ts-ignore
  movieNameArray.shift();
  const query = movieNameArray.join(" ");
  let rawPattern = ".";

  if (!query) {
    rawPattern = ".";
  } else {
    // Replace more than one whitespace character with a single space
    let modifiedQuery = query.replace(/\s+/g, " ");
  
    if (!modifiedQuery.includes(" ")) {
      rawPattern = "(\\b|[.\\+\\-_])" + modifiedQuery + "(\\b|[.\\+\\-_])";
    } else {
      rawPattern = modifiedQuery.replace(/\s/g, ".*[\\s.\\+\\-_]");
    }
  }
  // fuzzy search for movie
  // const aggregate = [
  //   {
  //     $search: {
  //       index: "filename_idx",
  //       autocomplete: {
  //         query: rawPattern,
  //         path: "filename",
  //         fuzzy: {
  //           maxEdits: 2,
  //           prefixLength: 0,
  //           maxExpansions: 50,
  //         },
  //       },
  //     },
  //   },
  //   {
  //     $project: {
  //       filename: 1,
  //       score: { $meta: "searchScore" },
  //     },
  //   },
  // ];

  // let moviesCount = 0;
  // try {
  //   moviesCount = (await MediaItem.aggregate(aggregate).count("filename"))[0]
  //     .filename;
  // } catch (error) {}

  // const movies = await MediaItem.aggregate(aggregate)
  //   .sort({ score: -1 })
  //   .limit(PAGE_SIZE);

  const moviesCount = await MediaItem.find({
    filename: { $regex: new RegExp(rawPattern, "i") },
  }).countDocuments();

  const movies = await MediaItem.find({
    filename: { $regex: new RegExp(rawPattern, "i") },
  })
  .sort('filename')
  .limit(PAGE_SIZE);

  if (movies.length === 0) {
    const sentMessage = await bot.sendMessage(chatId, "No movies found.", {
      reply_to_message_id: originalMessageId,
    });
    setTimeout(() => {
      bot.deleteMessage(chatId, sentMessage.message_id);
      bot.deleteMessage(chatId, originalMessageId);
    }, AUTO_DELETE_TIME);
    return;
  }

  // const inlineKeyboard = movies.map((movie, index) => ({
  //   text: (index + 1).toString(),
  //   callback_data: JSON.stringify({
  //     query: "MOVIE",
  //     data: movie._id,
  //   }),
  // }));

  const nextPrevInlineKeyboard = [
    {
      text: "◀ Prev",
      callback_data: JSON.stringify({
        query: "SEARCH_PREV",
      }),
    },
    {
      text: "Next ▶",
      callback_data: JSON.stringify({
        query: "SEARCH_NEXT",
      }),
    },
  ];

  const markdown_message = movies
    .map((movie, index) => {
      const url = `https://t.me/Google_Photo_Links_Bot?start=movie_${movie._id}`;
      return `<a href="${url}">${index + 1}. ${movie.filename}</a>`;
    })
    .join("\n\n");

  const sentMessage = await bot.sendMessage(
    chatId,
    `Search Query: ${query}\nPage: ${1}\nTotal Count: ${moviesCount}\nHere's what I found:\n\n${markdown_message}`,
    {
      reply_markup: {
        inline_keyboard: [
          // [...inlineKeyboard],
          [...nextPrevInlineKeyboard],
        ],
      },
      parse_mode: "HTML",
      reply_to_message_id: originalMessageId,
    }
  );

  // delete the message after 2 seconds
  setTimeout(() => {
    bot.deleteMessage(chatId, sentMessage.message_id);
    bot.deleteMessage(chatId, originalMessageId);
  }, AUTO_DELETE_TIME);
});

bot.onText(/\/logs/, async (msg: Message) => {
  const moviesCount = await MediaItem.find().countDocuments();
  const successfulRequests = await MovieRequest.find({status: 'COMPLETED'}).countDocuments();
  const inProgressRequests = await MovieRequest.find({status: "IN_PROGRESS"}).countDocuments();
  const pendingRequests = await MovieRequest.find({status: "PENDING"}).countDocuments();
  const failedRequests = await MovieRequest.find({status: "FAILED"}).countDocuments();

  bot.sendMessage(
    msg.chat.id,
    `Our status:\nMovies Count: ${moviesCount}\nNumber of original files served: ${successfulRequests}\nNumber of pending requests: ${pendingRequests}\nIn Progress Requests: ${inProgressRequests}\nFailed Requests: ${failedRequests}`,
    {
      reply_to_message_id: msg.message_id,
    }
  );
})

bot.on("callback_query", async (query) => {
  if (!query.message) {
    return;
  }

  const { message_id, chat } = query.message;
  const { data } = query;

  let info, type, text;
  try {
    info = JSON.parse(data || ""); // Assuming the callback data format is "movie_movieId"
    type = info.query;
    text = info.data;
  } catch (error) {
    return;
  }

  // check if the user who clicked the button is the same as the user who sent the message
  const { from, message } = query;
  if (!from || !message) {
    return;
  }

  if (type === "MOVIE") {
    // reply hello world to the user in his/her personal chat using user id
    const user_id = query.from.id;

    if (query.from?.id !== query.message.reply_to_message?.from?.id) {
      bot.answerCallbackQuery(query.id, {
        text: "Sir, this is not your request. Please make your own requests and try again.",
        show_alert: true,
      });
      return;
    }

    const movie = await MediaItem.findById(text);
    if (!movie) {
      return;
    }

    const inlineKeyboard = [
      {
        text: "Original Video",
        callback_data: JSON.stringify({
          query: "ORIGINAL_VIDEO",
          data: movie._id,
        }),
      },
      {
        text: "Compressed Video",
        callback_data: JSON.stringify({
          query: "COMPRESSED_VIDEO",
          data: movie._id,
        }),
      },
    ];

    // await MovieOption.create({
    //   user_id: user_id,
    //   movie_id: movie._id,
    //   filename: movie.filename,
    // });

    bot.answerCallbackQuery(query.id, {
      url: `https://t.me/Google_Photo_Links_Bot?start=movie_${movie._id}`,
    });

    // await new Promise((res, rej): any => {
    //   setTimeout(() => {
    //     res(true);
    //   }, 2000);
    // });

    // await bot.sendMessage(
    //   user_id,
    //   `You selected the movie: *${movie.filename}*.\n\nPlease choose one option to continue...`,
    //   {
    //     reply_markup: {
    //       inline_keyboard: [inlineKeyboard],
    //     },
    //     parse_mode: "Markdown",
    //   }
    // );
  } else if (type === "ORIGINAL_VIDEO") {
    const movie = await MediaItem.findById(text);

    if (!movie) {
      return;
    }

    const request = await MediaItemRequest.create({
      chat_id: chat.id,
      message_id,
      request: movie.productUrl,
      status: "PENDING",
      title: movie.filename,
    });

    bot.sendMessage(
      chat.id,
      "We are processing your request. Please wait! Once the video is ready, you will receive a download link.",
      {
        reply_to_message_id: message_id,
      }
    );
  } else if (type === "COMPRESSED_VIDEO") {
    const movie = await MediaItem.findById(text);
    if (!movie) {
      return;
    }
    const upadtedBaseUrl = await fetchUpdatedMediaItem(movie.id);

    if (!upadtedBaseUrl) {
      return;
    }

    const inlineKeyboard = [
      {
        text: "Download",
        url: upadtedBaseUrl.baseUrl + "=dv",
      },
    ];

    bot.sendMessage(chat.id, `Download the compressed video `, {
      reply_markup: {
        inline_keyboard: [inlineKeyboard],
      },
      reply_to_message_id: message_id,
    });
  } else if (type === "SEARCH_PREV" || type === "SEARCH_NEXT") {
    if (query.from?.id !== query.message.reply_to_message?.from?.id) {
      bot.answerCallbackQuery(query.id, {
        text: "Sir, this is not your request. Please make your own requests and try again.",
        show_alert: true,
      });
      return;
    }
    const message = query.message.text;

    if (!message) {
      return;
    }

    const searchRegex = /Search Query:\s*(.*)/;

    let match = message.match(searchRegex);

    const _searchQuery = match ? match[1] : "";

    const totalCountRegex = /Total Count:\s*(\d+)/;

    match = message.match(totalCountRegex);

    const totalCount = match ? +match[1] : 0;

    const pageNumberRegex = /Page:\s*(\d+)/;

    match = message.match(pageNumberRegex);

    const pageNumber = match ? +match[1] : 1;

    function getDecimalPart(number: number) {
      return number - Math.floor(number);
    }
   
    const pageToSearch =
      type === "SEARCH_NEXT"
        ? Math.min(pageNumber + 1, Math.floor(totalCount / PAGE_SIZE) + Math.ceil(getDecimalPart(totalCount / PAGE_SIZE)))
        : Math.max(pageNumber - 1, 1);

    if (pageToSearch === pageNumber) {
      // give a popup to the user
      bot.answerCallbackQuery(query.id, {
        text: "You have reached the end.",
      });
      return;
    }

    const searchQuery = _searchQuery;
    let rawPattern = ".";

    if (!searchQuery) {
      rawPattern = ".";
    } else {
      // Replace more than one whitespace character with a single space
      let modifiedQuery = searchQuery.replace(/\s+/g, " ");
    
      if (!modifiedQuery.includes(" ")) {
        rawPattern = "(\\b|[.\\+\\-_])" + modifiedQuery + "(\\b|[.\\+\\-_])";
      } else {
        rawPattern = modifiedQuery.replace(/\s/g, ".*[\\s.\\+\\-_]");
      }
    }

    const movies = await MediaItem.find({
      filename: { $regex: new RegExp(rawPattern, "i") },
    })
      .sort('filename')
      .skip(Math.max((pageToSearch - 1) * PAGE_SIZE, 0))
      .limit(PAGE_SIZE);

    // const aggregate = [
    //   {
    //     $search: {
    //       index: "filename_idx",
    //       autocomplete: {
    //         query: searchQuery,
    //         path: "filename",
    //         fuzzy: {
    //           maxEdits: 2,
    //           prefixLength: 0,
    //           maxExpansions: 50,
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       filename: 1,
    //       score: { $meta: "searchScore" },
    //     },
    //   },
    // ];

    // const movies = await MediaItem.aggregate(aggregate)
    //   .sort({ score: -1 })
    //   .skip(pageToSearch * PAGE_SIZE)
    //   .limit(PAGE_SIZE);

    if (movies.length === 0) {
      const sentMessage = await bot.sendMessage(chat.id, "No movies found.", {
        reply_to_message_id: message_id,
      });

      setTimeout(() => {
        bot.deleteMessage(chat.id, sentMessage.message_id);
        bot.deleteMessage(chat.id, message_id);
      }, AUTO_DELETE_TIME);
      return;
    }

    // const inlineKeyboard = movies.map((movie, index) => ({
    //   text: (index + 1).toString(),
    //   callback_data: JSON.stringify({
    //     query: "MOVIE",
    //     data: movie._id,
    //   }),
    // }));

    const nextPrevInlineKeyboard = [
      {
        text: "◀ Prev",
        callback_data: JSON.stringify({
          query: "SEARCH_PREV",
        }),
      },
      {
        text: "Next ▶",
        callback_data: JSON.stringify({
          query: "SEARCH_NEXT",
        }),
      },
    ];

    const markdown_message = movies
      .map((movie, index) => {
        const url = `https://t.me/Google_Photo_Links_Bot?start=movie_${movie._id}`;
        return `<a href="${url}">${index + 1}. ${movie.filename})</a>`;
      })
      .join("\n\n");

    // replace the old message with the new message
    bot.editMessageText(
      `Search Query: ${searchQuery}\nPage: ${pageToSearch}\nTotal Count: ${totalCount}\nHere's what I found:\n\n${markdown_message}`,
      {
        chat_id: chat.id,
        message_id,
        reply_markup: {
          inline_keyboard: [
            // [...inlineKeyboard],
            [...nextPrevInlineKeyboard],
          ],
        },
        parse_mode: "HTML",
      }
    );
  } else if (type === "ABOUT") {
    bot.sendMessage(
      chat.id,
      "I can provide you with a vast collection of movies and TV shows. By scraping Google Photos, I can gather and share direct links to this content for you to enjoy. Sit back, relax, and dive into endless entertainment!"
    );
  }
});


bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  {
    command: "/list",
    description: `Randomly shows upto ${MAX_SEARCH_COUNT} movies from the database. Enter a number after the command to set the search count.`,
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
    command: '/logs',
    description: "Get the movies stats."
  }
]);

mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    setInterval(
      async () => {
        await main();
      },
      1000 * 60 * 60 * 2
    );

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Bot is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
