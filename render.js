document.getElementById('selectFolder').addEventListener('click', async () => {
    const sourcePath = await window.electron.openFolderDialog();
    if (sourcePath) {
      const result = await window.electron.copyJpgFiles(sourcePath);
      document.getElementById('result').textContent = result.message;
    }
  });
  