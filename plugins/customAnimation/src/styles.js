// refaktoring build test - CSS

export const CUSTOM_ANIM_STYLE_ID = 'custom-anim-style';

export function injectCustomAnimStyles(container) {
	if (document.getElementById(CUSTOM_ANIM_STYLE_ID)) {
		return;
	}

	var style = document.createElement('style');
	style.id = CUSTOM_ANIM_STYLE_ID;
	style.textContent = `
	.custom-anim-main {
		font-family: 'Segoe UI', Arial, sans-serif;
		background: #f8f9fa;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding-top: 0.7rem;
	}
	.custom-anim-flexrow {
		display: flex;
		flex: 1 1 0;
		gap: 1.5rem;
		padding: 0 1.5rem 1.5rem 1.5rem;
		box-sizing: border-box;
		min-height: 0;
	}
	.custom-anim-editorcol {
		display: flex;
		flex-direction: column;
		flex: 0 0 400px;
		min-width: 200px;
		height: 100%;
		gap: 1rem;
	}
	.custom-anim-textarea {
		width: 100%;
		height: 220px;
		resize: vertical;
		padding: 0.75rem;
		font-size: 1rem;
		border: 1px solid #d0d7de;
		border-radius: 6px;
		background: #fff;
		box-sizing: border-box;
		margin-bottom: 0.5rem;
		transition: border 0.2s;
	}
	.custom-anim-textarea:focus {
		border: 1.5px solid #0078d4;
		outline: none;
	}
	.custom-anim-btngroup {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.custom-anim-btn {
		background: #e9ecef;
		border: 1px solid #d0d7de;
		border-radius: 5px;
		padding: 0.4rem 0.9rem;
		font-size: 0.98rem;
		cursor: pointer;
		transition: background 0.2s, border 0.2s;
	}
	.custom-anim-btn:hover {
		background: #d0ebff;
		border: 1.5px solid #0078d4;
	}
	.custom-anim-actiongroup {
		display: flex;
		gap: 0.7rem;
		margin-top: 0.5rem;
	}
	div.custom-anim-main .custom-anim-actionbtn {
		background: #0078d4 !important;
		color: #fff !important;
		border: none;
		border-radius: 5px;
		padding: 0.5rem 1.2rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}
	div.custom-anim-main .custom-anim-actionbtn:hover {
		background: #005fa3 !important;
	}
	.custom-anim-preview {
		background: #fff;
		border: 1.5px solid #d0d7de;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		min-height: 200px;
		min-width: 200px;
		height: 100%;
		width: 100%;
	}
	`;

	container.appendChild(style);
}