var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/papaparse/papaparse.min.js
var require_papaparse_min = __commonJS({
  "node_modules/papaparse/papaparse.min.js"(exports, module) {
    ((e, t) => {
      "function" == typeof define && define.amd ? define([], t) : "object" == typeof module && "undefined" != typeof exports ? module.exports = t() : e.Papa = t();
    })(exports, function r() {
      var n = "undefined" != typeof self ? self : "undefined" != typeof window ? window : void 0 !== n ? n : {};
      var s = !n.document && !!n.postMessage, a = n.IS_PAPA_WORKER || false, o = {}, h = 0, w = {};
      function q(e) {
        return 65279 === e.charCodeAt(0) ? e.slice(1) : e;
      }
      function u(e) {
        this._handle = null, this._finished = false, this._completed = false, this._halted = false, this._input = null, this._baseIndex = 0, this._partialLine = "", this._rowCount = 0, this._start = 0, this._nextChunk = null, this.isFirstChunk = true, this._completeResults = { data: [], errors: [], meta: {} }, function(e2) {
          var t = v(e2);
          t.chunkSize = parseInt(t.chunkSize), e2.step || e2.chunk || (t.chunkSize = null);
          this._handle = new i(t), (this._handle.streamer = this)._config = t;
        }.call(this, e), this.parseChunk = function(t, e2) {
          var i2 = parseInt(this._config.skipFirstNLines) || 0;
          if (this.isFirstChunk && 0 < i2) {
            let e3 = this._config.newline;
            e3 || (r2 = this._config.quoteChar || '"', e3 = this._handle.guessLineEndings(t, r2)), t = [...t.split(e3).slice(i2)].join(e3);
          }
          this.isFirstChunk && U(this._config.beforeFirstChunk) && void 0 !== (r2 = this._config.beforeFirstChunk(t)) && (t = r2), this.isFirstChunk = false, this._halted = false;
          var i2 = this._partialLine + t, r2 = (this._partialLine = "", this._handle.parse(i2, this._baseIndex, !this._finished));
          if (!this._handle.paused() && !this._handle.aborted()) {
            t = r2.meta.cursor, i2 = (this._finished || (this._partialLine = i2.substring(t - this._baseIndex), this._baseIndex = t), r2 && r2.data && (this._rowCount += r2.data.length), this._finished || this._config.preview && this._rowCount >= this._config.preview);
            if (a) n.postMessage({ results: r2, workerId: w.WORKER_ID, finished: i2 });
            else if (U(this._config.chunk) && !e2) {
              if (this._config.chunk(r2, this._handle), this._handle.paused() || this._handle.aborted()) return void (this._halted = true);
              this._completeResults = r2 = void 0;
            }
            return this._config.step || this._config.chunk || (this._completeResults.data = this._completeResults.data.concat(r2.data), this._completeResults.errors = this._completeResults.errors.concat(r2.errors), this._completeResults.meta = r2.meta), this._completed || !i2 || !U(this._config.complete) || r2 && r2.meta.aborted || (this._config.complete(this._completeResults, this._input), this._completed = true), i2 || r2 && r2.meta.paused || this._nextChunk(), r2;
          }
          this._halted = true;
        }, this._sendError = function(e2) {
          U(this._config.error) ? this._config.error(e2) : a && this._config.error && n.postMessage({ workerId: w.WORKER_ID, error: e2, finished: false });
        };
      }
      function d(e) {
        var r2;
        (e = e || {}).chunkSize || (e.chunkSize = w.RemoteChunkSize), u.call(this, e), this._nextChunk = s ? function() {
          this._readChunk(), this._chunkLoaded();
        } : function() {
          this._readChunk();
        }, this.stream = function(e2) {
          this._input = e2, this._nextChunk();
        }, this._readChunk = function() {
          if (this._finished) this._chunkLoaded();
          else {
            if (r2 = new XMLHttpRequest(), this._config.withCredentials && (r2.withCredentials = this._config.withCredentials), s || (r2.onload = m(this._chunkLoaded, this), r2.onerror = m(this._chunkError, this)), r2.ontimeout = m(this._chunkTimeout, this), r2.open(this._config.downloadRequestBody ? "POST" : "GET", this._input, !s), this._config.downloadTimeout && !s && (r2.timeout = this._config.downloadTimeout), this._config.downloadRequestHeaders) {
              var e2, t = this._config.downloadRequestHeaders;
              for (e2 in t) r2.setRequestHeader(e2, t[e2]);
            }
            var i2;
            this._config.chunkSize && (i2 = this._start + this._config.chunkSize - 1, r2.setRequestHeader("Range", "bytes=" + this._start + "-" + i2));
            try {
              r2.send(this._config.downloadRequestBody);
            } catch (e3) {
              this._chunkError(e3.message);
            }
            s && 0 === r2.status && this._chunkError();
          }
        }, this._chunkLoaded = function() {
          4 === r2.readyState && (r2.status < 200 || 400 <= r2.status ? this._chunkError() : (this._start += this._config.chunkSize || r2.responseText.length, this._finished = !this._config.chunkSize || this._start >= ((e2) => null !== (e2 = e2.getResponseHeader("Content-Range")) ? parseInt(e2.substring(e2.lastIndexOf("/") + 1)) : -1)(r2), this.parseChunk(r2.responseText)));
        }, this._chunkError = function(e2) {
          e2 = r2.statusText || e2;
          this._sendError(new Error(e2));
        }, this._chunkTimeout = function() {
          this._chunkError("Request timed out after " + this._config.downloadTimeout + "ms");
        };
      }
      function l(e) {
        (e = e || {}).chunkSize || (e.chunkSize = w.LocalChunkSize), u.call(this, e);
        var i2, r2, n2 = "undefined" != typeof FileReader;
        this.stream = function(e2) {
          this._input = e2, r2 = e2.slice || e2.webkitSlice || e2.mozSlice, n2 ? ((i2 = new FileReader()).onload = m(this._chunkLoaded, this), i2.onerror = m(this._chunkError, this)) : i2 = new FileReaderSync(), this._nextChunk();
        }, this._nextChunk = function() {
          this._finished || this._config.preview && !(this._rowCount < this._config.preview) || this._readChunk();
        }, this._readChunk = function() {
          var e2 = this._input, t = (this._config.chunkSize && (t = Math.min(this._start + this._config.chunkSize, this._input.size), e2 = r2.call(e2, this._start, t)), i2.readAsText(e2, this._config.encoding));
          n2 || this._chunkLoaded({ target: { result: t } });
        }, this._chunkLoaded = function(e2) {
          this._start += this._config.chunkSize, this._finished = !this._config.chunkSize || this._start >= this._input.size, this.parseChunk(e2.target.result);
        }, this._chunkError = function() {
          this._sendError(i2.error);
        };
      }
      function f(e) {
        var i2;
        u.call(this, e = e || {}), this.stream = function(e2) {
          return i2 = e2, this._nextChunk();
        }, this._nextChunk = function() {
          var e2, t;
          if (!this._finished) return e2 = this._config.chunkSize, i2 = e2 ? (t = i2.substring(0, e2), i2.substring(e2)) : (t = i2, ""), this._finished = !i2, this.parseChunk(t);
        };
      }
      function c(e) {
        u.call(this, e = e || {});
        var t = [], i2 = true, r2 = false;
        this.pause = function() {
          u.prototype.pause.apply(this, arguments), this._input.pause();
        }, this.resume = function() {
          u.prototype.resume.apply(this, arguments), this._input.resume();
        }, this.stream = function(e2) {
          this._input = e2, this._input.on("data", this._streamData), this._input.on("end", this._streamEnd), this._input.on("error", this._streamError);
        }, this._checkIsFinished = function() {
          r2 && 1 === t.length && (this._finished = true);
        }, this._nextChunk = function() {
          this._checkIsFinished(), t.length ? this.parseChunk(t.shift()) : i2 = true;
        }, this._streamData = m(function(e2) {
          try {
            t.push("string" == typeof e2 ? e2 : e2.toString(this._config.encoding)), i2 && (i2 = false, this._checkIsFinished(), this.parseChunk(t.shift()));
          } catch (e3) {
            this._streamError(e3);
          }
        }, this), this._streamError = m(function(e2) {
          this._streamCleanUp(), this._sendError(e2);
        }, this), this._streamEnd = m(function() {
          this._streamCleanUp(), r2 = true, this._streamData("");
        }, this), this._streamCleanUp = m(function() {
          this._input.removeListener("data", this._streamData), this._input.removeListener("end", this._streamEnd), this._input.removeListener("error", this._streamError);
        }, this);
      }
      function i(m2) {
        var n2, s2, a2, t, o2 = Math.pow(2, 53), h2 = -o2, u2 = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/, d2 = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/, i2 = this, r2 = 0, l2 = 0, f2 = false, e = false, c2 = [], p2 = { data: [], errors: [], meta: {} };
        function y(e2) {
          return "greedy" === m2.skipEmptyLines ? "" === e2.join("").trim() : 1 === e2.length && 0 === e2[0].length;
        }
        function _2() {
          if (p2 && a2 && (k("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '" + w.DefaultDelimiter + "'"), a2 = false), m2.skipEmptyLines && (p2.data = p2.data.filter(function(e3) {
            return !y(e3);
          })), g2()) {
            let t3 = function(e3) {
              c2.push(e3);
            };
            var t2 = t3;
            if (p2) if (Array.isArray(p2.data[0])) {
              for (var e2 = 0; g2() && e2 < p2.data.length; e2++) p2.data[e2].forEach(t3);
              p2.data.splice(0, 1);
            } else p2.data.forEach(t3);
          }
          function i3(e3, t3) {
            for (var i4 = m2.header ? {} : [], r4 = 0; r4 < e3.length; r4++) {
              var n3 = r4, s3 = e3[r4], s3 = ((e4, t4) => ((e5) => (m2.dynamicTypingFunction && void 0 === m2.dynamicTyping[e5] && (m2.dynamicTyping[e5] = m2.dynamicTypingFunction(e5)), true === (m2.dynamicTyping[e5] || m2.dynamicTyping)))(e4) ? "true" === t4 || "TRUE" === t4 || "false" !== t4 && "FALSE" !== t4 && (((e5) => {
                if (u2.test(e5)) {
                  e5 = parseFloat(e5);
                  if (h2 < e5 && e5 < o2) return 1;
                }
              })(t4) ? parseFloat(t4) : d2.test(t4) ? new Date(t4) : "" === t4 ? null : t4) : t4)(n3 = m2.header ? r4 >= c2.length ? "__parsed_extra" : c2[r4] : n3, s3 = m2.transform ? m2.transform(s3, n3) : s3);
              "__parsed_extra" === n3 ? (i4[n3] = i4[n3] || [], i4[n3].push(s3)) : i4[n3] = s3;
            }
            return m2.header && (r4 > c2.length ? k("FieldMismatch", "TooManyFields", "Too many fields: expected " + c2.length + " fields but parsed " + r4, l2 + t3) : r4 < c2.length && k("FieldMismatch", "TooFewFields", "Too few fields: expected " + c2.length + " fields but parsed " + r4, l2 + t3)), i4;
          }
          var r3;
          p2 && (m2.header || m2.dynamicTyping || m2.transform) && (r3 = 1, !p2.data.length || Array.isArray(p2.data[0]) ? (p2.data = p2.data.map(i3), r3 = p2.data.length) : p2.data = i3(p2.data, 0), m2.header && p2.meta && (p2.meta.fields = c2), l2 += r3);
        }
        function g2() {
          return m2.header && 0 === c2.length;
        }
        function k(e2, t2, i3, r3) {
          e2 = { type: e2, code: t2, message: i3 };
          void 0 !== r3 && (e2.row = r3), p2.errors.push(e2);
        }
        U(m2.step) && (t = m2.step, m2.step = function(e2) {
          p2 = e2, g2() ? _2() : (_2(), 0 !== p2.data.length && (r2 += e2.data.length, m2.preview && r2 > m2.preview ? s2.abort() : (p2.data = p2.data[0], t(p2, i2))));
        }), this.parse = function(e2, t2, i3) {
          var r3 = m2.quoteChar || '"', r3 = (m2.newline || (m2.newline = this.guessLineEndings(e2, r3)), a2 = false, m2.delimiter ? U(m2.delimiter) && (m2.delimiter = m2.delimiter(e2), p2.meta.delimiter = m2.delimiter) : ((r3 = ((e3, t3, i4, r4, n3) => {
            var s3, a3, o3, h3;
            n3 = n3 || [",", "	", "|", ";", w.RECORD_SEP, w.UNIT_SEP];
            for (var u3 = 0; u3 < n3.length; u3++) {
              for (var d3, l3 = n3[u3], f3 = 0, c3 = 0, p3 = 0, _3 = (o3 = void 0, new E({ comments: r4, delimiter: l3, newline: t3, preview: 10 }).parse(e3)), g3 = 0; g3 < _3.data.length; g3++) i4 && y(_3.data[g3]) ? p3++ : (d3 = _3.data[g3].length, c3 += d3, void 0 === o3 ? o3 = d3 : 0 < d3 && (f3 += Math.abs(d3 - o3), o3 = d3));
              0 < _3.data.length && (c3 /= _3.data.length - p3), 1.99 < c3 && (void 0 === a3 || f3 < a3 || f3 === a3 && h3 < c3) && (a3 = f3, s3 = l3, h3 = c3);
            }
            return { successful: !!(m2.delimiter = s3), bestDelimiter: s3 };
          })(e2, m2.newline, m2.skipEmptyLines, m2.comments, m2.delimitersToGuess)).successful ? m2.delimiter = r3.bestDelimiter : (a2 = true, m2.delimiter = w.DefaultDelimiter), p2.meta.delimiter = m2.delimiter), v(m2));
          return r3.header = g2(), m2.preview && m2.header && r3.preview++, n2 = e2, s2 = new E(r3), p2 = s2.parse(n2, t2, i3), _2(), f2 ? { meta: { paused: true } } : p2 || { meta: { paused: false } };
        }, this.paused = function() {
          return f2;
        }, this.pause = function() {
          f2 = true, s2.abort(), n2 = U(m2.chunk) ? "" : n2.substring(s2.getCharIndex());
        }, this.resume = function() {
          i2.streamer._halted ? (f2 = false, i2.streamer.parseChunk(n2, true)) : setTimeout(i2.resume, 3);
        }, this.aborted = function() {
          return e;
        }, this.abort = function() {
          e = true, s2.abort(), p2.meta.aborted = true, U(m2.complete) && m2.complete(p2), n2 = "";
        }, this.guessLineEndings = function(e2, t2) {
          e2 = e2.substring(0, 1048576);
          var t2 = new RegExp(P(t2) + "([^]*?)" + P(t2), "gm"), i3 = (e2 = e2.replace(t2, "")).split("\r"), t2 = e2.split("\n"), e2 = 1 < t2.length && t2[0].length < i3[0].length;
          if (1 === i3.length || e2) return "\n";
          for (var r3 = 0, n3 = 0; n3 < i3.length; n3++) "\n" === i3[n3][0] && r3++;
          return r3 >= i3.length / 2 ? "\r\n" : "\r";
        };
      }
      function P(e) {
        return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      function E(C) {
        var S = (C = C || {}).delimiter, O = C.newline, x = C.comments, T = C.step, I = C.preview, A = C.fastMode, D = null, L = false, F = null == C.quoteChar ? '"' : C.quoteChar, z = F;
        if (void 0 !== C.escapeChar && (z = C.escapeChar), ("string" != typeof S || -1 < w.BAD_DELIMITERS.indexOf(S)) && (S = ","), x === S) throw new Error("Comment character same as delimiter");
        true === x ? x = "#" : ("string" != typeof x || -1 < w.BAD_DELIMITERS.indexOf(x)) && (x = false), "\n" !== O && "\r" !== O && "\r\n" !== O && (O = "\n");
        var M = 0, j = false;
        this.parse = function(i2, t, r2) {
          if ("string" != typeof i2) throw new Error("Input must be a string");
          var n2 = i2.length, e = S.length, s2 = O.length, a2 = x.length, o2 = U(T), h2 = [], u2 = [], d2 = [], l2 = M = 0;
          if (!i2) return b();
          if (A || false !== A && -1 === i2.indexOf(F)) {
            for (var f2 = i2.split(O), c2 = 0; c2 < f2.length; c2++) {
              if (d2 = f2[c2], M += d2.length, c2 !== f2.length - 1) M += O.length;
              else if (r2) return b();
              if (!x || d2.substring(0, a2) !== x) {
                if (o2) {
                  if (h2 = [], k(d2.split(S)), R(), j) return b();
                } else k(d2.split(S));
                if (I && I <= c2) return h2 = h2.slice(0, I), b(true);
              }
            }
            return b();
          }
          for (var p2 = i2.indexOf(S, M), _2 = i2.indexOf(O, M), g2 = new RegExp(P(z) + P(F), "g"), m2 = i2.indexOf(F, M); ; ) if (i2[M] === F) for (m2 = M, M++; ; ) {
            if (-1 === (m2 = i2.indexOf(F, m2 + 1))) return r2 || u2.push({ type: "Quotes", code: "MissingQuotes", message: "Quoted field unterminated", row: h2.length, index: M }), E2();
            if (m2 === n2 - 1) return E2(i2.substring(M, m2).replace(g2, F));
            if (F === z && i2[m2 + 1] === z) m2++;
            else if (F === z || 0 === m2 || i2[m2 - 1] !== z) {
              -1 !== p2 && p2 < m2 + 1 && (p2 = i2.indexOf(S, m2 + 1));
              var y = w2(-1 === (_2 = -1 !== _2 && _2 < m2 + 1 ? i2.indexOf(O, m2 + 1) : _2) ? p2 : Math.min(p2, _2));
              if (i2.substr(m2 + 1 + y, e) === S) {
                d2.push(i2.substring(M, m2).replace(g2, F)), i2[M = m2 + 1 + y + e] !== F && (m2 = i2.indexOf(F, M)), p2 = i2.indexOf(S, M), _2 = i2.indexOf(O, M);
                break;
              }
              y = w2(_2);
              if (i2.substring(m2 + 1 + y, m2 + 1 + y + s2) === O) {
                if (d2.push(i2.substring(M, m2).replace(g2, F)), v2(m2 + 1 + y + s2), p2 = i2.indexOf(S, M), m2 = i2.indexOf(F, M), o2 && (R(), j)) return b();
                if (I && h2.length >= I) return b(true);
                break;
              }
              u2.push({ type: "Quotes", code: "InvalidQuotes", message: "Trailing quote on quoted field is malformed", row: h2.length, index: M }), m2++;
            }
          }
          else if (x && 0 === d2.length && i2.substring(M, M + a2) === x) {
            if (-1 === _2) return b();
            M = _2 + s2, _2 = i2.indexOf(O, M), p2 = i2.indexOf(S, M);
          } else if (-1 !== p2 && (p2 < _2 || -1 === _2)) d2.push(i2.substring(M, p2)), M = p2 + e, p2 = i2.indexOf(S, M);
          else {
            if (-1 === _2) break;
            if (d2.push(i2.substring(M, _2)), v2(_2 + s2), o2 && (R(), j)) return b();
            if (I && h2.length >= I) return b(true);
          }
          return E2();
          function k(e2) {
            h2.push(e2), l2 = M;
          }
          function w2(e2) {
            var t2 = 0;
            return t2 = -1 !== e2 && (e2 = i2.substring(m2 + 1, e2)) && "" === e2.trim() ? e2.length : t2;
          }
          function E2(e2) {
            return r2 || (void 0 === e2 && (e2 = i2.substring(M)), d2.push(e2), M = n2, k(d2), o2 && R()), b();
          }
          function v2(e2) {
            M = e2, k(d2), d2 = [], _2 = i2.indexOf(O, M);
          }
          function b(e2) {
            if (C.header && !t && h2.length && !L) {
              var s3 = h2[0], a3 = /* @__PURE__ */ Object.create(null), o3 = new Set(s3);
              let n3 = false;
              for (let r3 = 0; r3 < s3.length; r3++) {
                let i3 = q(s3[r3]);
                if (a3[i3 = U(C.transformHeader) ? C.transformHeader(i3, r3) : i3]) {
                  let e3, t2 = a3[i3];
                  for (; e3 = i3 + "_" + t2, t2++, o3.has(e3); ) ;
                  o3.add(e3), s3[r3] = e3, a3[i3]++, n3 = true, (D = null === D ? {} : D)[e3] = i3;
                } else a3[i3] = 1, s3[r3] = i3;
                o3.add(i3);
              }
              n3 && console.warn("Duplicate headers found and renamed."), L = true;
            }
            return { data: h2, errors: u2, meta: { delimiter: S, linebreak: O, aborted: j, truncated: !!e2, cursor: l2 + (t || 0), renamedHeaders: D } };
          }
          function R() {
            T(b()), h2 = [], u2 = [];
          }
        }, this.abort = function() {
          j = true;
        }, this.getCharIndex = function() {
          return M;
        };
      }
      function p(e) {
        var t = e.data, i2 = o[t.workerId], r2 = false;
        if (t.error) i2.userError(t.error, t.file);
        else if (t.results && t.results.data) {
          var n2 = { abort: function() {
            r2 = true, _(t.workerId, { data: [], errors: [], meta: { aborted: true } });
          }, pause: g, resume: g };
          if (U(i2.userStep)) {
            for (var s2 = 0; s2 < t.results.data.length && (i2.userStep({ data: t.results.data[s2], errors: t.results.errors, meta: t.results.meta }, n2), !r2); s2++) ;
            delete t.results;
          } else U(i2.userChunk) && (i2.userChunk(t.results, n2, t.file), delete t.results);
        }
        t.finished && !r2 && _(t.workerId, t.results);
      }
      function _(e, t) {
        var i2 = o[e];
        U(i2.userComplete) && i2.userComplete(t), i2.terminate(), delete o[e];
      }
      function g() {
        throw new Error("Not implemented.");
      }
      function v(e) {
        if ("object" != typeof e || null === e) return e;
        var t, i2 = Array.isArray(e) ? [] : {};
        for (t in e) i2[t] = v(e[t]);
        return i2;
      }
      function m(e, t) {
        return function() {
          e.apply(t, arguments);
        };
      }
      function U(e) {
        return "function" == typeof e;
      }
      return w.parse = function(e, t) {
        var i2 = (t = t || {}).dynamicTyping || false;
        U(i2) && (t.dynamicTypingFunction = i2, i2 = {});
        if (t.dynamicTyping = i2, t.transform = !!U(t.transform) && t.transform, void 0 !== t.downloadTimeout) {
          var i2 = parseInt(t.downloadTimeout);
          if (isNaN(i2)) throw new Error("Config downloadTimeout value (" + t.downloadTimeout + ") not parsable by parseInt(val).");
          t.downloadTimeout = i2;
        }
        if (!t.worker || !w.WORKERS_SUPPORTED) return i2 = null, w.NODE_STREAM_INPUT, "string" == typeof e ? (e = q(e), i2 = new (t.download ? d : f)(t)) : true === e.readable && U(e.read) && U(e.on) ? i2 = new c(t) : (n.File && e instanceof File || e instanceof Object) && (i2 = new l(t)), i2.stream(e);
        (i2 = (() => {
          var e2;
          return !!w.WORKERS_SUPPORTED && (e2 = (() => {
            var e3 = n.URL || n.webkitURL || null, t2 = r.toString();
            return w.BLOB_URL || (w.BLOB_URL = e3.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ", "(", t2, ")();"], { type: "text/javascript" })));
          })(), (e2 = new n.Worker(e2)).onmessage = p, e2.id = h++, o[e2.id] = e2);
        })()).userStep = t.step, i2.userChunk = t.chunk, i2.userComplete = t.complete, i2.userError = t.error, t.step = U(t.step), t.chunk = U(t.chunk), t.complete = U(t.complete), t.error = U(t.error), delete t.worker, i2.postMessage({ input: e, config: t, workerId: i2.id });
      }, w.unparse = function(e, t) {
        var s2 = false, g2 = true, m2 = ",", y = "\r\n", a2 = '"', o2 = a2 + a2, i2 = false, r2 = null, h2 = false, u2 = ((() => {
          if ("object" == typeof t) {
            if ("string" != typeof t.delimiter || w.BAD_DELIMITERS.filter(function(e2) {
              return -1 !== t.delimiter.indexOf(e2);
            }).length || (m2 = t.delimiter), "boolean" != typeof t.quotes && "function" != typeof t.quotes && !Array.isArray(t.quotes) || (s2 = t.quotes), "boolean" != typeof t.skipEmptyLines && "string" != typeof t.skipEmptyLines || (i2 = t.skipEmptyLines), "string" == typeof t.newline && (y = t.newline), "string" == typeof t.quoteChar && (a2 = t.quoteChar, o2 = a2 + a2), "boolean" == typeof t.header && (g2 = t.header), Array.isArray(t.columns)) {
              if (0 === t.columns.length) throw new Error("Option columns is empty");
              r2 = t.columns;
            }
            void 0 !== t.escapeChar && (o2 = t.escapeChar + a2), t.escapeFormulae instanceof RegExp ? h2 = t.escapeFormulae : "boolean" == typeof t.escapeFormulae && t.escapeFormulae && (h2 = /^[=+\-@\t\r].*$/);
          }
        })(), new RegExp(P(a2), "g"));
        "string" == typeof e && (e = JSON.parse(e));
        if (Array.isArray(e)) {
          if (!e.length || Array.isArray(e[0])) return n2(null, e, i2);
          if ("object" == typeof e[0]) return n2(r2 || Object.keys(e[0]), e, i2);
        } else if ("object" == typeof e) return "string" == typeof e.data && (e.data = JSON.parse(e.data)), Array.isArray(e.data) && (e.fields || (e.fields = e.meta && e.meta.fields || r2), e.fields || (e.fields = Array.isArray(e.data[0]) ? e.fields : "object" == typeof e.data[0] ? Object.keys(e.data[0]) : []), Array.isArray(e.data[0]) || "object" == typeof e.data[0] || (e.data = [e.data])), n2(e.fields || [], e.data || [], i2);
        throw new Error("Unable to serialize unrecognized input");
        function n2(e2, t2, i3) {
          var r3 = "", n3 = ("string" == typeof e2 && (e2 = JSON.parse(e2)), "string" == typeof t2 && (t2 = JSON.parse(t2)), Array.isArray(e2) && 0 < e2.length), s3 = !Array.isArray(t2[0]);
          if (n3 && g2) {
            for (var a3 = 0; a3 < e2.length; a3++) 0 < a3 && (r3 += m2), r3 += k(e2[a3], a3);
            0 < t2.length && (r3 += y);
          }
          for (var o3 = 0; o3 < t2.length; o3++) {
            var h3 = (n3 ? e2 : t2[o3]).length, u3 = false, d2 = n3 ? 0 === Object.keys(t2[o3]).length : 0 === t2[o3].length;
            if (i3 && !n3 && (u3 = "greedy" === i3 ? "" === t2[o3].join("").trim() : 1 === t2[o3].length && 0 === t2[o3][0].length), "greedy" === i3 && n3) {
              for (var l2 = [], f2 = 0; f2 < h3; f2++) {
                var c2 = s3 ? e2[f2] : f2;
                l2.push(t2[o3][c2]);
              }
              u3 = "" === l2.join("").trim();
            }
            if (!u3) {
              for (var p2 = 0; p2 < h3; p2++) {
                0 < p2 && !d2 && (r3 += m2);
                var _2 = n3 && s3 ? e2[p2] : p2;
                r3 += k(t2[o3][_2], p2);
              }
              o3 < t2.length - 1 && (!i3 || 0 < h3 && !d2) && (r3 += y);
            }
          }
          return r3;
        }
        function k(e2, t2) {
          var i3, r3, n3;
          return null == e2 ? "" : e2.constructor === Date ? isNaN(e2.getTime()) ? "" : e2.toISOString() : (n3 = false, h2 && "string" == typeof e2 && h2.test(e2) && (e2 = "'" + e2, n3 = true), r3 = (i3 = e2.toString()).replace(u2, o2), (n3 = n3 || true === s2 || "function" == typeof s2 && s2(e2, t2) || Array.isArray(s2) && s2[t2] || ((e3, t3) => {
            for (var i4 = 0; i4 < t3.length; i4++) if (-1 < e3.indexOf(t3[i4])) return true;
            return false;
          })(r3, w.BAD_DELIMITERS) || -1 < r3.indexOf(m2) || -1 < i3.indexOf(a2) || " " === r3.charAt(0) || " " === r3.charAt(r3.length - 1)) ? a2 + r3 + a2 : r3);
        }
      }, w.RECORD_SEP = String.fromCharCode(30), w.UNIT_SEP = String.fromCharCode(31), w.BYTE_ORDER_MARK = "\uFEFF", w.BAD_DELIMITERS = ["\r", "\n", '"', w.BYTE_ORDER_MARK], w.WORKERS_SUPPORTED = !s && !!n.Worker, w.NODE_STREAM_INPUT = 1, w.LocalChunkSize = 10485760, w.RemoteChunkSize = 5242880, w.DefaultDelimiter = ",", w.Parser = E, w.ParserHandle = i, w.NetworkStreamer = d, w.FileStreamer = l, w.StringStreamer = f, w.ReadableStreamStreamer = c, a && (n.onmessage = function(e) {
        e = e.data;
        void 0 === w.WORKER_ID && e && (w.WORKER_ID = e.workerId);
        "string" == typeof e.input ? n.postMessage({ workerId: w.WORKER_ID, results: w.parse(e.input, e.config), finished: true }) : (n.File && e.input instanceof File || e.input instanceof Object) && (e = w.parse(e.input, e.config)) && n.postMessage({ workerId: w.WORKER_ID, results: e, finished: true });
      }), (d.prototype = Object.create(u.prototype)).constructor = d, (l.prototype = Object.create(u.prototype)).constructor = l, (f.prototype = Object.create(f.prototype)).constructor = f, (c.prototype = Object.create(u.prototype)).constructor = c, w;
    });
  }
});

// src/core/id_columns.ts
var MLBAM_ID_COLUMNS = [
  "batter",
  "pitcher",
  "on_1b",
  "on_2b",
  "on_3b",
  ...[2, 3, 4, 5, 6, 7, 8, 9].map((i) => `fielder_${i}`),
  "game_pk"
];
var EXACT_IDS = /* @__PURE__ */ new Set([...MLBAM_ID_COLUMNS, "hid", "vid"]);
var ID_SEGMENT = /^id$|_ids?$|_id\d+$|_id_(\d+|started|ended)$|^id_(play|drive)$|(team|person|player|matchup)id$|[a-z0-9]Ids?$/;
function isIdColumn(name) {
  return ID_SEGMENT.test(name.slice(name.lastIndexOf(".") + 1)) || EXACT_IDS.has(name);
}

// src/core/int64.ts
var INT64_WARNING_CODE = "SDV_INT64";
function rowCells(rows, col) {
  return {
    n: rows.length,
    get: (i) => rows[i][col],
    set: (i, v) => {
      if (col in rows[i]) rows[i][col] = v;
    }
  };
}
var exactInt = (v) => typeof v === "bigint" || typeof v === "number" && Number.isSafeInteger(v);
function idsToStrings(c) {
  let convert = false;
  const ok = (v) => {
    if (v === null || v === void 0 || typeof v === "string") return true;
    if (Array.isArray(v)) return v.every(ok);
    if (typeof v === "number" && Number.isNaN(v)) return convert = true;
    if (!exactInt(v)) return false;
    return convert = true;
  };
  let integers = true;
  for (let i = 0; i < c.n && integers; i++) integers = ok(c.get(i));
  if (integers && !convert) return "unchanged";
  const str = (v) => Array.isArray(v) ? v.map(str) : typeof v === "number" && Number.isNaN(v) ? null : integers && (typeof v === "bigint" || typeof v === "number") ? String(v) : v;
  for (let i = 0; i < c.n; i++) {
    const v = c.get(i);
    if (v !== null && v !== void 0 && typeof v !== "string") c.set(i, str(v));
  }
  return integers ? "strings" : "not-integers";
}
function idColumnsToStrings(rows) {
  const cols = /* @__PURE__ */ new Set();
  for (const r of rows) for (const k of Object.keys(r)) if (isIdColumn(k)) cols.add(k);
  for (const col of cols) idsToStrings(rowCells(rows, col));
  return rows;
}
var warned = /* @__PURE__ */ new Set();
var once = (key, message) => {
  if (warned.has(key)) return void 0;
  warned.add(key);
  return message;
};
function bigintWarning(surface, column) {
  return once(
    `bigint\0${surface}\0${column}`,
    `${surface}: column "${column}" holds integers beyond Number.MAX_SAFE_INTEGER; left as BigInt`
  );
}
function warnBigint(surface, column) {
  const message = bigintWarning(surface, column);
  if (message === void 0) return;
  const proc = globalThis.process;
  if (proc?.emitWarning) proc.emitWarning(message, { code: INT64_WARNING_CODE });
  else console.warn(message);
}

// src/parsers/_normalize.ts
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);
}
function snakeCase(key) {
  return key.replace(/\./g, "_").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/[\s-]+/g, "_").replace(/__+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}
