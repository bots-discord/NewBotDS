const Discord = require('discord.js');
const Canvas = require('canvas');
const config = require('./config.json');
const r = require('snekfetch');
const randomWord = require('random-word');
const fs = require('fs');

let hangman = {};
try {
	hangman = JSON.parse(fs.readFileSync('hangman.json'));
	if (!Object.keys(hangman).length && hangman !== {}) hangman = {};
} catch (e) {} // file doesn't exist [yet]

function match(arg, type, message) {
	if (type === 'author') {
		if (message.author.id === arg) return true;
	} else if (type === 'word') {
		let regex = '\\b';
		regex += escapeRegExp(arg);
		regex += '\\b';
		if (new RegExp(regex, 'i').test(message.content)) return true;
	}
	return false;
}

function escapeRegExp(string){
  return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

exports.commands = {
	setgame: function(client, message, userdata, args) {
		r.post('https://api.twitch.tv/kraken/channels/LeInfiniti?client_id=' + config.client_id)
			.send({
				status: 'Test Status',
				game: 'League of Legends'
			})
			.then(res => console.log(res.body));
	},

  test: function(client, message, userdata, args) {
		if (message.author.id != '142410465027293184') return;
		message.channel.send(randomWord());
	},

  code: 'js',
  js: function(client, message, userdata, args) {
    let msg = args.join(' ');
		if (message.author.id != '142410465027293184') return;
		try {
			let time = process.hrtime();
			let result = eval(msg);
			let diff = process.hrtime(time);

			message.delete();
			message.channel.send("", { embed: {
				color: 16758725,
				fields: [{
						name: '**Input**',
						value: '\`\`\`JavaScript\n' + msg + '\n\`\`\`'
					},
					{
						name: '**Output**',
						value: '\`\`\`JavaScript\n' + result + '\n\`\`\`'
					}],
				footer: {
					text: '(Executed in ' + (diff[0] * 1000 + diff[1] / 1000000) + ' milliseconds)'
				}
			}});
		}
		catch (err) {
			message.channel.send('\`\`\`JavaScript\n' + err + '\n\`\`\`');
		}
	},

	prune: function(client, message, userdata, args) {
		if (message.author.id != '142410465027293184') return;
		if (args.length < 2) {
			message.delete();
			message.channel.send(':x: | **' + message.author.username + '**, the correct syntax is: `>prune <@mention>|<string> <3-100>`\n:white_small_square: e.g. `>prune @Infiniti 10`\n:white_small_square: Get more help using `>help prune`')
				.then((m) => { m.delete(20 * 1000); });
			return;
		}
		let n = args.pop();
		msg = args.join(' ');
		if (message.mentions.members.first()) {
			var type = 'author';
			msg = message.mentions.members.first().id;
		} else {
			var type = 'word';
		}
		message.delete().then(() => {
			let msgs = message.channel.fetchMessages()
				.then(msgs => {
					msgs = msgs.filter(m => match(msg, type, m));
					let msgsArray = msgs.array().slice(0, n);
					message.channel.bulkDelete(msgsArray);
				})
				.then(() => {
					message.channel.send(':wastebasket: | **' + message.author.username + '** successfully deleted ' + n + ' messages from this channel!').then((m) => { m.delete(5 * 1000); });
				})
				.catch(console.error);
		});
	},

/// Everyone ///////////////////////////////////////////////////////////////////

  level: 'points',
	points: function(client, message, userdata, args) {
		message.reply('you are currently level **' + userdata[message.author.id].level + '**, with **' + userdata[message.author.id].points + '** MashiPoints!^-^');
	},

  choose: 'pick',
	pick: function(client, message, userdata, args) {
    let msg = args.join(' ');
		let choices = msg.split(',');
		let num = choices.length;
		if (num < 2) {
			message.delete();
			message.channel.send(':x: | **' + message.author.username + '**, the correct syntax is: `>pick <string 1>, <string 2>, ..., [string n]`\n:white_small_square: e.g. `>pick code bot, do homework`\n:white_small_square: Get more help using `>help pick`')
				.then((m) => { m.delete(20 * 1000); });
			return;
		}
		let pick = Math.floor(Math.random() * num);
		message.channel.send('Randomly picked: **' + choices[pick].trim() + '**!');
	},

	bio: function(client, message, userdata, args) {
    let msg = args.join(' ');
		message.delete();
		if (msg === '') {
			if (!userdata[message.author.id].bio) message.author.send('*You don\'t have a bio message set yet! ;~;*');
			else message.author.send('Your bio message: *"' + userdata[message.author.id].bio + '"*');
		} else {
			if (msg.length > 60) return message.author.send('*Your bio message can\'t be over 60 characters! ;~;*');
			if (!userdata[message.author.id].bio) message.author.send('Your bio message has been changed to: *"' + msg + '"* !')
			else message.author.send('Your bio message has been changed to: *"' + msg + '"* !\nYour old bio message: *"' + userdata[message.author.id].bio + '"*');
			userdata[message.author.id].bio = msg;
		}
		fs.writeFile('./userdata.json', JSON.stringify(userdata), (err) => {
	    if (err) console.error(err);
	  });
	},

	profile: function(client, message, userdata, args) {
		message.delete();

		let Image = Canvas.Image;
		let canvas = new Canvas(400, 200);
		let ctx = canvas.getContext('2d');

		let img = new Image();
		var url = message.author.avatarURL;
		url = url.substring(0, url.indexOf('?'));

		r.get(url).then(res => {
			var dataURL = res.body.toString('base64');
			dataURL = 'data:image/png;base64,' + dataURL;
			img.onload = function() {

				ctx.save();
    		ctx.beginPath();
    		ctx.arc(48, 48, 32, 0, Math.PI * 2, true);
		    ctx.closePath();
		    ctx.clip();
		    ctx.drawImage(img, 16, 16, 64, 64);
		    ctx.restore();

				ctx.strokeStyle = '#ffb7c5';
				ctx.strokeRect(0, 0, 400, 200);

				ctx.fillStyle = message.member.displayHexColor;
				ctx.strokeStyle = message.member.displayHexColor;
//				ctx.shadowColor = '#000000';
//				ctx.shadowBlur = 5;
				ctx.globalCompositeOperation = 'destination-over';

				ctx.beginPath();
				ctx.arc(48, 48, 35, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();

//				ctx.shadowColor = 'transparent';
				ctx.globalCompositeOperation = 'source-over';
				ctx.textAlign = 'start';
				ctx.textBaseline = 'middle';

				ctx.font = 'normal 25px Helvetica Neue, serif';
				ctx.fillText(message.author.username, 100, 32);
				ctx.globalAlpha = 0.5;
				ctx.strokeText(message.author.username, 100, 32);
				ctx.globalAlpha = 1;

				ctx.textAlign = 'center';

				let lvl = userdata[message.author.id].level;
				let nextlvl = userdata[message.author.id].level + 1;
				let xp = userdata[message.author.id].points - Math.pow(10 * lvl, 2);
				let nextxp = Math.pow(10 * nextlvl, 2) -  Math.pow(10 * lvl, 2);
				let xppct = xp / nextxp;

				ctx.beginPath();
				ctx.fillStyle = '#f9f4f4'; // White/Pink
				ctx.fillRect(50, 150, 300, 30);
				ctx.fillStyle = '#ff6262'; // Dark Pink
				ctx.fillRect(55, 155, 290, 20);
				ctx.fillStyle = '#f9f4f4';
				ctx.fillRect(59, 159, 282, 12);
				ctx.fillStyle = '#ffb7c5'; // Light Pink
				ctx.fillRect(59, 160, 282 * xppct, 10);

				ctx.fillStyle = '#000000';
				ctx.font = 'normal 12px Helvetica Neue, serif';
				ctx.fillText(xp + ' / ' + nextxp, 200, 190);

				ctx.font = 'normal 20px Helvetica Neue, serif';
				ctx.fillText(lvl, 25, 165);
				ctx.fillText(nextlvl, 375, 165);

				ctx.strokeStyle = '#d3d3d3';
				ctx.moveTo(100, 48);
				ctx.lineTo(300, 48);
				ctx.stroke();

				if (userdata[message.author.id].bio) {
					ctx.textAlign = 'start'; // 29 characters max
					ctx.font = 'normal 12px Helvetica Neue, serif';
					ctx.fillText(userdata[message.author.id].bio, 100, 58);
				}

				message.channel.send({ files: [{ attachment: canvas.toBuffer(), name: 'profile.jpg' }] });
			}
			img.src = dataURL;
		});
	},

/// Games //////////////////////////////////////////////////////////////////////

	hangman: function(client, message, userdata, args) {
		let word = randomWord();
		hangman.word = word.split();
		hangman.guesses = ['a', 'b', 'c'];
		let spaces = '';
		for (i = word.length; i > 0; i--) spaces += '_ ';
		let guesses = hangman.guesses.join(', ');

		let embed = new Discord.RichEmbed()
			.setAuthor(spaces)
			.setColor(16758725)
			.addField('Wrong Guesses', guesses, true);

		message.channel.send({embed});

		fs.writeFile('./hangman.json', JSON.stringify(hangman), (err) => {
	    if (err) console.error(err);
	  });
	}
};
