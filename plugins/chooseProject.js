
import { parseJavaProject } from "./javaParser.js";

Draw.loadPlugin(function(editorUi)
{
	mxResources.parse('chooseProject=Choose Project...');
	editorUi.actions.addAction('chooseProject', function()
	{
		if (this.chooseProjectWindow == null)
		{
			var w = 420, h = 240;
			var bw = document.documentElement.clientWidth || document.body.clientWidth || 0;
			var bh = document.documentElement.clientHeight || document.body.clientHeight || 0;
			var x = Math.max(0, (bw - w) / 2);
			var y = Math.max(0, (bh - h) / 2);
			this.chooseProjectWindow = new ChooseProjectWindow(editorUi, x, y, w, h);
			this.chooseProjectWindow.window.setVisible(true);
		}
		else
		{
			this.chooseProjectWindow.window.setVisible(!this.chooseProjectWindow.window.isVisible());
		}
	});

	var menu = editorUi.menus.get('extras');
	var oldFunct = menu.funct;
	menu.funct = function(menu, parent) {
		oldFunct.apply(this, arguments);
		editorUi.menus.addMenuItems(menu, ['-', 'chooseProject'], parent);
	};

	var ChooseProjectWindow = function(editorUi, x, y, w, h)
	{
		var main = document.createElement('div');
		main.style.display = 'flex'; main.style.flexDirection = 'column'; main.style.height = '100%'; main.style.padding = '8px';
		var selectedFolderPath = '';
		var selectedFiles = [];

		var setSelection = function(folderPath)
		{
			selectedFolderPath = folderPath || '';
			selectedLabel.textContent = selectedFolderPath ? 'Selected: ' + folderPath : 'No folder selected';
			saveBtn.disabled = selectedFiles.length === 0;
		};

		var info = document.createElement('div');
		info.textContent = 'Pick a project folder (reads .java files)'; info.style.textAlign = 'center';

		var hiddenInput = document.createElement('input');
		hiddenInput.type = 'file'; hiddenInput.style.display = 'none'; hiddenInput.multiple = true;
		hiddenInput.setAttribute('webkitdirectory', true); hiddenInput.setAttribute('directory', true);

		var selectedLabel = document.createElement('div');
		selectedLabel.textContent = 'No folder selected'; selectedLabel.style.textAlign = 'center';

		async function loadFiles(fileList)
		{
			var filesArr = Array.from(fileList || []).filter(function(f){ return f.name && f.name.toLowerCase().endsWith('.java'); });
			if (!filesArr.length) {
				selectedFiles = [];
				setSelection('');
				return;
			}

			try {
				var withText = await Promise.all(filesArr.map(async function(f){
					var text = await f.text();
					return { name: f.webkitRelativePath || f.name, text: text };
				}));
				selectedFiles = withText;
				var base = filesArr[0].webkitRelativePath || filesArr[0].name;
				var folderName = (base.split(/[\\/]/)[0]) || base;
				setSelection(folderName);
			} catch (e) {
				console.log('Failed to read files', e);
				selectedFiles = [];
				setSelection('');
			}
		}

		var chooseBtn = mxUtils.button('Choose', function()
		{
			hiddenInput.click();
		});

		var saveBtn = mxUtils.button('Next', async function()
		{
			if (!selectedFiles.length) { return; }
			try {
				var result = parseJavaProject(selectedFiles);
				if (typeof showClassMethodsViewer === 'function') {
					showClassMethodsViewer(result.project, { title: 'Parsed Java Project' });
				} else {
					if (typeof mxUtils !== 'undefined' && mxUtils.alert) { mxUtils.alert('Class Methods Viewer is unavailable.'); }
					console.log('showClassMethodsViewer is not defined');
				}
			} catch (e) {
				if (typeof mxUtils !== 'undefined' && mxUtils.alert) { mxUtils.alert('Parsing failed: ' + (e.message || e)); }
				console.log('Parsing failed', e);
			}
		});
		saveBtn.disabled = true;

		var center = document.createElement('div');
		center.style.display = 'flex'; center.style.flexDirection = 'column'; center.style.alignItems = 'center';
		center.style.justifyContent = 'center'; center.style.flex = '1'; center.style.gap = '6px';

		var selectRow = document.createElement('div');
		selectRow.style.display = 'flex'; selectRow.style.gap = '8px';
		selectRow.appendChild(chooseBtn);

		center.appendChild(info);
		center.appendChild(selectRow);
		center.appendChild(selectedLabel);
		center.appendChild(saveBtn);

		main.appendChild(center);
		main.appendChild(hiddenInput);

		hiddenInput.addEventListener('change', function()
		{
			if (hiddenInput.files && hiddenInput.files.length > 0)
			{
				loadFiles(hiddenInput.files);
			}
			else
			{
				selectedFiles = [];
				setSelection('');
			}
		});

		this.window = new mxWindow('Choose Project', main, x, y, w, h, true, true);
		this.window.destroyOnClose = false;
		this.window.setMaximizable(false);
		this.window.setResizable(true);
		this.window.setClosable(true);
		this.window.setVisible(true);
		this.window.setSize(w, h);
	};
});
