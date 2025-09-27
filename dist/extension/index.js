//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let vscode = require("vscode");
vscode = __toESM(vscode);

//#region node_modules/@tomjs/vite-plugin-vscode/dist/webview.js
var template_default = "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <style>\n      html,\n      body {\n        width: 100%;\n        height: 100%;\n        margin: 0;\n        padding: 0;\n        overflow: hidden;\n      }\n\n      #webview-patch-iframe {\n        width: 100%;\n        height: 100%;\n        border: none;\n      }\n\n      .outer {\n        width: 100%;\n        height: 100%;\n        overflow: hidden;\n      }\n    </style>\n\n    <script type=\"module\" id=\"webview-patch\">\n      const TAG = '[@tomjs:vscode:extension] ';\n\n      function onDomReady(callback, doc) {\n        const _doc = doc || document;\n        if (_doc.readyState === 'interactive' || _doc.readyState === 'complete') {\n          callback();\n        } else {\n          _doc.addEventListener('DOMContentLoaded', callback);\n        }\n      }\n\n      let vsCodeApi;\n\n      function getApi() {\n        if (vsCodeApi) return vsCodeApi;\n        return (vsCodeApi = acquireVsCodeApi());\n      }\n\n      function sendInitData(iframe) {\n        console.log(TAG + 'init data');\n        const dataset = {};\n        Object.keys(document.body.dataset).forEach((key) => {\n          dataset[key] = document.body.dataset[key];\n        });\n\n        iframe.contentWindow.postMessage(\n          {\n            type: '[vscode:extension]:init',\n            data: {\n              state: getApi().getState(),\n              style: document.getElementById('_defaultStyles').innerHTML,\n              root: {\n                cssText: document.documentElement.style.cssText,\n              },\n              body: {\n                dataset: dataset,\n                className: document.body.className,\n                role: document.body.getAttribute('role'),\n              },\n            },\n          },\n          '*',\n        );\n      }\n\n      function observeAttributeChanges(element, attributeName, callback) {\n        const observer = new MutationObserver(function (mutationsList) {\n          for (let mutation of mutationsList) {\n            if (mutation.type === 'attributes' && mutation.attributeName === attributeName) {\n              callback(mutation.target.getAttribute(attributeName));\n            }\n          }\n        });\n        observer.observe(element, { attributes: true });\n        return observer;\n      }\n\n      // message handler\n      let iframeLoaded = false;\n      const cacheMessages = [];\n\n      function handleMessage(e) {\n        const iframe = document.getElementById('webview-patch-iframe');\n        if (!iframeLoaded || !iframe) {\n          return;\n        }\n        if (e.origin.startsWith('vscode-webview://')) {\n          iframe.contentWindow.postMessage(e.data, '*');\n        } else if ('{{serverUrl}}'.startsWith(e.origin)) {\n          const { type, data } = e.data;\n          console.log(TAG + ' received:', e.data);\n          if (type === '[vscode:client]:postMessage') {\n            getApi().postMessage(data);\n          } else if (type === '[vscode:client]:commands') {\n            if (data === 'F1') {\n              window.dispatchEvent(\n                new KeyboardEvent('keydown', {\n                  key: 'F1',\n                  keyCode: 112,\n                  code: 'F1',\n                }),\n              );\n            }\n          }\n        }\n      }\n\n      window.addEventListener('message', function (event) {\n        if (event.origin.startsWith('vscode-webview://')) {\n          cacheMessages.push(event);\n          return;\n        }\n        handleMessage(event);\n      });\n\n      let isCacheWorking = false;\n      setInterval(() => {\n        if (isCacheWorking) {\n          return;\n        }\n\n        isCacheWorking = true;\n        if (iframeLoaded) {\n          let event = cacheMessages.shift();\n          while (event) {\n            handleMessage(event);\n            event = cacheMessages.shift();\n          }\n        }\n        isCacheWorking = false;\n      }, 50);\n\n      onDomReady(function () {\n        /**  @type {HTMLIFrameElement} */\n        const iframe = document.getElementById('webview-patch-iframe');\n        observeAttributeChanges(document.body, 'class', function (className) {\n          sendInitData(iframe);\n        });\n\n        onDomReady(function () {\n          iframeLoaded = true;\n          sendInitData(iframe);\n        }, iframe.contentDocument);\n\n        iframe.addEventListener('load', function (e) {\n          iframeLoaded = true;\n\n          let interval = setInterval(() => {\n            try {\n              if (document.getElementById('_defaultStyles')) {\n                sendInitData(iframe);\n                // addListeners(iframe);\n                clearInterval(interval);\n                return;\n              }\n            } catch (e) {\n              clearInterval(interval);\n              console.error(e);\n            }\n          }, 10);\n        });\n      });\n    <\/script>\n  </head>\n\n  <body>\n    <div class=\"outer\">\n      <iframe\n        id=\"webview-patch-iframe\"\n        frameborder=\"0\"\n        sandbox=\"allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-downloads\"\n        allow=\"cross-origin-isolated; autoplay; clipboard-read; clipboard-write\"\n        src=\"{{serverUrl}}\"\n      ></iframe>\n    </div>\n  </body>\n</html>\n";
/**
*
* @param options serverUrl string or object options
*/
function getWebviewHtml(options) {
	const opts = { serverUrl: "" };
	Object.assign(opts, options);
	return template_default.replace(/\{\{serverUrl\}\}/g, opts.serverUrl);
}
var webview_default = getWebviewHtml;

