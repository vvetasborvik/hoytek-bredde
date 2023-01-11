import 'dotenv/config';
import express from 'express';
import { DateTime } from 'luxon';
import axios from 'axios';
import { Client, Events, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import { VerifyDiscordRequest, getRandomEmoji, DiscordRequest } from './utils.js';
import {
  JOIN_COMMAND,
  HasGuildCommands,
} from './commands.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let channel = null

client.once(Events.ClientReady, c => {
  channel = client.channels.cache.get('942115367935967264');
  console.log('Ready! Logged in as '+c.user.tag);
  console.log('Currently sending updates in :'+channel)
});

client.login(process.env.DISCORD_TOKEN);


// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "join" guild command
    if (name === 'join') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: 'hello world <a href="https://strava.com>Link to Join</a>',
        },
      });
    }
    // additional guild commands go here: 
  }

});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.js are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    JOIN_COMMAND,
  ]);
});


setInterval(() => {

    axios.get('https://www.strava.com/api/v3/clubs/1100648/activities?page=1&per_page=4', {
        headers: {
            'Authorization': 'Bearer '+process.env.STRAVA_KEY
        }
    }).then((response) => {

      const data = response.data

      const activityName = data[0].name
      const athlete = data[0].athlete.firstname+' '+data[0].athlete.lastname
      const dist = (data[0].distance/1600).toFixed(2)
      const seconds = data[0].moving_time
      let duration = 0
      if(seconds > 3600) {
        const hours = (seconds/3600).toFixed(0)
        const minutes = ((seconds%3600)/60).toFixed(0)
        duration = hours+' Hr '+minutes+' Min'
      } else {
        const minutes =(seconds/60).toFixed(0)
        duration = minutes+' Min'
      }

      const speed = (dist/(seconds/3600)).toFixed(1)
      const paceRaw = (seconds/dist)
      const paceMin = (paceRaw/60).toFixed(0)
      let paceSec = ((paceRaw%60)*60).toFixed(0)
      if(paceSec < 10) {
        paceSec.toString().padStart(2, 0)
      }
      const pace = paceMin+':'+paceSec

      const activity = data[0].type

      const message = athlete+' just completed a '+dist+' mile '+activity+'!'

      console.log(response.data);

      if(activty === 'Ride') {

        // inside a command, event listener, etc.
        const exampleEmbed = new EmbedBuilder()
          .setColor('#77c471')
          .setTitle(activityName)
          .setDescription(message)
          .addFields(
            { name: 'Distance', value: dist+' Miles', inline: true },
            { name: 'Time', value: duration, inline: true },
            { name: 'Avg Speed', value: speed+' mph', inline: true },
          )         
          .setTimestamp()
          .setFooter({ text: 'MLC Wave Runners' });
        channel.send({ embeds: [exampleEmbed] });

      } else if(activty === 'Ride') {

        // inside a command, event listener, etc.
        const exampleEmbed = new EmbedBuilder()
          .setColor('#77c471')
          .setTitle(activityName)
          .setDescription(message)
          .addFields(
            { name: 'Distance', value: dist+' Miles', inline: true },
            { name: 'Time', value: duration, inline: true },
            { name: 'Avg Pace', value: pace+' per mile', inline: true },
          )          
          .setTimestamp()
          .setFooter({ text: 'MLC Wave Runners' });
        channel.send({ embeds: [exampleEmbed] });

      } else {

        // inside a command, event listener, etc.
        const exampleEmbed = new EmbedBuilder()
          .setColor('#77c471')
          .setTitle(activityName)
          .setDescription(message)
          .addFields(
            { name: 'Distance', value: dist+' Miles', inline: true },
            { name: 'Time', value: duration, inline: true },
          )          
          .setTimestamp()
          .setFooter({ text: 'MLC Wave Runners' });
        channel.send({ embeds: [exampleEmbed] });

      }
      
      

        
    }).catch((error) => {
        console.error(error);
    });
}, 60000);
