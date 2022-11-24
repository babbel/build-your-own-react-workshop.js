const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const execSyncWrapper = command => {
  let stdout = null;
  try {
    stdout = execSync(command).toString().trim();
  } catch (error) {
    console.error(error);
  }
  return stdout;
};

const getGitBranch = () => {
  let gitBranch = execSyncWrapper('git rev-parse --abbrev-ref HEAD');

  const obj = {
    gitBranch,
  };

  const filePath = path.resolve('todo-app/public', 'generatedGitBranch.json');
  const fileContents = JSON.stringify(obj, null, 2);

  fs.writeFileSync(filePath, fileContents);
  console.log(`Wrote the current git branch to ${filePath}`);
};

getGitBranch();