function underscore(word) {
  return word.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/-/g, "_").toLowerCase();
}
function flattenRow(obj2, prefix, out) {
  for (const [k, v] of Object.entries(obj2)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (isPlainObject(v)) {
      flattenRow(v, key, out);
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v);
    } else {
      out[key] = v;
    }
  }
}
function normalize(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const flat = rows.map((row) => {
    const out = {};
    if (isPlainObject(row)) {
      flattenRow(row, "", out);
    } else {
      out.value = Array.isArray(row) ? JSON.stringify(row) : row;
    }
    const snaked = {};
    for (const [k, v] of Object.entries(out)) snaked[snakeCase(k)] = v;
    return snaked;
  });
  return idColumnsToStrings(flat);
}

// src/parsers/mlb.ts
function isPlainObject2(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
var LIST_KEYS = [
  "teams",
  "venues",
  "sports",
  "leagues",
  "divisions",
  "seasons",
  "awards",
  "awardRecipients",
  "umpires",
  "people",
  "players",
  "items",
  "records",
  "conferences",
  "roster",
  "highLowResults",
  "leagueLeaders",
  "freeAgents",
  "stats",
  "series"
];
function parse_mlb_list(raw) {
  if (!isPlainObject2(raw)) return [];
  for (const key of LIST_KEYS) {
    const candidate = raw[key];
    if (Array.isArray(candidate) && candidate.length > 0 && isPlainObject2(candidate[0])) {
      return normalize(candidate);
    }
  }
  return [];
}
function parse_mlb_teams(raw) {
  return normalize(raw?.teams ?? []);
}
function parse_mlb_schedule(raw) {
  const dates = raw?.dates;
  if (!Array.isArray(dates) || dates.length === 0) return [];
  const rows = dates.flatMap(
    (d) => (d?.games ?? []).map((g) => ({ schedule_date: d?.date, ...g }))
  );
  return normalize(rows);
}
function parse_mlb_team_roster(raw) {
  return normalize(raw?.roster ?? []);
}
function parse_mlb_standings(raw) {
  if (!isPlainObject2(raw)) return [];
  const records2 = raw.records;
  if (!Array.isArray(records2) || records2.length === 0) return [];
  const rows = [];
  for (const div of records2) {
    if (!isPlainObject2(div)) continue;
    const base = {
      standings_type: div.standingsType,
      standings_league_id: div.league?.id,
      standings_league_name: div.league?.name,
      standings_division_id: div.division?.id,
      standings_division_name: div.division?.name,
      standings_last_updated: div.lastUpdated
    };
    for (const teamRow of div.teamRecords ?? []) {
      rows.push({ ...base, ...teamRow ?? {} });
    }
  }
  return normalize(rows);
}
function parse_mlb_person_stats(raw) {
  if (!isPlainObject2(raw)) return [];
  const stats = raw.stats;
  if (!Array.isArray(stats) || stats.length === 0) return [];
  const rows = [];
  for (const block of stats) {
    if (!isPlainObject2(block)) continue;
    const base = {
      stats_type: block.type?.displayName,
      stats_group: block.group?.displayName
    };
    for (const split of block.splits ?? []) {
      rows.push({ ...base, ...split ?? {} });
    }
  }
  return normalize(rows);
}
function parse_mlb_boxscore(raw) {
  if (!isPlainObject2(raw)) return [];
  const teams = raw.teams ?? {};
  const rows = [];
  for (const side of ["home", "away"]) {
    const sideData = teams[side] ?? {};
    const team = sideData.team ?? {};
    const base = { team_side: side, team_id: team.id, team_name: team.name };
    const players = sideData.players ?? {};
    for (const player of Object.values(players)) {
      rows.push({ ...base, ...player ?? {} });
    }
  }
  return normalize(rows);
}
function parse_mlb_linescore(raw) {
  if (!isPlainObject2(raw)) return [];
  return normalize(raw.innings ?? []);
}
function parse_mlb_play_by_play(raw) {
  if (!isPlainObject2(raw)) return [];
  return normalize(raw.allPlays ?? []);
}
function parse_mlb_win_probability(raw) {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}
function parse_mlb_draft_latest(raw) {
  if (!isPlainObject2(raw) || Object.keys(raw).length === 0) return [];
  const { copyright, ...row } = raw;
  return normalize([row]);
}
function parse_mlb_timecodes(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return normalize(raw.map((t) => ({ timecode: t })));
}

// src/parsers/nhl_api_web.ts
function isPlainObject3(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function parse_nhl_web_pbp(raw) {
  return normalize((raw ?? {})?.plays ?? []);
}
function parse_nhl_web_boxscore(raw) {
  if (!isPlainObject3(raw)) return [];
  const byTeam = raw.playerByGameStats ?? {};
  const rows = [];
  for (const side of ["awayTeam", "homeTeam"]) {
    const teamBlock = byTeam[side] ?? {};
    const ha = side === "awayTeam" ? "away" : "home";
    for (const posGroup of ["forwards", "defense", "goalies"]) {
      for (const player of teamBlock[posGroup] ?? []) {
        rows.push({ home_away: ha, position_group: posGroup, ...player ?? {} });
      }
    }
  }
  return normalize(rows);
}
function parse_nhl_web_landing(raw) {
  if (!isPlainObject3(raw) || Object.keys(raw).length === 0) return [];
  return normalize([raw]);
}
function parse_nhl_web_right_rail(raw) {
  if (!isPlainObject3(raw)) return [];
  return normalize(raw.seasonSeries ?? []);
}
function parse_nhl_web_schedule(raw) {
  if (!isPlainObject3(raw)) return [];
  const week = raw.gameWeek ?? [];
  const rows = [];
  for (const day of week) {
    const dateStr = (day ?? {}).date;
    for (const game of (day ?? {}).games ?? []) {
      rows.push({ schedule_date: dateStr, ...game ?? {} });
    }
  }
  return normalize(rows);
}
function parse_nhl_web_score(raw) {
  return normalize((raw ?? {})?.games ?? []);
}
function parse_nhl_web_club_schedule(raw) {
  if (!isPlainObject3(raw)) return [];
  const ctx = {
    club_previous_season: raw.previousSeason,
    club_current_season: raw.currentSeason,
    club_next_season: raw.nextSeason,
    club_timezone: raw.clubTimezone
  };
  const rows = (raw.games ?? []).map((game) => ({ ...ctx, ...game ?? {} }));
  return normalize(rows);
}
function parse_nhl_web_standings(raw) {
  return normalize((raw ?? {})?.standings ?? []);
}
function parse_nhl_web_standings_season(raw) {
  return normalize((raw ?? {})?.seasons ?? []);
}
function parse_nhl_web_club_stats(raw) {
  if (!isPlainObject3(raw)) return [];
  return normalize(raw.skaters ?? []);
}
function parse_nhl_web_roster(raw) {
  if (!isPlainObject3(raw)) return [];
  const rows = [];
  for (const posGroup of ["forwards", "defensemen", "goalies"]) {
    for (const player of raw[posGroup] ?? []) {
      rows.push({ position_group: posGroup, ...player ?? {} });
    }
  }
  return normalize(rows);
}
function parse_nhl_web_player_landing(raw) {
  if (!isPlainObject3(raw) || Object.keys(raw).length === 0) return [];
  return normalize([raw]);
}
function parse_nhl_web_player_game_log(raw) {
  return normalize((raw ?? {})?.gameLog ?? []);
}
function parse_nhl_web_leaders(raw) {
  if (!isPlainObject3(raw)) return [];
  const rows = [];
  for (const [category, players] of Object.entries(raw)) {
    if (!Array.isArray(players)) continue;
    for (const player of players) {
      if (!isPlainObject3(player)) continue;
      rows.push({ category, ...player });
    }
  }
  return normalize(rows);
}
function parse_nhl_web_draft_picks(raw) {
  return normalize((raw ?? {})?.picks ?? []);
}
function parse_nhl_web_player_spotlight(raw) {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}
function parse_nhl_web_draft_rankings(raw) {
  if (!isPlainObject3(raw)) return [];
  const base = {
    draft_year: raw.draftYear,
    category_id: raw.categoryId,
    category_key: raw.categoryKey
  };
  const rows = (raw.rankings ?? []).map((p) => ({ ...base, ...p ?? {} }));
  return normalize(rows);
}
function parse_nhl_web_playoff_series(raw) {
  if (!isPlainObject3(raw)) return [];
  const top = raw.topSeedTeam ?? {};
  const bottom = raw.bottomSeedTeam ?? {};
  const base = {
    round: raw.round,
    series_letter: raw.seriesLetter,
    top_seed_team_id: top.id,
    top_seed_team_abbrev: top.abbrev,
    bottom_seed_team_id: bottom.id,
    bottom_seed_team_abbrev: bottom.abbrev
  };
  const rows = (raw.games ?? []).map((game) => ({ ...base, ...game ?? {} }));
  return normalize(rows);
}

// src/parsers/nhl_edge.ts
function isPlainObject4(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isNonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0;
}
var TOP10_LIST_KEYS = [
  "top10",
  "leaderboard",
  "leaders",
  "players",
  "skaters",
  "goalies",
  "teams",
  "data",
  "items"
];
function parse_edge_top10(raw) {
  if (!isPlainObject4(raw)) return [];
  let rows = null;
  for (const key of TOP10_LIST_KEYS) {
    if (isNonEmptyArray(raw[key])) {
      rows = raw[key];
      break;
    }
  }
  if (rows === null) {
    for (const val of Object.values(raw)) {
      if (isNonEmptyArray(val) && isPlainObject4(val[0])) {
        rows = val;
        break;
      }
    }
  }
  if (!rows || rows.length === 0) return [];
  return normalize(rows);
}
function parse_edge_detail(raw) {
  if (!isPlainObject4(raw) || Object.keys(raw).length === 0) return [];
  return normalize([raw]);
}
var SHOT_LOCATION_KEYS = [
  "shotLocationDetails",
  "sogDetails",
  "shotLocationTotals",
  "shotLocationSummary",
  "sogSummary"
];
function parse_edge_shot_location(raw) {
  if (!isPlainObject4(raw)) return [];
  for (const key of SHOT_LOCATION_KEYS) {
    if (isNonEmptyArray(raw[key])) {
      return normalize(raw[key]);
    }
  }
  const parts = [];
  for (const [section, contents] of Object.entries(raw)) {
    if (!isPlainObject4(contents)) continue;
    for (const key of SHOT_LOCATION_KEYS) {
      if (isNonEmptyArray(contents[key])) {
        for (const zone of contents[key]) {
          parts.push({ section, ...zone ?? {} });
        }
        break;
      }
    }
  }
  if (parts.length === 0) return [];
  return normalize(parts);
}
var ZONE_TIME_KEYS = [
  "zoneTimeDetails",
  "zoneTime",
  "zoneTimes",
  "zoneStarts",
  "zones",
  "byZone",
  "byStrength",
  "data"
];
function parse_edge_zone_time(raw) {
  if (!isPlainObject4(raw)) return [];
  for (const key of ZONE_TIME_KEYS) {
    const candidate = raw[key];
    if (isNonEmptyArray(candidate)) {
      return normalize(candidate);
    }
    if (isPlainObject4(candidate) && Object.keys(candidate).length > 0) {
      return normalize([candidate]);
    }
  }
  return parse_edge_detail(raw);
}
function parse_edge_sog_details(raw) {
  if (!isPlainObject4(raw)) return [];
  for (const key of ["sogDetails", "shotLocationDetails"]) {
    if (isNonEmptyArray(raw[key])) return normalize(raw[key]);
  }
  return [];
}
function parse_edge_sog_summary(raw) {
  if (!isPlainObject4(raw)) return [];
  for (const key of ["sogSummary", "shotLocationSummary", "shotLocationTotals"]) {
    if (isNonEmptyArray(raw[key])) return normalize(raw[key]);
  }
  return [];
}
function parse_edge_hardest_shots(raw) {
  if (!isPlainObject4(raw)) return [];
  if (!isNonEmptyArray(raw.hardestShots)) return [];
  return normalize(raw.hardestShots);
}
function parse_edge_payload(raw) {
  if (!isPlainObject4(raw)) return [];
  let bestKey = null;
  let bestLen = 0;
  for (const [key, val] of Object.entries(raw)) {
    if (isNonEmptyArray(val) && isPlainObject4(val[0]) && val.length > bestLen) {
      bestLen = val.length;
      bestKey = key;
    }
  }
  if (bestKey !== null) return normalize(raw[bestKey]);
  return parse_edge_detail(raw);
}

// src/parsers/nhl_stats_rest.ts
function isPlainObject5(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function parse_nhl_stats_rest(raw) {
  if (!isPlainObject5(raw)) return [];
  const rows = raw.data;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return normalize(rows);
}

// src/parsers/nhl_records.ts
function isPlainObject6(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function parse_nhl_records(raw) {
  if (!isPlainObject6(raw)) return [];
  const rows = raw.data;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return normalize(rows);
}

// src/parsers/nfl_api.ts
function isPlainObject7(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function parse_nfl_standings(raw) {
  if (!isPlainObject7(raw)) return [];
  const records2 = [];
  for (const wk of raw.weeks ?? []) {
    for (const s of wk?.standings ?? []) records2.push(s);
  }
  return normalize(records2);
}
function parse_nfl_rosters(raw) {
  return normalize(raw?.rosters ?? []);
}
function parse_nfl_teams_history(raw) {
  return normalize(raw?.teams ?? []);
}
function parse_nfl_team(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (isPlainObject7(raw)) return normalize([raw]);
  return [];
}
function parse_nfl_weeks(raw) {
  return normalize(raw?.weeks ?? []);
}
function parse_nfl_weeks_by_date(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (isPlainObject7(raw)) return normalize([raw]);
  return [];
}
function parse_nfl_combine_profiles(raw) {
  return normalize(raw?.combineProfiles ?? []);
}
function parse_nfl_draft_picks(raw) {
  return normalize(raw?.picks ?? []);
}
function parse_nfl_injuries(raw) {
  return normalize(raw?.injuries ?? []);
}
function parse_nfl_game_summaries(raw) {
  return normalize(raw?.data ?? []);
}
function parse_nfl_weekly_game_details(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (isPlainObject7(raw)) return normalize(raw.games ?? raw.data ?? []);
  return [];
}

// src/parsers/mlb_statcast.ts
var import_papaparse = __toESM(require_papaparse_min(), 1);
function underscore2(word) {
  return word.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/-/g, "_").replace(/\./g, "_").toLowerCase();
}
function isPlainObject8(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function flattenRow2(obj2, prefix, out) {
  for (const [k, v] of Object.entries(obj2)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (isPlainObject8(v)) {
      flattenRow2(v, key, out);
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v);
    } else {
      out[key] = v;
    }
  }
}
function underscoreKeys(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) out[underscore2(String(k))] = v;
  return out;
}
function jsonRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const flat = rows.map((row) => {
    const out = {};
    if (isPlainObject8(row)) flattenRow2(row, "", out);
    else out.value = Array.isArray(row) ? JSON.stringify(row) : row;
    return underscoreKeys(out);
  });
  return idColumnsToStrings(flat);
}
function csvToRowsRaw(text) {
  if (typeof text !== "string" || !text.trim()) return [];
  let parsed;
  try {
    parsed = import_papaparse.default.parse(text, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true
    });
  } catch {
    return [];
  }
  const data = parsed?.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  return data;
}
var CSV_NA = /* @__PURE__ */ new Set([
  "",
  "#N/A",
  "#N/A N/A",
  "#NA",
  "-1.#IND",
  "-1.#QNAN",
  "-NaN",
  "-nan",
  "1.#IND",
  "1.#QNAN",
  "<NA>",
  "N/A",
  "NA",
  "NULL",
  "NaN",
  "None",
  "n/a",
  "nan",
  "null"
]);
var CSV_INT = /^[+-]?\d+$/;
var CSV_NUMBER = /^[+-]?((\d+\.?\d*|\.\d+)([eE][+-]?\d+)?|inf|infinity)$/i;
var CSV_TRUE = /* @__PURE__ */ new Set(["True", "TRUE", "true"]);
var CSV_BOOL = /* @__PURE__ */ new Set([...CSV_TRUE, "False", "FALSE", "false"]);
function csvNumber(v) {
  const t = v.trim();
  return /inf/i.test(t) ? t.startsWith("-") ? -Infinity : Infinity : Number(t);
}
function warn(message) {
  const proc = globalThis.process;
  if (proc?.emitWarning) proc.emitWarning(message);
  else console.warn(message);
}
function inferCsvTypes(rows) {
  for (const col of rows.length ? Object.keys(rows[0]) : []) {
    const present = rows.map((r) => r[col]).filter((v) => typeof v === "string" && !CSV_NA.has(v));
    let conv = null;
    if (present.length && present.every((v) => CSV_NUMBER.test(v.trim()))) {
      const big = present.every((v) => CSV_INT.test(v.trim())) && present.some((v) => !Number.isSafeInteger(Number(v.trim())));
      conv = big ? (v) => BigInt(v.trim()) : csvNumber;
    } else if (present.length && present.every((v) => CSV_BOOL.has(v))) {
      conv = (v) => CSV_TRUE.has(v);
    }
    for (const r of rows) {
      const v = r[col];
      r[col] = typeof v !== "string" || CSV_NA.has(v) ? null : conv ? conv(v) : v;
    }
  }
  return rows;
}
function mlbamId(v) {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return Number.isSafeInteger(v) ? String(v) : void 0;
  if (typeof v !== "string") return void 0;
  const t = v.trim();
  if (CSV_INT.test(t)) return BigInt(t).toString();
  const n = CSV_NUMBER.test(t) ? csvNumber(t) : NaN;
  return Number.isSafeInteger(n) ? String(n) : void 0;
}
function pinIdColumns(rows) {
  const uncast = [];
  for (const col of MLBAM_ID_COLUMNS) {
    if (!rows.some((r) => col in r)) continue;
    const present = rows.map((r) => r[col]).filter((v) => v !== null && v !== void 0 && v !== "");
    if (!present.every((v) => mlbamId(v) !== void 0)) {
      uncast.push(col);
      continue;
    }
    for (const r of rows) {
      if (r[col] === "") r[col] = null;
      else if (r[col] !== null && r[col] !== void 0) r[col] = mlbamId(r[col]);
    }
  }
  if (uncast.length) {
    warn(
      `Savant CSV id columns [${uncast.sort().join(", ")}] hold non-integral or non-numeric values; left as read, not cast to Int64.`
    );
  }
  return rows;
}
function typedCsvRows(rows) {
  const out = idColumnsToStrings(pinIdColumns(inferCsvTypes(rows).map((row) => underscoreKeys(row))));
  for (const col of out.length ? Object.keys(out[0]) : []) {
    if (out.some((r) => typeof r[col] === "bigint")) warnBigint("Savant CSV", col);
  }
  return out;
}
function csvToRows(text) {
  return typedCsvRows(csvToRowsRaw(text));
}
function htmlDecodeVar(html, varName) {
  if (!html || typeof html !== "string") return null;
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pat = new RegExp(`(?:(?:var|let|const)\\s+|window\\.)?${escaped}\\s*=\\s*`, "g");
  let m;
  while ((m = pat.exec(html)) !== null) {
    const start = m.index;
    const prev = start > 0 ? html[start - 1] : "";
    if (prev && /[\w$.]/.test(prev)) continue;
    const decoded = decodeJsonAt(html, m.index + m[0].length);
    if (decoded !== void 0 && (Array.isArray(decoded) || isPlainObject8(decoded))) {
      return decoded;
    }
  }
  return null;
}
function decodeJsonAt(text, pos) {
  const open = text[pos];
  if (open !== "{" && open !== "[") return void 0;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = pos; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
    } else if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(pos, i + 1));
        } catch {
          return void 0;
        }
      }
    }
  }
  return void 0;
}
function htmlScriptJson(html, varName) {
  const obj2 = htmlDecodeVar(html, varName);
  return isPlainObject8(obj2) ? obj2 : {};
}
function parse_mlb_statcast_search(payload) {
  return csvToRows(payload);
}
function parse_mlb_statcast_leaderboard(payload) {
  return csvToRows(payload);
}
function parse_mlb_statcast_gamefeed(payload) {
  if (!isPlainObject8(payload)) return [];
  let rows = [];
  for (const side of ["team_home", "team_away"]) {
    const v = payload[side];
    if (Array.isArray(v)) rows = rows.concat(v);
  }
  if (rows.length === 0 && Array.isArray(payload.exit_velocity)) {
    rows = payload.exit_velocity;
  }
  return pinIdColumns(jsonRows(rows));
}
function parse_mlb_statcast_schedule(payload) {
  const sched = isPlainObject8(payload) ? payload.schedule : null;
  const dates = isPlainObject8(sched) ? sched.dates : null;
  if (!Array.isArray(dates)) return [];
  const games = [];
  for (const d of dates) {
    if (isPlainObject8(d) && Array.isArray(d.games)) games.push(...d.games);
  }
  return jsonRows(games);
}
function parse_mlb_statcast_html_leaderboard(payload) {
  const rows = htmlDecodeVar(typeof payload === "string" ? payload : "", "data");
  if (!Array.isArray(rows)) return [];
  return jsonRows(rows);
}
function parse_mlb_statcast_player(payload, section = "statcast") {
  const rows = htmlScriptJson(typeof payload === "string" ? payload : "", "serverVals")[section];
  if (!Array.isArray(rows)) return [];
  return jsonRows(rows);
}

