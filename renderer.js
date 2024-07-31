const state = {
  sourcePath: '',
  startDate: '',
  endDate: ''
};

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
