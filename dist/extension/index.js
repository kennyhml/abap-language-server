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
//#region types/connection.ts
const ConnectionTypes = {
	GroupSelection: "GroupSelection",
	CustomApplicationServer: "CustomApplicationServer"
};
const SecurityLevel = {
	Highest: "Highest",
	Encrypted: "Encrypted",
	Signed: "Signed",
	Authed: "Authed"
};
function isGroupSelection(connection) {
	return connection.connectionType === ConnectionTypes.GroupSelection;
}
function isApplicationServer(connection) {
	return connection.connectionType === ConnectionTypes.CustomApplicationServer;
}

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
		this._panel.webview.onDidReceiveMessage((message) => {}, undefined, this._disposables);
		this.initializeAvailableConnections();
	}
	static render(context) {
		if (AddConnectionPanel.currentPanel) {
			AddConnectionPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
		} else {
			const panel = vscode.window.createWebviewPanel("addSystemConnection", "Add System Connection", vscode.ViewColumn.One, {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "dist")],
				retainContextWhenHidden: true
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
	initializeAvailableConnections() {
		let connections = [];
		for (let i = 0; i < 30; i++) {
			connections.push({
				systemId: `W${i}D`,
				name: "",
				displayName: "",
				description: "",
				connectionType: ConnectionTypes.CustomApplicationServer,
				applicationServer: "",
				instanceNumber: "",
				sapRouterString: "",
				sncEnabled: true,
				ssoEnabled: true,
				sncName: "",
				sncLevel: SecurityLevel.Encrypted,
				keepSynced: true
			});
		}
		this._panel.webview.postMessage({
			type: "init",
			data: { connections }
		});
	}
};
_defineProperty(AddConnectionPanel, "currentPanel", void 0);

//#endregion
//#region src/index.ts
function activate(context) {
	console.log(context.workspaceState.keys());
	context.subscriptions.push(vscode.commands.registerCommand("abap.openAddConnectionScreen", () => {
		AddConnectionPanel.render(context);
	}));
	console.log("Extension activated.");
}
function deactivate() {}

//#endregion
exports.activate = activate;
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL0B0b21qcy92aXRlLXBsdWdpbi12c2NvZGUvZGlzdC93ZWJ2aWV3LmpzIiwiLi4vLi4vdHlwZXMvY29ubmVjdGlvbi50cyIsIi4uLy4uL3NyYy92aWV3cy9hZGRDb25uZWN0aW9uLnRzIiwiLi4vLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vI3JlZ2lvbiBzcmMvd2Vidmlldy90ZW1wbGF0ZS5odG1sXG52YXIgdGVtcGxhdGVfZGVmYXVsdCA9IFwiPCFkb2N0eXBlIGh0bWw+XFxuPGh0bWwgbGFuZz1cXFwiZW5cXFwiPlxcbiAgPGhlYWQ+XFxuICAgIDxtZXRhIGNoYXJzZXQ9XFxcIlVURi04XFxcIiAvPlxcbiAgICA8bWV0YSBodHRwLWVxdWl2PVxcXCJYLVVBLUNvbXBhdGlibGVcXFwiIGNvbnRlbnQ9XFxcIklFPWVkZ2VcXFwiIC8+XFxuICAgIDxtZXRhIG5hbWU9XFxcInZpZXdwb3J0XFxcIiBjb250ZW50PVxcXCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wXFxcIiAvPlxcbiAgICA8c3R5bGU+XFxuICAgICAgaHRtbCxcXG4gICAgICBib2R5IHtcXG4gICAgICAgIHdpZHRoOiAxMDAlO1xcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xcbiAgICAgICAgbWFyZ2luOiAwO1xcbiAgICAgICAgcGFkZGluZzogMDtcXG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XFxuICAgICAgfVxcblxcbiAgICAgICN3ZWJ2aWV3LXBhdGNoLWlmcmFtZSB7XFxuICAgICAgICB3aWR0aDogMTAwJTtcXG4gICAgICAgIGhlaWdodDogMTAwJTtcXG4gICAgICAgIGJvcmRlcjogbm9uZTtcXG4gICAgICB9XFxuXFxuICAgICAgLm91dGVyIHtcXG4gICAgICAgIHdpZHRoOiAxMDAlO1xcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gICAgICB9XFxuICAgIDwvc3R5bGU+XFxuXFxuICAgIDxzY3JpcHQgdHlwZT1cXFwibW9kdWxlXFxcIiBpZD1cXFwid2Vidmlldy1wYXRjaFxcXCI+XFxuICAgICAgY29uc3QgVEFHID0gJ1tAdG9tanM6dnNjb2RlOmV4dGVuc2lvbl0gJztcXG5cXG4gICAgICBmdW5jdGlvbiBvbkRvbVJlYWR5KGNhbGxiYWNrLCBkb2MpIHtcXG4gICAgICAgIGNvbnN0IF9kb2MgPSBkb2MgfHwgZG9jdW1lbnQ7XFxuICAgICAgICBpZiAoX2RvYy5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnIHx8IF9kb2MucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xcbiAgICAgICAgICBjYWxsYmFjaygpO1xcbiAgICAgICAgfSBlbHNlIHtcXG4gICAgICAgICAgX2RvYy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgY2FsbGJhY2spO1xcbiAgICAgICAgfVxcbiAgICAgIH1cXG5cXG4gICAgICBsZXQgdnNDb2RlQXBpO1xcblxcbiAgICAgIGZ1bmN0aW9uIGdldEFwaSgpIHtcXG4gICAgICAgIGlmICh2c0NvZGVBcGkpIHJldHVybiB2c0NvZGVBcGk7XFxuICAgICAgICByZXR1cm4gKHZzQ29kZUFwaSA9IGFjcXVpcmVWc0NvZGVBcGkoKSk7XFxuICAgICAgfVxcblxcbiAgICAgIGZ1bmN0aW9uIHNlbmRJbml0RGF0YShpZnJhbWUpIHtcXG4gICAgICAgIGNvbnNvbGUubG9nKFRBRyArICdpbml0IGRhdGEnKTtcXG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSB7fTtcXG4gICAgICAgIE9iamVjdC5rZXlzKGRvY3VtZW50LmJvZHkuZGF0YXNldCkuZm9yRWFjaCgoa2V5KSA9PiB7XFxuICAgICAgICAgIGRhdGFzZXRba2V5XSA9IGRvY3VtZW50LmJvZHkuZGF0YXNldFtrZXldO1xcbiAgICAgICAgfSk7XFxuXFxuICAgICAgICBpZnJhbWUuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZShcXG4gICAgICAgICAge1xcbiAgICAgICAgICAgIHR5cGU6ICdbdnNjb2RlOmV4dGVuc2lvbl06aW5pdCcsXFxuICAgICAgICAgICAgZGF0YToge1xcbiAgICAgICAgICAgICAgc3RhdGU6IGdldEFwaSgpLmdldFN0YXRlKCksXFxuICAgICAgICAgICAgICBzdHlsZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ19kZWZhdWx0U3R5bGVzJykuaW5uZXJIVE1MLFxcbiAgICAgICAgICAgICAgcm9vdDoge1xcbiAgICAgICAgICAgICAgICBjc3NUZXh0OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dCxcXG4gICAgICAgICAgICAgIH0sXFxuICAgICAgICAgICAgICBib2R5OiB7XFxuICAgICAgICAgICAgICAgIGRhdGFzZXQ6IGRhdGFzZXQsXFxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogZG9jdW1lbnQuYm9keS5jbGFzc05hbWUsXFxuICAgICAgICAgICAgICAgIHJvbGU6IGRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdyb2xlJyksXFxuICAgICAgICAgICAgICB9LFxcbiAgICAgICAgICAgIH0sXFxuICAgICAgICAgIH0sXFxuICAgICAgICAgICcqJyxcXG4gICAgICAgICk7XFxuICAgICAgfVxcblxcbiAgICAgIGZ1bmN0aW9uIG9ic2VydmVBdHRyaWJ1dGVDaGFuZ2VzKGVsZW1lbnQsIGF0dHJpYnV0ZU5hbWUsIGNhbGxiYWNrKSB7XFxuICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChtdXRhdGlvbnNMaXN0KSB7XFxuICAgICAgICAgIGZvciAobGV0IG11dGF0aW9uIG9mIG11dGF0aW9uc0xpc3QpIHtcXG4gICAgICAgICAgICBpZiAobXV0YXRpb24udHlwZSA9PT0gJ2F0dHJpYnV0ZXMnICYmIG11dGF0aW9uLmF0dHJpYnV0ZU5hbWUgPT09IGF0dHJpYnV0ZU5hbWUpIHtcXG4gICAgICAgICAgICAgIGNhbGxiYWNrKG11dGF0aW9uLnRhcmdldC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSkpO1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgfVxcbiAgICAgICAgfSk7XFxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGVsZW1lbnQsIHsgYXR0cmlidXRlczogdHJ1ZSB9KTtcXG4gICAgICAgIHJldHVybiBvYnNlcnZlcjtcXG4gICAgICB9XFxuXFxuICAgICAgLy8gbWVzc2FnZSBoYW5kbGVyXFxuICAgICAgbGV0IGlmcmFtZUxvYWRlZCA9IGZhbHNlO1xcbiAgICAgIGNvbnN0IGNhY2hlTWVzc2FnZXMgPSBbXTtcXG5cXG4gICAgICBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlKGUpIHtcXG4gICAgICAgIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3ZWJ2aWV3LXBhdGNoLWlmcmFtZScpO1xcbiAgICAgICAgaWYgKCFpZnJhbWVMb2FkZWQgfHwgIWlmcmFtZSkge1xcbiAgICAgICAgICByZXR1cm47XFxuICAgICAgICB9XFxuICAgICAgICBpZiAoZS5vcmlnaW4uc3RhcnRzV2l0aCgndnNjb2RlLXdlYnZpZXc6Ly8nKSkge1xcbiAgICAgICAgICBpZnJhbWUuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZShlLmRhdGEsICcqJyk7XFxuICAgICAgICB9IGVsc2UgaWYgKCd7e3NlcnZlclVybH19Jy5zdGFydHNXaXRoKGUub3JpZ2luKSkge1xcbiAgICAgICAgICBjb25zdCB7IHR5cGUsIGRhdGEgfSA9IGUuZGF0YTtcXG4gICAgICAgICAgY29uc29sZS5sb2coVEFHICsgJyByZWNlaXZlZDonLCBlLmRhdGEpO1xcbiAgICAgICAgICBpZiAodHlwZSA9PT0gJ1t2c2NvZGU6Y2xpZW50XTpwb3N0TWVzc2FnZScpIHtcXG4gICAgICAgICAgICBnZXRBcGkoKS5wb3N0TWVzc2FnZShkYXRhKTtcXG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnW3ZzY29kZTpjbGllbnRdOmNvbW1hbmRzJykge1xcbiAgICAgICAgICAgIGlmIChkYXRhID09PSAnRjEnKSB7XFxuICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChcXG4gICAgICAgICAgICAgICAgbmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCB7XFxuICAgICAgICAgICAgICAgICAga2V5OiAnRjEnLFxcbiAgICAgICAgICAgICAgICAgIGtleUNvZGU6IDExMixcXG4gICAgICAgICAgICAgICAgICBjb2RlOiAnRjEnLFxcbiAgICAgICAgICAgICAgICB9KSxcXG4gICAgICAgICAgICAgICk7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICB9XFxuICAgICAgICB9XFxuICAgICAgfVxcblxcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2ZW50KSB7XFxuICAgICAgICBpZiAoZXZlbnQub3JpZ2luLnN0YXJ0c1dpdGgoJ3ZzY29kZS13ZWJ2aWV3Oi8vJykpIHtcXG4gICAgICAgICAgY2FjaGVNZXNzYWdlcy5wdXNoKGV2ZW50KTtcXG4gICAgICAgICAgcmV0dXJuO1xcbiAgICAgICAgfVxcbiAgICAgICAgaGFuZGxlTWVzc2FnZShldmVudCk7XFxuICAgICAgfSk7XFxuXFxuICAgICAgbGV0IGlzQ2FjaGVXb3JraW5nID0gZmFsc2U7XFxuICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xcbiAgICAgICAgaWYgKGlzQ2FjaGVXb3JraW5nKSB7XFxuICAgICAgICAgIHJldHVybjtcXG4gICAgICAgIH1cXG5cXG4gICAgICAgIGlzQ2FjaGVXb3JraW5nID0gdHJ1ZTtcXG4gICAgICAgIGlmIChpZnJhbWVMb2FkZWQpIHtcXG4gICAgICAgICAgbGV0IGV2ZW50ID0gY2FjaGVNZXNzYWdlcy5zaGlmdCgpO1xcbiAgICAgICAgICB3aGlsZSAoZXZlbnQpIHtcXG4gICAgICAgICAgICBoYW5kbGVNZXNzYWdlKGV2ZW50KTtcXG4gICAgICAgICAgICBldmVudCA9IGNhY2hlTWVzc2FnZXMuc2hpZnQoKTtcXG4gICAgICAgICAgfVxcbiAgICAgICAgfVxcbiAgICAgICAgaXNDYWNoZVdvcmtpbmcgPSBmYWxzZTtcXG4gICAgICB9LCA1MCk7XFxuXFxuICAgICAgb25Eb21SZWFkeShmdW5jdGlvbiAoKSB7XFxuICAgICAgICAvKiogIEB0eXBlIHtIVE1MSUZyYW1lRWxlbWVudH0gKi9cXG4gICAgICAgIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3ZWJ2aWV3LXBhdGNoLWlmcmFtZScpO1xcbiAgICAgICAgb2JzZXJ2ZUF0dHJpYnV0ZUNoYW5nZXMoZG9jdW1lbnQuYm9keSwgJ2NsYXNzJywgZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xcbiAgICAgICAgICBzZW5kSW5pdERhdGEoaWZyYW1lKTtcXG4gICAgICAgIH0pO1xcblxcbiAgICAgICAgb25Eb21SZWFkeShmdW5jdGlvbiAoKSB7XFxuICAgICAgICAgIGlmcmFtZUxvYWRlZCA9IHRydWU7XFxuICAgICAgICAgIHNlbmRJbml0RGF0YShpZnJhbWUpO1xcbiAgICAgICAgfSwgaWZyYW1lLmNvbnRlbnREb2N1bWVudCk7XFxuXFxuICAgICAgICBpZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIChlKSB7XFxuICAgICAgICAgIGlmcmFtZUxvYWRlZCA9IHRydWU7XFxuXFxuICAgICAgICAgIGxldCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcXG4gICAgICAgICAgICB0cnkge1xcbiAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdfZGVmYXVsdFN0eWxlcycpKSB7XFxuICAgICAgICAgICAgICAgIHNlbmRJbml0RGF0YShpZnJhbWUpO1xcbiAgICAgICAgICAgICAgICAvLyBhZGRMaXN0ZW5lcnMoaWZyYW1lKTtcXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XFxuICAgICAgICAgICAgICAgIHJldHVybjtcXG4gICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XFxuICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICB9LCAxMCk7XFxuICAgICAgICB9KTtcXG4gICAgICB9KTtcXG4gICAgPFxcL3NjcmlwdD5cXG4gIDwvaGVhZD5cXG5cXG4gIDxib2R5PlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJvdXRlclxcXCI+XFxuICAgICAgPGlmcmFtZVxcbiAgICAgICAgaWQ9XFxcIndlYnZpZXctcGF0Y2gtaWZyYW1lXFxcIlxcbiAgICAgICAgZnJhbWVib3JkZXI9XFxcIjBcXFwiXFxuICAgICAgICBzYW5kYm94PVxcXCJhbGxvdy1zY3JpcHRzIGFsbG93LXNhbWUtb3JpZ2luIGFsbG93LWZvcm1zIGFsbG93LXBvaW50ZXItbG9jayBhbGxvdy1kb3dubG9hZHNcXFwiXFxuICAgICAgICBhbGxvdz1cXFwiY3Jvc3Mtb3JpZ2luLWlzb2xhdGVkOyBhdXRvcGxheTsgY2xpcGJvYXJkLXJlYWQ7IGNsaXBib2FyZC13cml0ZVxcXCJcXG4gICAgICAgIHNyYz1cXFwie3tzZXJ2ZXJVcmx9fVxcXCJcXG4gICAgICA+PC9pZnJhbWU+XFxuICAgIDwvZGl2PlxcbiAgPC9ib2R5PlxcbjwvaHRtbD5cXG5cIjtcblxuLy8jZW5kcmVnaW9uXG4vLyNyZWdpb24gc3JjL3dlYnZpZXcvd2Vidmlldy50c1xuLyoqXG4qXG4qIEBwYXJhbSBvcHRpb25zIHNlcnZlclVybCBzdHJpbmcgb3Igb2JqZWN0IG9wdGlvbnNcbiovXG5mdW5jdGlvbiBnZXRXZWJ2aWV3SHRtbChvcHRpb25zKSB7XG5cdGNvbnN0IG9wdHMgPSB7IHNlcnZlclVybDogXCJcIiB9O1xuXHRPYmplY3QuYXNzaWduKG9wdHMsIG9wdGlvbnMpO1xuXHRyZXR1cm4gdGVtcGxhdGVfZGVmYXVsdC5yZXBsYWNlKC9cXHtcXHtzZXJ2ZXJVcmxcXH1cXH0vZywgb3B0cy5zZXJ2ZXJVcmwpO1xufVxudmFyIHdlYnZpZXdfZGVmYXVsdCA9IGdldFdlYnZpZXdIdG1sO1xuXG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IHdlYnZpZXdfZGVmYXVsdCBhcyBkZWZhdWx0LCBnZXRXZWJ2aWV3SHRtbCB9OyIsImV4cG9ydCBjb25zdCBDb25uZWN0aW9uVHlwZXMgPSB7XHJcblx0R3JvdXBTZWxlY3Rpb246ICdHcm91cFNlbGVjdGlvbicsXHJcblx0Q3VzdG9tQXBwbGljYXRpb25TZXJ2ZXI6ICdDdXN0b21BcHBsaWNhdGlvblNlcnZlcicsXHJcbn0gYXMgY29uc3Q7XHJcblxyXG5leHBvcnQgY29uc3QgU2VjdXJpdHlMZXZlbCA9IHtcclxuXHRIaWdoZXN0OiAnSGlnaGVzdCcsXHJcblx0RW5jcnlwdGVkOiAnRW5jcnlwdGVkJyxcclxuXHRTaWduZWQ6ICdTaWduZWQnLFxyXG5cdEF1dGhlZDogJ0F1dGhlZCcsXHJcbn0gYXMgY29uc3Q7XHJcblxyXG5leHBvcnQgdHlwZSBDb25uZWN0aW9uVHlwZSA9IGtleW9mIHR5cGVvZiBDb25uZWN0aW9uVHlwZXM7XHJcblxyXG50eXBlIENvbW1vblByb3BlcnRpZXMgPSB7XHJcblx0bmFtZTogc3RyaW5nO1xyXG5cdGRpc3BsYXlOYW1lPzogc3RyaW5nO1xyXG5cdGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG5cdHN5c3RlbUlkOiBzdHJpbmc7XHJcblx0c25jRW5hYmxlZDogYm9vbGVhbjtcclxuXHRzc29FbmFibGVkOiBib29sZWFuO1xyXG5cdHNuY05hbWU6IHN0cmluZztcclxuXHRzbmNMZXZlbDoga2V5b2YgdHlwZW9mIFNlY3VyaXR5TGV2ZWw7XHJcblx0c2FwUm91dGVyU3RyaW5nPzogc3RyaW5nO1xyXG5cdGtlZXBTeW5jZWQ6IGJvb2xlYW47XHJcbn07XHJcblxyXG50eXBlIEdyb3VwU2VsZWN0aW9uUHJvcGVydGllcyA9IHtcclxuXHRjb25uZWN0aW9uVHlwZTogdHlwZW9mIENvbm5lY3Rpb25UeXBlcy5Hcm91cFNlbGVjdGlvbjtcclxuXHRtZXNzYWdlU2VydmVyOiBzdHJpbmc7XHJcblx0Z3JvdXA6IHN0cmluZztcclxuXHRtZXNzYWdlU2VydmVyUG9ydD86IG51bWJlcjtcclxufTtcclxuXHJcbnR5cGUgQXBwbGljYXRpb25TZXJ2ZXJQcm9wZXJ0aWVzID0ge1xyXG5cdGNvbm5lY3Rpb25UeXBlOiB0eXBlb2YgQ29ubmVjdGlvblR5cGVzLkN1c3RvbUFwcGxpY2F0aW9uU2VydmVyO1xyXG5cdGFwcGxpY2F0aW9uU2VydmVyOiBzdHJpbmc7XHJcblx0aW5zdGFuY2VOdW1iZXI6IHN0cmluZztcclxuXHRyZmNHYXRld2F5U2VydmVyPzogc3RyaW5nO1xyXG5cdHJmY0dhdGV3YXlTZXJ2ZXJQb3J0PzogbnVtYmVyO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgQ29ubmVjdGlvbiA9XHJcblx0fCAoQ29tbW9uUHJvcGVydGllcyAmIEdyb3VwU2VsZWN0aW9uUHJvcGVydGllcylcclxuXHR8IChDb21tb25Qcm9wZXJ0aWVzICYgQXBwbGljYXRpb25TZXJ2ZXJQcm9wZXJ0aWVzKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0dyb3VwU2VsZWN0aW9uKFxyXG5cdGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXHJcbik6IGNvbm5lY3Rpb24gaXMgQ29ubmVjdGlvbiAmIEdyb3VwU2VsZWN0aW9uUHJvcGVydGllcyB7XHJcblx0cmV0dXJuIGNvbm5lY3Rpb24uY29ubmVjdGlvblR5cGUgPT09IENvbm5lY3Rpb25UeXBlcy5Hcm91cFNlbGVjdGlvbjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQXBwbGljYXRpb25TZXJ2ZXIoXHJcblx0Y29ubmVjdGlvbjogQ29ubmVjdGlvbixcclxuKTogY29ubmVjdGlvbiBpcyBDb25uZWN0aW9uICYgQXBwbGljYXRpb25TZXJ2ZXJQcm9wZXJ0aWVzIHtcclxuXHRyZXR1cm4gY29ubmVjdGlvbi5jb25uZWN0aW9uVHlwZSA9PT0gQ29ubmVjdGlvblR5cGVzLkN1c3RvbUFwcGxpY2F0aW9uU2VydmVyO1xyXG59XHJcbiIsImltcG9ydCB7XHJcblx0Q29ubmVjdGlvblR5cGVzLFxyXG5cdFNlY3VyaXR5TGV2ZWwsXHJcblx0dHlwZSBDb25uZWN0aW9uLFxyXG59IGZyb20gJ3R5cGVzL2Nvbm5lY3Rpb24nO1xyXG5pbXBvcnQgdHlwZSB7IERpc3Bvc2FibGUsIEV4dGVuc2lvbkNvbnRleHQsIFdlYnZpZXdQYW5lbCB9IGZyb20gJ3ZzY29kZSc7XHJcbmltcG9ydCAqIGFzIHZzY29kZSBmcm9tICd2c2NvZGUnO1xyXG5pbXBvcnQgeyBWaWV3Q29sdW1uLCB3aW5kb3cgfSBmcm9tICd2c2NvZGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFkZENvbm5lY3Rpb25QYW5lbCB7XHJcblx0cHVibGljIHN0YXRpYyBjdXJyZW50UGFuZWw6IEFkZENvbm5lY3Rpb25QYW5lbCB8IHVuZGVmaW5lZDtcclxuXHRwcml2YXRlIHJlYWRvbmx5IF9wYW5lbDogV2Vidmlld1BhbmVsO1xyXG5cdHByaXZhdGUgX2Rpc3Bvc2FibGVzOiBEaXNwb3NhYmxlW10gPSBbXTtcclxuXHJcblx0cHJpdmF0ZSBjb25zdHJ1Y3RvcihwYW5lbDogV2Vidmlld1BhbmVsLCBjb250ZXh0OiBFeHRlbnNpb25Db250ZXh0KSB7XHJcblx0XHR0aGlzLl9wYW5lbCA9IHBhbmVsO1xyXG5cclxuXHRcdHRoaXMuX3BhbmVsLm9uRGlkRGlzcG9zZSgoKSA9PiB0aGlzLmRpc3Bvc2UoKSwgbnVsbCwgdGhpcy5fZGlzcG9zYWJsZXMpO1xyXG5cclxuXHRcdHRoaXMuX3BhbmVsLndlYnZpZXcuaHRtbCA9IF9fZ2V0V2Vidmlld0h0bWxfXyh7XHJcblx0XHRcdHNlcnZlclVybDogYCR7cHJvY2Vzcy5lbnYuVklURV9ERVZfU0VSVkVSX1VSTH13ZWJ2aWV3cy9hZGRDb25uZWN0aW9uLmh0bWxgLFxyXG5cdFx0XHR3ZWJ2aWV3OiB0aGlzLl9wYW5lbC53ZWJ2aWV3LFxyXG5cdFx0XHRjb250ZXh0LFxyXG5cdFx0XHRpbnB1dE5hbWU6ICdhZGRDb25uZWN0aW9uJyxcclxuXHRcdH0pO1xyXG5cdFx0dGhpcy5fcGFuZWwud2Vidmlldy5vbkRpZFJlY2VpdmVNZXNzYWdlKFxyXG5cdFx0XHQobWVzc2FnZTogYW55KSA9PiB7fSxcclxuXHRcdFx0dW5kZWZpbmVkLFxyXG5cdFx0XHR0aGlzLl9kaXNwb3NhYmxlcyxcclxuXHRcdCk7XHJcblx0XHR0aGlzLmluaXRpYWxpemVBdmFpbGFibGVDb25uZWN0aW9ucygpO1xyXG5cdH1cclxuXHJcblx0cHVibGljIHN0YXRpYyByZW5kZXIoY29udGV4dDogRXh0ZW5zaW9uQ29udGV4dCkge1xyXG5cdFx0aWYgKEFkZENvbm5lY3Rpb25QYW5lbC5jdXJyZW50UGFuZWwpIHtcclxuXHRcdFx0QWRkQ29ubmVjdGlvblBhbmVsLmN1cnJlbnRQYW5lbC5fcGFuZWwucmV2ZWFsKFZpZXdDb2x1bW4uT25lKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNvbnN0IHBhbmVsID0gd2luZG93LmNyZWF0ZVdlYnZpZXdQYW5lbChcclxuXHRcdFx0XHQnYWRkU3lzdGVtQ29ubmVjdGlvbicsXHJcblx0XHRcdFx0J0FkZCBTeXN0ZW0gQ29ubmVjdGlvbicsXHJcblx0XHRcdFx0Vmlld0NvbHVtbi5PbmUsXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0ZW5hYmxlU2NyaXB0czogdHJ1ZSxcclxuXHRcdFx0XHRcdGxvY2FsUmVzb3VyY2VSb290czogW1xyXG5cdFx0XHRcdFx0XHR2c2NvZGUuVXJpLmpvaW5QYXRoKGNvbnRleHQuZXh0ZW5zaW9uVXJpLCAnZGlzdCcpLFxyXG5cdFx0XHRcdFx0XSxcclxuXHRcdFx0XHRcdHJldGFpbkNvbnRleHRXaGVuSGlkZGVuOiB0cnVlLFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdCk7XHJcblx0XHRcdEFkZENvbm5lY3Rpb25QYW5lbC5jdXJyZW50UGFuZWwgPSBuZXcgQWRkQ29ubmVjdGlvblBhbmVsKHBhbmVsLCBjb250ZXh0KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIENsZWFucyB1cCBhbmQgZGlzcG9zZXMgb2Ygd2VidmlldyByZXNvdXJjZXMgd2hlbiB0aGUgd2VidmlldyBwYW5lbCBpcyBjbG9zZWQuXHJcblx0ICovXHJcblx0cHVibGljIGRpc3Bvc2UoKSB7XHJcblx0XHRBZGRDb25uZWN0aW9uUGFuZWwuY3VycmVudFBhbmVsID0gdW5kZWZpbmVkO1xyXG5cclxuXHRcdC8vIERpc3Bvc2Ugb2YgdGhlIGN1cnJlbnQgd2VidmlldyBwYW5lbFxyXG5cdFx0dGhpcy5fcGFuZWwuZGlzcG9zZSgpO1xyXG5cclxuXHRcdC8vIERpc3Bvc2Ugb2YgYWxsIGRpc3Bvc2FibGVzIChpLmUuIGNvbW1hbmRzKSBmb3IgdGhlIGN1cnJlbnQgd2VidmlldyBwYW5lbFxyXG5cdFx0d2hpbGUgKHRoaXMuX2Rpc3Bvc2FibGVzLmxlbmd0aCkge1xyXG5cdFx0XHRjb25zdCBkaXNwb3NhYmxlID0gdGhpcy5fZGlzcG9zYWJsZXMucG9wKCk7XHJcblx0XHRcdGlmIChkaXNwb3NhYmxlKSB7XHJcblx0XHRcdFx0ZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHByaXZhdGUgaW5pdGlhbGl6ZUF2YWlsYWJsZUNvbm5lY3Rpb25zKCkge1xyXG5cdFx0bGV0IGNvbm5lY3Rpb25zOiBDb25uZWN0aW9uW10gPSBbXTtcclxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgMzA7IGkrKykge1xyXG5cdFx0XHRjb25uZWN0aW9ucy5wdXNoKHtcclxuXHRcdFx0XHRzeXN0ZW1JZDogYFcke2l9RGAsXHJcblx0XHRcdFx0bmFtZTogJycsXHJcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICcnLFxyXG5cdFx0XHRcdGRlc2NyaXB0aW9uOiAnJyxcclxuXHRcdFx0XHRjb25uZWN0aW9uVHlwZTogQ29ubmVjdGlvblR5cGVzLkN1c3RvbUFwcGxpY2F0aW9uU2VydmVyLFxyXG5cdFx0XHRcdGFwcGxpY2F0aW9uU2VydmVyOiAnJyxcclxuXHRcdFx0XHRpbnN0YW5jZU51bWJlcjogJycsXHJcblx0XHRcdFx0c2FwUm91dGVyU3RyaW5nOiAnJyxcclxuXHRcdFx0XHRzbmNFbmFibGVkOiB0cnVlLFxyXG5cdFx0XHRcdHNzb0VuYWJsZWQ6IHRydWUsXHJcblx0XHRcdFx0c25jTmFtZTogJycsXHJcblx0XHRcdFx0c25jTGV2ZWw6IFNlY3VyaXR5TGV2ZWwuRW5jcnlwdGVkLFxyXG5cdFx0XHRcdGtlZXBTeW5jZWQ6IHRydWUsXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX3BhbmVsLndlYnZpZXcucG9zdE1lc3NhZ2UoeyB0eXBlOiAnaW5pdCcsIGRhdGE6IHsgY29ubmVjdGlvbnMgfSB9KTtcclxuXHR9XHJcbn1cclxuIiwiaW1wb3J0ICogYXMgdnNjb2RlIGZyb20gJ3ZzY29kZSc7XG5pbXBvcnQgeyBBZGRDb25uZWN0aW9uUGFuZWwgfSBmcm9tICcuL3ZpZXdzL2FkZENvbm5lY3Rpb24nO1xuXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUoY29udGV4dDogdnNjb2RlLkV4dGVuc2lvbkNvbnRleHQpIHtcblx0Y29uc29sZS5sb2coY29udGV4dC53b3Jrc3BhY2VTdGF0ZS5rZXlzKCkpO1xuXG5cdGNvbnRleHQuc3Vic2NyaXB0aW9ucy5wdXNoKFxuXHRcdHZzY29kZS5jb21tYW5kcy5yZWdpc3RlckNvbW1hbmQoJ2FiYXAub3BlbkFkZENvbm5lY3Rpb25TY3JlZW4nLCAoKSA9PiB7XG5cdFx0XHRBZGRDb25uZWN0aW9uUGFuZWwucmVuZGVyKGNvbnRleHQpO1xuXHRcdH0pLFxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdFeHRlbnNpb24gYWN0aXZhdGVkLicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHt9XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzBdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Es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