/// <reference path="bower_components/phaser/typescript/phaser.d.ts" />
// import * as Phaser from 'phaser'

const ZOOM = 2
const TILE_SIZE = 42
const PLANET_SIZE = 320
const TILES = 5
const PADDING = 2
const IMAGE_FOLDER = "images/"
const MARGIN = (PLANET_SIZE - TILES * TILE_SIZE) / 2

let LEVEL : [string, boolean] = [`PS.B_
AC#.T
&.#K$
.FL.#
_HMGC`, true]

const ANIMALS = [
    'lion', 'giraffe', 'mouse', 'grasshopper', 'bird', 'snake',
    'vulture', 'monkey', 'antelope', 'leopard', 'hippo'
]

const DIST_DIRECT = [[0, 1], [0, -1], [-1, 0], [1, 0]]
const DIST_BELOW = [[0, 0]]
const DIST_FAST = [[0, 2], [0, -2], [-2, 0], [2, 0]]

const EATERS = {
    'lion': [[DIST_DIRECT, ['giraffe', 'hippo']]],
    'giraffe': [[DIST_DIRECT, ['tree']]],
    'mouse': [[DIST_BELOW, ['grass-high']]],
    'grasshopper': [[DIST_BELOW, ['grass-high']]],
    'bird': [[DIST_DIRECT, ['grasshopper']]],
    'snake': [[DIST_DIRECT, ['mouse']]],
    'vulture': [[DIST_DIRECT, []]],
    'monkey': [[DIST_DIRECT, ['tree', 'shrub', 'grasshopper']]],
    'antelope': [[DIST_DIRECT, ['shrub']], [DIST_BELOW, ['grass-high']]],
    'leopard': [[DIST_DIRECT, ['antelope', 'monkey']], [DIST_FAST, ['antelope', 'monkey']]],
    'hippo': [[DIST_DIRECT, ['water']]],
}

const TILE_MAP = {
    '.': [true, null, null],
    '#': [null, 'grass-high', null],
    '%': [true, null, 'rock'],
    ':': [false, null, 'rock'],
    '&': [true, null, 'tree'],
    '$': [true, null, 'shrub'],
    '_': [null, 'water', null],
    '-': [false, null, null],

    'P': [true, null, null],
    'R': [false, null, null],

    'L': [true, null, 'lion'],
    'D': [false, null, 'lion'],
    'G': [true, null, 'giraffe'],
    'E': [false, null, 'giraffe'],
    'M': [true, null, 'mouse'],
    'W': [false, null, 'mouse'],
    'H': [true, null, 'grasshopper'],
    'Q': [false, null, 'grasshopper'],
    'B': [true, null, 'bird'],
    'S': [true, null, 'snake'],
    'T': [true, null, 'vulture'],
    'U': [false, null, 'vulture'],
    'K': [true, null, 'monkey'],
    'N': [false, null, 'monkey'],
    'A': [true, null, 'antelope'],
    'I': [false, null, 'antelope'],
    'F': [true, null, 'leopard'],
    'J': [false, null, 'leopard'],
    'C': [true, null, 'hippo'],
}

module SmallWorldGame {

    export class GameState extends Phaser.State {
        game: Phaser.Game
        level: [string, boolean]
        map: Phaser.Tilemap
        name_to_gid: { [name: string]: number } = {}
        gid_to_name: { [gid: number]: string } = {}
        floorLayer: Phaser.TilemapLayer
        blockLayer: Phaser.TilemapLayer
        active: Phaser.Tile = null
        selector: Phaser.Sprite
        happy: boolean[][]
        happyGroup: Phaser.Group

        constructor() {
            super()
        }

        init(level: [string, boolean]) {
            this.level = LEVEL
            this.happy = new Array(TILES);
            for (var i = 0; i < TILES; i++) {
                this.happy[i] = new Array(TILES);
            }
        }

        preload() {
            this.load.atlasJSONArray('tiles', IMAGE_FOLDER + 'tiles.png', IMAGE_FOLDER + 'tiles.json')
            this.load.image('planet-green', IMAGE_FOLDER + 'planet-green.png')
        }

