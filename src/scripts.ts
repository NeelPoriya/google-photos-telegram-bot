namespace Script {
  export const START_TXT = `<b>Hᴇʟʟᴏ {},
Mʏ Nᴀᴍᴇ Is <a href="https://t.me/{}">{}</a>, I Cᴀɴ Pʀᴏᴠɪᴅᴇ Mᴏᴠɪᴇs, Jᴜsᴛ Aᴅᴅ Mᴇ Tᴏ Yᴏᴜʀ Gʀᴏᴜᴘ As Aᴅᴍɪɴ Aɴᴅ Eɴᴊᴏʏ 😍

🌿 𝐌𝐚𝐢𝐧𝐭𝐚𝐢𝐧𝐞𝐝 𝐁𝐲 : <a href='https://t.me/Sam_Dude2'>Sam_dude</a></b>`;

  // Function to replace placeholders with custom text
  export function getModifiedStartTxt(
    name: string,
    username: string,
    botname: string
  ): string {
    return START_TXT.replace("{}", name)
      .replace("{}", username)
      .replace("{}", botname);
  }
}

namespace Utils {
  export const photos = [
    "https://graph.org/file/387d2fbef1e9be2d78d30.jpg",
    "https://graph.org/file/9a5e509805fe2b5707e19.jpg",
    "https://graph.org/file/51586ac3affdacce111aa.jpg",
  ];
}

export { Script, Utils };
