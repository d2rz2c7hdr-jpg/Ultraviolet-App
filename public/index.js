"use strict";

/** @type {HTMLFormElement} */
const form = document.getElementById("uv-form");
/** @type {HTMLInputElement} */
const address = document.getElementById("uv-address");
/** @type {HTMLInputElement} */
const searchEngine = document.getElementById("uv-search-engine");
/** @type {HTMLParagraphElement} */
const error = document.getElementById("uv-error");
/** @type {HTMLPreElement} */
const errorCode = document.getElementById("uv-error-code");
/** @type {HTMLIFrameElement} */
const frame = document.getElementById("uv-frame");
/** @type {HTMLSelectElement} */
const themeSelect = document.getElementById("theme-select");
/** @type {HTMLSelectElement} */
const engineSelect = document.getElementById("engine-select");
const gameGrid = document.getElementById("game-grid");

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

const STORAGE_KEYS = {
	theme: "wsf-theme",
	engine: "wsf-search-engine",
};

function applyTheme(theme) {
	document.documentElement.setAttribute("data-theme", theme);
}

function applySearchEngine(engine) {
	searchEngine.value = engine;
}

async function launchProxy(target) {
	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(target, searchEngine.value);
	let wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";
	if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
		await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
	}

	frame.style.display = "block";
	frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	error.textContent = "";
	errorCode.textContent = "";
	await launchProxy(address.value);
});

gameGrid.addEventListener("click", async (event) => {
	const card = event.target.closest(".game-card");
	if (!card) return;
	address.value = card.dataset.url;
	error.textContent = "";
	errorCode.textContent = "";
	await launchProxy(card.dataset.url);
});

themeSelect.addEventListener("change", () => {
	applyTheme(themeSelect.value);
	localStorage.setItem(STORAGE_KEYS.theme, themeSelect.value);
});

engineSelect.addEventListener("change", () => {
	applySearchEngine(engineSelect.value);
	localStorage.setItem(STORAGE_KEYS.engine, engineSelect.value);
});

const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "dark";
const savedEngine =
	localStorage.getItem(STORAGE_KEYS.engine) || "https://duckduckgo.com/?q=%s";

themeSelect.value = savedTheme;
engineSelect.value = savedEngine;
applyTheme(savedTheme);
applySearchEngine(savedEngine);
