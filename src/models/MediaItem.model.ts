import mongoose, { Schema } from "mongoose";

/**
 * MediaItemSchema
 * Sample of MediaItem:
 * ```
 * {
            "id": "AH5nbAGdNuv5AybChTAm2NReQkjIiUgSozXVlJ4ttSNSI5sfQz4Poa2SCUmbLVk4r-wHpuvWu4Pr9Lg-1t7UaucrzOGNabz0Iw",
            "productUrl": "https://photos.google.com/lr/photo/AH5nbAGdNuv5AybChTAm2NReQkjIiUgSozXVlJ4ttSNSI5sfQz4Poa2SCUmbLVk4r-wHpuvWu4Pr9Lg-1t7UaucrzOGNabz0Iw",
            "baseUrl": "https://lh3.googleusercontent.com/lr/AAJ1LKfmJsE2sJOZciz6Ig8lgpuCiz_T5uxwxWH6m_1RhI90EJ3Y7-I_AZc-NYR6uVb5cRzmuo0RRrqE20FNo3CPtXoXTuTVuEk0Lcoiyq6iZWd1YPlxYXvAbilgw1WNNNl992mWCjASJKYEK_fwGhvyO7Qy4QeYFAAXslAertq-YNuivEa_Ubxkjx_cv2kAArkRbYP0l0Ypz8b6VCWo8D1Sn6-r7fNXadeqiLPmC3sHQzdvpnHbz6oHNl7K3Wncq6zdRDLhoMYavUSbugd9gCcMU4VnJQZXpDw8XLwdUI0Q_UgJaA6sWHizJRqgJYtmPaIZ5zRnpeBMeijxbkQJ9fEDXgGDNSwiGfrkI4Fj4y7mVIORTsF4rIl7GHxohNIRAq9jIM2GHSlVuY71x4IhlckImpt1cVIlUWpplLAnbrbA8jTGjTqJ-au2git7897nmVAp_HsTbGXbj0NCrcezEhRV_rvTTGm1OV7mly-0LlCPZPVAPGvYluMR6bT-xaQ_SBMqumGRDw3hyD6DNW-hVtfKP5KzeSoHsA_SJ3iHthFGv95r92athGgAWi5jqzDxQfU4U8HXuCZaJD6hoBHtPhds-92oEIfW8CtOk1nTVktJeLGRdGr6gDa-rOD2RIJvr1Wnodyz9PZxY62WT-Pv6BSaPCzQGoW99LsrE-rfyWpDI3ReQ127eAnYCl_RFTiC7g2yoCtTtxybceuJzKvzAnN7UJBB0RWFBTLGaG4euMAgUyXVdFxJ3DaA7TExndus-jSecwC5GI-Dm4iC_Zycqt0g3UaKtFe2JnMFxLPfEL-dm1N4TDXa0r1HzixBm1aSkZyIMPUkfl5TheSWOHgwPgjw4W94TFY7AiEWykazCyiCs-WfeyMQI22LXqx-eKvKDhQNP-Y4EDZW6A0HPqrowTZndFVLG-Rl0Guvc03Voj98JxwOiiij5Hu2xmolig_yoljP8wM6KvH1l63zvN_dgVeYTz9aICFi",
            "mimeType": "video/mp4",
            "mediaMetadata": {
                "creationTime": "2024-03-03T20:22:35Z",
                "width": "1080",
                "height": "1920",
                "video": {
                    "fps": 29.970029970029969,
                    "status": "READY"
                }
            },
            "filename": "ocean.mp4"
        }
    ```
 */

const MediaItemSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  productUrl: {
    type: String,
    required: true,
  },
  baseUrl: {
    type: String,
  },
  mimeType: {
    type: String,
  },
  mediaMetadata: {
    creationTime: {
      type: Date,
    },
    width: {
      type: String,
    },
    height: {
      type: String,
    },
    video: {
      fps: {
        type: Number,
      },
      status: {
        type: String,
      },
    },
  },
  filename: {
    type: String,
    required: true,
  },
});

const MediaItem = mongoose.model("MediaItem", MediaItemSchema);

export default MediaItem;
