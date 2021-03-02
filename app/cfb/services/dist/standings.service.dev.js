"use strict";

var axios = require('axios');

exports.getStandings = function _callee(_ref) {
  var _ref$year, year, _ref$group, group, baseUrl, params, res;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _ref$year = _ref.year, year = _ref$year === void 0 ? new Date().getFullYear() : _ref$year, _ref$group = _ref.group, group = _ref$group === void 0 ? 20 : _ref$group;
          baseUrl = "http://cdn.espn.com/core/nfl/standings/_/season/".concat(year, "/group/").concat(group);
          params = {
            xhr: 1,
            render: false,
            device: 'desktop',
            userab: 18
          };
          _context.next = 5;
          return regeneratorRuntime.awrap(axios.get(baseUrl, {
            params: params
          }));

        case 5:
          res = _context.sent;
          return _context.abrupt("return", res.content.standings.groups);

        case 7:
        case "end":
          return _context.stop();
      }
    }
  });
};