// src/parsers/odds_api.ts
function isPlainObject9(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function unrollOutcomes(events, extra = {}) {
  if (!Array.isArray(events)) return [];
  const rows = [];
  for (const ev of events) {
    if (!isPlainObject9(ev)) continue;
    const { bookmakers, ...eventCols } = ev;
    for (const bm of bookmakers ?? []) {
      if (!isPlainObject9(bm)) continue;
      const bookmakerCols = {
        bookmaker_key: bm.key,
        bookmaker: bm.title,
        bookmaker_last_update: bm.last_update
      };
      for (const mk of bm.markets ?? []) {
        if (!isPlainObject9(mk)) continue;
        const marketCols = {
          market_key: mk.key,
          market_last_update: mk.last_update
        };
        for (const oc of mk.outcomes ?? []) {
          if (!isPlainObject9(oc)) continue;
          const outcomeCols = {};
          for (const [k, v] of Object.entries(oc)) outcomeCols[`outcomes_${k}`] = v;
          rows.push({ ...extra, ...eventCols, ...bookmakerCols, ...marketCols, ...outcomeCols });
        }
      }
    }
  }
  return normalize(rows);
}
function parse_odds_api_sports(raw) {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}
function parse_odds_api_sports_odds(raw) {
  return unrollOutcomes(raw);
}
function parse_odds_api_sports_scores(raw) {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}
function parse_odds_api_sports_events(raw) {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}
function parse_odds_api_sports_participants(raw) {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}
function parse_odds_api_event_odds(raw) {
  if (!isPlainObject9(raw)) return [];
  return unrollOutcomes([raw]);
}
function parse_odds_api_event_markets(raw) {
  if (!isPlainObject9(raw)) return [];
  const { bookmakers, ...eventCols } = raw;
  const rows = [];
  for (const bm of bookmakers ?? []) {
    if (!isPlainObject9(bm)) continue;
    const bookmakerCols = {
      bookmaker_key: bm.key,
      bookmaker: bm.title
    };
    for (const mk of bm.markets ?? []) {
      if (!isPlainObject9(mk)) continue;
      rows.push({
        ...eventCols,
        ...bookmakerCols,
        market_key: mk.key,
        market_last_update: mk.last_update
      });
    }
  }
  return normalize(rows);
}
function parse_odds_api_sports_odds_history(raw) {
  if (!isPlainObject9(raw)) return [];
  const extra = {
    timestamp: raw.timestamp,
    previous_timestamp: raw.previous_timestamp,
    next_timestamp: raw.next_timestamp
  };
  return unrollOutcomes(raw.data ?? [], extra);
}
function parse_odds_api_sports_events_history(raw) {
  if (!isPlainObject9(raw)) return [];
  const data = raw.data;
  if (!Array.isArray(data)) return [];
  const rows = data.map((ev) => ({
    timestamp: raw.timestamp,
    previous_timestamp: raw.previous_timestamp,
    next_timestamp: raw.next_timestamp,
    ...ev
  }));
  return normalize(rows);
}
function parse_odds_api_event_odds_history(raw) {
  if (!isPlainObject9(raw)) return [];
  const extra = {
    timestamp: raw.timestamp,
    previous_timestamp: raw.previous_timestamp,
    next_timestamp: raw.next_timestamp
  };
  const data = raw.data;
  const events = Array.isArray(data) ? data : isPlainObject9(data) ? [data] : [];
  return unrollOutcomes(events, extra);
}

// src/parsers/recruiting.ts
function isPlainObject10(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
var LIST_KEYS2 = ["list", "rankings", "items", "results", "data"];
function parse_recruiting_list(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject10(raw)) return [];
  for (const key of LIST_KEYS2) {
    const candidate = raw[key];
    if (Array.isArray(candidate) && candidate.length > 0 && isPlainObject10(candidate[0])) {
      return normalize(candidate);
    }
  }
  return [];
}
function parse_recruiting_paged_list(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject10(raw)) return [];
  return normalize(raw.list ?? []);
}
function parse_recruiting_institution_rankings(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject10(raw)) return [];
  const list2 = raw.list;
  if (!Array.isArray(list2) || list2.length === 0) return [];
  const pag = isPlainObject10(raw.pagination) ? raw.pagination : {};
  const base = {};
  for (const [k, v] of Object.entries(pag)) base[`pagination_${k}`] = v;
  return normalize(list2.map((row) => ({ ...base, ...isPlainObject10(row) ? row : {} })));
}
function parse_recruiting_ranking_feed(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject10(raw)) return [];
  return normalize(raw.rankings ?? []);
}

// src/parsers/sports247.ts
function isPlainObject11(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
var LIST_KEYS3 = ["players", "results", "rankings", "list", "items"];
function extractRdbRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (isPlainObject11(raw)) {
    for (const k of LIST_KEYS3) {
      if (Array.isArray(raw[k])) return raw[k];
    }
    const values = Object.values(raw);
    if (values.some((v) => v === null || typeof v !== "object")) return [raw];
  }
  return [];
}
function parse_sports247_result_set(raw) {
  const rows = extractRdbRows(raw);
  if (!rows.length) return [];
  return normalize(isPlainObject11(rows[0]) ? rows : rows.map((value) => ({ value })));
}
function parse_sports247_teams(raw) {
  return parse_sports247_result_set(raw);
}
function parse_sports247_institution_rankings(raw) {
  return parse_sports247_result_set(raw);
}
var INT_RE = /^[+-]?\d+$/;
var FLOAT_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
function castNumericStrings(rows) {
  const columns = new Set(rows.flatMap((r) => Object.keys(r)));
  for (const col of columns) {
    const present = rows.filter((r) => r[col] !== void 0 && r[col] !== null);
    if (!present.length || !present.every((r) => typeof r[col] === "string")) continue;
    const values = present.map((r) => r[col]);
    if (values.every((v) => INT_RE.test(v))) {
      const nums = values.map(Number);
      if (isIdColumn(col)) {
        present.forEach((r, i) => r[col] = BigInt(values[i]).toString());
      } else if (nums.every(Number.isSafeInteger)) {
        present.forEach((r, i) => r[col] = nums[i]);
      } else {
        present.forEach((r, i) => r[col] = BigInt(values[i]));
        warnBigint("sports247_site_pages", col);
      }
    } else if (values.every((v) => FLOAT_RE.test(v))) {
      present.forEach((r, i) => r[col] = Number(values[i]));
    }
  }
  return rows;
}
function parse_sports247_site_page(raw) {
  const rows = Array.isArray(raw) ? raw.filter((r) => isPlainObject11(r) && Object.keys(r).length > 0) : isPlainObject11(raw) && Object.keys(raw).length > 0 ? [raw] : [];
  if (!rows.length) return [];
  return castNumericStrings(normalize(rows));
}

// src/parsers/_frames.ts
function pyUnderscore(word) {
  return word.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/-/g, "_").toLowerCase();
}
function pyJson(v) {
  return JSON.stringify(v).replace(
    /("(?:[^"\\]|\\.)*")|([,:])/g,
    (_m, str, sep) => str !== void 0 ? str : `${sep} `
  ).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}
function isPlainObject12(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function flatten(obj2, prefix, out) {
  const top = prefix === "";
  const nested = [];
  for (const [k, v] of Object.entries(obj2)) {
    const key = top ? k : `${prefix}_${k}`;
    if (!isPlainObject12(v)) out.push([key, v]);
    else if (top) nested.push([key, v]);
    else flatten(v, key, out);
  }
  for (const [key, v] of nested) flatten(v, key, out);
}
function idString(v) {
  if (v === null || v === void 0) return null;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((x) => String(x)).join(",");
  if (isPlainObject12(v)) return pyJson(v);
  return String(v);
}
function rowsToFrame(rows, opts = {}) {
  const kept = (rows ?? []).filter((r) => !(opts.dropNull && (r === null || r === void 0)));
  if (kept.length === 0) return [];
  if (!kept.some(isPlainObject12)) return kept.map((r) => ({ value: String(r) }));
  const records2 = kept.map((r) => {
    const pairs = [];
    flatten(isPlainObject12(r) ? r : { value: r }, "", pairs);
    return pairs;
  });
  const finalName = /* @__PURE__ */ new Map();
  const used = /* @__PURE__ */ new Map();
  for (const pairs of records2) {
    for (const [path] of pairs) {
      if (finalName.has(path)) continue;
      const base = pyUnderscore(path);
      const n = (used.get(base) ?? 0) + 1;
      used.set(base, n);
      finalName.set(path, n === 1 ? base : `${base}_${n}`);
    }
  }
  const columns = [...finalName.values()];
  const out = records2.map((pairs) => {
    const row = {};
    for (const c of columns) row[c] = null;
    for (const [path, v] of pairs) {
      const name = finalName.get(path);
      let cell = v === void 0 ? null : v;
      if (opts.ids && isIdColumn(name)) cell = idString(cell);
      else if (Array.isArray(cell) || isPlainObject12(cell)) cell = pyJson(cell);
      row[name] = cell;
    }
    return row;
  });
  return opts.ids ? out : idColumnsToStrings(out);
}
function asRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (isPlainObject12(raw) && Object.keys(raw).length > 0) return [raw];
  return [];
}
var MULTI_TABLE_SECTIONS = {
  parse_asa_goals_added: { default: "summary", sections: ["summary", "actions"] },
  parse_mls_standings: { default: "entries", sections: ["tables", "entries"] },
  parse_mls_match: {
    default: "match_information",
    sections: ["match_information", "environment", "teams", "players", "staff", "referees", "last_matches"]
  },
  parse_nwsl_lineups: { default: "players", sections: ["teams", "players", "staff"] },
  // PFF (py's `report` / `career` / `table` arguments) and KenPom (one table per
  // HTML id). The two dict-default parsers keep sdv-py's return shape.
  parse_pff_report: {
    default: null,
    sections: null,
    dynamic: "a key of the default dict (a matrix report's `defenders` / `receivers` / `versus`; `/v1/teams`' `franchise_groups` / `games` / `teams`), or a single report's own key (e.g. `passing_summary`)"
  },
  parse_pff_player_detail: { default: "weeks", sections: ["weeks", "career"] },
  parse_pff_v2_table: { default: "rows", sections: ["rows", "teamTotals"] },
  parse_kenpom_page: {
    default: null,
    sections: null,
    dynamic: "a table id on the page (e.g. `ratings_table`; team.php: `schedule_table`, `player_table`, `depth_chart`)"
  },
  // stats.nba.com / stats.wnba.com: the parser selects itself (sdv-py `result_set`).
  parse_nba_stats_result_sets: {
    default: null,
    sections: null,
    dynamic: "a result-set name the payload ships (sdv-py's `result_set`)",
    resultSet: true
  }
};
function sectionError(parser, name, valid, dflt) {
  return new Error(
    `${parser}: unknown section '${name}'. Choose one of ${JSON.stringify(valid)}` + (dflt === null ? " (default: every table, as a dict)." : ` (default '${dflt}').`)
  );
}
function pickSection(parser, tables2, section) {
  const spec = MULTI_TABLE_SECTIONS[parser];
  const name = section ?? spec.default ?? "";
  const valid = spec.sections ?? Object.keys(tables2);
  if (!Object.prototype.hasOwnProperty.call(tables2, name) || !valid.includes(name)) {
    throw sectionError(parser, name, valid, spec.default);
  }
  return tables2[name];
}

