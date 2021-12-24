const Handlebars = require('handlebars');
const postcssConfig = require('./postcss.config.js');
const tailwindConfig = require('tailwindcss');
const compileCss = require('tailwindcss/lib/cli/compile.js').default;
const fs = require('fs');
const minify = require('html-minifier').minify;
const cheerio = require('cheerio');
const $ = cheerio.load('<body>');
const spawn = require('child_process').spawn;
const { default: ChordSheet, Chord } = require('chordsheetjs');
const pythonRomanize = spawn('python', ['./romanize.py']);
pythonRomanize.stderr.setEncoding('utf8');
pythonRomanize.stderr.on('data', data => {
  console.log(data.toString());
});

const SONGS = fs.readdirSync('./song').sort();
console.log(SONGS);

async function compileTailwind() {
  const plugins = tailwindConfig('./tailwind.config.js').plugins;
  plugins.push(...postcssConfig.plugins);
  const result = await compileCss({
    inputFile: './build/style.css',
    plugins,
  });
  return result.css;
}

function firstChord(song) {
  for (const line of song.lines) {
    for (const item of line.items) {
      if (item.chords) {
        return item.chords;
      }
    }
  }
}

function chordDistance(from, to) {
  from = Chord.parse(from);
  let distance = 0;
  for (; distance < 10; ++distance) {
    if (from.toString() === to) {
      return -distance;
    }
    from = from.transposeDown();
  }
  return 0;
}

function transposeSong(song, toChord) {
  const chord = firstChord(song);
  let distance = 0;
  if (toChord.length <= 2) {
    distance = chordDistance(chord, toChord);
  }
  if (distance === 0) {
    return;
  }
  for (const line of song.lines) {
    for (const item of line.items) {
      if (item.chords) {
        item.chords = Chord.parse(item.chords).transpose(distance).toString();
      }
    }
  }
}

async function processSong(file, num) {
  const chordpro = fs.readFileSync(`./song/${file}`, 'utf8');
  const htmlFormatter = new ChordSheet.HtmlDivFormatter();
  const parser = new ChordSheet.ChordProParser();
  const song = parser.parse(chordpro);
  transposeSong(song, file.split('-')[1]);
  let romanizedSong = parser.parse(chordpro);
  transposeSong(romanizedSong, file.split('-')[1]);
  romanizedSong.metadata.title = await romanize(song.metadata.title);
  for (const line of romanizedSong.lines) {
    for (const item of line.items) {
      if (item instanceof ChordSheet.Tag) {
        item._value = await romanize(item._value);
      } else if (item instanceof ChordSheet.ChordLyricsPair) {
        item.lyrics = await romanize(item.lyrics) + ' ';
      }
    }
  }
  const id = romanizedSong.metadata.title.replace(/ /g, '-');
  song.metadata.title = `${num}. ${song.metadata.title}`;
  romanizedSong.metadata.title = `${num}. ${romanizedSong.metadata.title}`;
  $('body').append(`
<div id="${id}" class="song">
  <div class="th">
    ${htmlFormatter.format(song)}
  </div>
  <div class="en">
    ${htmlFormatter.format(romanizedSong)}
  </div>
</div>
  `);
  $('.nav-select.th').append($('<option>').val(`#${id}`).text(song.metadata.title));
  $('.nav-list.th').append($('<li>').append($('<a>').attr('href', `#${id}`).text(song.metadata.title)));
  $('.nav-select.en').append($('<option>').val(`#${id}`).text(romanizedSong.metadata.title));
  $('.nav-list.en').append($('<li>').append($('<a>').attr('href', `#${id}`).text(romanizedSong.metadata.title)));
}

function compile(source, destination, data) {
  const html = fs.readFileSync(source, 'utf8');
  const template = Handlebars.compile(html);
  let result = template(data);
  result = minify(result, {
    collapseWhitespace: false,
    collapseBooleanAttributes: true,
    caseSensitive: true,
    decodeEntities: true,
    minifyCSS: true,
    removeComments: true,
    removeAttributeQuotes: true,
    quoteCharacter: '"',
    useShortDoctype: true,
    removeOptionalTags: true,
  });
  fs.writeFileSync(destination, result);
}

async function romanize(text) {
  if (!/[\u0E00-\u0E7F]/gmu.test(text)) {
    return text;
  }
  return new Promise(resolve => {
    pythonRomanize.stdin.setEncoding('utf8');
    pythonRomanize.stdin.cork();
    pythonRomanize.stdin.write(text.replace(/\s*/g, '') + '\n');
    pythonRomanize.stdin.uncork();
    pythonRomanize.stdout.setEncoding('utf8');
    pythonRomanize.stdout.on('data', data => {
      const output = data.toString().slice(0, -1);
      resolve(JSON.parse(output.substr(output.indexOf('['))).join(' '));
    });
  });
}

async function main() {
  fs.mkdirSync(`./build`, { recursive: true });
  require('esbuild').build({
    entryPoints: ['./src/index.js'],
    bundle: true,
    minify: true,
    outfile: './build/build.js',
  });
  const $mobileNav = $('<div>').addClass('m-nav');
  $('body').prepend($('<ul>').addClass('nav-list en'));
  $('body').prepend($('<ul>').addClass('nav-list th'));
  $('.nav-list').append($('<li>').html($('<button>').text('Can\'t read Thai?').addClass('change-lang th').attr('data-target', 'en')));
  $('.nav-list').append($('<li>').html($('<button>').text('เปลี่ยนให้เป็นภาษาไทย').addClass('change-lang en').attr('data-target', 'th')));
  $mobileNav.append($('<select>').addClass('nav-select en'));
  $mobileNav.append($('<select>').addClass('nav-select th'));
  $mobileNav.append($('<button>').text('EN').addClass('change-lang th').attr('data-target', 'en'));
  $mobileNav.append($('<button>').text('TH').addClass('change-lang en').attr('data-target', 'th'));
  $('body').prepend($mobileNav);
  for (let i = 0; i < SONGS.length; ++i) {
    await processSong(SONGS[i], i + 1);
  }
  $('h1').addClass('title');
  const cssContent = fs.readFileSync('./src/style.css', 'utf8') + ChordSheet.HtmlDivFormatter.cssString();
  fs.writeFileSync('./build/style.css', cssContent);
  content = $('body').html();
  const javascript = fs.readFileSync('./build/build.js', 'utf8');
  fs.writeFileSync('./build/index.html', content);
  const data = {
    content,
    javascript,
    style: await compileTailwind(),
  };
  fs.mkdirSync('./public', { recursive: true });
  compile('./src/index.html', `./public/index.html`, data);
  pythonRomanize.kill();
  console.log(new Date());
}

main();
