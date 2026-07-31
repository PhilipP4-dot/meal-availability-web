const [major, minor] = process.versions.node.split(".").map(Number);

if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`\nThis project requires Node.js 22.13 or newer. You are using ${process.version}.`);
  console.error("Install Node.js 22 LTS, open a new terminal, then run npm install and npm run dev.\n");
  process.exit(1);
}