// src/parsers/cbs.ts
var ERROR_KEYS = ["error", "errors", "warnings"];
var isErrorEnvelope = (obj2) => ERROR_KEYS.some((k) => k in obj2);
function unwrapData(raw) {
  if (isPlainObject12(raw)) {
    if ("data" in raw) return raw.data;
    if (isErrorEnvelope(raw)) return null;
  }
  return raw;
}
var LIST_KEYS4 = [
  "rows",
  "items",
  "list",
  "results",
  "entries",
  "rankings",
  "standings",
  "scores",
  "games",
  "events",
  "players",
  "teams",
  "leaders",
  "plays",
  "odds",
  "markets",
  "data"
];
function firstListIn(obj2) {
  for (const key of LIST_KEYS4) {
    const c = obj2[key];
    if (Array.isArray(c) && c.length > 0 && isPlainObject12(c[0])) return c;
  }
  for (const v of Object.values(obj2)) {
    if (Array.isArray(v) && v.length > 0 && isPlainObject12(v[0])) return v;
  }
  return null;
}
function envelopeRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (!isPlainObject12(raw) || Object.keys(raw).length === 0) return [];
  if ("data" in raw) {
    const data = raw.data;
    if (Array.isArray(data)) return data;
    return isPlainObject12(data) && Object.keys(data).length > 0 ? [data] : [];
  }
  if (isErrorEnvelope(raw)) return [];
  const values = Object.values(raw);
  if (values.every(isPlainObject12)) {
    return Object.entries(raw).map(([key, value]) => ({ key, ...value }));
  }
  return [raw];
}
function pandasObjectColumns(rows) {
  const columns = new Set(rows.flatMap((r) => Object.keys(r)));
  for (const c of columns) {
    const cells2 = rows.map((r) => r[c]);
    if (!cells2.some((v) => typeof v === "string")) continue;
    for (const r of rows) {
      if (typeof r[c] === "number") r[c] = String(r[c]);
    }
  }
  return rows;
}
var PLAY_COLUMNS = [
  "id",
  "game_id",
  "drive_id",
  "quarter",
  "time_remaining",
  "down",
  "distance",
  "side",
  "yardline",
  "team_in_possession",
  "description",
  "medium",
  "short",
  "score_on_play",
  "score_type",
  "short_score",
  "under_review",
  "home_timeouts_remaining",
  "away_timeouts_remaining",
  "real_clock",
  "subplays"
];
var DRIVE_COLUMNS = [
  "id",
  "team_id",
  "quarter",
  "starting_time",
  "ending_time",
  "time_of_possession",
  "starting_yardline",
  "ending_yardline",
  "starting_play_id",
  "ending_play_id",
  "drive_plays",
  "yards_on_drive",
  "drive_yards_total",
  "penalty_yards",
  "first_downs_on_drive",
  "inside_the_20",
  "score_on_drive",
  "result"
];
var PLAY_INT_COLUMNS = /* @__PURE__ */ new Set([
  "id",
  "game_id",
  "drive_id",
  "quarter",
  "down",
  "yardline",
  "team_in_possession",
  "home_timeouts_remaining",
  "away_timeouts_remaining"
]);
var DRIVE_INT_COLUMNS = /* @__PURE__ */ new Set([
  "id",
  "team_id",
  "quarter",
  "drive_plays",
  "starting_play_id",
  "ending_play_id",
  "yards_on_drive",
  "drive_yards_total",
  "penalty_yards",
  "first_downs_on_drive"
]);
var PLAY_BOOL_COLUMNS = /* @__PURE__ */ new Set(["score_on_play", "under_review"]);
var DRIVE_BOOL_COLUMNS = /* @__PURE__ */ new Set(["score_on_drive", "inside_the_20"]);
function flatSubplays(subplays) {
  let events = isPlainObject12(subplays) ? subplays.subplay : subplays;
  if (isPlainObject12(events)) events = [events];
  const out = [];
  for (const event of Array.isArray(events) ? events : []) {
    if (!isPlainObject12(event)) continue;
    const flat = {};
    for (const [key, value] of Object.entries(event)) {
      if (isPlainObject12(value)) Object.assign(flat, value);
      else flat[key] = value;
    }
    out.push(flat);
  }
  return out;
}
function scoringCell(column, v, ints, bools) {
  if (v === null || v === void 0) return null;
  if (ints.has(column)) {
    const s = String(v);
    if (!/^-?\d+$/.test(s)) return null;
    return isIdColumn(column) ? String(BigInt(s)) : Number(s);
  }
  if (bools.has(column)) return String(v) === "Yes";
  return Array.isArray(v) || isPlainObject12(v) ? pyJson(v) : v;
}
function scoringRows(raw, key, order, ints, bools) {
  const list2 = raw[key];
  const records2 = Array.isArray(list2) ? list2.filter(isPlainObject12) : [];
  if (records2.length === 0) return [];
  let subplays = [];
  if (key === "plays") {
    const flat = records2.map((r) => flatSubplays(r.subplays));
    const fields = [...new Set(flat.flat().flatMap((e) => Object.keys(e)))];
    subplays = flat.map((events) => events.map((e) => Object.fromEntries(fields.map((f) => [f, e[f] ?? null]))));
  }
  const rows = records2.map((r, i) => {
    const row = {};
    for (const c of order) row[c] = c === "subplays" ? JSON.stringify(subplays[i]) : scoringCell(c, r[c], ints, bools);
    for (const [k, v] of Object.entries(r)) if (!(k in row)) row[k] = scoringCell(k, v, ints, bools);
    return row;
  });
  return idColumnsToStrings(rows);
}
function parse_cbs_list(raw) {
  if (isPlainObject12(raw)) {
    const keys = Object.keys(raw);
    if (keys.length === 1 && keys[0] === "plays") return scoringRows(raw, "plays", PLAY_COLUMNS, PLAY_INT_COLUMNS, PLAY_BOOL_COLUMNS);
    if (keys.length === 1 && keys[0] === "drives") return scoringRows(raw, "drives", DRIVE_COLUMNS, DRIVE_INT_COLUMNS, DRIVE_BOOL_COLUMNS);
  }
  return pandasObjectColumns(rowsToFrame(envelopeRows(raw)));
}
function parse_cbs_scoreboard(raw) {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject12(data)) return [];
  for (const key of ["games", "scoreboard", "scores", "events"]) {
    const c = data[key];
    if (Array.isArray(c)) return normalize(c);
  }
  const list2 = firstListIn(data);
  if (list2) return normalize(list2);
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}
function parse_cbs_standings(raw) {
  if (!isPlainObject12(raw) || Object.keys(raw).length === 0 || isErrorEnvelope(raw)) return [];
  const numericYears = Object.keys(raw).every((y) => /^\d+$/.test(y));
  const rows = [];
  for (const [year, byType] of Object.entries(raw)) {
    if (!isPlainObject12(byType)) continue;
    for (const [seasonType, block] of Object.entries(byType)) {
      if (!isPlainObject12(block)) continue;
      rows.push({ season_year: numericYears ? Number(year) : year, season_type: String(seasonType), ...block });
    }
  }
  if (rows.length > 0) return pandasObjectColumns(rowsToFrame(rows));
  return "data" in raw ? parse_cbs_list(raw) : [];
}
function parse_cbs_odds(raw) {
  const data = unwrapData(raw);
  let markets = null;
  if (Array.isArray(data)) {
    markets = data;
  } else if (isPlainObject12(data)) {
    for (const key of ["markets", "odds", "lines"]) {
      if (Array.isArray(data[key])) {
        markets = data[key];
        break;
      }
    }
    if (!markets) markets = firstListIn(data);
    if (!markets && Object.keys(data).length > 0) return normalize([data]);
  }
  if (!Array.isArray(markets)) return [];
  const rows = [];
  for (const mk of markets) {
    if (!isPlainObject12(mk)) continue;
    const { books, lines, quotes, ...marketCols } = mk;
    const inner = [books, lines, quotes].find((x) => Array.isArray(x) && x.length > 0);
    if (Array.isArray(inner)) {
      for (const b of inner) {
        if (isPlainObject12(b)) rows.push({ ...marketCols, ...b });
      }
    } else {
      rows.push(mk);
    }
  }
  return normalize(rows);
}

// src/parsers/fox.ts
var cells = (columns) => (Array.isArray(columns) ? columns : []).map((c) => isPlainObject(c) ? c.text ?? null : c);
function uriId(uri) {
  if (!uri || typeof uri !== "string") return null;
  const m = /(\d+)$/.exec(uri);
  return m ? m[1] : null;
}
var clean = (name) => String(name).replace(/[^\p{L}\p{N}_]+/gu, "_").replace(/^_+|_+$/g, "").toLowerCase() || "v";
var nil = (v) => v === null || v === void 0;
var list = (v) => Array.isArray(v) ? v : [];
var obj = (v) => isPlainObject(v) ? v : {};
function tableRows(tbl, extra = {}) {
  if (!tbl || !isPlainObject(tbl)) return [];
  const t = tbl;
  const headers = cells(obj(list(t.headers)[0]).columns);
  const names = headers.map((h, i) => nil(h) || h === "" ? `v${i}` : clean(h));
  const out = [];
  for (const r of list(t.rows)) {
    const row = { ...extra };
    const vals = cells(obj(r).columns);
    for (let i = 0; i < Math.min(names.length, vals.length); i++) row[names[i]] = vals[i];
    row.entity_id = uriId(obj(obj(r).entityLink).contentUri);
    out.push(row);
  }
  return out;
}
function fullTeamName(team) {
  if (!team) return null;
  const stacked = `${team.stackedNameTop || ""} ${team.stackedNameBottom || ""}`.trim();
  return stacked || team.longName || team.name || null;
}
function segmentEvents(raw) {
  const rows = [];
  for (const sec of list(raw.sectionList)) {
    const s = obj(sec);
    const events = [...list(s.events)];
    for (const mod of list(s.modules)) events.push(...list(obj(obj(mod).model).events));
    for (const e of events) {
      const ev = obj(e);
      const tokens = obj(obj(obj(ev.entityLink).layout).tokens);
      const homeUri = tokens.homeUri;
      const awayUri = tokens.awayUri;
      const upper = obj(ev.upperTeam);
      const lower = obj(ev.lowerTeam);
      const byUri = /* @__PURE__ */ new Map();
      for (const t of [upper, lower]) if (t.uri) byUri.set(t.uri, t);
      const home = homeUri ? byUri.get(homeUri) ?? null : lower;
      const away = awayUri ? byUri.get(awayUri) ?? null : upper;
      rows.push({
        segment_id: null,
        section_id: s.id ?? null,
        section_title: s.title ?? null,
        game_id: tokens.id || uriId(ev.contentUri),
        chip_id: ev.id ?? null,
        league: ev.league ?? null,
        date: ev.eventTime ?? null,
        event_status: ev.eventStatus ?? null,
        status: ev.statusLine ?? null,
        tv_station: ev.tvStation ?? null,
        headline: ev.eventHeadline ?? null,
        odds_line: ev.oddsLine ?? null,
        over_under_line: ev.overUnderLine ?? null,
        home_team: fullTeamName(home),
        home_team_id: uriId(homeUri) || uriId(home?.uri),
        home_score: home?.score ?? null,
        home_record: home?.record ?? null,
        away_team: fullTeamName(away),
        away_team_id: uriId(awayUri) || uriId(away?.uri),
        away_score: away?.score ?? null,
        away_record: away?.record ?? null
      });
    }
  }
  return rows;
}
function standings(raw) {
  const rows = [];
  for (const sec of list(raw.standingsSections)) {
    const s = obj(sec);
    for (const tbl of list(s.standings)) rows.push(...tableRows(tbl, { section: s.title ?? null }));
  }
  return rows;
}
var MOVE_SIGN = { up: 1, down: -1 };
function polls(raw) {
  const rows = [];
  for (const sec of list(raw.standingsSections)) {
    const s = obj(sec);
    for (const tbl of list(s.standings)) {
      if (!tbl || !isPlainObject(tbl)) continue;
      const t = tbl;
      const templates = list(obj(list(t.headers)[0]).columns).map((c) => isPlainObject(c) ? c.template : null);
      const ent = templates.indexOf("cell-entity");
      const chg = templates.indexOf("cell-change");
      const built = tableRows(t, { section: s.title ?? null });
      const raws = list(t.rows);
      for (let i = 0; i < Math.min(built.length, raws.length); i++) {
        const row = built[i];
        const cols = list(obj(raws[i]).columns).map((c) => isPlainObject(c) ? c : { text: c });
        const cell = chg >= 0 && chg < cols.length ? cols[chg] : {};
        const sign = MOVE_SIGN[cell.subType || ""];
        const text = cell.text;
        if (ent >= 0 && ent < cols.length) row.team = cols[ent].text ?? null;
        if (!("team" in row)) row.team = null;
        const decimal = typeof text === "string" && /^\d+$/.test(text) ? text : null;
        row.rank_change = sign && decimal ? sign * Number(decimal) : null;
        rows.push(row);
      }
    }
  }
  return rows;
}
function navItems(raw) {
  const buckets = [[null, list(raw.navItems)]];
  for (const g of list(raw.groups)) buckets.push([obj(obj(g).header).title ?? null, list(obj(g).items)]);
  const rows = [];
  for (const [group, items] of buckets) {
    for (const i of items) {
      const it = obj(i);
      const link = obj(it.entityLink);
      rows.push({
        group,
        fox_id: uriId(link.contentUri),
        abbreviation: it.title ?? null,
        name: link.title || it.imageAltText || null,
        content_uri: link.contentUri ?? null,
        content_type: link.contentType ?? null,
        web_url: link.webUrl || it.webUrl || null,
        color: link.color ?? null,
        logo_url: it.logoUrl ?? null
      });
    }
  }
  return rows;
}
function header(raw) {
  if (!(raw.title || raw.contentUri)) return [];
  const details = list(raw.details).filter(isPlainObject).map((d) => d.text).filter((d) => d);
  return [
    {
      template: raw.template ?? null,
      title: raw.title ?? null,
      entity_id: uriId(raw.contentUri),
      content_uri: raw.contentUri ?? null,
      content_type: raw.contentType ?? null,
      color: raw.color ?? null,
      logo_url: raw.logoUrl ?? null,
      image_alt_text: raw.imageAltText ?? null,
      rank: raw.rank ?? null,
      details: details.map(String).join(" \xB7 ") || null
    }
  ];
}
function searchResults(raw) {
  const rows = [];
  for (const r of list(raw.results)) {
    const res = obj(r);
    for (const c of list(res.components)) {
      const comp = obj(c);
      const model = obj(comp.model);
      rows.push({
        group: res.title ?? null,
        type: comp.type ?? null,
        entity_id: uriId(model.contentUri),
        title: model.title ?? null,
        subtitle: model.subtitle ?? null,
        content_type: model.contentType ?? null,
        content_uri: model.contentUri ?? null,
        web_url: model.webUrl ?? null,
        analytics_name: model.analyticsName ?? null,
        image_url: isPlainObject(model.image) ? model.image.url ?? null : null
      });
    }
  }
  return rows;
}
function trending(raw) {
  const rows = [];
  for (const i of list(obj(raw.data).results)) {
    const it = obj(i);
    let thumbUrl = null;
    if (isPlainObject(it.thumbnail)) {
      const thumb = it.thumbnail;
      thumbUrl = thumb.url || (isPlainObject(thumb.content) ? thumb.content.url ?? null : null);
    }
    rows.push({
      id: it.id ?? null,
      spark_id: it.spark_id ?? null,
      title: it.title ?? null,
      description: it.description || it.dek || it.meta_description || null,
      content_type: it.content_type ?? null,
      component_type: it.component_type ?? null,
      publication_date: it.publication_date ?? null,
      last_published_date: it.last_published_date ?? null,
      canonical_url: it.canonical_url ?? null,
      thumbnail_url: thumbUrl ?? null,
      playback_url: it.playback_url ?? null
    });
  }
  return rows;
}
function roster(raw) {
  const rows = [];
  for (const g of list(raw.groups)) {
    const grp = obj(g);
    const headers = cells(obj(list(grp.headers)[0]).columns);
    const groupLabel = grp.title || (headers.length ? headers[0] : null);
    const names = ["player", ...headers.slice(1).map((h) => nil(h) ? "none" : String(h).toLowerCase())];
    for (const r of list(grp.rows)) {
      const uri = obj(obj(r).entityLink).contentUri;
      if (!uri || typeof uri !== "string" || !uri.includes("athletes/")) continue;
      const vals = cells(obj(r).columns);
      const row = { position_group: groupLabel ?? null };
      for (let i = 0; i < Math.min(names.length, vals.length); i++) row[names[i]] = vals[i];
      row.athlete_id = uriId(uri);
      rows.push(row);
    }
  }
  return rows;
}
var scorechip = (raw) => raw.id ? [flatten2(raw)] : [];
function flatten2(rec2, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(rec2)) {
    const key = `${prefix}${underscore(String(k))}`;
    if (isPlainObject(v)) flatten2(v, `${key}_`, out);
    else if (Array.isArray(v)) out[key] = JSON.stringify(v);
    else out[key] = v;
  }
  return out;
}
function largestRecordList(payload) {
  let best = [];
  const queue = [payload];
  while (queue.length) {
    const node = queue.shift();
    if (isPlainObject(node)) queue.push(...Object.values(node));
    else if (Array.isArray(node)) {
      const recs = node.filter(isPlainObject);
      if (recs.length > best.length) best = recs;
      queue.push(...recs);
    }
  }
  return best;
}
function homogenize(rows) {
  const kinds = /* @__PURE__ */ new Map();
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      if (v === null || v === void 0) continue;
      if (!kinds.has(k)) kinds.set(k, /* @__PURE__ */ new Set());
      kinds.get(k).add(typeof v);
    }
  }
  const toStr2 = new Set([...kinds].filter(([, t]) => t.size > 1).map(([k]) => k));
  if (!toStr2.size) return rows;
  const str = (v) => v === null || v === void 0 ? v : typeof v === "boolean" ? v ? "True" : "False" : String(v);
  return rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, toStr2.has(k) ? str(v) : v])));
}
function generic(raw) {
  try {
    return idColumnsToStrings(homogenize(largestRecordList(raw).map((r) => flatten2(r))));
  } catch {
    return [];
  }
}
function dedicated(raw, ...builders) {
  if (isPlainObject(raw)) {
    for (const b of builders) {
      let rows = [];
      try {
        rows = b(raw);
      } catch {
        rows = [];
      }
      if (rows.length) return idColumnsToStrings(rows);
    }
  }
  return generic(raw);
}
function parse_fox_list(raw) {
  return dedicated(
    raw,
    navItems,
    trending,
    (r) => r.template === "entity-header" ? header(r) : [],
    scorechip
  );
}
function parse_fox_scoreboard(raw) {
  return dedicated(raw, segmentEvents);
}
function parse_fox_standings(raw) {
  return dedicated(
    raw,
    (r) => list(r.standingsSections).some((s) => list(obj(s).standings).some((t) => obj(t).template === "table-polls")) ? polls(r) : [],
    standings
  );
}
function parse_fox_event(raw) {
  return generic(raw);
}
function parse_fox_team_roster(raw) {
  return dedicated(raw, roster);
}
function parse_fox_search(raw) {
  return dedicated(raw, searchResults);
}

// src/parsers/yahoo.ts
function pyStr(v) {
  return String(v);
}
var pyName = (key) => underscore(key.replace(/[^\p{L}\p{N}_]+/gu, "_")).replace(/^_+|_+$/g, "");
function flattenRecord(rec2) {
  const out = {};
  const nested = {};
  for (const [k, v] of Object.entries(rec2)) (isPlainObject(v) ? nested : out)[k] = v;
  const walk = (obj2, prefix) => {
    for (const [k, v] of Object.entries(obj2)) {
      const key = `${prefix}_${k}`;
      if (isPlainObject(v)) walk(v, key);
      else out[key] = v;
    }
  };
  for (const [k, v] of Object.entries(nested)) walk(v, k);
  return out;
}
function pyFrame(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (!rows.some(isPlainObject)) {
    return rows.map((r) => ({ value: r === null || r === void 0 ? null : pyStr(r) }));
  }
  const flat = rows.map((r) => isPlainObject(r) ? flattenRecord(r) : { value: r });
  const names = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Map();
  for (const r of flat) {
    for (const k of Object.keys(r)) {
      if (names.has(k)) continue;
      let name = pyName(k);
      const n = (seen.get(name) ?? 0) + 1;
      seen.set(name, n);
      if (n > 1) name = `${name}_${n}`;
      names.set(k, name);
    }
  }
  const cols = [...new Set(names.values())];
  const out = flat.map((r) => {
    const o = {};
    for (const c of cols) o[c] = null;
    for (const [k, v] of Object.entries(r)) o[names.get(k)] = v === void 0 ? null : v;
    return o;
  });
  for (const c of cols) {
    const vals = out.map((r) => r[c]).filter((v) => v !== null);
    const kinds = new Set(vals.map((v) => typeof v === "object" ? "nested" : typeof v));
    const native = kinds.size === 0 || kinds.size === 1 && (kinds.has("number") || kinds.has("string") || kinds.has("boolean"));
    if (native) continue;
    for (const r of out) {
      const v = r[c];
      if (v === null || typeof v === "string" || typeof v === "boolean") continue;
      r[c] = typeof v === "object" ? JSON.stringify(v) : pyStr(v);
    }
  }
  return idColumnsToStrings(out);
}
function descend(node) {
  for (; ; ) {
    if (Array.isArray(node)) {
      const dicts2 = node.filter(isPlainObject);
      if (node.length && dicts2.length === node.length && dicts2.every((d) => Object.keys(d).length === 1)) {
        const keys = new Set(dicts2.map((d) => Object.keys(d)[0]));
        if (keys.size === 1) {
          const inner = dicts2.map((d) => d[Object.keys(d)[0]]);
          if (inner.every((v) => Array.isArray(v) || isPlainObject(v))) {
            node = inner.flatMap((v) => Array.isArray(v) ? v : [v]);
            continue;
          }
        }
      }
      return node;
    }
    if (isPlainObject(node)) {
      const keys = Object.keys(node);
      if (keys.length === 1 && (Array.isArray(node[keys[0]]) || isPlainObject(node[keys[0]]))) {
        node = node[keys[0]];
        continue;
      }
      return keys.length ? [node] : [];
    }
    return [];
  }
}
function tables(raw) {
  const out = /* @__PURE__ */ new Map();
  const data = isPlainObject(raw) ? raw.data : void 0;
  if (!isPlainObject(data)) return out;
  for (const [key, value] of Object.entries(data)) out.set(underscore(key), pyFrame(descend(value)));
  return out;
}
function parse_yahoo_list(raw) {
  const first = tables(raw).values().next();
  return first.done ? [] : first.value;
}
function parse_yahoo_stats(raw) {
  const t = tables(raw);
  const leagues = t.get("leagues");
  if (leagues?.length) return leagues;
  return [...t.values()].find((rows) => rows.length) ?? [];
}

// src/parsers/yahoo_scores.ts
var isIdMap = (entry) => isPlainObject(entry) && Object.keys(entry).length > 0 && Object.values(entry).every(isPlainObject);
function collectionRows(collection) {
  const rows = [];
  for (const [entity_id, entry] of Object.entries(collection)) {
    if (isIdMap(entry)) {
      for (const [sub_id, rec2] of Object.entries(entry)) rows.push({ entity_id, sub_id, ...rec2 });
    } else if (isPlainObject(entry)) {
      rows.push({ entity_id, ...entry });
    } else if (Array.isArray(entry)) {
      for (const item of entry) rows.push(isPlainObject(item) ? { entity_id, ...item } : { entity_id, value: item });
    } else {
      rows.push({ entity_id, value: entry });
    }
  }
  return rows;
}
function collections(raw) {
  const out = /* @__PURE__ */ new Map();
  const service = isPlainObject(raw) ? raw.service : void 0;
  if (!isPlainObject(service)) return out;
  const root = Object.entries(service).find(([k, v]) => k !== "xml:lang" && isPlainObject(v))?.[1];
  if (!isPlainObject(root)) return out;
  for (const [name, collection] of Object.entries(root)) {
    if (isPlainObject(collection)) out.set(underscore(name), collection);
  }
  return out;
}
var frame = (raw, name) => {
  const collection = collections(raw).get(name);
  return collection ? pyFrame(collectionRows(collection)) : [];
};
function parse_yahoo_scores_list(raw) {
  const first = collections(raw).keys().next();
  return first.done ? [] : frame(raw, first.value);
}
function parse_yahoo_scores_scoreboard(raw) {
  return frame(raw, "games");
}
function parse_yahoo_scores_boxscore(raw) {
  return frame(raw, "player_stats");
}

