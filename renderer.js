const state = {
  sourcePath: '',
  startDate: '',
  endDate: ''
};

// Function to set today's date as the default value
function setTodayDate() {
  const today = new Date().toISOString().split('T')[0]; // Gets today's date in yyyy-mm-dd format
  document.getElementById('start-date').value = today;
  document.getElementById('end-date').value = today;
}

//Init the last directory and set todays date
(async () => {
  try {
    const lastDir = await window.electron.getLastDirectory();
    if (lastDir) {
      state.sourcePath = lastDir;
      document.getElementById('selected-folder').innerText = lastDir;
    }
  } catch (error) {
    console.error('Error retrieving last directory:', error);
  }
  setTodayDate();
})();

// Progress indicator
document.addEventListener('DOMContentLoaded', () => {
  const progressText = document.getElementById('progress-text');
  // Copying started
  window.electron.on('copy-progress', () => {    
    progressText.textContent = `Copying file...`;
  });
  
  // Copying finished
  window.electron.on('copy-progress-finished', (nrOfFilesCopied) => {    
    progressText.textContent = `Copied ${nrOfFilesCopied} files`;
  });
});

document.getElementById('select-folder').addEventListener('click', async () => {
  const folderPath = await window.electron.openFolder();
  if (folderPath) {
    state.sourcePath = folderPath;
    document.getElementById('selected-folder').innerText = folderPath;
  }
});

document.getElementById('start-date').addEventListener('change', (event) => {
  state.startDate = event.target.value;
});

document.getElementById('end-date').addEventListener('change', (event) => {
  state.endDate = event.target.value;
});

document.getElementById('copy-files').addEventListener('click', async () => {
  const { sourcePath, startDate, endDate } = state;
  const result = await window.electron.copyJpgFiles(sourcePath, startDate, endDate);
});