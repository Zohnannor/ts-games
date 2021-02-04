"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var _a, _b, _c, _d;
var Tile = /** @class */ (function () {
    function Tile(value) {
        this.value = value;
        this.$cell = document.createElement('div');
        this.$tile = document.createElement('div');
        this.$tile.className = 'tile';
        this.$cell.className = 'cell';
    }
    Tile.prototype.toJSON = function () {
        return { value: this.value };
    };
    Tile.prototype.render = function () {
        this.$tile.innerText = this.value !== 0 ? this.value.toString() : '';
        this.$cell.appendChild(this.$tile);
        this.value > 0 && this.$tile.classList.add("t" + (this.value <= 4096 ? this.value : 'big'));
        return this.$cell;
    };
    return Tile;
}());
var Game = /** @class */ (function () {
    function Game() {
    }
    Game.init = function (load) {
        var _this = this;
        if (load === void 0) { load = true; }
        this.scores[this.N] = 0;
        this.continues[this.N] = false;
        this.emptyBoard();
        if (load) {
            if (!this.loadFromStorage()) {
                this.setRandomTile();
                this.setRandomTile();
            }
        }
        else {
            this.setRandomTile();
            this.setRandomTile();
        }
        this.$grid.style.gridTemplateColumns = "repeat(" + this.N + ", 1fr)";
        this.grids[this.N].forEach(function (row) { return row.forEach(function (t) { return _this.$grid.appendChild(t.render()); }); });
    };
    Game.newGame = function () {
        document.querySelector('.gameOver').style.display = 'none';
        document.addEventListener('keydown', onKeyDown);
        this.init(false);
        this.savetoStorage();
        this.updateScore();
    };
    Game.emptyBoard = function () {
        this.grids[this.N] = [];
        this.$grid.innerHTML = '';
        for (var i = 0; i < this.N; i++) {
            this.grids[this.N].push([]);
            for (var j = 0; j < this.N; j++) {
                this.grids[this.N][i].push(new Tile(0));
            }
        }
    };
    Game.serialize = function () {
        var _this = this;
        return JSON.stringify({
            N: this.N,
            data: Object.keys(this.scores).map(function (key) {
                return {
                    N: key,
                    grid: _this.grids[key],
                    score: _this.scores[key],
                    highscore: _this.highscores[key],
                    continue: _this.continues[key],
                };
            }),
        });
    };
    Game.savetoStorage = function () {
        localStorage.setItem(this.SAVE_SLOT, btoa(this.serialize()));
    };
    Game.loadFromStorage = function () {
        var _this = this;
        var data = localStorage.getItem(this.SAVE_SLOT);
        if (data !== null) {
            var save = JSON.parse(atob(data));
            this.N = save.N;
            var select = document.querySelector('#select');
            select.value = this.N.toString();
            save.data.forEach(function (score) {
                _this.scores[score.N] = score.score;
                _this.highscores[score.N] = score.highscore;
                _this.continues[score.N] = score.continue;
            });
            this.updateScore();
            this.emptyBoard();
            save.data.forEach(function (g) {
                _this.grids[g.N] = g.grid.map(function (r) {
                    return r.map(function (t) { return new Tile(t.value); });
                });
            });
            return true;
        }
        else {
            return false;
        }
    };
    Game.handleKeyDown = function (e) {
        var _this = this;
        switch (e.key) {
            case 'w':
            case 'ц':
            case 'ArrowUp':
                this.move('up');
                break;
            case 'a':
            case 'ф':
            case 'ArrowLeft':
                this.move('left');
                break;
            case 's':
            case 'ы':
            case 'ArrowDown':
                this.move('down');
                break;
            case 'd':
            case 'в':
            case 'ArrowRight':
                this.move('right');
                break;
            default:
                return;
        }
        setTimeout(function () {
            if (_this.moved.some(function (v) { return v; })) {
                _this.setRandomTile();
                _this.savetoStorage();
            }
            else {
                _this.$grid.classList.add('error');
                setTimeout(function () {
                    _this.$grid.classList.remove('error');
                }, 300);
            }
            if (_this.isWin() && !_this.continues[_this.N]) {
                document.querySelector('.youWin').style.display = 'block';
                document.removeEventListener('keydown', onKeyDown);
            }
            _this.moved = [];
            _this.render();
            if (_this.getEmptyCellsCoords().length === 0 && _this.isGameOver()) {
                document.querySelector('.gameOver').style.display = 'block';
                document.removeEventListener('keydown', onKeyDown);
            }
        }, 100);
        this.savetoStorage();
    };
    Game.undo = function () {
        if (this.memory.length > 0) {
            this.grids[this.N] = this.memory;
        }
        this.render();
    };
    Game.setRandomTile = function () {
        var emptyCells = this.getEmptyCellsCoords();
        var cell = choice(emptyCells);
        if (cell) {
            var _a = __read(cell, 2), y = _a[0], x = _a[1];
            var newTile = this.tileAtCoords({ x: x, y: y });
            newTile.$tile.classList.add('newTile');
            newTile.value = Math.random() < 0.9 ? 2 : 4;
        }
    };
    Game.isWin = function () {
        for (var y = 0; y < this.grids[this.N].length - 1; y++) {
            for (var x = 0; x < this.grids[this.N].length - 1; x++) {
                if (this.tileAtCoords({ x: x, y: y }).value === 2048) {
                    return true;
                }
            }
        }
        return false;
    };
    Game.isGameOver = function () {
        var isOver = true;
        for (var y = 0; y < this.grids[this.N].length - 1; y++) {
            for (var x = 0; x < this.grids[this.N].length - 1; x++) {
                if (this.tileAtCoords({ x: x, y: y }).value === this.tileAtCoords({ x: x + 1, y: y }).value) {
                    isOver = false;
                }
                if (this.tileAtCoords({ x: x, y: y }).value === this.tileAtCoords({ x: x, y: y + 1 }).value) {
                    isOver = false;
                }
            }
        }
        return isOver;
    };
    Game.handleSelect = function (e) {
        document.addEventListener('keydown', onKeyDown);
        var select = e.target;
        this.N = +select.value;
        this.memory = [];
        this.savetoStorage();
        this.render();
        select.blur();
    };
    Game.getEmptyCellsCoords = function () {
        var _this = this;
        return this.grids[this.N].flatMap(function (r, y) {
            return r.map(function (_, x) { return [y, x]; }).filter(function (_a) {
                var _b = __read(_a, 2), y = _b[0], x = _b[1];
                return _this.tileAtCoords({ x: x, y: y }).value < 1;
            });
        });
    };
    Game.move = function (direction) {
        var _this = this;
        this.memory = this.grids[this.N].map(function (r) { return r.map(function (t) { return new Tile(t.value); }); });
        var v = this.getVector(direction);
        var ys = __spread(Array(this.N).keys());
        var xs = __spread(Array(this.N).keys());
        if (v.y === 1)
            ys = ys.reverse();
        if (v.x === 1)
            xs = xs.reverse();
        ys.forEach(function (y) {
            xs.forEach(function (x) {
                var tile = _this.tileAtCoords({ x: x, y: y });
                if (tile.value > 0) {
                    var _a = _this.getPossibleCoords({ x: x, y: y }, v), prev = _a.prev, next = _a.next;
                    if (_this.isInbounds(next) &&
                        _this.tileAtCoords(next).value === tile.value &&
                        !_this.tileAtCoords(next).$tile.classList.contains('mergedTile')) {
                        _this.moveTileVisually(_this.tileAtCoords({ x: x, y: y }), v, next, { x: x, y: y });
                        _this.grids[_this.N][y][x] = new Tile(0);
                        var mergedTile = _this.tileAtCoords(next);
                        mergedTile.value *= 2;
                        mergedTile.$tile.classList.add('mergedTile');
                        _this.addToScore(mergedTile.value);
                        _this.moved.push(true);
                    }
                    else if (prev.x === x && prev.y === y) {
                        _this.grids[_this.N][y][x] = new Tile(0);
                        _this.grids[_this.N][y][x].value = tile.value;
                        _this.moved.push(false);
                    }
                    else {
                        _this.moveTileVisually(_this.tileAtCoords({ x: x, y: y }), v, prev, { x: x, y: y });
                        _this.grids[_this.N][y][x] = new Tile(0);
                        _this.tileAtCoords(prev).value = tile.value;
                        _this.moved.push(true);
                    }
                }
            });
        });
    };
    Game.addToScore = function (value) {
        this.scores[this.N] += value;
        this.highscores[this.N] = Math.max(this.scores[this.N], this.highscores[this.N]);
    };
    Game.moveTileVisually = function (tile, v, newTile, _a) {
        var x = _a.x, y = _a.y;
        if (v.x !== 0) {
            tile.$tile.style.transform = "translateX(calc(" + (newTile.x - x) + " * (var(--tile-size) + 2 * var(--space))))";
        }
        else {
            tile.$tile.style.transform = "translateY(calc(" + (newTile.y - y) + " * (var(--tile-size) + 2 * var(--space))))";
        }
    };
    Game.isInbounds = function (_a) {
        var x = _a.x, y = _a.y;
        return x >= 0 && x < this.N && y >= 0 && y < this.N;
    };
    Game.tileAtCoords = function (_a) {
        var x = _a.x, y = _a.y;
        return this.grids[this.N][y][x];
    };
    Game.getPossibleCoords = function (_a, v) {
        var x = _a.x, y = _a.y;
        var prev = { x: x, y: y };
        var next = { x: x, y: y };
        do {
            prev.x = next.x;
            prev.y = next.y;
            next.x += v.x;
            next.y += v.y;
        } while (this.isInbounds(next) && this.tileAtCoords(next).value < 1);
        return { prev: prev, next: next };
    };
    Game.getVector = function (direction) {
        switch (direction) {
            case 'up':
                return { x: 0, y: -1 };
            case 'down':
                return { x: 0, y: 1 };
            case 'left':
                return { x: -1, y: 0 };
            case 'right':
                return { x: 1, y: 0 };
        }
    };
    Game.render = function () {
        var _this = this;
        this.$grid.style.gridTemplateColumns = "repeat(" + this.N + ", 1fr)";
        this.$grid.innerHTML = '';
        if (this.grids[this.N].length === 0) {
            this.newGame();
        }
        this.grids[this.N].forEach(function (row) {
            row.forEach(function (t) {
                _this.$grid.appendChild(t.render());
            });
        });
        this.updateScore();
    };
    Game.updateScore = function () {
        this.$score.innerHTML = this.scores[this.N].toString();
        this.$highscore.innerHTML = this.highscores[this.N].toString();
    };
    Game.N = 4;
    Game.$grid = document.querySelector('#grid');
    Game.$score = document.querySelector('#score');
    Game.$highscore = document.querySelector('#highscore');
    Game.grids = { 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [] };
    Game.scores = { 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    Game.highscores = { 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    Game.moved = [];
    Game.SAVE_SLOT = '2048-save';
    Game.continues = {
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
        10: false,
    };
    return Game;
}());
var choice = function (list) {
    return list[Math.floor(Math.random() * list.length)];
};
var onKeyDown = function (e) {
    Game.handleKeyDown(e);
};
Game.init();
(_a = document.querySelectorAll('.newGameBtn')) === null || _a === void 0 ? void 0 : _a.forEach(function (btn) {
    btn.addEventListener('click', Game.newGame.bind(Game));
});
(_b = document.querySelector('#undo')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', Game.undo.bind(Game));
document.addEventListener('keydown', onKeyDown);
(_c = document.querySelector('#select')) === null || _c === void 0 ? void 0 : _c.addEventListener('change', Game.handleSelect.bind(Game));
(_d = document.querySelector('#continue')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', function () {
    document.querySelector('.youWin').style.display = 'none';
    Game.continues[Game.N] = true;
    document.addEventListener('keydown', onKeyDown);
});
//# sourceMappingURL=2048.js.map