        create() {
            this.stage.smoothed = false;
            this.stage.backgroundColor = '#000';

            if (!resized) {
                this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE
                this.game.scale.setUserScale(ZOOM, ZOOM, 0, 0)
                this.game.scale.refresh();

                resized = true
            }

            let cursors = this.input.keyboard.createCursorKeys()

            cursors.up.onUp.add(this.onKey(0, -1), this)
            cursors.down.onUp.add(this.onKey(0, 1), this)
            cursors.left.onUp.add(this.onKey(-1, 0), this)
            cursors.right.onUp.add(this.onKey(1, 0), this)

            let sprite = this.add.sprite(0, 0, 'planet-green');

            this.input.onTap.add(this.onTap, this)

            let group = this.add.group()
            group.x = group.y = MARGIN

            this.map = this.add.tilemap(null, TILE_SIZE, TILE_SIZE, TILES, TILES);
            this.map.addTilesetImage('tiles', 'tiles')
            this.cache.getFrameData('tiles').getFrames().forEach((frame, i) => {
                this.name_to_gid[frame.name] = i
                this.gid_to_name[i] = frame.name
            })
            this.floorLayer = this.map.createBlankLayer('floor', TILES, TILES, TILE_SIZE, TILE_SIZE, group)
            this.selector = this.add.sprite(0, 0, 'tiles', 'select', group)
            this.selector.centerX = TILE_SIZE / 2
            this.selector.centerY = TILE_SIZE / 2
            this.add.tween(this.selector).to({ alpha: 0.7 }, 400, "Linear", true, 0, -1, true);
            this.selector.visible = false
            this.blockLayer = this.map.createBlankLayer('block', TILES, TILES, TILE_SIZE, TILE_SIZE, group)
            this.happyGroup = this.add.group()

            this.parseLevel()
            this.updateHappyness()
        }

        shutdown() {
        }

        update() {
            this.game.input.update()
        }

        onTap(position: Phaser.Pointer) {
            let x = (this.floorLayer as any).getTileX(position.worldX - MARGIN);
            let y = (this.floorLayer as any).getTileY(position.worldY - MARGIN);
            let tile = this.map.getTile(x, y, this.blockLayer)

            if (tile !== null) {
                let name = this.gid_to_name[tile.index]
                if (ANIMALS.indexOf(name) !== -1) {
                    this.active = tile
                } else {
                    this.active = null
                }
            } else {
                this.active = null
            }

            this.updateSelector()
        }

        onKey(dx: number, dy: number): () => void {
            return function () {
                if (this.active !== null) {
                    let sx = this.active.x
                    let sy = this.active.y
                    let tx = sx + dx
                    let ty = sy + dy
                    if (tx >= 0 && tx < TILES && ty >= 0 && ty < TILES) {
                        let blockTile = this.map.getTile(tx, ty, this.blockLayer)
                        let floorName = this.getFloorTileNameAt(tx, ty)
                        let activeName = this.gid_to_name[this.active.index]
                        if (floorName !== 'water') {
                            if (blockTile === null) {
                                this.active = this.map.putTile(this.active, tx, ty, this.blockLayer)
                                this.map.removeTile(sx, sy, this.blockLayer)
                            }
                            else if (ANIMALS.indexOf(this.gid_to_name[blockTile.index]) !== -1) {
                                let old = blockTile.index
                                this.active = this.map.putTile(this.active, tx, ty, this.blockLayer)
                                this.map.putTile(old, sx, sy, this.blockLayer)
                            }
                        } else if (activeName == 'bird' || activeName == 'vulture') {
                            this.active = this.map.putTile(this.active, tx, ty, this.blockLayer)
                            this.map.removeTile(sx, sy, this.blockLayer)
                        }

                        this.updateSelector()
                    }
                }
            }
        }

        updateSelector() {
            if (this.active !== null) {
                this.selector.position.set(this.active.worldX, this.active.worldY)
                this.selector.visible = true
            } else {
                this.selector.visible = false
            }

            this.updateHappyness()
        }

        parseLevel() {
            let lines = this.level[0].split('\n')
            for (let y = 0; y < TILES; y++) {
                for (let x = 0; x < TILES; x++) {
                    let [is_grass, floor, block] = TILE_MAP[lines[y][x]]
                    if (is_grass === null) {
                        is_grass = this.level[1]
                    }
                    if (is_grass !== this.level[1]) {
                        floor = is_grass ? 'grass-patch' : 'desert'
                    }
                    if (floor !== null) {
                        this.map.putTile(this.name_to_gid[floor], x, y, this.floorLayer)
                    }
                    if (block !== null) {
                        this.map.putTile(this.name_to_gid[block], x, y, this.blockLayer)
                    }
                }
            }
        }