//#endregion
//#region \0@oxc-project+runtime@0.92.0/helpers/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
		return typeof o$1;
	} : function(o$1) {
		return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
	}, _typeof(o);
}

//#endregion
//#region \0@oxc-project+runtime@0.92.0/helpers/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}

//#endregion
//#region \0@oxc-project+runtime@0.92.0/helpers/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}

//#endregion
//#region \0@oxc-project+runtime@0.92.0/helpers/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}

//#endregion
//#region src/views/addConnection.ts
var AddConnectionPanel = class AddConnectionPanel {
	constructor(panel, context) {
		_defineProperty(this, "_panel", void 0);
		_defineProperty(this, "_disposables", []);
		this._panel = panel;
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
		this._panel.webview.html = webview_default({
			serverUrl: `${"http://localhost:5173/"}webviews/addConnection.html`,
			webview: this._panel.webview,
			context,
			inputName: "addConnection"
		});
	}
	static render(context) {
		if (AddConnectionPanel.currentPanel) {
			AddConnectionPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
		} else {
			const panel = vscode.window.createWebviewPanel("addSystemConnection", "Add System Connection", vscode.ViewColumn.One, {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "dist")]
			});
			AddConnectionPanel.currentPanel = new AddConnectionPanel(panel, context);
		}
	}
	/**
	* Cleans up and disposes of webview resources when the webview panel is closed.
	*/
	dispose() {
		AddConnectionPanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
};
_defineProperty(AddConnectionPanel, "currentPanel", void 0);

//#endregion
//#region src/index.ts
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand("abap.openAddConnectionScreen", () => {
		AddConnectionPanel.render(context);
	}));
	console.log("Extension activated.");
}
function deactivate() {}