// src/parsers/hockeytech.ts
function isPlainObject13(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function siteKitRows(payload) {
  const kit = isPlainObject13(payload) ? payload.SiteKit : void 0;
  if (!isPlainObject13(kit)) return [];
  for (const v of Object.values(kit)) {
    if (Array.isArray(v)) return v;
  }
  return [];
}
function deriveSeasonYear(name) {
  const latest = (/* @__PURE__ */ new Date()).getFullYear() + 2;
  const twoDigitEnd = (zz) => 2e3 + zz <= latest ? 2e3 + zz : 1900 + zz;
  const s = String(name ?? "");
  const m = /(\d{4})\s*[-/]\s*(\d{4}|\d{2})(?!\d)/.exec(s);
  const short = /(?<!\d)(\d{2})\s*[-/]\s*(\d{2})(?!\d)/.exec(s);
  const token = /(?<!\d)(\d{4})(?!\d)/.exec(s);
  let yr = null;
  if (m) {
    const start = Number(m[1]);
    yr = m[2].length === 4 ? Number(m[2]) : Math.floor(start / 100) * 100 + Number(m[2]);
    if (yr < start) yr += 100;
  } else if (short && (Number(short[1]) + 1) % 100 === Number(short[2])) {
    yr = twoDigitEnd(Number(short[2]));
  } else if (token) {
    const t = Number(token[1]);
    if (t >= 1950 && t <= latest) yr = t;
    else if ((Math.floor(t / 100) + 1) % 100 === t % 100) yr = twoDigitEnd(t % 100);
  }
  return yr !== null && yr >= 1950 && yr <= latest ? yr : null;
}
function gameTypeLabel(name) {
  const n = String(name ?? "").toLowerCase();
  if (/pre[- ]?season/.test(n)) return "preseason";
  if (/playoff|post/.test(n)) return "playoffs";
  if (n.includes("exhibition")) return "exhibition";
  return "regular";
}
var TWO_YEAR_NAME_RE = /\d{2}\s*[-/]\s*\d{2}/;
function parse_hockeytech_seasons(payload) {
  const rows = siteKitRows(payload).map((r) => {
    if (!isPlainObject13(r)) return r;
    const name = String(r.season_name ?? "");
    let yr = deriveSeasonYear(r.season_name);
    const label = gameTypeLabel(r.season_name);
    if ((label === "preseason" || label === "exhibition") && yr !== null && !TWO_YEAR_NAME_RE.test(name) && String(r.start_date ?? "").slice(0, 4) === String(yr)) {
      yr += 1;
    }
    return { ...r, season_yr: yr, game_type_label: label };
  });
  return normalize(rows);
}
function parse_hockeytech_schedule(payload) {
  return normalize(siteKitRows(payload));
}
function parse_hockeytech_teams(payload) {
  return normalize(siteKitRows(payload));
}
function parse_hockeytech_team_roster(payload) {
  return normalize(siteKitRows(payload));
}
function parse_hockeytech_player_stats(payload) {
  const kit = isPlainObject13(payload) ? payload.SiteKit : void 0;
  const player = isPlainObject13(kit) ? kit.Player : void 0;
  if (!isPlainObject13(player)) return normalize(siteKitRows(payload));
  const rows = [];
  for (const [statClass, lines] of Object.entries(player)) {
    if (!Array.isArray(lines)) continue;
    for (const r of lines) {
      if (isPlainObject13(r)) rows.push({ stat_class: statClass, ...r });
    }
  }
  return normalize(rows);
}
function parse_hockeytech_game_shifts(payload) {
  const kit = isPlainObject13(payload) ? payload.SiteKit : void 0;
  const gs = isPlainObject13(kit) ? kit.Gameshifts : void 0;
  if (!isPlainObject13(gs)) return [];
  const rows = [];
  for (const side of ["home", "visitor"]) {
    const arr = gs[side];
    if (Array.isArray(arr)) {
      for (const r of arr) rows.push(isPlainObject13(r) ? { side, ...r } : { side, value: r });
    }
  }
  return normalize(rows);
}
function parse_hockeytech_standings(payload) {
  if (!Array.isArray(payload) || payload.length === 0) return [];
  const rows = [];
  for (const block of payload) {
    const sections = isPlainObject13(block) ? block.sections : void 0;
    if (!Array.isArray(sections)) continue;
    for (const sec of sections) {
      const data = isPlainObject13(sec) ? sec.data : void 0;
      if (!Array.isArray(data)) continue;
      for (const d of data) {
        const row = isPlainObject13(d) ? d.row : void 0;
        if (isPlainObject13(row)) rows.push(row);
      }
    }
  }
  return normalize(rows);
}
function parse_hockeytech_leaders(payload) {
  if (!isPlainObject13(payload)) return [];
  const rows = [];
  for (const [playerType, group] of Object.entries(payload)) {
    if (!isPlainObject13(group)) continue;
    for (const [category, body] of Object.entries(group)) {
      const results = isPlainObject13(body) ? body.results : void 0;
      if (!Array.isArray(results)) continue;
      for (const r of results) {
        if (isPlainObject13(r)) rows.push({ player_type: playerType, category, ...r });
      }
    }
  }
  return normalize(rows);
}
function parse_hockeytech_pbp(payload) {
  if (!Array.isArray(payload) || payload.length === 0) return [];
  const rows = payload.map((p) => {
    if (!isPlainObject13(p)) return { value: p };
    const { event, details } = p;
    return isPlainObject13(details) ? { event, ...details } : { event, details };
  });
  return normalize(rows);
}
function parse_hockeytech_game_summary(payload) {
  const gc = isPlainObject13(payload) ? payload.GC : void 0;
  const summary = isPlainObject13(gc) ? gc.Gamesummary : void 0;
  const goals = isPlainObject13(summary) ? summary.goals : void 0;
  if (!Array.isArray(goals)) return [];
  return normalize(goals);
}
function parse_hockeytech_scorebar(payload) {
  return normalize(siteKitRows(payload));
}
function parse_hockeytech_player_search(payload) {
  return normalize(siteKitRows(payload));
}
function parse_hockeytech_stats(payload) {
  return normalize(siteKitRows(payload));
}
function parse_hockeytech_player_game_log(payload) {
  const kit = isPlainObject13(payload) ? payload.SiteKit : void 0;
  const player = isPlainObject13(kit) ? kit.Player : void 0;
  const games = isPlainObject13(player) ? player.games : void 0;
  return Array.isArray(games) ? normalize(games) : [];
}
function parse_hockeytech_transactions(payload) {
  const kit = isPlainObject13(payload) ? payload.SiteKit : void 0;
  const tx = isPlainObject13(kit) ? kit.Transactions : void 0;
  const rows = isPlainObject13(tx) ? tx.transactions : void 0;
  return Array.isArray(rows) ? normalize(rows) : [];
}
function parse_hockeytech_playoff_bracket(payload) {
  const kit = isPlainObject13(payload) ? payload.SiteKit : void 0;
  const br = isPlainObject13(kit) ? kit.Brackets : void 0;
  const rounds = isPlainObject13(br) ? br.rounds : void 0;
  if (!Array.isArray(rounds)) return [];
  const rows = [];
  for (const rd of rounds) {
    if (!isPlainObject13(rd)) continue;
    const { matchups, ...roundFields } = rd;
    if (!Array.isArray(matchups)) continue;
    for (const m of matchups) {
      if (!isPlainObject13(m)) continue;
      const prefixed = Object.fromEntries(Object.entries(roundFields).map(([k, v]) => [k === "round" ? "round_number" : k.startsWith("round_") ? k : `round_${k}`, v]));
      rows.push({ ...prefixed, ...m });
    }
  }
  return normalize(rows);
}

// src/parsers/torvik.ts
var import_papaparse2 = __toESM(require_papaparse_min(), 1);
function cleanHeader(key) {
  return String(key).replace(/%/g, "_percent").replace(/#/g, "_number").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9]+/g, "_").replace(/__+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}
function cleanKeys(row) {
  const out = {};
  const counts = /* @__PURE__ */ new Map();
  for (const [k, v] of Object.entries(row)) {
    const base = cleanHeader(k);
    let key = base;
    if (counts.has(base)) {
      let n = counts.get(base) + 1;
      while (`${base}_${n}` in out) n++;
      key = `${base}_${n}`;
      counts.set(base, n);
    } else {
      counts.set(base, 1);
    }
    out[key] = v;
  }
  return out;
}
function parseHeaderCsv(text) {
  if (typeof text !== "string" || !text.trim()) return [];
  let parsed;
  try {
    parsed = import_papaparse2.default.parse(text, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true
    });
  } catch {
    return [];
  }
  const data = parsed?.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((row) => cleanKeys(row));
}
function parsePositionalCsv(text, cols) {
  if (typeof text !== "string" || !text.trim()) return [];
  let parsed;
  try {
    parsed = import_papaparse2.default.parse(text, {
      header: false,
      dynamicTyping: false,
      skipEmptyLines: true
    });
  } catch {
    return [];
  }
  const data = parsed?.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((arr) => positionalRow(Array.isArray(arr) ? arr : [], cols));
}
function positionalRow(arr, cols) {
  const out = {};
  const n = Math.max(arr.length, cols.length);
  for (let i = 0; i < n; i++) {
    const name = i < cols.length ? cols[i] : `field_${i}`;
    let v = i < arr.length ? arr[i] : null;
    if (Array.isArray(v)) v = v.map((x) => x === null || x === void 0 ? "" : x).join(";");
    out[name] = v;
  }
  return out;
}
function parsePositionalJson(input, cols) {
  let rows = input;
  if (typeof input === "string") {
    if (!input.trim()) return [];
    try {
      rows = JSON.parse(input);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map((arr) => positionalRow(Array.isArray(arr) ? arr : [], cols));
}
var GAME_STATS_COLS = [
  "date",
  "type",
  "team",
  "conf",
  "opp",
  "venue",
  "result",
  "adj_oe",
  "adj_de",
  "oe",
  "off_efg",
  "off_to",
  "off_or",
  "off_ftr",
  "de",
  "def_efg",
  "def_to",
  "def_or",
  "def_ftr",
  "game_score",
  "opp_conf",
  "quad",
  "year",
  "tempo",
  "muid",
  "coach",
  "opp_coach",
  "margin",
  "win_prob",
  "game_stats",
  "overtimes"
];
var PLAYER_STATS_COLS = [
  "player_name",
  "team",
  "conf",
  "games",
  "min_pct",
  "o_rtg",
  "usage",
  "e_fg",
  "ts_pct",
  "orb_pct",
  "drb_pct",
  "ast_pct",
  "to_pct",
  "ftm",
  "fta",
  "ft_pct",
  "two_pm",
  "two_pa",
  "two_p_pct",
  "three_pm",
  "three_pa",
  "three_p_pct",
  "blk_pct",
  "stl_pct",
  "ftr",
  "class",
  "height",
  "number",
  "porpag",
  "adj_oe",
  "pfr",
  "year",
  "player_id",
  "hometown",
  "rec_rank",
  "ast_to",
  "rim_made",
  "rim_attempts",
  "mid_made",
  "mid_attempts",
  "rim_pct",
  "mid_pct",
  "dunks_made",
  "dunks_attempts",
  "dunks_pct",
  "pick",
  "drtg",
  "adrtg",
  "dporpag",
  "stops",
  "bpm",
  "obpm",
  "dbpm",
  "gbpm",
  "minutes",
  "ogbpm",
  "dgbpm",
  "oreb",
  "dreb",
  "treb",
  "ast",
  "stl",
  "blk",
  "pts",
  "role",
  "threat",
  "recruit_date"
];
var GAME_SCHEDULE_COLS = [
  "muid",
  "date",
  "conmatch",
  "matchup",
  "prediction",
  "ttq",
  "conf",
  "venue",
  "team1",
  "t1oe",
  "t1de",
  "t1py",
  "t1wp",
  "t1propt",
  "team2",
  "t2oe",
  "t2de",
  "t2py",
  "t2wp",
  "t2propt",
  "tpro",
  "t1qual",
  "t2qual",
  "gp",
  "result",
  "tempo",
  "possessions",
  "t1pts",
  "t2pts",
  "winner",
  "loser",
  "t1adjt",
  "t2adjt",
  "t1adjo",
  "t1adjd",
  "t2adjo",
  "t2adjd",
  "gamevalue",
  "mismatch",
  "blowout",
  "t1elite",
  "t2elite",
  "ord_date",
  "t1ppp",
  "t2ppp",
  "gameppp",
  "t1rk",
  "t2rk",
  "t1gs",
  "t2gs",
  "gamestats",
  "overtimes",
  "t1fun",
  "t2fun",
  "results"
];
function parse_torvik_ratings(text) {
  return parseHeaderCsv(text);
}
function parse_torvik_team_factors(text) {
  return parseHeaderCsv(text);
}
function parse_torvik_game_stats(input) {
  return parsePositionalJson(input, GAME_STATS_COLS);
}
function parse_torvik_player_stats(text) {
  return parsePositionalCsv(text, PLAYER_STATS_COLS);
}
function parse_torvik_game_schedule(input) {
  return parsePositionalJson(input, GAME_SCHEDULE_COLS);
}

// src/parsers/pff_api.ts
var MATRIX_KEYS = ["defenders", "receivers", "versus"];
var META_KEYS = /* @__PURE__ */ new Set(["restricted"]);
var V2_TABLES = { rows: "columns", teamTotals: "totalsColumns" };
var ID_COLS = /* @__PURE__ */ new Set([
  "player_id",
  "franchise_id",
  "league_id",
  "season_id",
  "game_id",
  "away_franchise_id",
  "home_franchise_id",
  "player_franchise_id",
  "coverage_player_id",
  "defender_player_id",
  "receiver_player_id",
  "stadium_id",
  "id"
]);
function envelope(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (!META_KEYS.has(k)) out[k] = v;
  return out;
}
function pyJsonDumps(value) {
  const str = (s) => JSON.stringify(s).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const enc = (v) => {
    if (v === null || v === void 0) return "null";
    if (typeof v === "string") return str(v);
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : v > 0 ? "Infinity" : v < 0 ? "-Infinity" : "NaN";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (Array.isArray(v)) return `[${v.map(enc).join(", ")}]`;
    if (typeof v === "object") {
      return `{${Object.keys(v).sort().map((k) => `${str(k)}: ${enc(v[k])}`).join(", ")}}`;
    }
    return str(String(v));
  };
  return enc(value);
}
function truthy(v) {
  if (Array.isArray(v)) return v.length > 0;
  if (isPlainObject(v)) return Object.keys(v).length > 0;
  return Boolean(v);
}
function scalarize(value) {
  return value !== null && typeof value === "object" ? pyJsonDumps(value) : value;
}
function rectangular(rows) {
  const raw = [];
  const seen = /* @__PURE__ */ new Set();
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        raw.push(k);
      }
    }
  }
  const columns = raw.map(underscore);
  const out = rows.map((r) => {
    const o = {};
    raw.forEach((k, i) => {
      o[columns[i]] = r[k] === void 0 ? null : r[k];
    });
    return o;
  });
  return { columns, rows: out };
}
function toInt(v) {
  if (v === null || v === void 0) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
  if (typeof v === "string" && /^\s*[-+]?\d+\s*$/.test(v)) {
    const n = Number(v);
    return Number.isSafeInteger(n) ? n : BigInt(v.trim());
  }
  return null;
}
function toFloat(v) {
  if (v === null || v === void 0) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v;
  if (typeof v === "string" && /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(v)) return Number(v);
  return null;
}
function toStr(v) {
  return v === null || v === void 0 ? null : String(v);
}
function frame2(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (!isPlainObject(rows[0])) return rows.map((r) => ({ value: scalarize(r) }));
  const norm = rows.map((row) => {
    const o = {};
    for (const [k, v] of Object.entries(isPlainObject(row) ? row : {})) o[k] = scalarize(v);
    return o;
  });
  const { columns, rows: out } = rectangular(norm);
  for (const c of columns) {
    const isText = out.some((r) => typeof r[c] === "string");
    if (ID_COLS.has(c) && !isText) for (const r of out) r[c] = toInt(r[c]);
  }
  if (columns.includes("jersey_number")) for (const r of out) r.jersey_number = toStr(r.jersey_number);
  return idColumnsToStrings(out);
}
function isMatrix(v) {
  return isPlainObject(v) && MATRIX_KEYS.every((k) => k in v);
}
function parse_pff_matrix(raw, report) {
  let obj2 = {};
  if (isPlainObject(raw) && Object.keys(raw).length) {
    if (report !== void 0 && isPlainObject(raw[report])) {
      obj2 = raw[report];
    } else {
      for (const v of Object.values(raw)) {
        if (isMatrix(v)) {
          obj2 = v;
          break;
        }
      }
    }
  }
  const out = {};
  for (const name of MATRIX_KEYS) out[name] = frame2(truthy(obj2[name]) ? obj2[name] : []);
  return out;
}
var has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function parse_pff_report(raw, section) {
  const all = reportTables(raw);
  if (section === void 0) return all;
  let tables2 = {};
  if (!Array.isArray(all)) tables2 = all;
  else if (isPlainObject(raw)) {
    const keys = Object.keys(envelope(raw));
    if (keys.length === 1 && Array.isArray(raw[keys[0]])) tables2 = { [keys[0]]: all };
  }
  if (!Object.keys(tables2).length) return [];
  if (!has(tables2, section)) {
    throw sectionError("parse_pff_report", section, Object.keys(tables2), MULTI_TABLE_SECTIONS.parse_pff_report.default);
  }
  return tables2[section];
}
function reportTables(raw) {
  if (!isPlainObject(raw) || !Object.keys(raw).length) return [];
  const env = envelope(raw);
  const keys = Object.keys(env);
  if (keys.length === 1) {
    const val = env[keys[0]];
    if (isMatrix(val)) return parse_pff_matrix(env);
    if (Array.isArray(val)) return frame2(val);
    return [];
  }
  const out = {};
  for (const [k, v] of Object.entries(env)) if (Array.isArray(v)) out[k] = frame2(v);
  return Object.keys(out).length ? out : [];
}
function fixedSection(parser, section) {
  const spec = MULTI_TABLE_SECTIONS[parser];
  const name = section ?? spec.default;
  if (!spec.sections.includes(name)) throw sectionError(parser, name, spec.sections, spec.default);
  return name;
}
function parse_pff_player_detail(raw, section) {
  const career = fixedSection("parse_pff_player_detail", section) === "career";
  if (!isPlainObject(raw) || !Object.keys(raw).length) return [];
  const env = envelope(raw);
  const keys = Object.keys(env);
  const obj2 = keys.length === 1 && isPlainObject(env[keys[0]]) ? env[keys[0]] : env;
  if (!isPlainObject(obj2)) return [];
  const subject = isPlainObject(obj2.subject) ? obj2.subject : {};
  let rows = career ? obj2.seasons : obj2.weeks;
  if (!truthy(rows)) rows = truthy(obj2.week_totals) ? obj2.week_totals : truthy(obj2.career) ? obj2.career : [];
  if (isPlainObject(rows)) rows = [rows];
  const flat = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!isPlainObject(row)) continue;
    const r = { ...row };
    const game = r.game;
    delete r.game;
    if (isPlainObject(game)) for (const [gk, gv] of Object.entries(game)) r[`game_${gk}`] = gv;
    for (const sk of ["player_id", "league_id", "season"]) if (!(sk in r)) r[sk] = subject[sk] ?? null;
    flat.push(r);
  }
  return frame2(flat);
}
function inferredKind(values) {
  const kinds = /* @__PURE__ */ new Set();
  for (const v of values) {
    if (v === null || v === void 0) continue;
    if (typeof v === "number") kinds.add(Number.isInteger(v) ? "int" : "float");
    else if (typeof v === "boolean") kinds.add("bool");
    else kinds.add("str");
  }
  if (kinds.size === 0) return "null";
  if (kinds.size === 1) return [...kinds][0];
  if ([...kinds].every((k) => k === "int" || k === "float")) return "float";
  return "mixed";
}
function parse_pff_v2_table(raw, section) {
  const table = fixedSection("parse_pff_v2_table", section);
  const body = isPlainObject(raw) ? raw : {};
  const declared = (body[V2_TABLES[table] ?? `${table}Columns`] || []).filter(
    (c) => isPlainObject(c) && c.key
  );
  const schema = /* @__PURE__ */ new Map();
  for (const c of declared) {
    const name = underscore(String(c.key));
    const type = ["integer", "number", "boolean", "string"].includes(String(c.type)) ? String(c.type) : "string";
    schema.set(name, name === "id" || name.endsWith("_id") ? "integer" : type);
  }
  const rows = (body[table] || []).filter(isPlainObject);
  if (!rows.length) return [];
  const norm = rows.map((r) => {
    const o = {};
    for (const [k, v] of Object.entries(r)) o[k] = scalarize(v);
    return o;
  });
  const { columns, rows: out } = rectangular(norm);
  for (const [c, type] of schema) {
    if (!columns.includes(c)) {
      for (const r of out) r[c] = null;
      continue;
    }
    const kind = inferredKind(out.map((r) => r[c]));
    if (type === "integer") for (const r of out) r[c] = toInt(r[c]);
    else if (type === "number") for (const r of out) r[c] = toFloat(r[c]);
    else if (type === "boolean") {
      if (kind !== "str" && kind !== "mixed") for (const r of out) r[c] = r[c] === null ? null : Boolean(r[c]);
    } else if (kind !== "null") {
      for (const r of out) r[c] = toStr(r[c]);
    }
  }
  const order = [...schema.keys(), ...columns.filter((c) => !schema.has(c))];
  return idColumnsToStrings(
    out.map((r) => {
      const o = {};
      for (const c of order) o[c] = r[c];
      return o;
    })
  );
}

