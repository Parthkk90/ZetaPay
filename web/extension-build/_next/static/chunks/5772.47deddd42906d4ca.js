"use strict";
(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([[5772],{

/***/ 65772:
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   offchainLookup: function() { return /* binding */ v; },
/* harmony export */   offchainLookupSignature: function() { return /* binding */ P; }
/* harmony export */ });
/* unused harmony exports ccipRequest, offchainLookupAbiItem */
/* harmony import */ var _index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(61917);

class M extends _index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.f {
  constructor({ callbackSelector: s, cause: e, data: n, extraData: c, sender: u, urls: t }) {
    var i;
    super(e.shortMessage || "An error occurred while fetching for an offchain result.", {
      cause: e,
      metaMessages: [
        ...e.metaMessages || [],
        (i = e.metaMessages) != null && i.length ? "" : [],
        "Offchain Gateway Call:",
        t && [
          "  Gateway URL(s):",
          ...t.map((f) => `    ${(0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.j)(f)}`)
        ],
        `  Sender: ${u}`,
        `  Data: ${n}`,
        `  Callback selector: ${s}`,
        `  Extra data: ${c}`
      ].flat()
    }), Object.defineProperty(this, "name", {
      enumerable: !0,
      configurable: !0,
      writable: !0,
      value: "OffchainLookupError"
    });
  }
}
class R extends _index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.f {
  constructor({ result: s, url: e }) {
    super("Offchain gateway response is malformed. Response data must be a hex value.", {
      metaMessages: [
        `Gateway URL: ${(0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.j)(e)}`,
        `Response: ${(0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.s)(s)}`
      ]
    }), Object.defineProperty(this, "name", {
      enumerable: !0,
      configurable: !0,
      writable: !0,
      value: "OffchainLookupResponseMalformedError"
    });
  }
}
class $ extends _index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.f {
  constructor({ sender: s, to: e }) {
    super("Reverted sender address does not match target contract address (`to`).", {
      metaMessages: [
        `Contract address: ${e}`,
        `OffchainLookup sender address: ${s}`
      ]
    }), Object.defineProperty(this, "name", {
      enumerable: !0,
      configurable: !0,
      writable: !0,
      value: "OffchainLookupSenderMismatchError"
    });
  }
}
const P = "0x556f1830", S = {
  name: "OffchainLookup",
  type: "error",
  inputs: [
    {
      name: "sender",
      type: "address"
    },
    {
      name: "urls",
      type: "string[]"
    },
    {
      name: "callData",
      type: "bytes"
    },
    {
      name: "callbackFunction",
      type: "bytes4"
    },
    {
      name: "extraData",
      type: "bytes"
    }
  ]
};
async function v(o, { blockNumber: s, blockTag: e, data: n, to: c }) {
  const { args: u } = (0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.k)({
    data: n,
    abi: [S]
  }), [t, i, f, a, r] = u, { ccipRead: l } = o, b = l && typeof (l == null ? void 0 : l.request) == "function" ? l.request : j;
  try {
    if (!(0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.l)(c, t))
      throw new $({ sender: t, to: c });
    const d = await b({ data: f, sender: t, urls: i }), { data: w } = await (0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.m)(o, {
      blockNumber: s,
      blockTag: e,
      data: (0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.n)([
        a,
        (0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.o)([{ type: "bytes" }, { type: "bytes" }], [d, r])
      ]),
      to: c
    });
    return w;
  } catch (d) {
    throw new M({
      callbackSelector: a,
      cause: d,
      data: n,
      extraData: r,
      sender: t,
      urls: i
    });
  }
}
async function j({ data: o, sender: s, urls: e }) {
  var c;
  let n = new Error("An unknown error occurred.");
  for (let u = 0; u < e.length; u++) {
    const t = e[u], i = t.includes("{data}") ? "GET" : "POST", f = i === "POST" ? { data: o, sender: s } : void 0;
    try {
      const a = await fetch(t.replace("{sender}", s).replace("{data}", o), {
        body: JSON.stringify(f),
        method: i
      });
      let r;
      if ((c = a.headers.get("Content-Type")) != null && c.startsWith("application/json") ? r = (await a.json()).data : r = await a.text(), !a.ok) {
        n = new _index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.H({
          body: f,
          details: r != null && r.error ? (0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.s)(r.error) : a.statusText,
          headers: a.headers,
          status: a.status,
          url: t
        });
        continue;
      }
      if (!(0,_index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.p)(r)) {
        n = new R({
          result: r,
          url: t
        });
        continue;
      }
      return r;
    } catch (a) {
      n = new _index_Dkxv0BVe_mjs__WEBPACK_IMPORTED_MODULE_0__.H({
        body: f,
        details: a.message,
        url: t
      });
    }
  }
  throw n;
}



/***/ })

}]);