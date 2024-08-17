/**
 * @author NeelPoriya1309
 * @description This file is used to test the Google Photos API and MongoDB connection.
 * @details Inorder to run this file you need to setup .env file to have the following variables:
 * - MONGODB_URI: MongoDB connection string
 * - GOOGLE_CLOUD_CLIENT_ID: Google Cloud client ID
 * - GOOGLE_CLOUD_CLIENT_SECRET: Google Cloud client secret
 * - GOOGLE_PHOTOS_REFRESH_TOKEN: Google Photos refresh token
 *
 * Use the following command to run:
 * `npx tsx src/test.ts`
 */

import { config } from "dotenv";
import mongoose from "mongoose";
import MediaItem from "./models/MediaItem.model";
import winston from "winston";
import { logger } from "./lib/helper";
import MovieRequest from "./models/Request";

config();

// mongoose
//   .connect(process.env.MONGODB_URI!)
//   .then(() => {
//     logger.info("Connected to MongoDB");
//   })
//   .catch((error) => {
//     logger.error("Error connecting to MongoDB", error);
//   });

const GOOGLE_PHOTOS_ENDPOINT = "https://photoslibrary.googleapis.com/v1";
const GOOGLE_AUTH_ENDPOINT = "https://oauth2.googleapis.com/token";
const PAGE_SIZE = 100;

const getAccessToken = async () => {
  try {
    const response = await fetch(GOOGLE_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLOUD_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLOUD_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_PHOTOS_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

const storeAllMediaItems = async () => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      logger.error("Failed to get access token");
      return;
    }
    let pageToken = "";
    while (true) {
      const response = await fetch(
        `${GOOGLE_PHOTOS_ENDPOINT}/mediaItems?pageSize=${PAGE_SIZE}&pageToken=${pageToken}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      // filter out all media items whose mimeType doesn't start with "video"
      const mediaItems = data.mediaItems.filter((mediaItem: any) =>
        mediaItem.mimeType.startsWith("video")
      );

      // replace all . in mdeiaItems.filename with " "
      mediaItems.map((mediaItem: any) => {
        mediaItem.filename = mediaItem.filename.replace(/\./g, " ");
      });

      const newMediaItems = await MediaItem.insertMany(mediaItems);

      newMediaItems.map((item) => {
        logger.info(`Added: ${item.filename}`);
      });
      pageToken = data.nextPageToken;
      if (!data.nextPageToken) {
        break;
      }
    }
  } catch (error) {
    logger.error(error);
  }
};

const removeMediaItems = async () => {
  try {
    await MovieRequest.deleteMany({status: "PENDING"});
    await MovieRequest.deleteMany({status: "IN_PROGRESS"});
    await MovieRequest.deleteMany({status: "FAILED"});

    await MediaItem.deleteMany({});
    logger.info("All media items removed");
  } catch (error) {
    logger.error(error);
  }
};

async function removeDuplicates() {

  try {
    // Step 1 & 2: Group by filename and keep the first document of each group
    const groupedDocs = await MediaItem.aggregate([
      {
        $group: {
          _id: "$filename",
          doc: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$doc" }
      }
    ]);

    // Assuming you want to replace the original collection with the deduplicated documents
    // Drop the original collection
    await MediaItem.collection.drop();
    
    // Insert the deduplicated documents back into the collection
    await MediaItem.insertMany(groupedDocs);

    // Commit the transaction
    console.log("Duplicates removed successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}


const main = async () => {
  logger.info("Script: src/test.ts");
  console.log("Refreshing stuff...");

  await removeMediaItems();
  await storeAllMediaItems();
  await removeDuplicates();

  // Close the connection
  // await mongoose.connection.close();

  logger.info("Connection closed");
  logger.info("Script: src/test.ts completed");
};

const fetchUpdatedMediaItem = async (id: string) => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      logger.error("Failed to get access token");
      return null;
    }

    const response = await fetch(`${GOOGLE_PHOTOS_ENDPOINT}/mediaItems/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

// export main and fetchUpdatedMediaItem functions
export { main, fetchUpdatedMediaItem };
