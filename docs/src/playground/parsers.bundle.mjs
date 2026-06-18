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
      var d, s = !n.document && !!n.postMessage, a = n.IS_PAPA_WORKER || false, o = {}, h = 0, v = {};
      function u(e) {
        this._handle = null, this._finished = false, this._completed = false, this._halted = false, this._input = null, this._baseIndex = 0, this._partialLine = "", this._rowCount = 0, this._start = 0, this._nextChunk = null, this.isFirstChunk = true, this._completeResults = { data: [], errors: [], meta: {} }, function(e2) {
          var t = b(e2);
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
            if (a) n.postMessage({ results: r2, workerId: v.WORKER_ID, finished: i2 });
            else if (U(this._config.chunk) && !e2) {
              if (this._config.chunk(r2, this._handle), this._handle.paused() || this._handle.aborted()) return void (this._halted = true);
              this._completeResults = r2 = void 0;
            }
            return this._config.step || this._config.chunk || (this._completeResults.data = this._completeResults.data.concat(r2.data), this._completeResults.errors = this._completeResults.errors.concat(r2.errors), this._completeResults.meta = r2.meta), this._completed || !i2 || !U(this._config.complete) || r2 && r2.meta.aborted || (this._config.complete(this._completeResults, this._input), this._completed = true), i2 || r2 && r2.meta.paused || this._nextChunk(), r2;
          }
          this._halted = true;
        }, this._sendError = function(e2) {
          U(this._config.error) ? this._config.error(e2) : a && this._config.error && n.postMessage({ workerId: v.WORKER_ID, error: e2, finished: false });
        };
      }
      function f(e) {
        var r2;
        (e = e || {}).chunkSize || (e.chunkSize = v.RemoteChunkSize), u.call(this, e), this._nextChunk = s ? function() {
          this._readChunk(), this._chunkLoaded();
        } : function() {
          this._readChunk();
        }, this.stream = function(e2) {
          this._input = e2, this._nextChunk();
        }, this._readChunk = function() {
          if (this._finished) this._chunkLoaded();
          else {
            if (r2 = new XMLHttpRequest(), this._config.withCredentials && (r2.withCredentials = this._config.withCredentials), s || (r2.onload = y(this._chunkLoaded, this), r2.onerror = y(this._chunkError, this)), r2.open(this._config.downloadRequestBody ? "POST" : "GET", this._input, !s), this._config.downloadRequestHeaders) {
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
        };
      }
      function l(e) {
        (e = e || {}).chunkSize || (e.chunkSize = v.LocalChunkSize), u.call(this, e);
        var i2, r2, n2 = "undefined" != typeof FileReader;
        this.stream = function(e2) {
          this._input = e2, r2 = e2.slice || e2.webkitSlice || e2.mozSlice, n2 ? ((i2 = new FileReader()).onload = y(this._chunkLoaded, this), i2.onerror = y(this._chunkError, this)) : i2 = new FileReaderSync(), this._nextChunk();
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
      function c(e) {
        var i2;
        u.call(this, e = e || {}), this.stream = function(e2) {
          return i2 = e2, this._nextChunk();
        }, this._nextChunk = function() {
          var e2, t;
          if (!this._finished) return e2 = this._config.chunkSize, i2 = e2 ? (t = i2.substring(0, e2), i2.substring(e2)) : (t = i2, ""), this._finished = !i2, this.parseChunk(t);
        };
      }
      function p(e) {
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
        }, this._streamData = y(function(e2) {
          try {
            t.push("string" == typeof e2 ? e2 : e2.toString(this._config.encoding)), i2 && (i2 = false, this._checkIsFinished(), this.parseChunk(t.shift()));
          } catch (e3) {
            this._streamError(e3);
          }
        }, this), this._streamError = y(function(e2) {
          this._streamCleanUp(), this._sendError(e2);
        }, this), this._streamEnd = y(function() {
          this._streamCleanUp(), r2 = true, this._streamData("");
        }, this), this._streamCleanUp = y(function() {
          this._input.removeListener("data", this._streamData), this._input.removeListener("end", this._streamEnd), this._input.removeListener("error", this._streamError);
        }, this);
      }
      function i(m2) {
        var n2, s2, a2, t, o2 = Math.pow(2, 53), h2 = -o2, u2 = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/, d2 = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/, i2 = this, r2 = 0, f2 = 0, l2 = false, e = false, c2 = [], p2 = { data: [], errors: [], meta: {} };
        function y2(e2) {
          return "greedy" === m2.skipEmptyLines ? "" === e2.join("").trim() : 1 === e2.length && 0 === e2[0].length;
        }
        function g2() {
          if (p2 && a2 && (k("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '" + v.DefaultDelimiter + "'"), a2 = false), m2.skipEmptyLines && (p2.data = p2.data.filter(function(e3) {
            return !y2(e3);
          })), _2()) {
            let t3 = function(e3, t4) {
              U(m2.transformHeader) && (e3 = m2.transformHeader(e3, t4)), c2.push(e3);
            };
            var t2 = t3;
            if (p2) if (Array.isArray(p2.data[0])) {
              for (var e2 = 0; _2() && e2 < p2.data.length; e2++) p2.data[e2].forEach(t3);
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
            return m2.header && (r4 > c2.length ? k("FieldMismatch", "TooManyFields", "Too many fields: expected " + c2.length + " fields but parsed " + r4, f2 + t3) : r4 < c2.length && k("FieldMismatch", "TooFewFields", "Too few fields: expected " + c2.length + " fields but parsed " + r4, f2 + t3)), i4;
          }
          var r3;
          p2 && (m2.header || m2.dynamicTyping || m2.transform) && (r3 = 1, !p2.data.length || Array.isArray(p2.data[0]) ? (p2.data = p2.data.map(i3), r3 = p2.data.length) : p2.data = i3(p2.data, 0), m2.header && p2.meta && (p2.meta.fields = c2), f2 += r3);
        }
        function _2() {
          return m2.header && 0 === c2.length;
        }
        function k(e2, t2, i3, r3) {
          e2 = { type: e2, code: t2, message: i3 };
          void 0 !== r3 && (e2.row = r3), p2.errors.push(e2);
        }
        U(m2.step) && (t = m2.step, m2.step = function(e2) {
          p2 = e2, _2() ? g2() : (g2(), 0 !== p2.data.length && (r2 += e2.data.length, m2.preview && r2 > m2.preview ? s2.abort() : (p2.data = p2.data[0], t(p2, i2))));
        }), this.parse = function(e2, t2, i3) {
          var r3 = m2.quoteChar || '"', r3 = (m2.newline || (m2.newline = this.guessLineEndings(e2, r3)), a2 = false, m2.delimiter ? U(m2.delimiter) && (m2.delimiter = m2.delimiter(e2), p2.meta.delimiter = m2.delimiter) : ((r3 = ((e3, t3, i4, r4, n3) => {
            var s3, a3, o3, h3;
            n3 = n3 || [",", "	", "|", ";", v.RECORD_SEP, v.UNIT_SEP];
            for (var u3 = 0; u3 < n3.length; u3++) {
              for (var d3, f3 = n3[u3], l3 = 0, c3 = 0, p3 = 0, g3 = (o3 = void 0, new E({ comments: r4, delimiter: f3, newline: t3, preview: 10 }).parse(e3)), _3 = 0; _3 < g3.data.length; _3++) i4 && y2(g3.data[_3]) ? p3++ : (d3 = g3.data[_3].length, c3 += d3, void 0 === o3 ? o3 = d3 : 0 < d3 && (l3 += Math.abs(d3 - o3), o3 = d3));
              0 < g3.data.length && (c3 /= g3.data.length - p3), (void 0 === a3 || l3 <= a3) && (void 0 === h3 || h3 < c3) && 1.99 < c3 && (a3 = l3, s3 = f3, h3 = c3);
            }
            return { successful: !!(m2.delimiter = s3), bestDelimiter: s3 };
          })(e2, m2.newline, m2.skipEmptyLines, m2.comments, m2.delimitersToGuess)).successful ? m2.delimiter = r3.bestDelimiter : (a2 = true, m2.delimiter = v.DefaultDelimiter), p2.meta.delimiter = m2.delimiter), b(m2));
          return m2.preview && m2.header && r3.preview++, n2 = e2, s2 = new E(r3), p2 = s2.parse(n2, t2, i3), g2(), l2 ? { meta: { paused: true } } : p2 || { meta: { paused: false } };
        }, this.paused = function() {
          return l2;
        }, this.pause = function() {
          l2 = true, s2.abort(), n2 = U(m2.chunk) ? "" : n2.substring(s2.getCharIndex());
        }, this.resume = function() {
          i2.streamer._halted ? (l2 = false, i2.streamer.parseChunk(n2, true)) : setTimeout(i2.resume, 3);
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
        var S = (C = C || {}).delimiter, O = C.newline, x = C.comments, I = C.step, A = C.preview, T = C.fastMode, D = null, L = false, F = null == C.quoteChar ? '"' : C.quoteChar, j = F;
        if (void 0 !== C.escapeChar && (j = C.escapeChar), ("string" != typeof S || -1 < v.BAD_DELIMITERS.indexOf(S)) && (S = ","), x === S) throw new Error("Comment character same as delimiter");
        true === x ? x = "#" : ("string" != typeof x || -1 < v.BAD_DELIMITERS.indexOf(x)) && (x = false), "\n" !== O && "\r" !== O && "\r\n" !== O && (O = "\n");
        var z = 0, M = false;
        this.parse = function(i2, t, r2) {
          if ("string" != typeof i2) throw new Error("Input must be a string");
          var n2 = i2.length, e = S.length, s2 = O.length, a2 = x.length, o2 = U(I), h2 = [], u2 = [], d2 = [], f2 = z = 0;
          if (!i2) return w();
          if (T || false !== T && -1 === i2.indexOf(F)) {
            for (var l2 = i2.split(O), c2 = 0; c2 < l2.length; c2++) {
              if (d2 = l2[c2], z += d2.length, c2 !== l2.length - 1) z += O.length;
              else if (r2) return w();
              if (!x || d2.substring(0, a2) !== x) {
                if (o2) {
                  if (h2 = [], k(d2.split(S)), R(), M) return w();
                } else k(d2.split(S));
                if (A && A <= c2) return h2 = h2.slice(0, A), w(true);
              }
            }
            return w();
          }
          for (var p2 = i2.indexOf(S, z), g2 = i2.indexOf(O, z), _2 = new RegExp(P(j) + P(F), "g"), m2 = i2.indexOf(F, z); ; ) if (i2[z] === F) for (m2 = z, z++; ; ) {
            if (-1 === (m2 = i2.indexOf(F, m2 + 1))) return r2 || u2.push({ type: "Quotes", code: "MissingQuotes", message: "Quoted field unterminated", row: h2.length, index: z }), E2();
            if (m2 === n2 - 1) return E2(i2.substring(z, m2).replace(_2, F));
            if (F === j && i2[m2 + 1] === j) m2++;
            else if (F === j || 0 === m2 || i2[m2 - 1] !== j) {
              -1 !== p2 && p2 < m2 + 1 && (p2 = i2.indexOf(S, m2 + 1));
              var y2 = v2(-1 === (g2 = -1 !== g2 && g2 < m2 + 1 ? i2.indexOf(O, m2 + 1) : g2) ? p2 : Math.min(p2, g2));
              if (i2.substr(m2 + 1 + y2, e) === S) {
                d2.push(i2.substring(z, m2).replace(_2, F)), i2[z = m2 + 1 + y2 + e] !== F && (m2 = i2.indexOf(F, z)), p2 = i2.indexOf(S, z), g2 = i2.indexOf(O, z);
                break;
              }
              y2 = v2(g2);
              if (i2.substring(m2 + 1 + y2, m2 + 1 + y2 + s2) === O) {
                if (d2.push(i2.substring(z, m2).replace(_2, F)), b2(m2 + 1 + y2 + s2), p2 = i2.indexOf(S, z), m2 = i2.indexOf(F, z), o2 && (R(), M)) return w();
                if (A && h2.length >= A) return w(true);
                break;
              }
              u2.push({ type: "Quotes", code: "InvalidQuotes", message: "Trailing quote on quoted field is malformed", row: h2.length, index: z }), m2++;
            }
          }
          else if (x && 0 === d2.length && i2.substring(z, z + a2) === x) {
            if (-1 === g2) return w();
            z = g2 + s2, g2 = i2.indexOf(O, z), p2 = i2.indexOf(S, z);
          } else if (-1 !== p2 && (p2 < g2 || -1 === g2)) d2.push(i2.substring(z, p2)), z = p2 + e, p2 = i2.indexOf(S, z);
          else {
            if (-1 === g2) break;
            if (d2.push(i2.substring(z, g2)), b2(g2 + s2), o2 && (R(), M)) return w();
            if (A && h2.length >= A) return w(true);
          }
          return E2();
          function k(e2) {
            h2.push(e2), f2 = z;
          }
          function v2(e2) {
            var t2 = 0;
            return t2 = -1 !== e2 && (e2 = i2.substring(m2 + 1, e2)) && "" === e2.trim() ? e2.length : t2;
          }
          function E2(e2) {
            return r2 || (void 0 === e2 && (e2 = i2.substring(z)), d2.push(e2), z = n2, k(d2), o2 && R()), w();
          }
          function b2(e2) {
            z = e2, k(d2), d2 = [], g2 = i2.indexOf(O, z);
          }
          function w(e2) {
            if (C.header && !t && h2.length && !L) {
              var s3 = h2[0], a3 = /* @__PURE__ */ Object.create(null), o3 = new Set(s3);
              let n3 = false;
              for (let r3 = 0; r3 < s3.length; r3++) {
                let i3 = s3[r3];
                if (a3[i3 = U(C.transformHeader) ? C.transformHeader(i3, r3) : i3]) {
                  let e3, t2 = a3[i3];
                  for (; e3 = i3 + "_" + t2, t2++, o3.has(e3); ) ;
                  o3.add(e3), s3[r3] = e3, a3[i3]++, n3 = true, (D = null === D ? {} : D)[e3] = i3;
                } else a3[i3] = 1, s3[r3] = i3;
                o3.add(i3);
              }
              n3 && console.warn("Duplicate headers found and renamed."), L = true;
            }
            return { data: h2, errors: u2, meta: { delimiter: S, linebreak: O, aborted: M, truncated: !!e2, cursor: f2 + (t || 0), renamedHeaders: D } };
          }
          function R() {
            I(w()), h2 = [], u2 = [];
          }
        }, this.abort = function() {
          M = true;
        }, this.getCharIndex = function() {
          return z;
        };
      }
      function g(e) {
        var t = e.data, i2 = o[t.workerId], r2 = false;
        if (t.error) i2.userError(t.error, t.file);
        else if (t.results && t.results.data) {
          var n2 = { abort: function() {
            r2 = true, _(t.workerId, { data: [], errors: [], meta: { aborted: true } });
          }, pause: m, resume: m };
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
      function m() {
        throw new Error("Not implemented.");
      }
      function b(e) {
        if ("object" != typeof e || null === e) return e;
        var t, i2 = Array.isArray(e) ? [] : {};
        for (t in e) i2[t] = b(e[t]);
        return i2;
      }
      function y(e, t) {
        return function() {
          e.apply(t, arguments);
        };
      }
      function U(e) {
        return "function" == typeof e;
      }
      return v.parse = function(e, t) {
        var i2 = (t = t || {}).dynamicTyping || false;
        U(i2) && (t.dynamicTypingFunction = i2, i2 = {});
        if (t.dynamicTyping = i2, t.transform = !!U(t.transform) && t.transform, !t.worker || !v.WORKERS_SUPPORTED) return i2 = null, v.NODE_STREAM_INPUT, "string" == typeof e ? (e = ((e2) => 65279 !== e2.charCodeAt(0) ? e2 : e2.slice(1))(e), i2 = new (t.download ? f : c)(t)) : true === e.readable && U(e.read) && U(e.on) ? i2 = new p(t) : (n.File && e instanceof File || e instanceof Object) && (i2 = new l(t)), i2.stream(e);
        (i2 = (() => {
          var e2;
          return !!v.WORKERS_SUPPORTED && (e2 = (() => {
            var e3 = n.URL || n.webkitURL || null, t2 = r.toString();
            return v.BLOB_URL || (v.BLOB_URL = e3.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ", "(", t2, ")();"], { type: "text/javascript" })));
          })(), (e2 = new n.Worker(e2)).onmessage = g, e2.id = h++, o[e2.id] = e2);
        })()).userStep = t.step, i2.userChunk = t.chunk, i2.userComplete = t.complete, i2.userError = t.error, t.step = U(t.step), t.chunk = U(t.chunk), t.complete = U(t.complete), t.error = U(t.error), delete t.worker, i2.postMessage({ input: e, config: t, workerId: i2.id });
      }, v.unparse = function(e, t) {
        var n2 = false, _2 = true, m2 = ",", y2 = "\r\n", s2 = '"', a2 = s2 + s2, i2 = false, r2 = null, o2 = false, h2 = ((() => {
          if ("object" == typeof t) {
            if ("string" != typeof t.delimiter || v.BAD_DELIMITERS.filter(function(e2) {
              return -1 !== t.delimiter.indexOf(e2);
            }).length || (m2 = t.delimiter), "boolean" != typeof t.quotes && "function" != typeof t.quotes && !Array.isArray(t.quotes) || (n2 = t.quotes), "boolean" != typeof t.skipEmptyLines && "string" != typeof t.skipEmptyLines || (i2 = t.skipEmptyLines), "string" == typeof t.newline && (y2 = t.newline), "string" == typeof t.quoteChar && (s2 = t.quoteChar), "boolean" == typeof t.header && (_2 = t.header), Array.isArray(t.columns)) {
              if (0 === t.columns.length) throw new Error("Option columns is empty");
              r2 = t.columns;
            }
            void 0 !== t.escapeChar && (a2 = t.escapeChar + s2), t.escapeFormulae instanceof RegExp ? o2 = t.escapeFormulae : "boolean" == typeof t.escapeFormulae && t.escapeFormulae && (o2 = /^[=+\-@\t\r].*$/);
          }
        })(), new RegExp(P(s2), "g"));
        "string" == typeof e && (e = JSON.parse(e));
        if (Array.isArray(e)) {
          if (!e.length || Array.isArray(e[0])) return u2(null, e, i2);
          if ("object" == typeof e[0]) return u2(r2 || Object.keys(e[0]), e, i2);
        } else if ("object" == typeof e) return "string" == typeof e.data && (e.data = JSON.parse(e.data)), Array.isArray(e.data) && (e.fields || (e.fields = e.meta && e.meta.fields || r2), e.fields || (e.fields = Array.isArray(e.data[0]) ? e.fields : "object" == typeof e.data[0] ? Object.keys(e.data[0]) : []), Array.isArray(e.data[0]) || "object" == typeof e.data[0] || (e.data = [e.data])), u2(e.fields || [], e.data || [], i2);
        throw new Error("Unable to serialize unrecognized input");
        function u2(e2, t2, i3) {
          var r3 = "", n3 = ("string" == typeof e2 && (e2 = JSON.parse(e2)), "string" == typeof t2 && (t2 = JSON.parse(t2)), Array.isArray(e2) && 0 < e2.length), s3 = !Array.isArray(t2[0]);
          if (n3 && _2) {
            for (var a3 = 0; a3 < e2.length; a3++) 0 < a3 && (r3 += m2), r3 += k(e2[a3], a3);
            0 < t2.length && (r3 += y2);
          }
          for (var o3 = 0; o3 < t2.length; o3++) {
            var h3 = (n3 ? e2 : t2[o3]).length, u3 = false, d2 = n3 ? 0 === Object.keys(t2[o3]).length : 0 === t2[o3].length;
            if (i3 && !n3 && (u3 = "greedy" === i3 ? "" === t2[o3].join("").trim() : 1 === t2[o3].length && 0 === t2[o3][0].length), "greedy" === i3 && n3) {
              for (var f2 = [], l2 = 0; l2 < h3; l2++) {
                var c2 = s3 ? e2[l2] : l2;
                f2.push(t2[o3][c2]);
              }
              u3 = "" === f2.join("").trim();
            }
            if (!u3) {
              for (var p2 = 0; p2 < h3; p2++) {
                0 < p2 && !d2 && (r3 += m2);
                var g2 = n3 && s3 ? e2[p2] : p2;
                r3 += k(t2[o3][g2], p2);
              }
              o3 < t2.length - 1 && (!i3 || 0 < h3 && !d2) && (r3 += y2);
            }
          }
          return r3;
        }
        function k(e2, t2) {
          var i3, r3;
          return null == e2 ? "" : e2.constructor === Date ? JSON.stringify(e2).slice(1, 25) : (r3 = false, o2 && "string" == typeof e2 && o2.test(e2) && (e2 = "'" + e2, r3 = true), i3 = e2.toString().replace(h2, a2), (r3 = r3 || true === n2 || "function" == typeof n2 && n2(e2, t2) || Array.isArray(n2) && n2[t2] || ((e3, t3) => {
            for (var i4 = 0; i4 < t3.length; i4++) if (-1 < e3.indexOf(t3[i4])) return true;
            return false;
          })(i3, v.BAD_DELIMITERS) || -1 < i3.indexOf(m2) || " " === i3.charAt(0) || " " === i3.charAt(i3.length - 1)) ? s2 + i3 + s2 : i3);
        }
      }, v.RECORD_SEP = String.fromCharCode(30), v.UNIT_SEP = String.fromCharCode(31), v.BYTE_ORDER_MARK = "\uFEFF", v.BAD_DELIMITERS = ["\r", "\n", '"', v.BYTE_ORDER_MARK], v.WORKERS_SUPPORTED = !s && !!n.Worker, v.NODE_STREAM_INPUT = 1, v.LocalChunkSize = 10485760, v.RemoteChunkSize = 5242880, v.DefaultDelimiter = ",", v.Parser = E, v.ParserHandle = i, v.NetworkStreamer = f, v.FileStreamer = l, v.StringStreamer = c, v.ReadableStreamStreamer = p, n.jQuery && ((d = n.jQuery).fn.parse = function(o2) {
        var i2 = o2.config || {}, h2 = [];
        return this.each(function(e2) {
          if (!("INPUT" === d(this).prop("tagName").toUpperCase() && "file" === d(this).attr("type").toLowerCase() && n.FileReader) || !this.files || 0 === this.files.length) return true;
          for (var t = 0; t < this.files.length; t++) h2.push({ file: this.files[t], inputElem: this, instanceConfig: d.extend({}, i2) });
        }), e(), this;
        function e() {
          if (0 === h2.length) U(o2.complete) && o2.complete();
          else {
            var e2, t, i3, r2, n2 = h2[0];
            if (U(o2.before)) {
              var s2 = o2.before(n2.file, n2.inputElem);
              if ("object" == typeof s2) {
                if ("abort" === s2.action) return e2 = "AbortError", t = n2.file, i3 = n2.inputElem, r2 = s2.reason, void (U(o2.error) && o2.error({ name: e2 }, t, i3, r2));
                if ("skip" === s2.action) return void u2();
                "object" == typeof s2.config && (n2.instanceConfig = d.extend(n2.instanceConfig, s2.config));
              } else if ("skip" === s2) return void u2();
            }
            var a2 = n2.instanceConfig.complete;
            n2.instanceConfig.complete = function(e3) {
              U(a2) && a2(e3, n2.file, n2.inputElem), u2();
            }, v.parse(n2.file, n2.instanceConfig);
          }
        }
        function u2() {
          h2.splice(0, 1), e();
        }
      }), a && (n.onmessage = function(e) {
        e = e.data;
        void 0 === v.WORKER_ID && e && (v.WORKER_ID = e.workerId);
        "string" == typeof e.input ? n.postMessage({ workerId: v.WORKER_ID, results: v.parse(e.input, e.config), finished: true }) : (n.File && e.input instanceof File || e.input instanceof Object) && (e = v.parse(e.input, e.config)) && n.postMessage({ workerId: v.WORKER_ID, results: e, finished: true });
      }), (f.prototype = Object.create(u.prototype)).constructor = f, (l.prototype = Object.create(u.prototype)).constructor = l, (c.prototype = Object.create(c.prototype)).constructor = c, (p.prototype = Object.create(u.prototype)).constructor = p, v;
    });
  }
});

// src/parsers/_normalize.ts
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);
}
function snakeCase(key) {
  return key.replace(/\./g, "_").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/[\s-]+/g, "_").replace(/__+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}
function flattenRow(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
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
  return rows.map((row) => {
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
  const records = raw.records;
  if (!Array.isArray(records) || records.length === 0) return [];
  const rows = [];
  for (const div of records) {
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
  const records = [];
  for (const wk of raw.weeks ?? []) {
    for (const s of wk?.standings ?? []) records.push(s);
  }
  return normalize(records);
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
function underscore(word) {
  return word.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/-/g, "_").replace(/\./g, "_").toLowerCase();
}
function isPlainObject8(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function flattenRow2(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
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
  for (const [k, v] of Object.entries(row)) out[underscore(String(k))] = v;
  return out;
}
function jsonRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map((row) => {
    const flat = {};
    if (isPlainObject8(row)) flattenRow2(row, "", flat);
    else flat.value = Array.isArray(row) ? JSON.stringify(row) : row;
    return underscoreKeys(flat);
  });
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
function csvToRows(text) {
  return csvToRowsRaw(text).map((row) => underscoreKeys(row));
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
  const obj = htmlDecodeVar(html, varName);
  return isPlainObject8(obj) ? obj : {};
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
  return jsonRows(rows);
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

// src/parsers/sports247.ts
function isPlainObject10(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
var LIST_KEYS2 = ["list", "rankings", "items", "results", "data"];
function parse_sports247_list(raw) {
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
function parse_sports247_paged_list(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject10(raw)) return [];
  return normalize(raw.list ?? []);
}
function parse_sports247_institution_rankings(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject10(raw)) return [];
  const list = raw.list;
  if (!Array.isArray(list) || list.length === 0) return [];
  const pag = isPlainObject10(raw.pagination) ? raw.pagination : {};
  const base = {};
  for (const [k, v] of Object.entries(pag)) base[`pagination_${k}`] = v;
  return normalize(list.map((row) => ({ ...base, ...isPlainObject10(row) ? row : {} })));
}
function parse_sports247_ranking_feed(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject10(raw)) return [];
  return normalize(raw.rankings ?? []);
}

// src/parsers/cbs.ts
function isPlainObject11(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
var ERROR_KEYS = ["error", "errors", "warnings"];
function unwrapData(raw) {
  if (isPlainObject11(raw)) {
    const obj = raw;
    if ("data" in obj) return obj.data;
    if (ERROR_KEYS.some((k) => k in obj)) return null;
  }
  return raw;
}
var LIST_KEYS3 = [
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
function firstListIn(obj) {
  for (const key of LIST_KEYS3) {
    const c = obj[key];
    if (Array.isArray(c) && c.length > 0 && isPlainObject11(c[0])) return c;
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length > 0 && isPlainObject11(v[0])) return v;
  }
  return null;
}
function parse_cbs_list(raw) {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject11(data)) return [];
  const list = firstListIn(data);
  if (list) return normalize(list);
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}
function parse_cbs_scoreboard(raw) {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject11(data)) return [];
  for (const key of ["games", "scoreboard", "scores", "events"]) {
    const c = data[key];
    if (Array.isArray(c)) return normalize(c);
  }
  const list = firstListIn(data);
  if (list) return normalize(list);
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}
function parse_cbs_standings(raw) {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject11(data)) return [];
  const groups = data.groups ?? data.divisions;
  if (Array.isArray(groups) && groups.length > 0 && isPlainObject11(groups[0])) {
    const rows = [];
    for (const g of groups) {
      if (!isPlainObject11(g)) continue;
      const { standings, rows: gRows, entries, ...groupCols } = g;
      const inner = [standings, gRows, entries].find(
        (x) => Array.isArray(x) && x.length > 0
      );
      const groupPrefixed = {};
      for (const [k, v] of Object.entries(groupCols)) {
        if (!isPlainObject11(v) && !Array.isArray(v)) groupPrefixed[`group_${k}`] = v;
      }
      for (const r of inner ?? []) {
        if (isPlainObject11(r)) rows.push({ ...groupPrefixed, ...r });
      }
    }
    if (rows.length > 0) return normalize(rows);
  }
  for (const key of ["standings", "rows", "entries"]) {
    const c = data[key];
    if (Array.isArray(c)) return normalize(c);
  }
  const list = firstListIn(data);
  if (list) return normalize(list);
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}
function parse_cbs_odds(raw) {
  const data = unwrapData(raw);
  let markets = null;
  if (Array.isArray(data)) {
    markets = data;
  } else if (isPlainObject11(data)) {
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
    if (!isPlainObject11(mk)) continue;
    const { books, lines, quotes, ...marketCols } = mk;
    const inner = [books, lines, quotes].find((x) => Array.isArray(x) && x.length > 0);
    if (Array.isArray(inner)) {
      for (const b of inner) {
        if (isPlainObject11(b)) rows.push({ ...marketCols, ...b });
      }
    } else {
      rows.push(mk);
    }
  }
  return normalize(rows);
}

// src/parsers/fox.ts
function isPlainObject12(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
var LIST_KEYS4 = [
  "selectionGroupList",
  "groupList",
  "sectionList",
  "standingsSections",
  "navItems",
  "results",
  "items",
  "events",
  "rows",
  "groups",
  "list",
  "entries"
];
function firstListIn2(obj) {
  for (const key of LIST_KEYS4) {
    const c = obj[key];
    if (Array.isArray(c) && c.length > 0 && isPlainObject12(c[0])) return c;
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length > 0 && isPlainObject12(v[0])) return v;
  }
  return null;
}
function parse_fox_list(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject12(raw)) return [];
  const list = firstListIn2(raw);
  if (list) return normalize(list);
  if (Object.keys(raw).length > 0) return normalize([raw]);
  return [];
}
function parse_fox_scoreboard(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject12(raw)) return [];
  const selectionGroups = raw.selectionGroupList;
  if (Array.isArray(selectionGroups)) {
    const rows = [];
    for (const g of selectionGroups) {
      if (!isPlainObject12(g)) continue;
      const { selectionList, ...groupMeta } = g;
      const list = Array.isArray(selectionList) ? selectionList : [];
      for (const sel of list) {
        if (!isPlainObject12(sel)) continue;
        rows.push({ group: groupMeta, ...sel });
      }
    }
    return normalize(rows);
  }
  for (const key of ["events", "groupList", "sectionList"]) {
    const c = raw[key];
    if (Array.isArray(c) && c.length > 0 && isPlainObject12(c[0])) return normalize(c);
  }
  return parse_fox_list(raw);
}
function parse_fox_standings(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject12(raw)) return [];
  const sections = raw.standingsSections;
  if (Array.isArray(sections)) {
    const rows = [];
    for (const s of sections) {
      if (!isPlainObject12(s)) continue;
      const { standings, ...sectionMeta } = s;
      const list = Array.isArray(standings) ? standings : [];
      for (const r of list) {
        if (!isPlainObject12(r)) continue;
        rows.push({ section: sectionMeta, ...r });
      }
    }
    return normalize(rows);
  }
  return parse_fox_list(raw);
}
function parse_fox_event(raw) {
  if (!isPlainObject12(raw)) return [];
  const comparison = raw?.teamStatsComparison?.items ?? raw?.gameStats?.items ?? raw?.eventStatsTab?.eventStatsList;
  if (Array.isArray(comparison) && comparison.length > 0 && isPlainObject12(comparison[0])) {
    return normalize(comparison);
  }
  if (Object.keys(raw).length > 0) return normalize([raw]);
  return [];
}
function parse_fox_team_roster(raw) {
  if (!isPlainObject12(raw)) return [];
  const groups = raw.groups;
  if (Array.isArray(groups)) {
    const rows = [];
    for (const g of groups) {
      if (!isPlainObject12(g)) continue;
      const { rows: groupRows, ...groupMeta } = g;
      const list = Array.isArray(groupRows) ? groupRows : [];
      for (const r of list) {
        if (!isPlainObject12(r)) continue;
        rows.push({ group: groupMeta, ...r });
      }
    }
    return normalize(rows);
  }
  return parse_fox_list(raw);
}
function parse_fox_search(raw) {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject12(raw)) return [];
  const results = raw.results;
  if (Array.isArray(results)) return normalize(results);
  return parse_fox_list(raw);
}

