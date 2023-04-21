require("dotenv").config();

const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const { Configuration, OpenAIApi } = require("openai");

const client = new Client({
  authStrategy: new LocalAuth(),
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);
const fs = require('fs');

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (msg) => {
  if (msg.body === "!ping") {
    msg.reply("pong");
  } else if (msg.body === "hi" || msg.body === "hello" || msg.body === "halo") {
    client.sendMessage(msg.from, "Untuk list command ketik !command");
  } else if (msg.body === "!command") {
    msg.reply(`*Command List*
    1. !ping
    2. !ask 
    3. !audiosumm (with audio file attachment)
    4. (In progress...)`);
  } else if (msg.body.startsWith("!ask ")) {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: msg.body.slice(5) }],
      max_tokens: 100,
      temperature: 0,
    });
    msg.reply(completion.data.choices[0].message.content);
  } else if (msg.body === "!audiosumm" && msg.hasMedia) {
    const attachmentData = await msg.downloadMedia();

    msg.reply(`
    *Media info*
    MimeType: ${attachmentData.mimetype}
    Filename: ${attachmentData.filename}
    Data (length): ${attachmentData.data.length}
    `);

    // const resp = await openai.createTranscription(
    //   attachmentData,
    //   "whisper-1"
    // );

    // msg.reply(resp.data.text);
  }
});

client.initialize();
