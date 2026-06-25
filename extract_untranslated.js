import fs from 'fs';
import path from 'path';

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walk(filepath, filelist);
    } else {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const files = walk(path.join(process.cwd(), 'src'));
const cyrillicRegex = /[А-Яа-яЁё]+/g;
// We need a better regex to extract the whole string/JSX text containing cyrillic.
// This is hard to do with regex alone. Let's just run grep and manually review the output.