// src/parsers/nfl_pro.ts
var NFL_PRO_COLLECTION_KEYS = [
  "passers",
  "rushers",
  "receivers",
  "defenders",
  "offense",
  "defense",
  "players"
];
function isRecordList(value) {
  return Array.isArray(value) && (value.length === 0 || value.some(isPlainObject));
}
var dicts = (values) => values.filter(isPlainObject);
function records(payload) {
  if (Array.isArray(payload)) return isRecordList(payload) ? dicts(payload) : [];
  if (!isPlainObject(payload)) return [];
  const body = payload;
  for (const key of NFL_PRO_COLLECTION_KEYS) if (isRecordList(body[key])) return dicts(body[key]);
  let best;
  for (const v of Object.values(body)) if (isRecordList(v) && (!best || v.length > best.length)) best = v;
  return best ? dicts(best) : [];
}
function flatten3(obj2, prefix, out) {
  for (const [k, v] of Object.entries(obj2)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (isPlainObject(v)) flatten3(v, key, out);
    else out[key] = v;
  }
}
function pyStr2(v, missing) {
  if (missing) return "nan";
  const repr = (x) => {
    if (x === null || x === void 0) return "None";
    if (typeof x === "boolean") return x ? "True" : "False";
    if (typeof x === "number") return Number.isFinite(x) ? String(x) : Number.isNaN(x) ? "nan" : x > 0 ? "inf" : "-inf";
    if (typeof x === "string") {
      const quote = x.includes("'") && !x.includes('"') ? '"' : "'";
      const body = x.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
      return quote + (quote === "'" ? body.replace(/'/g, "\\'") : body) + quote;
    }
    if (Array.isArray(x)) return `[${x.map(repr).join(", ")}]`;
    return `{${Object.entries(x).map(([k, val]) => `${repr(k)}: ${repr(val)}`).join(", ")}}`;
  };
  return typeof v === "string" ? v : repr(v);
}
function parse_nfl_pro_stats(payload) {
  const recs = records(payload);
  if (!recs.length) return [];
  const flat = recs.map((r) => {
    const o = {};
    flatten3(r, "", o);
    return o;
  });
  const raw = [];
  const seen = /* @__PURE__ */ new Set();
  for (const r of flat) for (const k of Object.keys(r)) if (!seen.has(k) && seen.add(k)) raw.push(k);
  const keep = [];
  const names = /* @__PURE__ */ new Set();
  for (const k of raw) {
    const name = underscore(String(k));
    if (names.has(name)) continue;
    names.add(name);
    keep.push([k, name]);
  }
  const stringify = new Set(
    keep.filter(([k]) => flat.some((r) => r[k] !== null && typeof r[k] === "object")).map(([k]) => k)
  );
  const rows = flat.map((r) => {
    const o = {};
    for (const [k, name] of keep) {
      const missing = !(k in r);
      o[name] = stringify.has(k) ? pyStr2(r[k], missing) : missing || r[k] === void 0 ? null : r[k];
    }
    return o;
  });
  return idColumnsToStrings(rows);
}

// src/parsers/on3.ts
function parse_on3_rdb(raw) {
  let rows = [];
  if (Array.isArray(raw)) rows = raw;
  else if (isPlainObject12(raw)) {
    rows = Array.isArray(raw.list) ? raw.list : Object.keys(raw).length ? [raw] : [];
  }
  return rowsToFrame(rows);
}

// src/parsers/asa.ts
var OPTS = { ids: true, dropNull: true };
var GOALS_ADDED_KEYS = ["player_id", "team_id", "general_position", "minutes_played", "minutes"];
function parse_asa(raw) {
  return rowsToFrame(asRows(raw), OPTS);
}
function parse_asa_goals_added_tables(raw) {
  const rows = asRows(raw).filter(isPlainObject12);
  const summary = rows.map(({ data: _data, ...rest }) => rest);
  const actions = [];
  for (const row of rows) {
    const keys = {};
    for (const k of GOALS_ADDED_KEYS) if (k in row) keys[k] = row[k];
    for (const action of Array.isArray(row.data) ? row.data : []) {
      if (isPlainObject12(action)) actions.push({ ...keys, ...action });
    }
  }
  return { summary: rowsToFrame(summary, OPTS), actions: rowsToFrame(actions, OPTS) };
}
function parse_asa_goals_added(raw, section) {
  return pickSection("parse_asa_goals_added", parse_asa_goals_added_tables(raw), section);
}

// src/parsers/mls_api.ts
var OPTS2 = { ids: true, dropNull: true };
var META_KEYS2 = /* @__PURE__ */ new Set(["meta", "pagination", "next_page_token"]);
function rowsKey(raw) {
  for (const [key, value] of Object.entries(raw)) {
    if (META_KEYS2.has(key) || !Array.isArray(value) || value.length === 0) continue;
    if (value.every(isPlainObject12)) return value;
  }
  return void 0;
}
function parse_mls_api(raw) {
  let rows = [];
  if (Array.isArray(raw)) rows = raw;
  else if (isPlainObject12(raw) && Object.keys(raw).length) rows = rowsKey(raw) ?? [raw];
  return rowsToFrame(rows, OPTS2);
}
function parse_mls_entity(raw) {
  let rows = [];
  if (Array.isArray(raw)) rows = raw;
  else if (isPlainObject12(raw) && Object.keys(raw).length) rows = [raw];
  return rowsToFrame(rows, OPTS2);
}
function parse_mls_standings_tables(raw) {
  const rawTables = isPlainObject12(raw) ? raw.tables : Array.isArray(raw) ? raw : null;
  const tables2 = (Array.isArray(rawTables) ? rawTables : []).filter(isPlainObject12);
  const meta = tables2.map(({ entries: _entries, ...rest }) => rest);
  const entries = [];
  for (const table of tables2) {
    const keys = {};
    for (const k of ["competition_id", "season_id", "group", "category", "type"]) {
      if (k in table) keys[k] = table[k];
    }
    for (const entry of Array.isArray(table.entries) ? table.entries : []) {
      if (isPlainObject12(entry)) entries.push({ ...keys, ...entry });
    }
  }
  return { tables: rowsToFrame(meta, OPTS2), entries: rowsToFrame(entries, OPTS2) };
}
function parse_mls_standings(raw, section) {
  return pickSection("parse_mls_standings", parse_mls_standings_tables(raw), section);
}
var MATCH_TABLES = [
  "match_information",
  "environment",
  "teams",
  "players",
  "staff",
  "referees",
  "last_matches"
];
function parse_mls_match_tables(raw) {
  const match = isPlainObject12(raw) ? raw : {};
  const teams = [];
  const players = [];
  const staff = [];
  for (const side of ["home", "away"]) {
    const block = match[side];
    if (!isPlainObject12(block)) continue;
    const scalars = {};
    for (const [k, v] of Object.entries(block)) {
      if (!Array.isArray(v) && !isPlainObject12(v)) scalars[k] = v;
    }
    teams.push({ side, ...scalars });
    const keys = { side, team_id: block.team_id, team_name: block.team_name };
    for (const person of Array.isArray(block.players) ? block.players : []) {
      if (isPlainObject12(person)) players.push({ ...keys, ...person });
    }
    for (const group of ["trainer_staff", "official_staff"]) {
      for (const person of Array.isArray(block[group]) ? block[group] : []) {
        if (isPlainObject12(person)) staff.push({ ...keys, staff_group: group, ...person });
      }
    }
  }
  const objs = (v) => Array.isArray(v) ? v.filter(isPlainObject12) : [];
  const blocks = {
    match_information: isPlainObject12(match.match_information) ? [match.match_information] : [],
    environment: isPlainObject12(match.environment) ? [match.environment] : [],
    teams,
    players,
    staff,
    referees: objs(match.referees),
    last_matches: objs(match.last_matches)
  };
  const out = {};
  for (const name of MATCH_TABLES) out[name] = rowsToFrame(blocks[name], OPTS2);
  return out;
}
function parse_mls_match(raw, section) {
  return pickSection("parse_mls_match", parse_mls_match_tables(raw), section);
}

// src/parsers/nwsl_api.ts
var OPTS3 = { ids: true, dropNull: true };
var ROWS_KEYS = ["matches", "matchdays", "stages", "standings", "players", "teams", "competitions"];
var META_KEYS3 = /* @__PURE__ */ new Set(["apiCallRequestTime", "competition", "pagination"]);
function envelopeRows2(raw) {
  if (Array.isArray(raw)) return raw;
  if (!isPlainObject12(raw)) return [];
  for (const key of ROWS_KEYS) {
    const v = raw[key];
    if (Array.isArray(v) && v.length) return v;
  }
  for (const [key, v] of Object.entries(raw)) {
    if (META_KEYS3.has(key) || !Array.isArray(v) || v.length === 0) continue;
    if (v.every(isPlainObject12)) return v;
  }
  return [];
}
var statCells = (row) => (Array.isArray(row.stats) ? row.stats : []).filter(isPlainObject12);
var withoutStats = ({ stats: _stats, ...rest }) => rest;
var scalar = (v) => Array.isArray(v) || isPlainObject12(v) ? pyJson(v) : v;
function parse_nwsl_sdp(raw) {
  return rowsToFrame(envelopeRows2(raw), OPTS3);
}
function parse_nwsl_standings(raw) {
  const splits = isPlainObject12(raw) ? raw.standings : raw;
  const rows = [];
  for (const split of Array.isArray(splits) ? splits : []) {
    if (!isPlainObject12(split)) continue;
    for (const club of Array.isArray(split.teams) ? split.teams : []) {
      if (!isPlainObject12(club)) continue;
      const row = { split_type: split.type, ...withoutStats(club) };
      for (const cell of statCells(club)) {
        if (cell.statsId) row[pyUnderscore(String(cell.statsId))] = scalar(cell.statsValue);
      }
      rows.push(row);
    }
  }
  return rowsToFrame(rows, OPTS3);
}
function parse_nwsl_stats(raw) {
  const rows = [];
  for (const entity of envelopeRows2(raw)) {
    if (!isPlainObject12(entity)) continue;
    const identity = withoutStats(entity);
    for (const cell of statCells(entity)) {
      rows.push({ ...identity, ...cell, statsValue: scalar(cell.statsValue) });
    }
  }
  return rowsToFrame(rows, OPTS3).map((r) => {
    if ("stats_value" in r && r.stats_value !== null && typeof r.stats_value !== "string") {
      r.stats_value = String(r.stats_value);
    }
    return r;
  });
}
function parse_nwsl_lineups_tables(raw) {
  const body = isPlainObject12(raw) ? raw : {};
  const matchId = body.matchId;
  const teams = [];
  const players = [];
  const staff = [];
  for (const side of ["home", "away"]) {
    const block = body[side];
    if (!isPlainObject12(block)) continue;
    const scalars = {};
    for (const [k, v] of Object.entries(block)) {
      if (!Array.isArray(v) && !isPlainObject12(v)) scalars[k] = v;
    }
    teams.push({ matchId, side, ...scalars });
    const keys = { matchId, side, teamId: block.teamId };
    for (const selection of ["fielded", "benched"]) {
      for (const person of Array.isArray(block[selection]) ? block[selection] : []) {
        if (isPlainObject12(person)) players.push({ ...keys, selection, ...person });
      }
    }
    for (const person of Array.isArray(block.staff) ? block.staff : []) {
      if (isPlainObject12(person)) staff.push({ ...keys, ...person });
    }
  }
  return {
    teams: rowsToFrame(teams, OPTS3),
    players: rowsToFrame(players, OPTS3),
    staff: rowsToFrame(staff, OPTS3)
  };
}
function parse_nwsl_lineups(raw, section) {
  return pickSection("parse_nwsl_lineups", parse_nwsl_lineups_tables(raw), section);
}

// src/parsers/nba_stats.ts
function underscore3(word) {
  return word.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/-/g, "_").toLowerCase();
}
var isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
var isNested = (v) => isObj(v) || Array.isArray(v);
function pyJson2(v) {
  if (v === null || v === void 0) return "null";
  if (typeof v === "string") {
    return JSON.stringify(v).replace(
      /[\u007f-￿]/g,
      (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")
    );
  }
  if (Array.isArray(v)) return "[" + v.map(pyJson2).join(", ") + "]";
  if (isObj(v)) {
    return "{" + Object.entries(v).map(([k, x]) => `${pyJson2(String(k))}: ${pyJson2(x)}`).join(", ") + "}";
  }
  return String(v);
}
function setFromRows(name, rows) {
  const headers = [];
  const seen = /* @__PURE__ */ new Set();
  for (const r of rows) for (const k of Object.keys(r)) if (!seen.has(k)) seen.add(k), headers.push(k);
  return { name, headers, rowSet: rows.map((r) => headers.map((h) => h in r ? r[h] : null)) };
}
function setFromRowsSorted(name, rows) {
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))].sort();
  return { name, headers, rowSet: rows.map((r) => headers.map((h) => h in r ? r[h] : null)) };
}
function videoResultSets(rs) {
  const urls = isObj(rs.Meta) && Array.isArray(rs.Meta.videoUrls) ? rs.Meta.videoUrls : [];
  const playlist = Array.isArray(rs.playlist) ? rs.playlist : [];
  return [
    setFromRows("videoUrls", urls.filter(isObj)),
    setFromRows("playlist", playlist.filter(isObj))
  ];
}
function boxscoreV3ResultSets(box) {
  const gameMeta = {};
  for (const [k, v] of Object.entries(box)) if (!isNested(v)) gameMeta[k] = v;
  const teams = ["homeTeam", "awayTeam"].map((s) => box[s]).filter(isObj);
  if (!teams.length) {
    const row = {};
    for (const [k, v] of Object.entries(box)) row[k] = isNested(v) ? pyJson2(v) : v;
    return [setFromRows("BoxScoreSummary", [row])];
  }
  const playerRows = [];
  const teamRows = [];
  for (const team of teams) {
    const ident = { ...gameMeta };
    for (const [k, v] of Object.entries(team)) if (!isNested(v)) ident[k] = v;
    const tstats = isObj(team.statistics) ? team.statistics : {};
    const trow = { ...ident };
    for (const [k, v] of Object.entries(tstats)) if (!isNested(v)) trow[k] = v;
    teamRows.push(trow);
    for (const player of Array.isArray(team.players) ? team.players : []) {
      const row = { ...ident };
      for (const [k, v] of Object.entries(player)) {
        if (k === "statistics" && isObj(v)) {
          for (const [sk, sv] of Object.entries(v)) if (!isNested(sv)) row[sk] = sv;
        } else if (isNested(v)) row[k] = pyJson2(v);
        else row[k] = v;
      }
      playerRows.push(row);
    }
  }
  const sets = [setFromRows("PlayerStats", playerRows), setFromRows("TeamStats", teamRows)];
  for (const [k, v] of Object.entries(box)) {
    if (Array.isArray(v) && v.length && isObj(v[0])) {
      const rows = v.map((rec2) => {
        const o = {};
        for (const [rk, rv] of Object.entries(rec2)) o[rk] = isNested(rv) ? pyJson2(rv) : rv;
        return o;
      });
      sets.push(setFromRows(k.charAt(0).toUpperCase() + k.slice(1), rows));
    }
  }
  return sets;
}
function flattenGame(record, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    const name = prefix ? `${prefix}${key}` : key;
    if (isObj(value)) Object.assign(out, flattenGame(value, `${name}_`));
    else if (Array.isArray(value)) continue;
    else out[name.toLowerCase()] = value;
  }
  return out;
}
function scoreboardResultSet(sb) {
  const base = {};
  for (const [k, v] of Object.entries(sb)) if (k !== "games" && !isNested(v)) base[k] = v;
  const rows = sb.games.filter(isObj).map((g) => {
    const merged = { ...base };
    for (const [k, v] of Object.entries(g)) if (!Array.isArray(v)) merged[k] = v;
    return flattenGame(merged);
  });
  return setFromRowsSorted("GameHeader", rows);
}
var SEASON_TYPE_BY_ID = {
  "1": "Pre-Season",
  "2": "Regular Season",
  "3": "All-Star",
  "4": "Playoffs",
  "5": "Play-In Game",
  "6": "NBA Cup",
  "9": "International"
};
var nestedName = (outer, inner) => `${underscore3(outer)}_${underscore3(inner)}`.replace(/team_team/g, "team");
function leagueScheduleResultSet(ls) {
  const rows = [];
  for (const gd of ls.gameDates) {
    if (!isObj(gd)) continue;
    const day = {};
    for (const [k, v] of Object.entries(gd)) if (k !== "games" && !isNested(v)) day[underscore3(k)] = v;
    for (const game of Array.isArray(gd.games) ? gd.games : []) {
      if (!isObj(game)) continue;
      const row = { ...day };
      for (const [key, value] of Object.entries(game)) {
        if (Array.isArray(value)) continue;
        if (isObj(value)) {
          for (const [k, v] of Object.entries(value)) if (!isNested(v)) row[nestedName(key, k)] = v;
        } else row[underscore3(key)] = value;
      }
      const gid = row.game_id;
      const typeId = gid ? String(gid).slice(2, 3) : null;
      row.season_type_id = typeId;
      row.season_type_description = SEASON_TYPE_BY_ID[typeId ?? ""] ?? null;
      row.season = ls.seasonYear ?? null;
      row.league_id = ls.leagueId ?? null;
      rows.push(row);
    }
  }
  return setFromRowsSorted("SeasonGames", rows);
}
function resultSets(raw) {
  if (Array.isArray(raw.resultSets)) return raw.resultSets;
  if (isObj(raw.resultSets)) {
    if ("Meta" in raw.resultSets || "playlist" in raw.resultSets) return videoResultSets(raw.resultSets);
    return [raw.resultSets];
  }
  if (isObj(raw.resultSet)) return [raw.resultSet];
  if (Array.isArray(raw.resultSet)) return raw.resultSet;
  if (isObj(raw.scoreboard) && Array.isArray(raw.scoreboard.games)) return [scoreboardResultSet(raw.scoreboard)];
  if (isObj(raw.leagueSchedule) && Array.isArray(raw.leagueSchedule.gameDates)) {
    return [leagueScheduleResultSet(raw.leagueSchedule)];
  }
  for (const [key, val] of Object.entries(raw)) {
    if (key.startsWith("boxScore") && isObj(val)) return boxscoreV3ResultSets(val);
  }
  return [];
}
function flattenHeaders(headers) {
  if (!Array.isArray(headers) || !headers.length || !isObj(headers[0])) return Array.isArray(headers) ? [...headers] : [];
  const [group, flatHdr] = headers;
  const flat = [...flatHdr?.columnNames ?? []];
  const skip = group.columnsToSkip ?? 0;
  const span = group.columnSpan ?? 1;
  const out = flat.slice(0, skip);
  let idx = skip;
  for (const grp of group.columnNames ?? []) {
    const prefix = String(grp).replace(/\./g, "").trim().replace(/ /g, "_");
    for (let i = 0; i < span; i++) if (idx < flat.length) out.push(`${prefix}_${flat[idx++]}`);
  }
  return out.concat(flat.slice(idx));
}
function toRows(rs) {
  const headers = flattenHeaders(rs.headers).map((h) => underscore3(String(h)));
  if (!headers.length) return [];
  const rows = Array.isArray(rs.rowSet) ? rs.rowSet : [];
  const out = [];
  for (const r of rows) {
    if (!Array.isArray(r) || r.length !== headers.length) continue;
    const o = {};
    headers.forEach((h, i) => {
      const c = r[i];
      o[h] = Array.isArray(c) ? c.map(String).join("|") : c;
    });
    out.push(o);
  }
  return idColumnsToStrings(out);
}
function parse_nba_stats_result_sets(raw, resultSet) {
  if (!isObj(raw)) return [];
  let sets;
  try {
    sets = resultSets(raw).filter(isObj);
  } catch {
    return [];
  }
  const frames = {};
  sets.forEach((rs, i) => {
    Object.defineProperty(frames, String(rs.name ?? `set_${i}`), {
      value: toRows(rs),
      enumerable: true,
      writable: true,
      configurable: true
    });
  });
  if (resultSet != null) {
    return Object.prototype.hasOwnProperty.call(frames, resultSet) ? frames[resultSet] : [];
  }
  const names = Object.keys(frames);
  if (!names.length) return [];
  if (names.length === 1) return frames[names[0]];
  return frames;
}