// src/parsers/yahoo_scores.ts
function isPlainObject13(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
var LIST_KEYS5 = [
  "games",
  "events",
  "scores",
  "players",
  "teams",
  "leaders",
  "rows",
  "items",
  "list",
  "results",
  "entries"
];
function firstListIn3(obj) {
  for (const key of LIST_KEYS5) {
    const c = obj[key];
    if (Array.isArray(c) && c.length > 0 && isPlainObject13(c[0])) return c;
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length > 0 && isPlainObject13(v[0])) return v;
  }
  return null;
}
function unwrapService(raw) {
  if (isPlainObject13(raw) && isPlainObject13(raw.service)) {
    return raw.service;
  }
  return raw;
}
function unrollKeyedMap(map) {
  if (!isPlainObject13(map)) return [];
  const rows = [];
  for (const [key, val] of Object.entries(map)) {
    if (isPlainObject13(val)) rows.push({ id: key, ...val });
  }
  return rows;
}
function parse_yahoo_scores_list(raw) {
  const svc = unwrapService(raw);
  if (Array.isArray(svc)) return normalize(svc);
  if (!isPlainObject13(svc)) return [];
  const list = firstListIn3(svc);
  if (list) return normalize(list);
  if (Object.keys(svc).length > 0) return normalize([svc]);
  return [];
}
function parse_yahoo_scores_scoreboard(raw) {
  const svc = unwrapService(raw);
  if (!isPlainObject13(svc)) return [];
  const games = svc.scoreboard?.games ?? svc.games;
  if (isPlainObject13(games)) return normalize(unrollKeyedMap(games));
  if (Array.isArray(games)) return normalize(games);
  return parse_yahoo_scores_list(raw);
}
function parse_yahoo_scores_boxscore(raw) {
  const svc = unwrapService(raw);
  if (!isPlainObject13(svc)) return [];
  const playerStats = svc.boxscore?.player_stats ?? svc.player_stats;
  if (isPlainObject13(playerStats)) return normalize(unrollKeyedMap(playerStats));
  if (Array.isArray(playerStats)) return normalize(playerStats);
  return parse_yahoo_scores_list(raw);
}

