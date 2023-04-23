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
const { exec } = require("child_process");

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
    client.sendMessage(msg.from, "Halo, untuk tutorial ketik: !tutor");

  } else if (msg.body === "!tutor") {
    msg.reply(`*Bot ini akan menjawab otomatis jika kamu mengetik:*
    1. !ping
    2. !ask (pertanyaan) >> _untuk menjawab pertanyaan apa saja._
    3. _pertanyaan juga bisa diajukan melalui voice chat langsung tanpa mengetik !ask_
    4. !rangkum(Kirim beserta file audio) >> _untuk merangkum rekaman suara_
    5. (In progress...)
    
    Contoh: !ask berapa kalori nasi putih?`);

  } else if (msg.body.startsWith("!ask ")) {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: msg.body.slice(5) }],
      temperature: 0,
    });
    msg.reply(completion.data.choices[0].message.content);
    
  } else if (msg.hasMedia) {
    const attachmentData = await msg.downloadMedia();
    // Ignore non-audio media
    if (!attachmentData || !attachmentData.mimetype.startsWith("audio/")) {
      msg.reply('File invalid. Tolong kirimkan file audio.')
    };
    const audioData = Buffer.from(attachmentData.data, 'base64');

    fs.writeFile('./audio/audio.mp3', audioData, function(err) {
        if(err) throw err;
        console.log('Audio file saved!');
    });

    const allowedCommands = ["whisper"];
    const command = "whisper ./audio/audio.mp3 --task transcribe --language Indonesian --output_format txt  --output_dir ./audio/txt";

    if (!command.startsWith(allowedCommands[0])) {
      console.error("Command not allowed");
      return;
    }
    
    exec(`${command}`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      try {
        const teks = fs.readFileSync('./audio/txt/audio.txt', 'utf8');

        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: teks }],
          temperature: 0,
        });
        msg.reply(completion.data.choices[0].message.content);
      } catch (err) {
        console.error(err);
      }
    });
  } else if (msg.body.startsWith("!rangkum") && msg.hasMedia) {
    const attachmentData = await msg.downloadMedia();
    // Ignore non-audio media
    if (!attachmentData || !attachmentData.mimetype.startsWith("audio/")) {
      msg.reply('File invalid. Tolong kirimkan file audio.')
    };
    const audioData = Buffer.from(attachmentData.data, 'base64');

    fs.writeFile('./audio/audio.mp3', audioData, function(err) {
        if(err) throw err;
        console.log('Audio file saved!');
    });

    const allowedCommands = ["whisper"];
    const command = "whisper ./audio/audio.mp3 --task transcribe --language Indonesian --output_format txt  --output_dir ./audio/txt";

    if (!command.startsWith(allowedCommands[0])) {
      console.error("Command not allowed");
      return;
    }
    
    exec(`${command}`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      try {
        const teks = fs.readFileSync('./audio/txt/audio.txt', 'utf8');

        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {role: "user", content: "Rangkum poin penting hasil rekaman ini: "},
            { role: "user", content: teks }
          ],
          temperature: 0,
        });
        msg.reply(completion.data.choices[0].message.content);
      } catch (err) {
        console.error(err);
      }
    });
  }
});

client.initialize();