// src/parsers/_registry.ts
var PARSERS = {
  // ---- MLB Stats API ----
  // Generic list flattener (the default for most endpoints).
  parse_mlb_list,
  // Dedicated parsers (extra unrolling logic).
  parse_mlb_teams,
  parse_mlb_schedule,
  parse_mlb_team_roster,
  parse_mlb_standings,
  parse_mlb_person_stats,
  parse_mlb_boxscore,
  parse_mlb_linescore,
  parse_mlb_play_by_play,
  parse_mlb_win_probability,
  parse_mlb_draft_latest,
  parse_mlb_timecodes,
  // ---- NHL api-web (modern game-feed) ----
  parse_nhl_web_pbp,
  parse_nhl_web_boxscore,
  parse_nhl_web_landing,
  parse_nhl_web_right_rail,
  parse_nhl_web_schedule,
  parse_nhl_web_score,
  parse_nhl_web_club_schedule,
  parse_nhl_web_standings,
  parse_nhl_web_standings_season,
  parse_nhl_web_club_stats,
  parse_nhl_web_roster,
  parse_nhl_web_player_landing,
  parse_nhl_web_player_game_log,
  parse_nhl_web_leaders,
  parse_nhl_web_draft_picks,
  parse_nhl_web_player_spotlight,
  parse_nhl_web_draft_rankings,
  parse_nhl_web_playoff_series,
  // ---- NHL EDGE (player/team tracking) ----
  parse_edge_top10,
  parse_edge_detail,
  parse_edge_shot_location,
  parse_edge_zone_time,
  parse_edge_sog_details,
  parse_edge_sog_summary,
  parse_edge_hardest_shots,
  parse_edge_payload,
  // ---- NHL Stats REST + Records (shared {data:[...]} generic) ----
  parse_nhl_stats_rest,
  parse_nhl_records,
  // ---- NFL.com "Shield" API (api.nfl.com /football/v2) ----
  parse_nfl_standings,
  parse_nfl_rosters,
  parse_nfl_teams_history,
  parse_nfl_team,
  parse_nfl_weeks,
  parse_nfl_weeks_by_date,
  parse_nfl_combine_profiles,
  parse_nfl_draft_picks,
  parse_nfl_injuries,
  parse_nfl_game_summaries,
  parse_nfl_weekly_game_details,
  // ---- Baseball Savant / Statcast (baseballsavant.mlb.com) ----
  parse_mlb_statcast_leaderboard,
  parse_mlb_statcast_search,
  parse_mlb_statcast_gamefeed,
  parse_mlb_statcast_schedule,
  parse_mlb_statcast_html_leaderboard,
  parse_mlb_statcast_player,
  // ---- The Odds API (api.the-odds-api.com) ----
  parse_odds_api_sports,
  parse_odds_api_sports_odds,
  parse_odds_api_sports_scores,
  parse_odds_api_sports_events,
  parse_odds_api_sports_participants,
  parse_odds_api_event_odds,
  parse_odds_api_event_markets,
  parse_odds_api_sports_odds_history,
  parse_odds_api_sports_events_history,
  parse_odds_api_event_odds_history,
  // ---- 247Sports Recruit Database (api.247sports.com /rdb/v1) ----
  // Generic list flattener (the default for most endpoints).
  parse_recruiting_list,
  // Dedicated parsers (envelope unrolling logic).
  parse_recruiting_paged_list,
  parse_recruiting_institution_rankings,
  parse_recruiting_ranking_feed,
  // ---- 247Sports RDB (ipa.247sports.com) + site pages (247sports.com *.json) ----
  // Faithful ports of sdv-py's sports247 / sports247_site_pages parsers.
  parse_sports247_result_set,
  parse_sports247_teams,
  parse_sports247_institution_rankings,
  parse_sports247_site_page,
  // ---- CBS Sports API (api.cbssports.com/napi) ----
  // Generic list flattener (the default for most endpoints).
  parse_cbs_list,
  // Dedicated parsers (envelope unrolling logic).
  parse_cbs_scoreboard,
  parse_cbs_standings,
  parse_cbs_odds,
  // ---- Fox Sports Fox (api.foxsports.com/bifrost/v1) ----
  // Generic module-shell flattener (the default for most endpoints).
  parse_fox_list,
  // Dedicated parsers (nested-list unrolling logic).
  parse_fox_scoreboard,
  parse_fox_standings,
  parse_fox_event,
  parse_fox_team_roster,
  parse_fox_search,
  // ---- Yahoo Sports scores (api-secure.sports.yahoo.com /v1/scores/s) ----
  // Generic service-envelope flattener + two dedicated keyed-map unrollers.
  parse_yahoo_scores_list,
  parse_yahoo_scores_scoreboard,
  parse_yahoo_scores_boxscore,
  // ---- Yahoo Sports stats stats-graph (graphite-secure.sports.yahoo.com) ----
  // Generic GraphQL-envelope flattener (default) + nested stat-array unroller.
  parse_yahoo_list,
  parse_yahoo_stats,
  // ---- HockeyTech / LeagueStat (lscluster.hockeytech.com + cluster.leaguestat.com) ----
  // One parser per feed view (modulekit SiteKit envelopes, statviewfeed
  // standings/leaders/pbp, gc gamesummary).
  parse_hockeytech_seasons,
  parse_hockeytech_schedule,
  parse_hockeytech_teams,
  parse_hockeytech_team_roster,
  parse_hockeytech_player_stats,
  parse_hockeytech_game_shifts,
  parse_hockeytech_standings,
  parse_hockeytech_leaders,
  parse_hockeytech_pbp,
  parse_hockeytech_game_summary,
  parse_hockeytech_scorebar,
  parse_hockeytech_player_search,
  parse_hockeytech_stats,
  parse_hockeytech_player_game_log,
  parse_hockeytech_transactions,
  parse_hockeytech_playoff_bracket,
  // ---- BartTorvik / T-Rank (barttorvik.com) ----
  // Two header-CSV parsers, one headerless-CSV (67 positional cols), two
  // headerless-JSON (31 / 55 positional cols).
  parse_torvik_ratings,
  parse_torvik_team_factors,
  parse_torvik_game_stats,
  parse_torvik_player_stats,
  parse_torvik_game_schedule,
  // ---- PFF Developer API (api.pff.com) ----
  // /v1 envelopes (one table, or a dict for matrix / multi-key bodies), /v1
  // player-detail weeks, and the self-describing /v2 tables.
  // `section` (MULTI_TABLE_SECTIONS) maps to py's report / career / table.
  parse_pff_report,
  parse_pff_player_detail,
  parse_pff_v2_table,
  // ---- NFL Pro (pro.nfl.com /api/secured/stats/*) ----
  parse_nfl_pro_stats,
  // ---- KenPom (kenpom.com HTML): parse_kenpom_page is NODE-ONLY; importing
  // src/parsers/kenpom.ts adds it via registerParser (see NODE_ONLY_PARSERS).
  // ---- Keyless providers / league APIs (vendored from sdv-py) ----
  parse_on3_rdb,
  parse_asa,
  parse_asa_goals_added,
  parse_mls_api,
  parse_mls_entity,
  parse_mls_standings,
  parse_mls_match,
  parse_nwsl_sdp,
  parse_nwsl_standings,
  parse_nwsl_stats,
  parse_nwsl_lineups,
  // ---- stats.nba.com / stats.wnba.com (resultSets envelope; one generic parser) ----
  // Multi-set payloads return { [setName]: rows }, hence the cast.
  parse_nba_stats_result_sets
};
function parserFor(name) {
  return name ? PARSERS[name] : void 0;
}

