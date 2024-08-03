import mongoose, { Schema } from "mongoose";

const MovieOptionSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  movie_id: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
  },
});

const MovieOption = mongoose.model("MovieOption", MovieOptionSchema);

export default MovieOption;