        updateHappyness() {
            let graph = {}
            let eaters = []
            let variety = {}
            let snake = {}
            let vultures = []
            for (let y = 0; y < TILES; y++) {
                for (let x = 0; x < TILES; x++) {
                    this.happy[y][x] = null
                    let eater = this.getBlockTileNameAt(x, y)
                    if (eater && EATERS[eater]) {
                        this.happy[y][x] = true
                        let id = eater + '-' + x + '-' + y
                        let greed_id = (eater == 'lion') ? id + '-greed' : null
                        if (!graph[id]) {
                            eaters.push([id, x, y])
                            graph[id] = []
                        }
                        if (greed_id && !graph[greed_id]) {
                            eaters.push([greed_id, x, y])
                            graph[greed_id] = []
                        }
                        if (eater == 'vulture') {
                            vultures.push([[x, y], []])
                        }
                        EATERS[eater].forEach(([directions, food]) => {
                            directions.forEach(([dx, dy]) => {
                                let what = this.getBlockTileNameAt(x + dx, y + dy)
                                let other_id = what + '-' + (x + dx) + '-' + (y + dy)
                                if (food.indexOf(what) !== -1) {
                                    graph[id].push(other_id)
                                    if (greed_id) graph[greed_id].push(other_id)
                                    if (eater == 'monkey') (variety[id] || (variety[id] = new Set())).add(what)
                                }
                                if (eater == 'snake' && (what == 'monkey' || what == 'bird')) {
                                    snake[other_id] = true
                                }
                                if (eater == 'vulture' && what != 'grasshopper' && ANIMALS.indexOf(what) !== -1) {
                                    vultures[vultures.length-1][1].push(other_id)
                                }
                                what = this.getFloorTileNameAt(x + dx, y + dy)
                                other_id = what + '-' + (x + dx) + '-' + (y + dy)
                                if (food.indexOf(what) !== -1) {
                                    graph[id].push(other_id)
                                    if (greed_id) graph[greed_id].push(other_id)
                                    if (eater == 'monkey') (variety[id] || (variety[id] = new Set())).add(what)
                                }
                            })
                        })
                    }
                }
            }
            let matching = window.hopcroftCarp.hopcroftKarp(graph)
            let happy = true
            let eaten = []
            for (let i = 0; i < eaters.length; i++) {
                let [id, x, y] = eaters[i]
                // Hungry
                if (matching[id] === null) {
                    this.happy[y][x] = false
                    happy = false
                } else {
                    eaten.push(matching[id])
                }
                // Desert
                let floor = this.getFloorTileNameAt(x, y)
                if (floor === 'desert' || (floor === null && !this.level[1]) || floor == 'water') {
                    this.happy[y][x] = false
                    happy = false
                }
                // Monkey variety
                if ((id in variety) && (variety[id].size < 2)) {
                    this.happy[y][x] = false
                    happy = false
                }
                // Snake
                if (snake[id]) {
                    this.happy[y][x] = false
                    happy = false
                }
            }
            // Vultures
            for (var i = 0; i < vultures.length; i++) {
                let [[x, y], foods] = vultures[i]
                let hungry = true
                for (var j = 0; j < foods.length; j++) {
                    if (eaten.indexOf(foods[j]) !== -1) {
                        hungry = false
                        break
                    }
                }
                this.happy[y][x] = !hungry
            }
            this.renderHappyness()
        }

        renderHappyness() {
            this.happyGroup.removeAll()

             for (let y = 0; y < TILES; y++) {
                for (let x = 0; x < TILES; x++) {
                    if (this.happy[y][x] !== null) {
                        this.add.sprite(MARGIN + x * TILE_SIZE, MARGIN + y * TILE_SIZE, 'tiles', this.happy[y][x]? 'happy' : 'sad', this.happyGroup)
                    }
                }
            }
        }

        getFloorTileNameAt(x: number, y: number) {
            let tile = this.map.getTile(x, y, this.floorLayer)
            return tile === null? null : this.gid_to_name[tile.index]
        }

        getBlockTileNameAt(x: number, y: number) {
            let tile = this.map.getTile(x, y, this.blockLayer)
            return tile === null? null : this.gid_to_name[tile.index]
        }
    }

    let resized = false

    export class LevelSelectState extends Phaser.State {
        preload() {
            this.load.image('planet-green', IMAGE_FOLDER + 'planet-green.png')
        }

        create() {
            this.stage.smoothed = false;
            this.stage.backgroundColor = '#000';

            if (!resized) {
                this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE
                this.game.scale.setUserScale(ZOOM, ZOOM, 0, 0)
                this.game.scale.refresh();

                resized = true
            }

            this.input.onTap.add(this.onTap, this)

            let sprite = this.add.sprite(0, 0, 'planet-green');
        }

        onTap(position: Phaser.Pointer) {
            this.game.state.start("GameState", true, false);
        }
    }

    export class SimpleGame extends Phaser.Game {
        constructor() {
            super(320, 320, Phaser.WEBGL, 'content', null, false, false)

            this.state.add("GameState", GameState, false);
            this.state.add("LevelSelectState", LevelSelectState, false);
            this.state.start("GameState", true, false);
        }

        boot() {
            super.boot()

            Phaser.Canvas.setImageRenderingCrisp(this.canvas)
        }
    }
}

window.onload = () => {
    let game = new SmallWorldGame.SimpleGame();
};