// src/parsers/yahoo.ts
function isPlainObject14(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function unwrapData2(raw) {
  if (isPlainObject14(raw) && "data" in raw) {
    return raw.data;
  }
  return raw;
}
function firstRootList(data) {
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.length > 0 && isPlainObject14(v[0])) return v;
  }
  return null;
}
var STAT_ARRAY_KEYS = [
  "footballStats",
  "basketballStats",
  "baseballStats",
  "hockeyStats",
  "soccerStats",
  "leaders",
  "stats",
  "statLeaders",
  "players",
  "teams"
];
function parse_yahoo_list(raw) {
  const data = unwrapData2(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject14(data)) return [];
  const list = firstRootList(data);
  if (list) return normalize(list);
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}
function parse_yahoo_stats(raw) {
  const data = unwrapData2(raw);
  if (!isPlainObject14(data)) return [];
  const rootList = firstRootList(data);
  if (!rootList) return parse_yahoo_list(raw);
  const rows = [];
  let sawStatArray = false;
  for (const entry of rootList) {
    if (!isPlainObject14(entry)) continue;
    const statArray = STAT_ARRAY_KEYS.map((k) => entry[k]).find(
      (x) => Array.isArray(x) && x.length > 0 && isPlainObject14(x[0])
    );
    if (!Array.isArray(statArray)) continue;
    sawStatArray = true;
    const meta = {};
    for (const [k, v] of Object.entries(entry)) {
      if (!isPlainObject14(v) && !Array.isArray(v)) meta[k] = v;
    }
    for (const rec of statArray) {
      if (isPlainObject14(rec)) rows.push({ ...meta, ...rec });
    }
  }
  if (!sawStatArray) return normalize(rootList);
  return normalize(rows);
}

