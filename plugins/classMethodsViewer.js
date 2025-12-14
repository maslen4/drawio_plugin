/*
 * showClassMethodsViewer(json, opts)
 * Displays a modal-like window (mxWindow) with classes/methods/attributes
 * Accepts: "json" (object) matching schema: { classes: [ { ClassName: { methods: [...], attributes: [...] } }, ... ] }
 * Returns: Promise which resolves to the user selection object or null when cancelled
 *
 * Usage (from another plugin):
 *   showClassMethodsViewer(json).then(selection => { console.log(selection); });
 */

(function(global){

function showClassMethodsViewer(json, opts)
{
	opts = opts || {};
	// Default window geometry
	var w = opts.width || 700;
	var h = opts.height || 500;
	var x = opts.x || Math.max(20, (document.body.offsetWidth - w) / 2);
	var y = opts.y || 120;

	// Validate JSON
	if (!json || !Array.isArray(json.classes)) {
		return Promise.reject(new Error('Invalid JSON: expected object with "classes" array'));
	}

	return new Promise(function(resolve)
	{
		var classes = json.classes.slice(); // local copy
		var expandedClasses = new Set();
		var expandedSections = new Set();
		var selectedItem = null; // selection state for UI

		// Create UI root
		var main = document.createElement('div');
		main.className = 'cmv-main';

		// Header
		var header = document.createElement('div');
		header.className = 'cmv-header';

		var title = document.createElement('span');
		title.textContent = opts.title || 'Java Classes & Methods';
		title.className = 'cmv-title';
		header.appendChild(title);

		main.appendChild(header);

		// List container
		var listContainer = document.createElement('div');
		listContainer.className = 'cmv-list-container';

		// Helper: build result object
		function buildResult(item) {
			if (!item) return null;
			var classObj = classes[item.classIndex] || {};
			var className = Object.keys(classObj)[0];
			var classData = classObj[className] || {};

			if (item.type === 'method') {
				var methodObj = classData.methods && classData.methods[item.itemIndex];
				var methodName = item.name;
				var methodData = methodObj && methodObj[methodName];
				return {
					type: 'method',
					className: className,
					methodName: methodName,
					methodData: methodData || null,
					signature: item.details || null,
					classIndex: item.classIndex,
					methodIndex: item.itemIndex
				};
			}
			else if (item.type === 'attribute') {
				var attrObj = classData.attributes && classData.attributes[item.itemIndex];
				var attrName = item.name;
				var attrData = attrObj && attrObj[attrName];
				return {
					type: 'attribute',
					className: className,
					attributeName: attrName,
					attributeData: attrData || null,
					signature: item.details || null,
					classIndex: item.classIndex,
					attributeIndex: item.itemIndex
				};
			}

			return null;
		}

		// setSelected resolves the promise with a structured object
		var resolved = false;
		function setSelected(type, classIndex, itemIndex, name, details)
		{
			selectedItem = { type: type, classIndex: classIndex, itemIndex: itemIndex, name: name, details: details };
			renderList();

			// Resolve with structured result then cleanup
			if (!resolved)
			{
				resolved = true;
				var res = buildResult(selectedItem);
				// If a method was selected, offer to save a txt with class/method info
				if (res && res.type === 'method') {
					try {
						var text = 'Class: ' + res.className + '\nMethod: ' + res.methodName;
						var blob = new Blob([text], { type: 'text/plain' });
						var url = URL.createObjectURL(blob);
						var link = document.createElement('a'); link.href = url; link.download = (res.className + '_' + res.methodName + '.txt'); link.click();
						setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
					} catch (e) { console.log('Failed to save selection', e); }
				}
				try { win.setVisible(false); } catch(e) {}
				try { win.destroy(); } catch(e) {}
				resolve(res);
			}
		}

		// Render list
		function renderList()
		{
			listContainer.innerHTML = '';

			if (classes.length === 0) {
				var emptyMsg = document.createElement('div');
				emptyMsg.className = 'cmv-empty-message';
				emptyMsg.textContent = 'No classes provided.';
				listContainer.appendChild(emptyMsg);
				return;
			}

			classes.forEach(function(classItem, classIndex){
				var className = Object.keys(classItem)[0];
				var classData = classItem[className];
				var isExpanded = expandedClasses.has(classIndex);

				// Class row
				var classRow = document.createElement('div');
				classRow.className = 'cmv-class-row';

				var toggleBtn = document.createElement('button');
				toggleBtn.className = 'cmv-toggle-btn';
				toggleBtn.textContent = isExpanded ? '▼' : '▶';
				toggleBtn.onclick = function(e){ e.stopPropagation(); if (expandedClasses.has(classIndex)) expandedClasses.delete(classIndex); else expandedClasses.add(classIndex); renderList(); };
				classRow.appendChild(toggleBtn);

				var classIcon = document.createElement('span');
				classIcon.className = 'cmv-class-icon';
				classIcon.textContent = 'C';
				classRow.appendChild(classIcon);

				var classNameSpan = document.createElement('span');
				classNameSpan.className = 'cmv-class-name';
				classNameSpan.textContent = className;
				classNameSpan.onclick = function(){ if (expandedClasses.has(classIndex)) expandedClasses.delete(classIndex); else expandedClasses.add(classIndex); renderList(); };
				classRow.appendChild(classNameSpan);

				listContainer.appendChild(classRow);

				if (isExpanded)
				{
					// Methods
					if (classData.methods && classData.methods.length > 0) {
						var methodsHeader = document.createElement('div');
						methodsHeader.className = 'cmv-section-header';

						var methodsToggle = document.createElement('button');
						methodsToggle.className = 'cmv-section-toggle';
						var methodsKey = classIndex + ':methods';
						var methodsExpanded = expandedSections.has(methodsKey);
						methodsToggle.textContent = methodsExpanded ? '▼' : '▶';
						methodsToggle.onclick = function(e){ e.stopPropagation(); if (expandedSections.has(methodsKey)) expandedSections.delete(methodsKey); else expandedSections.add(methodsKey); renderList(); };
						methodsHeader.appendChild(methodsToggle);

						var methodsLabel = document.createElement('span');
						methodsLabel.className = 'cmv-section-label';
						methodsLabel.textContent = 'Methods';
						methodsHeader.appendChild(methodsLabel);

						listContainer.appendChild(methodsHeader);

						if (methodsExpanded) {
							var methodsList = document.createElement('div');
							methodsList.className = 'cmv-methods-list';

							classData.methods.forEach(function(methodObj, methodIndex){
								var methodName = Object.keys(methodObj)[0];
								var methodData = methodObj[methodName] || {};
								var parameters = methodData.parameters || [];
								var returnType = methodData.returnType || 'void';

								var methodItem = document.createElement('div');
								methodItem.className = 'cmv-method-item';

								var headerRow = document.createElement('div');
								headerRow.className = 'cmv-method-header';

								var prefix = document.createElement('span');
								prefix.className = 'cmv-method-prefix';
								prefix.textContent = 'ƒ';
								headerRow.appendChild(prefix);

								var name = document.createElement('span');
								name.className = 'cmv-method-name';
								name.textContent = methodName;
								headerRow.appendChild(name);

								var returnSpan = document.createElement('span');
								returnSpan.className = 'cmv-method-return';
								returnSpan.textContent = ': ' + returnType;
								headerRow.appendChild(returnSpan);

								methodItem.appendChild(headerRow);

								// Build param signatures
								var paramSignatures = [];
								if (parameters.length > 0) {
									parameters.forEach(function(paramObj){
										var pn = Object.keys(paramObj)[0];
										var pt = paramObj[pn];
										paramSignatures.push(pn + ': ' + pt);
									});
								}

								if (paramSignatures.length > 0) {
									var paramsRow = document.createElement('div');
									paramsRow.className = 'cmv-method-params-row';

									var paramsLabel = document.createElement('span');
									paramsLabel.className = 'cmv-params-label';
									paramsLabel.textContent = 'Parameters: ';
									paramsRow.appendChild(paramsLabel);

									paramSignatures.forEach(function(sig, idx){
										var parts = sig.split(': ');
										var paramName = parts[0];
										var paramType = parts[1];

										var paramSpan = document.createElement('span');
										paramSpan.className = 'cmv-param-item';

										var nameSpan = document.createElement('span');
										nameSpan.className = 'cmv-param-name';
										nameSpan.textContent = paramName;
										paramSpan.appendChild(nameSpan);

										var colonSpan = document.createElement('span');
										colonSpan.textContent = ': ';
										paramSpan.appendChild(colonSpan);

										var typeSpan = document.createElement('span');
										typeSpan.className = 'cmv-param-type';
										typeSpan.textContent = paramType;
										paramSpan.appendChild(typeSpan);

										paramsRow.appendChild(paramSpan);

										if (idx < paramSignatures.length - 1) {
											var commaSpan = document.createElement('span');
											commaSpan.textContent = ', ';
											paramsRow.appendChild(commaSpan);
										}
									});

									methodItem.appendChild(paramsRow);
								}

								methodItem.onclick = function(e){ e.stopPropagation(); setSelected('method', classIndex, methodIndex, methodName, (methodName + '(' + (paramSignatures.join(', ')) + '): ' + returnType)); };

								if (selectedItem && selectedItem.type === 'method' && selectedItem.classIndex === classIndex && selectedItem.itemIndex === methodIndex) {
									methodItem.className += ' cmv-item-selected';
								}

								methodsList.appendChild(methodItem);
							});

							listContainer.appendChild(methodsList);
						}
					}

					// Attributes
					if (classData.attributes && classData.attributes.length > 0) {
						var attrsHeader = document.createElement('div');
						attrsHeader.className = 'cmv-section-header';

						var attrsToggle = document.createElement('button');
						attrsToggle.className = 'cmv-section-toggle';
						var attrsKey = classIndex + ':attributes';
						var attrsExpanded = expandedSections.has(attrsKey);
						attrsToggle.textContent = attrsExpanded ? '▼' : '▶';
						attrsToggle.onclick = function(e){ e.stopPropagation(); if (expandedSections.has(attrsKey)) expandedSections.delete(attrsKey); else expandedSections.add(attrsKey); renderList(); };
						attrsHeader.appendChild(attrsToggle);

						var attrsLabel = document.createElement('span');
						attrsLabel.className = 'cmv-section-label';
						attrsLabel.textContent = 'Attributes';
						attrsHeader.appendChild(attrsLabel);

						listContainer.appendChild(attrsHeader);

						if (attrsExpanded) {
							var attrsList = document.createElement('div');
							attrsList.className = 'cmv-attributes-list';

							classData.attributes.forEach(function(attrObj, attrIndex){
								var attrName = Object.keys(attrObj)[0];
								var attrData = attrObj[attrName];
								var attrType = (attrData && attrData.type) || 'unknown';

								var attrItem = document.createElement('div');
								attrItem.className = 'cmv-attribute-item';

								var prefix = document.createElement('span');
								prefix.className = 'cmv-attribute-prefix';
								prefix.textContent = '◆';
								attrItem.appendChild(prefix);

								var name = document.createElement('span');
								name.className = 'cmv-attribute-name';
								name.textContent = attrName;
								attrItem.appendChild(name);

								var details = document.createElement('span');
								details.className = 'cmv-attribute-details';
								details.textContent = ': ' + attrType;
								attrItem.appendChild(details);

								var signature = attrName + ': ' + attrType;

								attrItem.onclick = function(e){ e.stopPropagation(); setSelected('attribute', classIndex, attrIndex, attrName, signature); };

								if (selectedItem && selectedItem.type === 'attribute' && selectedItem.classIndex === classIndex && selectedItem.itemIndex === attrIndex) {
									attrItem.className += ' cmv-item-selected';
								}

								attrsList.appendChild(attrItem);
							});

							listContainer.appendChild(attrsList);
						}
					}
				}
			});
		}

		// Control buttons (Resolve with null on cancel)
		var btnGroup = document.createElement('div');
		btnGroup.className = 'cmv-button-group';

		var expandAllBtn = mxUtils.button('Expand All', function(){
			for (var i=0;i<classes.length;i++){ expandedClasses.add(i); expandedSections.add(i+':methods'); expandedSections.add(i+':attributes'); }
			renderList();
		});
		expandAllBtn.className = 'cmv-btn';
		btnGroup.appendChild(expandAllBtn);

		var collapseAllBtn = mxUtils.button('Collapse All', function(){ expandedClasses.clear(); expandedSections.clear(); renderList(); });
		collapseAllBtn.className = 'cmv-btn';
		btnGroup.appendChild(collapseAllBtn);

		var cancelBtn = mxUtils.button('Cancel', function(){ if (!resolved){ resolved = true; try{ win.setVisible(false);}catch(_){} try{win.destroy();}catch(_){} resolve(null);} });
		cancelBtn.className = 'cmv-btn';
		btnGroup.appendChild(cancelBtn);

		main.appendChild(listContainer);
		main.appendChild(btnGroup);

		// Styles
		var style = document.createElement('style');
		style.textContent = ""+
".cmv-main {\n"+
"  font-family: 'Segoe UI', Arial, sans-serif;\n"+
"  background: #f8f9fa;\n"+
"  width: 100%;\n"+
"  height: 100%;\n"+
"  display: flex;\n"+
"  flex-direction: column;\n"+
"  box-sizing: border-box;\n"+
"  padding: 1rem;\n"+
"  gap: 1rem;\n"+
"}\n"+
".cmv-header {\n"+
"  display: flex;\n"+
"  justify-content: space-between;\n"+
"  align-items: center;\n"+
"  background: #fff;\n"+
"  padding: 1rem;\n"+
"  border-radius: 6px;\n"+
"  border: 1px solid #d0d7de;\n"+
"  box-shadow: 0 1px 3px rgba(0,0,0,0.08);\n"+
"}\n"+
".cmv-title {\n"+
"  font-size: 1.1rem;\n"+
"  font-weight: 600;\n"+
"  color: #24292e;\n"+
"}\n"+
".cmv-list-container {\n"+
"  flex: 1 1 auto;\n"+
"  overflow-y: auto;\n"+
"  background: #fff;\n"+
"  border: 1px solid #d0d7de;\n"+
"  border-radius: 6px;\n"+
"  padding: 0.5rem;\n"+
"  min-height: 200px;\n"+
"}\n"+
".cmv-empty-message {\n"+
"  display: flex;\n"+
"  align-items: center;\n"+
"  justify-content: center;\n"+
"  height: 100%;\n"+
"  color: #6a737d;\n"+
"  text-align: center;\n"+
"  padding: 2rem;\n"+
"  font-size: 0.95rem;\n"+
"}\n"+
".cmv-class-row {\n"+
"  display: flex;\n"+
"  align-items: center;\n"+
"  padding: 0.7rem;\n"+
"  cursor: pointer;\n"+
"  border-radius: 5px;\n"+
"  transition: background 0.15s;\n"+
"  background: #f6f8fa;\n"+
"  margin-bottom: 0.3rem;\n"+
"  border-left: 3px solid #0078d4;\n"+
"}\n"+
".cmv-class-row:hover { background: #eef2f8; }\n"+
".cmv-toggle-btn { background: none; border: none; cursor: pointer; padding: 0.3rem 0.5rem; font-size: 0.9rem; color: #0078d4; margin-right: 0.5rem; }\n"+
".cmv-class-icon { display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background:#0078d4; color:#fff; border-radius:4px; font-size:0.9rem; font-weight:600; margin-right:0.5rem; }\n"+
".cmv-class-name { font-weight:600; color:#24292e; font-size:0.95rem; flex:1; }\n"+
".cmv-section-header { display:flex; align-items:center; padding:0.5rem 0.7rem 0.5rem 2rem; background:#f0f2f5; border-left:2px solid #8b949e; cursor:pointer; margin-top:0.3rem; }\n"+
".cmv-section-toggle { background:none; border:none; cursor:pointer; padding:0.2rem 0.4rem; font-size:0.85rem; color:#57606a; margin-right:0.5rem; }\n"+
".cmv-section-label { font-weight:500; color:#57606a; font-size:0.9rem; }\n"+
".cmv-methods-list { margin-left:2rem; padding:0.3rem 0; }\n"+
".cmv-attributes-list { margin-left:2rem; padding:0.3rem 0; }\n"+
".cmv-method-item { display:flex; flex-direction:column; gap:0.3rem; padding:0.5rem 0.7rem; color:#666; font-size:0.9rem; cursor:pointer; border-radius:4px; transition:background 0.15s; min-width:0; }\n"+
".cmv-method-item:hover { background:#f0f6ff; }\n"+
".cmv-method-header { display:flex; align-items:center; gap:0.6rem; min-width:0; }\n"+
".cmv-method-params-row { display:flex; padding-left:0.5rem; border-left:2px solid #e8eaef; flex-wrap:wrap; gap:0.2rem; }\n"+
".cmv-method-prefix { display:inline-block; width:20px; height:20px; line-height:20px; text-align:center; background:#f0f6ff; border-radius:4px; color:#0066cc; font-weight:700; flex-shrink:0; }\n"+
".cmv-attribute-prefix { display:inline-block; width:20px; height:20px; line-height:20px; text-align:center; background:#f5f0ff; border-radius:4px; color:#6f42c1; font-weight:700; flex-shrink:0; }\n"+
".cmv-method-name { font-family:'Courier New', monospace; color:#1f2937; white-space:nowrap; flex-shrink:0; min-width:fit-content; }\n"+
".cmv-attribute-name { font-family:'Courier New', monospace; color:#1f2937; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }\n"+
".cmv-method-return { font-family:'Courier New', monospace; font-size:0.8rem; color:#8b949e; flex-shrink:0; white-space:nowrap; }\n"+
".cmv-method-params { font-family:'Courier New', monospace; font-size:0.8rem; color:#666; word-break:break-word; }\n"+
".cmv-params-label { font-weight:500; color:#57606a; margin-right:0.3rem; }\n"+
".cmv-param-item { display:inline; font-family:'Courier New', monospace; font-size:0.8rem; }\n"+
".cmv-param-name { color:#24292e; }\n"+
".cmv-param-type { color:#0066cc; font-weight:600; }\n"+
".cmv-attribute-details { margin-left:auto; font-size:0.8rem; color:#8b949e; white-space:nowrap; }\n"+
".cmv-item-selected { background:#e6f0ff !important; color:#003366; }\n"+
".cmv-button-group { display:flex; gap:0.7rem; justify-content:flex-end; }\n"+
".cmv-btn { background:#e9ecef !important; color:#24292e !important; border:1px solid #d0d7de; border-radius:5px; padding:0.5rem 1rem; font-size:0.95rem; cursor:pointer; transition:background 0.2s, border 0.2s; }\n"+
".cmv-btn:hover { background:#d0ebff !important; border:1.5px solid #0078d4; }\n"+
".cmv-list-container::-webkit-scrollbar { width:8px; }\n"+
".cmv-list-container::-webkit-scrollbar-track { background:#f1f1f1; border-radius:10px; }\n"+
".cmv-list-container::-webkit-scrollbar-thumb { background:#c1c7cd; border-radius:10px; }\n"+
".cmv-list-container::-webkit-scrollbar-thumb:hover { background:#a0a7b1; }\n";
		main.appendChild(style);

		// Initial render
		renderList();

		// Create mxWindow and show
		var win = new mxWindow(opts.windowTitle || 'Class Methods Viewer', main, x, y, w, h, true, true);
		win.destroyOnClose = false;
		win.setMaximizable(false);
		win.setResizable(true);
		win.setClosable(true);
		win.setVisible(true);

		// Ensure focus
		try { win.contentWindow && win.contentWindow.focus && win.contentWindow.focus(); } catch(e) {}

	});
}

// Expose globally so other plugins may call it
global.showClassMethodsViewer = showClassMethodsViewer;

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
