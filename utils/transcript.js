const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');

async function sendTranscript(channel, user, logChannel, client) {
  // Fetch all messages in the channel
  let messages = [];
  let lastId;
  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId });
    if (fetched.size === 0) break;
    messages = messages.concat(Array.from(fetched.values()));
    lastId = fetched.last().id;
    if (fetched.size < 100) break;
  }
  messages = messages.reverse();
  // Format transcript
  const transcript = messages.map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`).join('\n');
  const fileName = `transcript-${channel.id}.txt`;
  fs.writeFileSync(fileName, transcript);
  // Send to user
  try {
    await user.send({ content: 'Here is your ticket transcript.', files: [fileName] });
  } catch (e) {
    // User DMs closed
  }
  // Send to log channel
  if (logChannel) {
    const attachment = new AttachmentBuilder(fileName);
    await logChannel.send({ content: `Transcript for ticket <#${channel.id}>`, files: [attachment] });
  }
  fs.unlinkSync(fileName);
}

module.exports = { sendTranscript };