//#endregion
exports.activate = activate;
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL0B0b21qcy92aXRlLXBsdWdpbi12c2NvZGUvZGlzdC93ZWJ2aWV3LmpzIiwiLi4vLi4vc3JjL3ZpZXdzL2FkZENvbm5lY3Rpb24udHMiLCIuLi8uLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy93ZWJ2aWV3L3RlbXBsYXRlLmh0bWxcbnZhciB0ZW1wbGF0ZV9kZWZhdWx0ID0gXCI8IWRvY3R5cGUgaHRtbD5cXG48aHRtbCBsYW5nPVxcXCJlblxcXCI+XFxuICA8aGVhZD5cXG4gICAgPG1ldGEgY2hhcnNldD1cXFwiVVRGLThcXFwiIC8+XFxuICAgIDxtZXRhIGh0dHAtZXF1aXY9XFxcIlgtVUEtQ29tcGF0aWJsZVxcXCIgY29udGVudD1cXFwiSUU9ZWRnZVxcXCIgLz5cXG4gICAgPG1ldGEgbmFtZT1cXFwidmlld3BvcnRcXFwiIGNvbnRlbnQ9XFxcIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcXFwiIC8+XFxuICAgIDxzdHlsZT5cXG4gICAgICBodG1sLFxcbiAgICAgIGJvZHkge1xcbiAgICAgICAgd2lkdGg6IDEwMCU7XFxuICAgICAgICBoZWlnaHQ6IDEwMCU7XFxuICAgICAgICBtYXJnaW46IDA7XFxuICAgICAgICBwYWRkaW5nOiAwO1xcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gICAgICB9XFxuXFxuICAgICAgI3dlYnZpZXctcGF0Y2gtaWZyYW1lIHtcXG4gICAgICAgIHdpZHRoOiAxMDAlO1xcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xcbiAgICAgICAgYm9yZGVyOiBub25lO1xcbiAgICAgIH1cXG5cXG4gICAgICAub3V0ZXIge1xcbiAgICAgICAgd2lkdGg6IDEwMCU7XFxuICAgICAgICBoZWlnaHQ6IDEwMCU7XFxuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgICAgIH1cXG4gICAgPC9zdHlsZT5cXG5cXG4gICAgPHNjcmlwdCB0eXBlPVxcXCJtb2R1bGVcXFwiIGlkPVxcXCJ3ZWJ2aWV3LXBhdGNoXFxcIj5cXG4gICAgICBjb25zdCBUQUcgPSAnW0B0b21qczp2c2NvZGU6ZXh0ZW5zaW9uXSAnO1xcblxcbiAgICAgIGZ1bmN0aW9uIG9uRG9tUmVhZHkoY2FsbGJhY2ssIGRvYykge1xcbiAgICAgICAgY29uc3QgX2RvYyA9IGRvYyB8fCBkb2N1bWVudDtcXG4gICAgICAgIGlmIChfZG9jLnJlYWR5U3RhdGUgPT09ICdpbnRlcmFjdGl2ZScgfHwgX2RvYy5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XFxuICAgICAgICAgIGNhbGxiYWNrKCk7XFxuICAgICAgICB9IGVsc2Uge1xcbiAgICAgICAgICBfZG9jLmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBjYWxsYmFjayk7XFxuICAgICAgICB9XFxuICAgICAgfVxcblxcbiAgICAgIGxldCB2c0NvZGVBcGk7XFxuXFxuICAgICAgZnVuY3Rpb24gZ2V0QXBpKCkge1xcbiAgICAgICAgaWYgKHZzQ29kZUFwaSkgcmV0dXJuIHZzQ29kZUFwaTtcXG4gICAgICAgIHJldHVybiAodnNDb2RlQXBpID0gYWNxdWlyZVZzQ29kZUFwaSgpKTtcXG4gICAgICB9XFxuXFxuICAgICAgZnVuY3Rpb24gc2VuZEluaXREYXRhKGlmcmFtZSkge1xcbiAgICAgICAgY29uc29sZS5sb2coVEFHICsgJ2luaXQgZGF0YScpO1xcbiAgICAgICAgY29uc3QgZGF0YXNldCA9IHt9O1xcbiAgICAgICAgT2JqZWN0LmtleXMoZG9jdW1lbnQuYm9keS5kYXRhc2V0KS5mb3JFYWNoKChrZXkpID0+IHtcXG4gICAgICAgICAgZGF0YXNldFtrZXldID0gZG9jdW1lbnQuYm9keS5kYXRhc2V0W2tleV07XFxuICAgICAgICB9KTtcXG5cXG4gICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKFxcbiAgICAgICAgICB7XFxuICAgICAgICAgICAgdHlwZTogJ1t2c2NvZGU6ZXh0ZW5zaW9uXTppbml0JyxcXG4gICAgICAgICAgICBkYXRhOiB7XFxuICAgICAgICAgICAgICBzdGF0ZTogZ2V0QXBpKCkuZ2V0U3RhdGUoKSxcXG4gICAgICAgICAgICAgIHN0eWxlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnX2RlZmF1bHRTdHlsZXMnKS5pbm5lckhUTUwsXFxuICAgICAgICAgICAgICByb290OiB7XFxuICAgICAgICAgICAgICAgIGNzc1RleHQ6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5jc3NUZXh0LFxcbiAgICAgICAgICAgICAgfSxcXG4gICAgICAgICAgICAgIGJvZHk6IHtcXG4gICAgICAgICAgICAgICAgZGF0YXNldDogZGF0YXNldCxcXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSxcXG4gICAgICAgICAgICAgICAgcm9sZTogZG9jdW1lbnQuYm9keS5nZXRBdHRyaWJ1dGUoJ3JvbGUnKSxcXG4gICAgICAgICAgICAgIH0sXFxuICAgICAgICAgICAgfSxcXG4gICAgICAgICAgfSxcXG4gICAgICAgICAgJyonLFxcbiAgICAgICAgKTtcXG4gICAgICB9XFxuXFxuICAgICAgZnVuY3Rpb24gb2JzZXJ2ZUF0dHJpYnV0ZUNoYW5nZXMoZWxlbWVudCwgYXR0cmlidXRlTmFtZSwgY2FsbGJhY2spIHtcXG4gICAgICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKG11dGF0aW9uc0xpc3QpIHtcXG4gICAgICAgICAgZm9yIChsZXQgbXV0YXRpb24gb2YgbXV0YXRpb25zTGlzdCkge1xcbiAgICAgICAgICAgIGlmIChtdXRhdGlvbi50eXBlID09PSAnYXR0cmlidXRlcycgJiYgbXV0YXRpb24uYXR0cmlidXRlTmFtZSA9PT0gYXR0cmlidXRlTmFtZSkge1xcbiAgICAgICAgICAgICAgY2FsbGJhY2sobXV0YXRpb24udGFyZ2V0LmdldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKSk7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICB9XFxuICAgICAgICB9KTtcXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoZWxlbWVudCwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xcbiAgICAgICAgcmV0dXJuIG9ic2VydmVyO1xcbiAgICAgIH1cXG5cXG4gICAgICAvLyBtZXNzYWdlIGhhbmRsZXJcXG4gICAgICBsZXQgaWZyYW1lTG9hZGVkID0gZmFsc2U7XFxuICAgICAgY29uc3QgY2FjaGVNZXNzYWdlcyA9IFtdO1xcblxcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UoZSkge1xcbiAgICAgICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dlYnZpZXctcGF0Y2gtaWZyYW1lJyk7XFxuICAgICAgICBpZiAoIWlmcmFtZUxvYWRlZCB8fCAhaWZyYW1lKSB7XFxuICAgICAgICAgIHJldHVybjtcXG4gICAgICAgIH1cXG4gICAgICAgIGlmIChlLm9yaWdpbi5zdGFydHNXaXRoKCd2c2NvZGUtd2VidmlldzovLycpKSB7XFxuICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKGUuZGF0YSwgJyonKTtcXG4gICAgICAgIH0gZWxzZSBpZiAoJ3t7c2VydmVyVXJsfX0nLnN0YXJ0c1dpdGgoZS5vcmlnaW4pKSB7XFxuICAgICAgICAgIGNvbnN0IHsgdHlwZSwgZGF0YSB9ID0gZS5kYXRhO1xcbiAgICAgICAgICBjb25zb2xlLmxvZyhUQUcgKyAnIHJlY2VpdmVkOicsIGUuZGF0YSk7XFxuICAgICAgICAgIGlmICh0eXBlID09PSAnW3ZzY29kZTpjbGllbnRdOnBvc3RNZXNzYWdlJykge1xcbiAgICAgICAgICAgIGdldEFwaSgpLnBvc3RNZXNzYWdlKGRhdGEpO1xcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdbdnNjb2RlOmNsaWVudF06Y29tbWFuZHMnKSB7XFxuICAgICAgICAgICAgaWYgKGRhdGEgPT09ICdGMScpIHtcXG4gICAgICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KFxcbiAgICAgICAgICAgICAgICBuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIHtcXG4gICAgICAgICAgICAgICAgICBrZXk6ICdGMScsXFxuICAgICAgICAgICAgICAgICAga2V5Q29kZTogMTEyLFxcbiAgICAgICAgICAgICAgICAgIGNvZGU6ICdGMScsXFxuICAgICAgICAgICAgICAgIH0pLFxcbiAgICAgICAgICAgICAgKTtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgIH1cXG4gICAgICAgIH1cXG4gICAgICB9XFxuXFxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXZlbnQpIHtcXG4gICAgICAgIGlmIChldmVudC5vcmlnaW4uc3RhcnRzV2l0aCgndnNjb2RlLXdlYnZpZXc6Ly8nKSkge1xcbiAgICAgICAgICBjYWNoZU1lc3NhZ2VzLnB1c2goZXZlbnQpO1xcbiAgICAgICAgICByZXR1cm47XFxuICAgICAgICB9XFxuICAgICAgICBoYW5kbGVNZXNzYWdlKGV2ZW50KTtcXG4gICAgICB9KTtcXG5cXG4gICAgICBsZXQgaXNDYWNoZVdvcmtpbmcgPSBmYWxzZTtcXG4gICAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XFxuICAgICAgICBpZiAoaXNDYWNoZVdvcmtpbmcpIHtcXG4gICAgICAgICAgcmV0dXJuO1xcbiAgICAgICAgfVxcblxcbiAgICAgICAgaXNDYWNoZVdvcmtpbmcgPSB0cnVlO1xcbiAgICAgICAgaWYgKGlmcmFtZUxvYWRlZCkge1xcbiAgICAgICAgICBsZXQgZXZlbnQgPSBjYWNoZU1lc3NhZ2VzLnNoaWZ0KCk7XFxuICAgICAgICAgIHdoaWxlIChldmVudCkge1xcbiAgICAgICAgICAgIGhhbmRsZU1lc3NhZ2UoZXZlbnQpO1xcbiAgICAgICAgICAgIGV2ZW50ID0gY2FjaGVNZXNzYWdlcy5zaGlmdCgpO1xcbiAgICAgICAgICB9XFxuICAgICAgICB9XFxuICAgICAgICBpc0NhY2hlV29ya2luZyA9IGZhbHNlO1xcbiAgICAgIH0sIDUwKTtcXG5cXG4gICAgICBvbkRvbVJlYWR5KGZ1bmN0aW9uICgpIHtcXG4gICAgICAgIC8qKiAgQHR5cGUge0hUTUxJRnJhbWVFbGVtZW50fSAqL1xcbiAgICAgICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dlYnZpZXctcGF0Y2gtaWZyYW1lJyk7XFxuICAgICAgICBvYnNlcnZlQXR0cmlidXRlQ2hhbmdlcyhkb2N1bWVudC5ib2R5LCAnY2xhc3MnLCBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XFxuICAgICAgICAgIHNlbmRJbml0RGF0YShpZnJhbWUpO1xcbiAgICAgICAgfSk7XFxuXFxuICAgICAgICBvbkRvbVJlYWR5KGZ1bmN0aW9uICgpIHtcXG4gICAgICAgICAgaWZyYW1lTG9hZGVkID0gdHJ1ZTtcXG4gICAgICAgICAgc2VuZEluaXREYXRhKGlmcmFtZSk7XFxuICAgICAgICB9LCBpZnJhbWUuY29udGVudERvY3VtZW50KTtcXG5cXG4gICAgICAgIGlmcmFtZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKGUpIHtcXG4gICAgICAgICAgaWZyYW1lTG9hZGVkID0gdHJ1ZTtcXG5cXG4gICAgICAgICAgbGV0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xcbiAgICAgICAgICAgIHRyeSB7XFxuICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ19kZWZhdWx0U3R5bGVzJykpIHtcXG4gICAgICAgICAgICAgICAgc2VuZEluaXREYXRhKGlmcmFtZSk7XFxuICAgICAgICAgICAgICAgIC8vIGFkZExpc3RlbmVycyhpZnJhbWUpO1xcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xcbiAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcXG4gICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgIH0sIDEwKTtcXG4gICAgICAgIH0pO1xcbiAgICAgIH0pO1xcbiAgICA8XFwvc2NyaXB0PlxcbiAgPC9oZWFkPlxcblxcbiAgPGJvZHk+XFxuICAgIDxkaXYgY2xhc3M9XFxcIm91dGVyXFxcIj5cXG4gICAgICA8aWZyYW1lXFxuICAgICAgICBpZD1cXFwid2Vidmlldy1wYXRjaC1pZnJhbWVcXFwiXFxuICAgICAgICBmcmFtZWJvcmRlcj1cXFwiMFxcXCJcXG4gICAgICAgIHNhbmRib3g9XFxcImFsbG93LXNjcmlwdHMgYWxsb3ctc2FtZS1vcmlnaW4gYWxsb3ctZm9ybXMgYWxsb3ctcG9pbnRlci1sb2NrIGFsbG93LWRvd25sb2Fkc1xcXCJcXG4gICAgICAgIGFsbG93PVxcXCJjcm9zcy1vcmlnaW4taXNvbGF0ZWQ7IGF1dG9wbGF5OyBjbGlwYm9hcmQtcmVhZDsgY2xpcGJvYXJkLXdyaXRlXFxcIlxcbiAgICAgICAgc3JjPVxcXCJ7e3NlcnZlclVybH19XFxcIlxcbiAgICAgID48L2lmcmFtZT5cXG4gICAgPC9kaXY+XFxuICA8L2JvZHk+XFxuPC9odG1sPlxcblwiO1xuXG4vLyNlbmRyZWdpb25cbi8vI3JlZ2lvbiBzcmMvd2Vidmlldy93ZWJ2aWV3LnRzXG4vKipcbipcbiogQHBhcmFtIG9wdGlvbnMgc2VydmVyVXJsIHN0cmluZyBvciBvYmplY3Qgb3B0aW9uc1xuKi9cbmZ1bmN0aW9uIGdldFdlYnZpZXdIdG1sKG9wdGlvbnMpIHtcblx0Y29uc3Qgb3B0cyA9IHsgc2VydmVyVXJsOiBcIlwiIH07XG5cdE9iamVjdC5hc3NpZ24ob3B0cywgb3B0aW9ucyk7XG5cdHJldHVybiB0ZW1wbGF0ZV9kZWZhdWx0LnJlcGxhY2UoL1xce1xce3NlcnZlclVybFxcfVxcfS9nLCBvcHRzLnNlcnZlclVybCk7XG59XG52YXIgd2Vidmlld19kZWZhdWx0ID0gZ2V0V2Vidmlld0h0bWw7XG5cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgd2Vidmlld19kZWZhdWx0IGFzIGRlZmF1bHQsIGdldFdlYnZpZXdIdG1sIH07IiwiaW1wb3J0IHR5cGUgeyBEaXNwb3NhYmxlLCBFeHRlbnNpb25Db250ZXh0LCBXZWJ2aWV3UGFuZWwgfSBmcm9tICd2c2NvZGUnO1xyXG5pbXBvcnQgKiBhcyB2c2NvZGUgZnJvbSAndnNjb2RlJztcclxuaW1wb3J0IHsgVmlld0NvbHVtbiwgd2luZG93IH0gZnJvbSAndnNjb2RlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBBZGRDb25uZWN0aW9uUGFuZWwge1xyXG5cdHB1YmxpYyBzdGF0aWMgY3VycmVudFBhbmVsOiBBZGRDb25uZWN0aW9uUGFuZWwgfCB1bmRlZmluZWQ7XHJcblx0cHJpdmF0ZSByZWFkb25seSBfcGFuZWw6IFdlYnZpZXdQYW5lbDtcclxuXHRwcml2YXRlIF9kaXNwb3NhYmxlczogRGlzcG9zYWJsZVtdID0gW107XHJcblxyXG5cdHByaXZhdGUgY29uc3RydWN0b3IocGFuZWw6IFdlYnZpZXdQYW5lbCwgY29udGV4dDogRXh0ZW5zaW9uQ29udGV4dCkge1xyXG5cdFx0dGhpcy5fcGFuZWwgPSBwYW5lbDtcclxuXHJcblx0XHR0aGlzLl9wYW5lbC5vbkRpZERpc3Bvc2UoKCkgPT4gdGhpcy5kaXNwb3NlKCksIG51bGwsIHRoaXMuX2Rpc3Bvc2FibGVzKTtcclxuXHJcblx0XHR0aGlzLl9wYW5lbC53ZWJ2aWV3Lmh0bWwgPSBfX2dldFdlYnZpZXdIdG1sX18oe1xyXG5cdFx0XHRzZXJ2ZXJVcmw6IGAke3Byb2Nlc3MuZW52LlZJVEVfREVWX1NFUlZFUl9VUkx9d2Vidmlld3MvYWRkQ29ubmVjdGlvbi5odG1sYCxcclxuXHRcdFx0d2VidmlldzogdGhpcy5fcGFuZWwud2VidmlldyxcclxuXHRcdFx0Y29udGV4dCxcclxuXHRcdFx0aW5wdXROYW1lOiAnYWRkQ29ubmVjdGlvbicsXHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBzdGF0aWMgcmVuZGVyKGNvbnRleHQ6IEV4dGVuc2lvbkNvbnRleHQpIHtcclxuXHRcdGlmIChBZGRDb25uZWN0aW9uUGFuZWwuY3VycmVudFBhbmVsKSB7XHJcblx0XHRcdEFkZENvbm5lY3Rpb25QYW5lbC5jdXJyZW50UGFuZWwuX3BhbmVsLnJldmVhbChWaWV3Q29sdW1uLk9uZSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBwYW5lbCA9IHdpbmRvdy5jcmVhdGVXZWJ2aWV3UGFuZWwoXHJcblx0XHRcdFx0J2FkZFN5c3RlbUNvbm5lY3Rpb24nLFxyXG5cdFx0XHRcdCdBZGQgU3lzdGVtIENvbm5lY3Rpb24nLFxyXG5cdFx0XHRcdFZpZXdDb2x1bW4uT25lLFxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdGVuYWJsZVNjcmlwdHM6IHRydWUsXHJcblx0XHRcdFx0XHRsb2NhbFJlc291cmNlUm9vdHM6IFtcclxuXHRcdFx0XHRcdFx0dnNjb2RlLlVyaS5qb2luUGF0aChjb250ZXh0LmV4dGVuc2lvblVyaSwgJ2Rpc3QnKSxcclxuXHRcdFx0XHRcdF0sXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0KTtcclxuXHRcdFx0QWRkQ29ubmVjdGlvblBhbmVsLmN1cnJlbnRQYW5lbCA9IG5ldyBBZGRDb25uZWN0aW9uUGFuZWwocGFuZWwsIGNvbnRleHQpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogQ2xlYW5zIHVwIGFuZCBkaXNwb3NlcyBvZiB3ZWJ2aWV3IHJlc291cmNlcyB3aGVuIHRoZSB3ZWJ2aWV3IHBhbmVsIGlzIGNsb3NlZC5cclxuXHQgKi9cclxuXHRwdWJsaWMgZGlzcG9zZSgpIHtcclxuXHRcdEFkZENvbm5lY3Rpb25QYW5lbC5jdXJyZW50UGFuZWwgPSB1bmRlZmluZWQ7XHJcblxyXG5cdFx0Ly8gRGlzcG9zZSBvZiB0aGUgY3VycmVudCB3ZWJ2aWV3IHBhbmVsXHJcblx0XHR0aGlzLl9wYW5lbC5kaXNwb3NlKCk7XHJcblxyXG5cdFx0Ly8gRGlzcG9zZSBvZiBhbGwgZGlzcG9zYWJsZXMgKGkuZS4gY29tbWFuZHMpIGZvciB0aGUgY3VycmVudCB3ZWJ2aWV3IHBhbmVsXHJcblx0XHR3aGlsZSAodGhpcy5fZGlzcG9zYWJsZXMubGVuZ3RoKSB7XHJcblx0XHRcdGNvbnN0IGRpc3Bvc2FibGUgPSB0aGlzLl9kaXNwb3NhYmxlcy5wb3AoKTtcclxuXHRcdFx0aWYgKGRpc3Bvc2FibGUpIHtcclxuXHRcdFx0XHRkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG4iLCJpbXBvcnQgKiBhcyB2c2NvZGUgZnJvbSAndnNjb2RlJztcbmltcG9ydCB7IEFkZENvbm5lY3Rpb25QYW5lbCB9IGZyb20gJy4vdmlld3MvYWRkQ29ubmVjdGlvbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZShjb250ZXh0OiB2c2NvZGUuRXh0ZW5zaW9uQ29udGV4dCkge1xuXHRjb250ZXh0LnN1YnNjcmlwdGlvbnMucHVzaChcblx0XHR2c2NvZGUuY29tbWFuZHMucmVnaXN0ZXJDb21tYW5kKCdhYmFwLm9wZW5BZGRDb25uZWN0aW9uU2NyZWVuJywgKCkgPT4ge1xuXHRcdFx0QWRkQ29ubmVjdGlvblBhbmVsLnJlbmRlcihjb250ZXh0KTtcblx0XHR9KSxcblx0KTtcblxuXHRjb25zb2xlLmxvZygnRXh0ZW5zaW9uIGFjdGl2YXRlZC4nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7fVxuIl0sInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLElBQUksbUJBQW1COzs7OztBQVF2QixTQUFTLGVBQWUsU0FBUztDQUNoQyxNQUFNLE9BQU8sRUFBRSxXQUFXLElBQUk7QUFDOUIsUUFBTyxPQUFPLE1BQU0sUUFBUTtBQUM1QixRQUFPLGlCQUFpQixRQUFRLHNCQUFzQixLQUFLLFVBQVU7O0FBRXRFLElBQUksa0JBQWtCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDVHRCLElBQWEscUJBQWIsTUFBYSxtQkFBbUI7Q0FLL0IsQUFBUSxZQUFZLE9BQUMsU0FBQTt3QkFISjt3QkFDbEIsZ0JBQUEsRUFBQTtBQUdBLE9BQUEsU0FBQTtBQUVBLE9BQUEsT0FBQSxtQkFBQSxLQUFBLFNBQUEsRUFBQSxNQUFBLEtBQUEsYUFBQTtBQUVFLE9BQUssT0FBTyxRQUFRLE9BQU8sZ0JBQW1CO0dBQzdDLFdBQVcsNEJBQWtCO0dBQzdCLFNBQVEsS0FBQSxPQUFBO0dBQ1I7R0FDQSxXQUFFO0dBQ0gsQ0FBQTs7Q0FHRCxPQUFjLE9BQU8sU0FBa0I7QUFDdEMsTUFBSSxtQkFBbUIsY0FBYztBQUNwQyxzQkFBTyxhQUFBLE9BQUEsT0FBQSxrQkFBQSxJQUFBO1NBQ0Q7R0FDTixNQUFNLFFBQVEsY0FBTyxtQkFDcEIsdUJBQ0EseUJBQ0Esa0JBQUMsS0FDRDtJQUNDLGVBQWU7SUFDZixvQkFBb0IsQ0FDbkIsT0FBQyxJQUFBLFNBQUEsUUFBQSxjQUFBLE9BQUEsQ0FDRDtJQUNELENBQ0Q7QUFDRCxzQkFBQSxlQUFBLElBQUEsbUJBQUEsT0FBQSxRQUFBOzs7Ozs7Q0FPRixBQUFPLFVBQVU7QUFDbEIscUJBQUEsZUFBQTtBQUdBLE9BQUEsT0FBQSxTQUFBO0FBR0UsU0FBTyxLQUFLLGFBQWEsUUFBUTtHQUNoQyxNQUFNLGFBQVcsS0FBQSxhQUFBLEtBQUE7QUFDakIsT0FBSSxZQUFZO0FBQ2YsZUFBQSxTQUFBOzs7OztvQ0FqRFc7Ozs7QUNIZixTQUFnQixTQUFTLFNBQWtDO0FBQzFELFNBQVEsY0FBYyxLQUNyQixPQUFPLFNBQVMsZ0JBQWdCLHNDQUFzQztBQUNyRSxxQkFBbUIsT0FBTyxRQUFRO0dBQ2pDLENBQ0Y7QUFFRCxTQUFRLElBQUksdUJBQXVCOztBQUdwQyxTQUFnQixhQUFhIn0=