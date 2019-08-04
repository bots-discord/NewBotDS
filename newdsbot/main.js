const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const colors = require('colors');
const fs = require('fs');
const r = require('snekfetch');

let userdata = {};
try {
	userdata = JSON.parse(fs.readFileSync('userdata.json'));
	if (!Object.keys(userdata).length && userdata !== {}) userdata = {};
} catch (e) {} // file doesn't exist [yet]

var Commands = require('./commands.js').commands;
var isStreaming = false;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Functions ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function twitch() {
	setTimeout(function () {
		r.get('https://api.twitch.tv/kraken/streams/leinfiniti/?client_id=' + config.client_id).then(res => {
			if (res.body.stream == null) {
				isStreaming = false;
			} else {
				if (isStreaming == false) {
					let game = res.body.stream.game.substring(0, 15) + '...';
					let embed = new Discord.RichEmbed()
						.setTitle(res.body.stream.channel.status)
						.setAuthor('LeInfiniti', res.body.stream.channel.logo)
						.setURL('https://www.twitch.tv/LeInfiniti')
						.setColor(16758725)
						.setThumbnail(res.body.stream.channel.logo)
						.addField('Played Game', game, true)
						.addField('Viewers', res.body.stream.viewers, true)
						.setImage(res.body.stream.preview.medium);
					let chan = client.channels.find('id', '316677424324673556');
					chan.send('@everyone Infiniti is now live at <https://www.twitch.tv/LeInfiniti>!^-^');
					chan.send({embed});
				}
				isStreaming = true;
			}
		});
		twitch();
	}, 1000 * 60);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Startup //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

client.on('ready', () => {
	console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n');
	console.log('------------------------------------------------------------------------------------------------------------------------'.gray);
	console.log('                                  Connecting to ' + 'Infiniti\'s Magical Friendship Castle'.green + '...');
	console.log('');
	console.log('                                                  - '.gray + 'discord   ' + 'LOADED'.green);
	console.log('                                                  - '.gray + 'config    ' + 'LOADED'.green);
	console.log('                                                  - '.gray + 'commmands ' + 'LOADED'.green);
	console.log('');
	console.log('                                                     Connected!'.green + '^-^');
	console.log('');
	console.log('------------------------------------------------------------------------------------------------------------------------'.gray);

	twitch();
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Chat Parsing /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

client.on('message', async message => {
	if (message.author.bot) return;

	let id = message.author.id;
	let msg = message.content;

	if (!userdata[id]) userdata[id] = {
		points: 0,
		level: 0
	};

	let user = userdata[id];

	if (!msg.startsWith(config.prefix)) {

/// Points ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	user.points += (msg.length > 100 ? 10 : Math.ceil(msg.length / 10));

	let curLevel = Math.floor(0.1 * Math.sqrt(user.points)); // (10 * level) ^ 2 = points required for level
  if (curLevel > user.level) {
    user.level = curLevel;
    message.reply('you\'ve leveled up to level **' + curLevel + '**, congrats!^-^');
  }

	fs.writeFile('./userdata.json', JSON.stringify(userdata), (err) => {
    if (err) console.error(err);
  });
}

/// Commands /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

else {

	let args = msg.split(' '); 														// ['>test', 'arg1', 'arg2']
	cmd = args.shift().substring(1); 											// 'test'
//	msg = (input.length > 0 ? input.join(' ') : '');

	if (Commands[cmd]) {
		let failsafe = 0;
		while (typeof Commands[cmd] !== 'function' && failsafe++ < 10) {
			cmd = Commands[cmd];
		}
		if (typeof Commands[cmd] === 'function') {
			try {
				Commands[cmd].call(this, client, message, userdata, args);
			} catch (e) {
				console.error(e);
			}
		} else {
			console.error('invalid command type for ' + cmd + ': ' + (typeof Commands[cmd]));
		}
	}

/// Developer //////////////////////////////////////////////////////////////////

	if (cmd === 'update') {
		if (id != '142410465027293184') return;
		try {
			let time = process.hrtime();
			delete require.cache[require.resolve('./commands.js')];
			Commands = require('./commands.js').commands;
			let diff = process.hrtime(time);

			message.delete();
			message.channel.send("", { embed: {
				color: 16758725,
				fields: [{
						name: ':white_check_mark: **Update Complete**',
						value: 'Commands have been successfully reloaded!'
					}],
				footer: {
					text: '(Executed in ' + (diff[0] * 1000 + diff[1] / 1000000) + ' milliseconds)'
				}
			}}).then((m) => { m.delete(5 * 1000); });
		}
		catch (err) {
			message.channel.send('\`\`\`JavaScript\n' + err + '\n\`\`\`').then((m) => { m.delete(5 * 1000); });
		}
	}
}});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// New Member ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

client.on('guildMemberAdd', member => {
  member.guild.defaultChannel.send(`Welcome to the server, ${member}!^-^`);
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Login ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

client.login(config.token);