// src/parsers/hockeytech.ts
function isPlainObject15(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function siteKitRows(payload) {
  const kit = isPlainObject15(payload) ? payload.SiteKit : void 0;
  if (!isPlainObject15(kit)) return [];
  for (const v of Object.values(kit)) {
    if (Array.isArray(v)) return v;
  }
  return [];
}
function parse_hockeytech_seasons(payload) {
  return normalize(siteKitRows(payload));
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
  const kit = isPlainObject15(payload) ? payload.SiteKit : void 0;
  const player = isPlainObject15(kit) ? kit.Player : void 0;
  if (!isPlainObject15(player)) return normalize(siteKitRows(payload));
  const rows = [];
  for (const [statClass, lines] of Object.entries(player)) {
    if (!Array.isArray(lines)) continue;
    for (const r of lines) {
      if (isPlainObject15(r)) rows.push({ stat_class: statClass, ...r });
    }
  }
  return normalize(rows);
}
function parse_hockeytech_game_shifts(payload) {
  const kit = isPlainObject15(payload) ? payload.SiteKit : void 0;
  const gs = isPlainObject15(kit) ? kit.Gameshifts : void 0;
  if (!isPlainObject15(gs)) return [];
  const rows = [];
  for (const side of ["home", "visitor"]) {
    const arr = gs[side];
    if (Array.isArray(arr)) {
      for (const r of arr) rows.push(isPlainObject15(r) ? { side, ...r } : { side, value: r });
    }
  }
  return normalize(rows);
}
function parse_hockeytech_standings(payload) {
  if (!Array.isArray(payload) || payload.length === 0) return [];
  const rows = [];
  for (const block of payload) {
    const sections = isPlainObject15(block) ? block.sections : void 0;
    if (!Array.isArray(sections)) continue;
    for (const sec of sections) {
      const data = isPlainObject15(sec) ? sec.data : void 0;
      if (!Array.isArray(data)) continue;
      for (const d of data) {
        const row = isPlainObject15(d) ? d.row : void 0;
        if (isPlainObject15(row)) rows.push(row);
      }
    }
  }
  return normalize(rows);
}
function parse_hockeytech_leaders(payload) {
  if (!isPlainObject15(payload)) return [];
  const rows = [];
  for (const [playerType, group] of Object.entries(payload)) {
    if (!isPlainObject15(group)) continue;
    for (const [category, body] of Object.entries(group)) {
      const results = isPlainObject15(body) ? body.results : void 0;
      if (!Array.isArray(results)) continue;
      for (const r of results) {
        if (isPlainObject15(r)) rows.push({ player_type: playerType, category, ...r });
      }
    }
  }
  return normalize(rows);
}
function parse_hockeytech_pbp(payload) {
  if (!Array.isArray(payload) || payload.length === 0) return [];
  const rows = payload.map((p) => {
    if (!isPlainObject15(p)) return { value: p };
    const { event, details } = p;
    return isPlainObject15(details) ? { event, ...details } : { event, details };
  });
  return normalize(rows);
}
function parse_hockeytech_game_summary(payload) {
  const gc = isPlainObject15(payload) ? payload.GC : void 0;
  const summary = isPlainObject15(gc) ? gc.Gamesummary : void 0;
  const goals = isPlainObject15(summary) ? summary.goals : void 0;
  if (!Array.isArray(goals)) return [];
  return normalize(goals);
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
  parse_sports247_list,
  // Dedicated parsers (envelope unrolling logic).
  parse_sports247_paged_list,
  parse_sports247_institution_rankings,
  parse_sports247_ranking_feed,
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
  // ---- BartTorvik / T-Rank (barttorvik.com) ----
  // Two header-CSV parsers, one headerless-CSV (67 positional cols), two
  // headerless-JSON (31 / 55 positional cols).
  parse_torvik_ratings,
  parse_torvik_team_factors,
  parse_torvik_game_stats,
  parse_torvik_player_stats,
  parse_torvik_game_schedule
};
function parserFor(name) {
  return name ? PARSERS[name] : void 0;
}

// src/parsers/espn.ts
function isPlainObject16(v) {
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
    } else if (isPlainObject16(v)) {
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
      } else if (isPlainObject16(v)) {
        for (const [k2, v2] of Object.entries(v)) {
          if (isScalar(v2)) {
            row[`${k}_${k2}`] = v2;
          } else if (isPlainObject16(v2)) {
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
  if (!payload || !isPlainObject16(payload)) return [];
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
  if (!payload || !isPlainObject16(payload)) return [];
  const events = payload.events;
  if (!Array.isArray(events) || !events.length) return [];
  return normalize(events);
}
function parse_team_roster(payload) {
  if (!payload || !isPlainObject16(payload)) return [];
  const athletes = payload.athletes;
  if (!Array.isArray(athletes) || !athletes.length) return [];
  const first = athletes[0] || {};
  const isGrouped = isPlainObject16(first) && "position" in first && Array.isArray(first.items);
  if (isGrouped) {
    const rows = [];
    for (const group of athletes) {
      if (!isPlainObject16(group)) continue;
      const groupName = group.position;
      for (const player of group.items || []) {
        if (!isPlainObject16(player)) continue;
        rows.push({ position_group: groupName, ...player });
      }
    }
    if (!rows.length) return [];
    return normalize(rows);
  }
  return normalize(athletes);
}
function parse_news(payload) {
  if (!payload || !isPlainObject16(payload)) return [];
  const articles = payload.articles;
  if (!Array.isArray(articles) || !articles.length) return [];
  return normalize(articles);
}
function parse_injuries(payload) {
  if (!payload || !isPlainObject16(payload)) return [];
  const teams = payload.injuries;
  if (!Array.isArray(teams) || !teams.length) return [];
  return normalize(teams);
}
function singleRow(payloadDict) {
  if (!isPlainObject16(payloadDict) || Object.keys(payloadDict).length === 0) return [];
  return normalize([payloadDict]);
}
function rowPerItem(items) {
  if (!Array.isArray(items) || !items.length) return [];
  return normalize(items);
}
function parse_summary_boxscore_player(payload) {
  if (!isPlainObject16(payload)) return [];
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
  if (!isPlainObject16(payload)) return [];
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
  if (!isPlainObject16(payload)) return [];
  const plays = payload.plays;
  if (!Array.isArray(plays) || !plays.length) return [];
  return normalize(plays);
}
function parse_summary_winprobability(payload) {
  if (!isPlainObject16(payload)) return [];
  const wp = payload.winprobability;
  if (!Array.isArray(wp) || !wp.length) return [];
  return normalize(wp);
}
function parse_summary_leaders(payload) {
  if (!isPlainObject16(payload)) return [];
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
    } else if (isPlainObject16(v)) {
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
  return singleRow(isPlainObject16(payload) ? payload.header : null);
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
    for (const rec of entry.records || []) {
      const row = { ...teamBase };
      for (const [k, v] of Object.entries(rec || {})) {
        if (isScalar(v)) {
          row[k] = v;
        } else if (isPlainObject16(v)) {
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
    if (!isPlainObject16(grp)) continue;
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
      if (isPlainObject16(teamField)) {
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
  return singleRow(isPlainObject16(payload) ? payload.format : null);
}
function parse_summary_pickcenter(payload) {
  return rowPerItem((payload || {}).pickcenter);
}
function parse_summary_odds(payload) {
  return rowPerItem((payload || {}).odds);
}
function parse_summary_article(payload) {
  return singleRow(isPlainObject16(payload) ? payload.article : null);
}
function parse_summary_injuries(payload) {
  return rowPerItem((payload || {}).injuries);
}
function parse_summary_news(payload) {
  const news = (payload || {}).news || {};
  return rowPerItem(news.articles);
}
function parse_single_entity(payload) {
  return singleRow(isPlainObject16(payload) ? payload : null);
}
function parse_summary_drives(payload) {
  const drives = (payload || {}).drives || {};
  const previous = isPlainObject16(drives) ? drives.previous : null;
  return rowPerItem(previous);
}
function parse_summary_scoring_plays(payload) {
  return rowPerItem((payload || {}).scoringPlays);
}
function parse_summary_drive_plays(payload) {
  const drives = (payload || {}).drives || {};
  const previous = isPlainObject16(drives) ? drives.previous : null;
  if (!Array.isArray(previous) || !previous.length) return [];
  const rows = [];
  previous.forEach((drive, idx) => {
    if (!isPlainObject16(drive)) return;
    const driveId = drive.id;
    const driveSeq = idx + 1;
    for (const play of drive.plays || []) {
      if (!isPlainObject16(play)) continue;
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
  rankings: parse_items,
  season_qbr: parse_items,
  season_qbr_week: parse_items,
  athlete_notes: parse_items,
  league_notes: parse_items,
  talentpicks: parse_items,
  // ---- Core v2 list payloads (more) ----
  leaders_core: parse_items,
  season_powerindex: parse_items,
  season_powerindex_leaders: parse_items,
  season_type_corrections: parse_items,
  season_type_leaders: parse_items,
  season_week_rankings: parse_items,
  season_group_children: parse_items,
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
  event_official_detail: parse_single_entity
};
function parserForEndpoint(short) {
  return ESPN_ENDPOINT_PARSERS[short];
}

// src/parsers/index.ts
function parseEndpoint(kind, key, raw, section) {
  if (kind === "espn") {
    const fn2 = parserForEndpoint(key);
    if (!fn2) return null;
    if (key === "summary") return parse_summary(raw, section);
    return fn2(raw);
  }
  const fn = parserFor(key);
  return fn ? fn(raw) : null;
}
export {
  ESPN_ENDPOINT_PARSERS,
  PARSERS,
  SUMMARY_SECTION_PARSERS,
  normalize,
  parseEndpoint,
  parse_summary,
  parserFor,
  parserForEndpoint,
  snakeCase
};
/*! Bundled license information:

papaparse/papaparse.min.js:
  (* @license
  Papa Parse
  v5.5.3
  https://github.com/mholt/PapaParse
  License: MIT
  *)
*/