// src/parsers/espn.ts
function isPlainObject14(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isScalar(v) {
  return v === null || v === void 0 || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}
function scoreboardEventParsing(event) {
  const comp = (event.competitions || [{}])[0] || {};
  const competitors = comp.competitors || [];
  const home = competitors.find((c) => c?.homeAway === "home") || {};
  const away = competitors.find((c) => c?.homeAway === "away") || {};
  const status = (event.status || {}).type || {};
  const venue = comp.venue || {};
  const notes = comp.notes || [];
  const noteText = notes.length ? notes[0].headline || "" : "";
  const team = (side) => {
    const t = side.team || {};
    const logos = t.logos;
    return {
      id: t.id,
      name: t.name,
      abbreviation: t.abbreviation,
      display_name: t.displayName,
      location: t.location,
      color: t.color,
      alternate_color: t.alternateColor,
      logo: logos && logos.length ? (logos[0] || {}).href : t.logo,
      score: side.score,
      winner: side.winner,
      home_away: side.homeAway,
      rank: (side.curatedRank || {}).current
    };
  };
  const h = team(home);
  const a = team(away);
  const season = event.season || {};
  const eventStatus = event.status || {};
  const address = venue.address || {};
  const broadcast = (comp.broadcasts || []).map((b) => b.names && b.names.length ? b.names[0] : b.market || "").join(", ");
  return {
    game_id: event.id,
    uid: event.uid,
    date: event.date,
    name: event.name,
    short_name: event.shortName,
    season_year: season.year,
    season_type: season.type,
    season_slug: season.slug,
    status_type_id: status.id,
    status_type_name: status.name,
    status_type_state: status.state,
    status_type_completed: status.completed,
    status_type_description: status.description,
    status_type_detail: status.detail,
    status_type_short_detail: status.shortDetail,
    status_clock: eventStatus.clock,
    status_display_clock: eventStatus.displayClock,
    status_period: eventStatus.period,
    neutral_site: comp.neutralSite,
    conference_competition: comp.conferenceCompetition,
    attendance: comp.attendance,
    venue_id: venue.id,
    venue_full_name: venue.fullName,
    venue_city: address.city,
    venue_state: address.state,
    venue_indoor: venue.indoor,
    broadcast,
    note: noteText,
    home_id: h.id,
    home_name: h.name,
    home_abbreviation: h.abbreviation,
    home_display_name: h.display_name,
    home_location: h.location,
    home_color: h.color,
    home_alternate_color: h.alternate_color,
    home_logo: h.logo,
    home_score: h.score,
    home_winner: h.winner,
    home_rank: h.rank,
    away_id: a.id,
    away_name: a.name,
    away_abbreviation: a.abbreviation,
    away_display_name: a.display_name,
    away_location: a.location,
    away_color: a.color,
    away_alternate_color: a.alternate_color,
    away_logo: a.logo,
    away_score: a.score,
    away_winner: a.winner,
    away_rank: a.rank
  };
}
function parse_scoreboard(payload) {
  if (!payload) return [];
  const events = payload.events || [];
  if (!events.length) return [];
  return normalize(events.map((ev) => scoreboardEventParsing(ev)));
}
function parse_teams(payload) {
  if (!payload) return [];
  try {
    const sports = payload.sports || [];
    let teamsRaw;
    if (sports.length) {
      const leagues = (sports[0] || {}).leagues || [];
      teamsRaw = leagues.length ? (leagues[0] || {}).teams || [] : [];
    } else {
      teamsRaw = payload.items || payload.teams || [];
    }
    if (!teamsRaw.length) return [];
    const drop = /* @__PURE__ */ new Set(["record", "links", "nextEvent", "standingSummary"]);
    const cleaned = teamsRaw.map((entry) => {
      const t = { ...entry.team || entry };
      for (const k of drop) delete t[k];
      return { team: t };
    });
    return normalize(cleaned);
  } catch {
    return [];
  }
}
function extractStandingEntries(children, parentName = "", parentAbbreviation = "") {
  const rows = [];
  for (const child of children) {
    const groupName = child.name || parentName;
    const groupAbbr = child.abbreviation || parentAbbreviation;
    const entries = (child.standings || {}).entries || [];
    if (entries.length) {
      for (const entry of entries) {
        const team = entry.team || {};
        const statsList = entry.stats || [];
        const row = {
          group_name: groupName,
          group_abbreviation: groupAbbr,
          team_id: team.id,
          team_name: team.name,
          team_abbreviation: team.abbreviation,
          team_display_name: team.displayName,
          team_location: team.location,
          team_logo: team.logo
        };
        for (const stat of statsList) {
          const col = snakeCase(stat.name || stat.abbreviation || "");
          row[col] = stat.value;
        }
        rows.push(row);
      }
    }
    const sub = child.children || [];
    if (sub.length) {
      rows.push(...extractStandingEntries(sub, groupName, groupAbbr));
    }
  }
  return rows;
}
function parse_standings(payload) {
  if (!payload) return [];
  let children = payload.children || [];
  if (!children.length) {
    const entries = (payload.standings || {}).entries || [];
    if (entries.length) children = [payload];
  }
  if (!children.length) return [];
  const rows = extractStandingEntries(children);
  if (!rows.length) return [];
  return normalize(rows);
}
function flattenGroups(groups, parentId = "", depth = 0) {
  const rows = [];
  for (const g of groups) {
    const children = g.children || [];
    const groupId = g.id || g.groupId;
    const row = {
      group_id: groupId,
      name: g.name,
      abbreviation: g.abbreviation || g.abbrev,
      short_name: g.shortName,
      is_conference: g.isConference !== void 0 ? g.isConference : depth === 0,
      parent_group_id: parentId || null,
      depth,
      children_count: children.length
    };
    rows.push(row);
    if (children.length) {
      rows.push(...flattenGroups(children, groupId || "", depth + 1));
    }
  }
  return rows;
}
function parse_groups(payload) {
  if (!payload) return [];
  let groups;
  try {
    const sports = payload.sports || [];
    if (sports.length) {
      const leagues = (sports[0] || {}).leagues || [];
      groups = leagues.length ? (leagues[0] || {}).groups || [] : [];
    } else {
      groups = payload.groups || [];
    }
  } catch {
    groups = [];
  }
  if (!groups.length) return [];
  const rows = flattenGroups(groups);
  if (!rows.length) return [];
  return normalize(rows);
}
function parse_athlete_overview(payload) {
  if (!payload) return [];
  const athlete = payload.athlete || {};
  const bio = {
    athlete_id: athlete.id,
    athlete_display_name: athlete.displayName,
    athlete_short_name: athlete.shortName,
    athlete_position: (athlete.position || {}).abbreviation,
    athlete_jersey: athlete.jersey,
    athlete_team_id: (athlete.team || {}).id,
    athlete_team_abbreviation: (athlete.team || {}).abbreviation
  };
  const statistics = payload.statistics || {};
  const splits = statistics.splits || [];
  const rows = [];
  for (const split of splits) {
    const labels = statistics.labels || split.labels || [];
    const names = statistics.names || split.names || labels;
    const stats = split.stats || [];
    const row = { ...bio };
    row.split_name = split.name || split.displayName;
    row.split_category = split.category;
    stats.forEach((val, i) => {
      const col = i < names.length ? snakeCase(names[i]) : `stat_${i}`;
      row[col] = val;
    });
    rows.push(row);
  }
  if (!rows.length) {
    return normalize([payload]);
  }
  return normalize(rows);
}
function parse_athlete_stats(payload) {
  if (!payload) return [];
  let categories = payload.categories || [];
  if (!categories.length) {
    const labels = payload.labels || [];
    const splits = payload.splits || [];
    if (labels.length && splits.length) {
      categories = [{ labels, splits, name: "default" }];
    }
  }
  if (!categories.length) {
    return normalize([payload]);
  }
  const rows = [];
  for (const cat of categories) {
    const catName = cat.name || cat.displayName || "";
    const labels = cat.labels || cat.names || [];
    const names = cat.names || labels;
    const splits = cat.splits || [];
    for (const split of splits) {
      const stats = split.stats || [];
      const row = {
        category: catName,
        split_name: split.name || split.displayName,
        split_category: split.category,
        split_value: split.value
      };
      stats.forEach((val, i) => {
        const col = i < names.length ? snakeCase(names[i]) : `stat_${i}`;
        row[col] = val;
      });
      rows.push(row);
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}
function parse_athlete_gamelog(payload) {
  if (!payload) return [];
  let seasonTypes = payload.seasonTypes || [];
  if (!seasonTypes.length) {
    const events = payload.events || [];
    if (events.length) {
      seasonTypes = [{ id: null, name: null, categories: [{ name: null, events }] }];
    }
  }
  const rows = [];
  for (const st of seasonTypes) {
    const stId = st.id;
    const stName = st.name || st.displayName;
    const categories = st.categories || [];
    for (const cat of categories) {
      const catName = cat.name || cat.displayName;
      const labels = cat.labels || cat.names || [];
      const names = cat.names || labels;
      const events = cat.events || [];
      for (const ev of events) {
        const eventRef = ev.eventId || ev.id || (ev.event || {}).id;
        const opp = ev.opponent || {};
        const row = {
          season_type_id: stId,
          season_type_name: stName,
          category: catName,
          event_id: eventRef,
          event_date: ev.date,
          home_away: ev.homeAway,
          score: ev.score,
          opponent_id: opp.id,
          opponent_abbreviation: opp.abbreviation,
          opponent_display_name: opp.displayName,
          game_result: ev.gameResult,
          game_processed: ev.gameProcessed
        };
        const stats = ev.stats || [];
        stats.forEach((val, i) => {
          const col = i < names.length ? snakeCase(names[i]) : `stat_${i}`;
          row[col] = val;
        });
        rows.push(row);
      }
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}
function parse_athlete_splits(payload) {
  if (!payload) return [];
  const categories = payload.categories || [];
  const rows = [];
  for (const cat of categories) {
    const catName = cat.name || cat.displayName || "";
    const labels = cat.labels || cat.names || [];
    const names = cat.names || labels;
    const splits = cat.splits || [];
    for (const split of splits) {
      const stats = split.stats || [];
      const row = {
        category: catName,
        split_name: split.name || split.displayName,
        split_abbreviation: split.abbreviation,
        split_category: split.category,
        split_value: split.value,
        split_description: split.description
      };
      stats.forEach((val, i) => {
        const col = i < names.length ? snakeCase(names[i]) : `stat_${i}`;
        row[col] = val;
      });
      rows.push(row);
    }
  }
  if (!rows.length) {
    return normalize([payload]);
  }
  return normalize(rows);
}
function parse_leaders(payload) {
  if (!payload) return [];
  const categories = payload.categories || [];
  const rows = [];
  for (const cat of categories) {
    const catName = cat.name || cat.displayName || "";
    const labels = cat.labels || cat.names || [];
    const names = cat.names || labels;
    const leaders = cat.leaders || [];
    for (const leader of leaders) {
      const athlete = leader.athlete || {};
      const team = leader.team || {};
      const row = {
        category: catName,
        rank: leader.rank,
        athlete_id: athlete.id,
        athlete_display_name: athlete.displayName,
        athlete_short_name: athlete.shortName,
        athlete_jersey: athlete.jersey,
        athlete_position: (athlete.position || {}).abbreviation,
        team_id: team.id,
        team_abbreviation: team.abbreviation,
        team_display_name: team.displayName
      };
      const stats = leader.stats || [];
      stats.forEach((val, i) => {
        let col;
        if (i < names.length) col = snakeCase(names[i]);
        else if (labels.length && i < labels.length) col = snakeCase(labels[i]);
        else col = `stat_${i}`;
        row[col] = val;
      });
      rows.push(row);
    }
  }
  if (!rows.length) {
    return normalize([payload]);
  }
  return normalize(rows);
}
function flattenScalarOneDeep(item) {
  const row = {};
  for (const [k, v] of Object.entries(item)) {
    if (isScalar(v)) {
      row[k] = v;
    } else if (isPlainObject14(v)) {
      for (const [k2, v2] of Object.entries(v)) {
        if (isScalar(v2)) row[`${k}_${k2}`] = v2;
      }
    }
  }
  return row;
}
function parse_coaches(payload) {
  if (!payload) return [];
  const items = payload.items || payload.coaches || [];
  if (!items.length) return [];
  const rows = items.map((item) => flattenScalarOneDeep(item));
  if (!rows.length) {
    return normalize(items);
  }
  return normalize(rows);
}
function parse_draft(payload) {
  if (!payload) return [];
  const rounds = payload.rounds || [];
  let allPicks = [];
  if (rounds.length) {
    for (const rnd of rounds) {
      const roundNum = rnd.number || rnd.round;
      const picks = rnd.picks || rnd.items || [];
      for (const pick of picks) {
        const p = { ...pick };
        if (p.round_number === void 0) p.round_number = roundNum;
        allPicks.push(p);
      }
    }
  } else {
    allPicks = payload.picks || payload.items || [];
  }
  if (!allPicks.length) return [];
  return normalize(allPicks);
}
function parse_event_competitor_roster(payload) {
  if (!payload) return [];
  const entries = payload.entries || payload.items || [];
  if (!entries.length) return [];
  const rows = [];
  for (const entry of entries) {
    const athlete = entry.athlete || entry;
    const row = flattenScalarOneDeep(athlete);
    for (const k of ["active", "starter", "didNotPlay", "ejected", "playingTime"]) {
      if (k in entry && !(k in row)) row[k] = entry[k];
    }
    rows.push(row);
  }
  if (!rows.length) {
    return normalize(entries);
  }
  return normalize(rows);
}
function parse_event_competitor_statistics(payload) {
  if (!payload) return [];
  let splits = payload.splits || [];
  if (!splits.length) {
    const cats = payload.categories || [];
    if (cats.length) splits = [{ name: null, categories: cats }];
  }
  const rows = [];
  for (const split of splits) {
    const splitName = split.name || split.displayName;
    const categories = split.categories || [];
    for (const cat of categories) {
      const catName = cat.name || cat.displayName;
      const stats = cat.stats || [];
      for (const stat of stats) {
        rows.push({
          split_name: splitName,
          category_name: catName,
          stat_name: stat.name,
          stat_abbreviation: stat.abbreviation,
          stat_value: stat.value,
          stat_display_value: stat.displayValue,
          stat_description: stat.description
        });
      }
    }
  }
  if (!rows.length) {
    return normalize([payload]);
  }
  return normalize(rows);
}
function parse_event_competitor_linescores(payload) {
  if (!payload) return [];
  const items = payload.items || payload.linescores || [];
  if (!items.length) return [];
  const rows = items.map((item, i) => ({
    period: i + 1,
    ...flattenScalarOneDeep(item)
  }));
  return normalize(rows);
}
function parse_event_plays(payload) {
  if (!payload) return [];
  const items = payload.items || payload.plays || [];
  if (!items.length) return [];
  const skip = /* @__PURE__ */ new Set(["participants", "athletesInvolved", "drive"]);
  const rows = [];
  for (const play of items) {
    const row = {};
    for (const [k, v] of Object.entries(play)) {
      if (skip.has(k)) continue;
      if (isScalar(v)) {
        row[k] = v;
      } else if (isPlainObject14(v)) {
        for (const [k2, v2] of Object.entries(v)) {
          if (isScalar(v2)) {
            row[`${k}_${k2}`] = v2;
          } else if (isPlainObject14(v2)) {
            for (const [k3, v3] of Object.entries(v2)) {
              if (isScalar(v3)) row[`${k}_${k2}_${k3}`] = v3;
            }
          }
        }
      } else if (Array.isArray(v)) {
        row[k] = String(v);
      }
    }
    rows.push(row);
  }
  if (!rows.length) {
    return normalize(items);
  }
  return normalize(rows);
}
var LIST_PAYLOAD_KEYS = ["items", "entries", "events", "athletes"];
function parse_items(payload) {
  if (!payload || !isPlainObject14(payload)) return [];
  let rows = null;
  for (const key of LIST_PAYLOAD_KEYS) {
    const candidate = payload[key];
    if (Array.isArray(candidate) && candidate.length) {
      rows = candidate;
      break;
    }
  }
  if (rows === null) return [];
  return normalize(rows);
}
function parse_team_schedule(payload) {
  if (!payload || !isPlainObject14(payload)) return [];
  const events = payload.events;
  if (!Array.isArray(events) || !events.length) return [];
  return normalize(events);
}
function parse_team_roster(payload) {
  if (!payload || !isPlainObject14(payload)) return [];
  const athletes = payload.athletes;
  if (!Array.isArray(athletes) || !athletes.length) return [];
  const first = athletes[0] || {};
  const isGrouped = isPlainObject14(first) && "position" in first && Array.isArray(first.items);
  if (isGrouped) {
    const rows = [];
    for (const group of athletes) {
      if (!isPlainObject14(group)) continue;
      const groupName = group.position;
      for (const player of group.items || []) {
        if (!isPlainObject14(player)) continue;
        rows.push({ position_group: groupName, ...player });
      }
    }
    if (!rows.length) return [];
    return normalize(rows);
  }
  return normalize(athletes);
}
function parse_news(payload) {
  if (!payload || !isPlainObject14(payload)) return [];
  const articles = payload.articles;
  if (!Array.isArray(articles) || !articles.length) return [];
  return normalize(articles);
}
function parse_injuries(payload) {
  if (!payload || !isPlainObject14(payload)) return [];
  const teams = payload.injuries;
  if (!Array.isArray(teams) || !teams.length) return [];
  return normalize(teams);
}
function singleRow(payloadDict) {
  if (!isPlainObject14(payloadDict) || Object.keys(payloadDict).length === 0) return [];
  return normalize([payloadDict]);
}
function rowPerItem(items) {
  if (!Array.isArray(items) || !items.length) return [];
  return normalize(items);
}
function parse_summary_boxscore_player(payload) {
  if (!isPlainObject14(payload)) return [];
  const bs = payload.boxscore || {};
  const teams = bs.players || [];
  if (!Array.isArray(teams) || !teams.length) return [];
  const rows = [];
  for (const entry of teams) {
    const team = (entry || {}).team || {};
    const teamRowBase = {
      team_id: team.id,
      team_abbreviation: team.abbreviation,
      team_display_name: team.displayName,
      team_location: team.location
    };
    for (const statBlock of entry.statistics || []) {
      const keys = statBlock.keys || statBlock.names || [];
      for (const athleteRow of statBlock.athletes || []) {
        const ath = athleteRow.athlete || {};
        const row = {
          ...teamRowBase,
          athlete_id: ath.id,
          athlete_display_name: ath.displayName,
          athlete_short_name: ath.shortName,
          athlete_jersey: ath.jersey,
          athlete_position: (ath.position || {}).abbreviation,
          starter: athleteRow.starter,
          active: athleteRow.active,
          did_not_play: athleteRow.didNotPlay,
          ejected: athleteRow.ejected,
          reason: athleteRow.reason
        };
        const stats = athleteRow.stats || [];
        const n = Math.min(keys.length, stats.length);
        for (let i = 0; i < n; i++) row[keys[i]] = stats[i];
        rows.push(row);
      }
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}
function parse_summary_boxscore_team(payload) {
  if (!isPlainObject14(payload)) return [];
  const bs = payload.boxscore || {};
  const teams = bs.teams || [];
  if (!Array.isArray(teams) || !teams.length) return [];
  const rows = [];
  for (const entry of teams) {
    const team = (entry || {}).team || {};
    const teamRowBase = {
      team_id: team.id,
      team_abbreviation: team.abbreviation,
      team_display_name: team.displayName,
      home_away: entry.homeAway,
      display_order: entry.displayOrder
    };
    for (const stat of entry.statistics || []) {
      rows.push({
        ...teamRowBase,
        stat_name: stat.name,
        stat_label: stat.label,
        stat_display_value: stat.displayValue,
        stat_value: stat.value
      });
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}
function parse_summary_plays(payload) {
  if (!isPlainObject14(payload)) return [];
  const plays = payload.plays;
  if (!Array.isArray(plays) || !plays.length) return [];
  return normalize(plays);
}
function parse_summary_winprobability(payload) {
  if (!isPlainObject14(payload)) return [];
  const wp = payload.winprobability;
  if (!Array.isArray(wp) || !wp.length) return [];
  return normalize(wp);
}
function parse_summary_leaders(payload) {
  if (!isPlainObject14(payload)) return [];
  const teams = payload.leaders;
  if (!Array.isArray(teams) || !teams.length) return [];
  const rows = [];
  for (const teamEntry of teams) {
    const team = (teamEntry || {}).team || {};
    const teamRowBase = {
      team_id: team.id,
      team_abbreviation: team.abbreviation
    };
    for (const category of teamEntry.leaders || []) {
      const catName = category.name;
      const catDisplay = category.displayName;
      for (const leader of category.leaders || []) {
        const ath = leader.athlete || {};
        rows.push({
          ...teamRowBase,
          category_name: catName,
          category_display_name: catDisplay,
          athlete_id: ath.id,
          athlete_display_name: ath.displayName,
          athlete_position: (ath.position || {}).abbreviation,
          value: leader.value,
          display_value: leader.displayValue,
          main_stat: leader.mainStat,
          summary: leader.summary
        });
      }
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}
function parse_summary_game_info(payload) {
  const info = (payload || {}).gameInfo || {};
  if (!Object.keys(info).length) return [];
  const flat = { attendance: info.attendance };
  const venue = info.venue || {};
  for (const [k, v] of Object.entries(venue)) {
    if (isScalar(v)) {
      flat[`venue_${k}`] = v;
    } else if (isPlainObject14(v)) {
      for (const [k2, v2] of Object.entries(v)) {
        if (isScalar(v2)) flat[`venue_${k}_${k2}`] = v2;
      }
    }
  }
  return singleRow(flat);
}
function parse_summary_officials(payload) {
  const officials = ((payload || {}).gameInfo || {}).officials;
  return rowPerItem(officials);
}
function parse_summary_header(payload) {
  return singleRow(isPlainObject14(payload) ? payload.header : null);
}
function parse_summary_season_series(payload) {
  return rowPerItem((payload || {}).seasonseries);
}
function parse_summary_against_the_spread(payload) {
  const teams = (payload || {}).againstTheSpread;
  if (!Array.isArray(teams) || !teams.length) return [];
  const rows = [];
  for (const entry of teams) {
    const team = (entry || {}).team || {};
    const teamBase = {
      team_id: team.id,
      team_abbreviation: team.abbreviation,
      team_display_name: team.displayName
    };
    for (const rec2 of entry.records || []) {
      const row = { ...teamBase };
      for (const [k, v] of Object.entries(rec2 || {})) {
        if (isScalar(v)) {
          row[k] = v;
        } else if (isPlainObject14(v)) {
          for (const [k2, v2] of Object.entries(v)) {
            if (isScalar(v2)) row[`${k}_${k2}`] = v2;
          }
        }
      }
      rows.push(row);
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}
function parse_summary_standings(payload) {
  const st = (payload || {}).standings || {};
  const groups = st.groups || [];
  if (!Array.isArray(groups) || !groups.length) return [];
  const rows = [];
  for (const grp of groups) {
    if (!isPlainObject14(grp)) continue;
    const grpBase = {
      group_header: grp.header,
      conference_header: grp.conferenceHeader,
      division_header: grp.divisionHeader
    };
    for (const entry of (grp.standings || {}).entries || []) {
      const row = { ...grpBase };
      const teamField = entry.team;
      row.team_id = entry.id;
      row.team_uid = entry.uid;
      row.team_location = typeof teamField === "string" ? teamField : null;
      if (isPlainObject14(teamField)) {
        row.team_abbreviation = teamField.abbreviation;
        row.team_display_name = teamField.displayName;
      }
      for (const stat of entry.stats || []) {
        const key = stat.name || stat.type;
        if (key) row[key] = stat.displayValue !== void 0 ? stat.displayValue : stat.value;
      }
      rows.push(row);
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}
function parse_summary_broadcasts(payload) {
  return rowPerItem((payload || {}).broadcasts);
}
function parse_summary_format(payload) {
  return singleRow(isPlainObject14(payload) ? payload.format : null);
}
function parse_summary_pickcenter(payload) {
  return rowPerItem((payload || {}).pickcenter);
}
function parse_summary_odds(payload) {
  return rowPerItem((payload || {}).odds);
}
function parse_summary_article(payload) {
  return singleRow(isPlainObject14(payload) ? payload.article : null);
}
function parse_summary_injuries(payload) {
  return rowPerItem((payload || {}).injuries);
}
function parse_summary_news(payload) {
  const news = (payload || {}).news || {};
  return rowPerItem(news.articles);
}
function parse_fpi(payload) {
  const teams = (payload || {}).teams;
  if (!Array.isArray(teams) || teams.length === 0) return [];
  const namesByCat = {};
  for (const c of (payload || {}).categories || []) namesByCat[c?.name] = c?.names || [];
  const rows = teams.map((entry) => {
    const tm = entry?.team || {};
    const row = {
      team_id: tm.id,
      team_uid: tm.uid,
      team_abbreviation: tm.abbreviation,
      team_display_name: tm.displayName,
      team_short_display_name: tm.shortDisplayName,
      team_nickname: tm.nickname
    };
    for (const cat of entry?.categories || []) {
      const names = cat.names || namesByCat[cat.name] || [];
      const values = cat.values || [];
      const n = Math.min(names.length, values.length);
      for (let i = 0; i < n; i++) {
        let key = pyUnderscore(String(names[i]));
        if (key in row) key = `${key}_${pyUnderscore(String(cat.name ?? "x"))}`;
        row[key] = values[i];
      }
    }
    row.season = payload.requestedSeason;
    return row;
  });
  return normalize(rows);
}
function parse_single_entity(payload) {
  return singleRow(isPlainObject14(payload) ? payload : null);
}
function parse_summary_drives(payload) {
  const drives = (payload || {}).drives || {};
  const previous = isPlainObject14(drives) ? drives.previous : null;
  return rowPerItem(previous);
}
function parse_summary_scoring_plays(payload) {
  return rowPerItem((payload || {}).scoringPlays);
}
function parse_summary_drive_plays(payload) {
  const drives = (payload || {}).drives || {};
  const previous = isPlainObject14(drives) ? drives.previous : null;
  if (!Array.isArray(previous) || !previous.length) return [];
  const rows = [];
  previous.forEach((drive, idx) => {
    if (!isPlainObject14(drive)) return;
    const driveId = drive.id;
    const driveSeq = idx + 1;
    for (const play of drive.plays || []) {
      if (!isPlainObject14(play)) continue;
      rows.push({ drive_id: driveId, drive_sequence: driveSeq, ...play });
    }
  });
  return rowPerItem(rows);
}
var SUMMARY_SECTION_PARSERS = {
  boxscore_player: parse_summary_boxscore_player,
  boxscore_team: parse_summary_boxscore_team,
  plays: parse_summary_plays,
  winprobability: parse_summary_winprobability,
  leaders: parse_summary_leaders,
  game_info: parse_summary_game_info,
  officials: parse_summary_officials,
  header: parse_summary_header,
  season_series: parse_summary_season_series,
  against_the_spread: parse_summary_against_the_spread,
  standings: parse_summary_standings,
  broadcasts: parse_summary_broadcasts,
  format: parse_summary_format,
  pickcenter: parse_summary_pickcenter,
  odds: parse_summary_odds,
  article: parse_summary_article,
  injuries: parse_summary_injuries,
  news: parse_summary_news,
  // NFL / CFB only — return zero-row frames for other sports
  drives: parse_summary_drives,
  drive_plays: parse_summary_drive_plays,
  scoring_plays: parse_summary_scoring_plays
};
function parse_summary(payload, section) {
  if (section !== void 0) {
    if (!(section in SUMMARY_SECTION_PARSERS)) {
      const valid = Object.keys(SUMMARY_SECTION_PARSERS).sort();
      throw new Error(
        `Unknown summary section '${section}'. Choose one of ${JSON.stringify(
          valid
        )} or omit section for the full dict.`
      );
    }
    return SUMMARY_SECTION_PARSERS[section](payload);
  }
  const out = {};
  for (const [name, fn] of Object.entries(SUMMARY_SECTION_PARSERS)) {
    out[name] = fn(payload);
  }
  return out;
}
function cdnContent(payload) {
  const content = isPlainObject14(payload) ? payload.content : void 0;
  return isPlainObject14(content) ? content : {};
}
function parse_cdn_game(payload, section) {
  const gp = isPlainObject14(payload) ? payload.gamepackageJSON : void 0;
  return parse_summary(isPlainObject14(gp) ? gp : {}, section);
}
function parse_cdn_scoreboard(payload) {
  const sb = cdnContent(payload).sbData;
  return parse_scoreboard(isPlainObject14(sb) ? sb : {});
}
function parse_cdn_schedule(payload) {
  const sch = cdnContent(payload).schedule;
  const days = isPlainObject14(sch) ? Object.values(sch) : [];
  const games = days.filter(isPlainObject14).flatMap((day) => Array.isArray(day.games) ? day.games : []).filter(isPlainObject14);
  return parse_scoreboard({ events: games });
}
var CDN_RANKINGS_LEAD = ["poll_id", "poll_name", "poll_short_name", "ranked", "team_id"];
function parse_cdn_rankings(payload) {
  const data = cdnContent(payload).data;
  const polls2 = isPlainObject14(data) ? data.rankings : void 0;
  const rows = [];
  for (const poll of Array.isArray(polls2) ? polls2 : []) {
    if (!isPlainObject14(poll)) continue;
    const head = { poll_id: poll.id, poll_name: poll.name, poll_short_name: poll.short_name };
    for (const [ranked, key] of [[true, "ranks"], [false, "others"]]) {
      for (const entry of Array.isArray(poll[key]) ? poll[key] : []) {
        if (isPlainObject14(entry)) rows.push({ ...head, ranked, ...entry });
      }
    }
  }
  if (!rows.length) return [];
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const rest = cols.map(pyUnderscore).filter((c) => !CDN_RANKINGS_LEAD.includes(c));
  const tidy = rows.map((r) => {
    const snaked = {};
    for (const c of cols) snaked[pyUnderscore(c)] = r[c] ?? null;
    const url = snaked.team_url;
    const m = typeof url === "string" ? /\/id\/(\d+)/.exec(url) : null;
    const out = {};
    for (const c of CDN_RANKINGS_LEAD) out[c] = c === "team_id" ? m ? m[1] : null : snaked[c] ?? null;
    for (const c of rest) out[c] = snaked[c];
    return out;
  });
  return idColumnsToStrings(tidy);
}
function intOrNull(v) {
  const s = typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : "";
  return /^-?\d+$/.test(s) ? Number(s) : null;
}
function rec(v) {
  return isPlainObject14(v) ? v : {};
}
function parse_rankings(payload) {
  const polls2 = rec(payload).rankings;
  const rows = [];
  for (const p of Array.isArray(polls2) ? polls2 : []) {
    if (!isPlainObject14(p)) continue;
    const poll = rec(p);
    const season = rec(poll.season);
    const occurrence = rec(poll.occurrence);
    const head = {
      poll_id: poll.id ?? null,
      poll_name: poll.name ?? null,
      poll_short_name: poll.shortName ?? null,
      poll_type: poll.type ?? null,
      season: season.year ?? null,
      season_type: rec(season.type).type ?? null,
      week: intOrNull(occurrence.value),
      week_display: occurrence.displayValue ?? null,
      poll_date: poll.date ?? null
    };
    for (const [ranked, key] of [[true, "ranks"], [false, "others"]]) {
      const entries = poll[key];
      for (const e of Array.isArray(entries) ? entries : []) {
        if (!isPlainObject14(e)) continue;
        const entry = rec(e);
        const team = rec(entry.team);
        rows.push({
          ...head,
          ranked,
          team_id: team.id ?? null,
          rank: ranked ? entry.current ?? null : null,
          previous_rank: entry.previous ?? null,
          points: entry.points ?? null,
          first_place_votes: entry.firstPlaceVotes ?? null,
          trend: entry.trend ?? null,
          record_summary: entry.recordSummary ?? null,
          team_uid: team.uid ?? null,
          team_location: team.location ?? null,
          team_name: team.name ?? null,
          team_nickname: team.nickname ?? null,
          team_abbreviation: team.abbreviation ?? null,
          // ESPN ships the literal string "NULL" for some teams with no color.
          team_color: team.color === "NULL" ? null : team.color ?? null,
          team_logo: team.logo ?? null,
          last_updated: entry.lastUpdated ?? null
        });
      }
    }
  }
  return idColumnsToStrings(rows);
}
var ESPN_ENDPOINT_PARSERS = {
  // Site v2 (rich nested)
  scoreboard: parse_scoreboard,
  teams_site: parse_teams,
  // summary is the dispatcher — returns an object of sub-frames by default
  summary: parse_summary,
  // Site v2 alt + Core v2 standings
  standings: parse_standings,
  standings_core: parse_standings,
  // Groups / conferences
  conferences: parse_groups,
  // Web v3 athlete deep dives
  athlete_overview: parse_athlete_overview,
  athlete_stats: parse_athlete_stats,
  athlete_gamelog: parse_athlete_gamelog,
  athlete_splits: parse_athlete_splits,
  leaders: parse_leaders,
  // Core v2 catalog (one-shot)
  teams_core: parse_teams,
  coaches: parse_coaches,
  season_coaches: parse_coaches,
  season_draft: parse_draft,
  // Event-competitor surface
  event_competitor_roster: parse_event_competitor_roster,
  event_competitor_statistics: parse_event_competitor_statistics,
  event_competitor_linescores: parse_event_competitor_linescores,
  event_plays: parse_event_plays,
  // Team-scoped Site v2
  team_schedule: parse_team_schedule,
  team_roster: parse_team_roster,
  // News (league-wide + team + athlete scoped)
  news: parse_news,
  team_news: parse_news,
  athlete_news: parse_news,
  // Injuries (league-wide + team + athlete scoped)
  injuries: parse_injuries,
  team_injuries: parse_injuries,
  athlete_injuries: parse_injuries,
  // Core v2 paginated list endpoints — parse_items returns a frame of raw items.
  venues: parse_items,
  franchises: parse_items,
  events: parse_items,
  athletes_index: parse_items,
  seasons: parse_items,
  season_types: parse_items,
  season_groups: parse_items,
  season_group_teams: parse_items,
  season_teams: parse_items,
  season_athletes: parse_items,
  season_weeks: parse_items,
  season_week_events: parse_items,
  season_awards: parse_items,
  season_recruits: parse_items,
  season_futures: parse_items,
  season_freeagents: parse_items,
  season_draft_round_picks: parse_items,
  awards: parse_items,
  tournaments: parse_items,
  positions: parse_items,
  transactions: parse_items,
  team_transactions: parse_items,
  team_record: parse_items,
  team_history: parse_items,
  athlete_career_stats: parse_items,
  athlete_statisticslog: parse_items,
  athlete_eventlog: parse_items,
  athlete_contracts: parse_items,
  athlete_awards: parse_items,
  athlete_seasons: parse_items,
  athlete_records: parse_items,
  // ---- Site v2 list payloads (calendar variants, NCAA / football extras) ----
  calendar: parse_items,
  calendar_offseason: parse_items,
  calendar_regular_season: parse_items,
  calendar_postseason: parse_items,
  calendar_ondays: parse_items,
  draft: parse_items,
  statistics_league: parse_items,
  team_depthcharts: parse_items,
  team_leaders: parse_items,
  rankings: parse_rankings,
  season_qbr: parse_items,
  season_qbr_week: parse_items,
  athlete_notes: parse_items,
  league_notes: parse_items,
  talentpicks: parse_items,
  // ---- Core v2 list payloads (more) ----
  leaders_core: parse_items,
  // ESPN fitt-v3 (FPI) team-season table.
  fpi: parse_fpi,
  season_powerindex: parse_items,
  season_powerindex_leaders: parse_items,
  season_type_corrections: parse_items,
  season_type_leaders: parse_items,
  season_week_rankings: parse_items,
  season_group_children: parse_items,
  // sdv-py names parse_weekly_powerindex here (not ported); the list parser is
  // the Core v2 fallback until it is.
  season_week_powerindex: parse_items,
  // NCAA recruiting (Core v2 list payloads).
  recruiting_years: parse_items,
  recruiting_athletes: parse_items,
  recruiting_rankings: parse_items,
  // ---- Event-scoped list payloads ----
  event_broadcasts: parse_items,
  event_competitors: parse_items,
  event_competitor_leaders: parse_items,
  event_leaders: parse_items,
  event_odds: parse_items,
  event_officials: parse_items,
  event_play_personnel: parse_items,
  event_probabilities: parse_items,
  event_propbets: parse_items,
  event_scoringplays: parse_items,
  // ---- Core v2 single-entity payloads (one row per call) ----
  team: parse_single_entity,
  team_core: parse_single_entity,
  venue: parse_single_entity,
  franchise: parse_single_entity,
  coach: parse_single_entity,
  coach_record: parse_single_entity,
  coach_season: parse_single_entity,
  position: parse_single_entity,
  award: parse_single_entity,
  league_root: parse_single_entity,
  athlete_core: parse_single_entity,
  athlete_info: parse_single_entity,
  athlete_bio: parse_single_entity,
  athlete_vs_athlete: parse_single_entity,
  athlete_hotzones: parse_single_entity,
  season_pointer: parse_single_entity,
  season_info: parse_single_entity,
  season_type: parse_single_entity,
  season_group: parse_single_entity,
  season_week: parse_single_entity,
  season_team: parse_single_entity,
  // ---- Event-scoped single-entity payloads ----
  event: parse_single_entity,
  event_competition: parse_single_entity,
  event_competitor: parse_single_entity,
  event_competitor_record: parse_single_entity,
  event_play: parse_single_entity,
  event_situation: parse_single_entity,
  event_status: parse_single_entity,
  event_predictor: parse_single_entity,
  event_powerindex: parse_single_entity,
  event_official_detail: parse_single_entity,
  // ---- ESPN CDN page payloads (cdn.espn.com/core) ----
  cdn_playbyplay: parse_cdn_game,
  cdn_boxscore: parse_cdn_game,
  cdn_schedule: parse_cdn_schedule,
  cdn_scoreboard: parse_cdn_scoreboard,
  cdn_rankings: parse_cdn_rankings
};
var SUMMARY_DISPATCHERS = /* @__PURE__ */ new Set([parse_summary, parse_cdn_game]);
var SECTIONED_ENDPOINTS = new Set(
  Object.keys(ESPN_ENDPOINT_PARSERS).filter((k) => SUMMARY_DISPATCHERS.has(ESPN_ENDPOINT_PARSERS[k]))
);
function parserForEndpoint(short) {
  return ESPN_ENDPOINT_PARSERS[short];
}

// src/parsers/browser.ts
function parseEndpoint(kind, key, raw, section) {
  if (kind === "espn") {
    const fn2 = parserForEndpoint(key);
    if (!fn2) return null;
    if (SECTIONED_ENDPOINTS.has(key)) return fn2(raw, section);
    return fn2(raw);
  }
  const fn = parserFor(key);
  if (!fn) return null;
  return key in MULTI_TABLE_SECTIONS ? fn(raw, section) : fn(raw);
}
export {
  ESPN_ENDPOINT_PARSERS,
  MULTI_TABLE_SECTIONS,
  PARSERS,
  SECTIONED_ENDPOINTS,
  SUMMARY_SECTION_PARSERS,
  normalize,
  parseEndpoint,
  parse_asa_goals_added_tables,
  parse_mls_match_tables,
  parse_mls_standings_tables,
  parse_nfl_pro_stats,
  parse_nwsl_lineups_tables,
  parse_pff_matrix,
  parse_pff_player_detail,
  parse_pff_report,
  parse_pff_v2_table,
  parse_summary,
  parserFor,
  parserForEndpoint,
  snakeCase
};
/*! Bundled license information:

papaparse/papaparse.min.js:
  (* @license
  Papa Parse
  v5.7.0
  https://github.com/mholt/PapaParse
  License: MIT
  *)
*/
