/// <reference path="bower_components/phaser/typescript/phaser.d.ts" />
// import * as Phaser from 'phaser'

const ZOOM = 2
const TILE_SIZE = 42
const PLANET_SIZE = 320
const TILES = 5
const PADDING = 2
const IMAGE_FOLDER = "images/"
const MARGIN = (PLANET_SIZE - TILES * TILE_SIZE) / 2

let level = `P....
..&..
.D..#
..G..
...__`

const ANIMALS = [
    'lion', 'giraffe'
]

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

    // . = Background
    // # = Grass
    // % = Rock
    // : = Rock and Desert
    // & = Tree
    // $ = Shrub
    // _ = Lake
    // - = Desert

    // P = PlayerInactive
    // R = PlayerInactive and Desert

    // L = HungryLion
    // D = HungryLion and Desert
    // G = HungryGiraffe
    // E = HungryGiraffe and Desert
    // M = HungryMouse
    // W = HungryMouse and Desert
    // H = HungryGrasshopper
    // Q = HungryGrasshopper and Desert
    // B = HungryBird
    // S = HungrySnake
    // T = HungryVulture
    // U = HungryVulture and Desert
    // O = HungrySkunk
    // K = HungryMonkey
    // N = HungryMonkey and Desert
    // A = HungryAntelope
    // I = HungryAntelope and Desert
    // F = HungryLeopard
    // J = HungryLeopard and Desert
    // C = HungryHippo
}

module SmallWorldGame {

    export class GameState extends Phaser.State {
        game: Phaser.Game
        level: string
        map: Phaser.Tilemap
        name_to_gid: { [name: string]: number } = {}
        gid_to_name: { [gid: number]: string } = {}
        floorLayer: Phaser.TilemapLayer
        blockLayer: Phaser.TilemapLayer
        active: Phaser.Tile = null
        selector: Phaser.Sprite
        happy: boolean[][]
        eaters: number[][]

        constructor() {
            super()
        }

        init(level: string) {
            this.level = level
            this.happy = new Array(TILES);
            for (var i = 0; i < TILES; i++) {
                this.happy[i] = new Array(TILES);
            }
            this.eaters = new Array(TILES);
            for (var i = 0; i < TILES; i++) {
                this.eaters[i] = new Array(TILES);
            }
        }

        preload() {
            this.load.atlasJSONArray('animals', IMAGE_FOLDER + 'animals.png', IMAGE_FOLDER + 'animals.json')
            this.load.atlasJSONArray('environment', IMAGE_FOLDER + 'environment.png', IMAGE_FOLDER + 'environment.json')
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
            let ets = this.map.addTilesetImage('environment', 'environment')
            let e_gid = ets.firstgid
            let a_gid = this.map.addTilesetImage('animals', 'animals', TILE_SIZE, TILE_SIZE, 0, 0, ets.firstgid + ets.total).firstgid
            this.cache.getFrameData('environment').getFrames().forEach((frame, i) => {
                let name = frame.name.substr(0, frame.name.length - 4)
                this.name_to_gid[name] = i + e_gid
                this.gid_to_name[i + e_gid] = name
            })
            this.cache.getFrameData('animals').getFrames().forEach((frame, i) => {
                let name = frame.name.substr(0, frame.name.length - 4)
                this.name_to_gid[name] = i + a_gid
                this.gid_to_name[i + a_gid] = name
            })
            this.floorLayer = this.map.createBlankLayer('floor', TILES, TILES, TILE_SIZE, TILE_SIZE, group)
            this.selector = this.add.sprite(0, 0, 'environment', 4, group)
            this.selector.centerX = TILE_SIZE / 2
            this.selector.centerY = TILE_SIZE / 2
            this.add.tween(this.selector).to({ alpha: 0.7 }, 400, "Linear", true, 0, -1, true);
            this.selector.visible = false
            this.blockLayer = this.map.createBlankLayer('block', TILES, TILES, TILE_SIZE, TILE_SIZE, group)

            this.parseLevel(level, true)
        }

        shutdown() {
        }

        update() {
            this.game.input.update()

            if (this.active !== null) {
            }
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
                        let floorTile = this.map.getTile(tx, ty, this.floorLayer)
                        let blockTile = this.map.getTile(tx, ty, this.blockLayer)
                        if (floorTile === null || this.gid_to_name[floorTile.index] != 'water') {
                            if (blockTile === null) {
                                this.active = this.map.putTile(this.active, tx, ty, this.blockLayer)
                                this.map.removeTile(sx, sy, this.blockLayer)
                            }
                            else if (ANIMALS.indexOf(this.gid_to_name[blockTile.index]) !== -1) {
                                let old = blockTile.index
                                this.active = this.map.putTile(this.active, tx, ty, this.blockLayer)
                                this.map.putTile(old, sx, sy, this.blockLayer)
                            }
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
        }

        parseLevel(level: string, grass_planet: boolean) {
            let lines = level.split('\n')
            for (let y = 0; y < TILES; y++) {
                for (let x = 0; x < TILES; x++) {
                    let [is_grass, floor, block] = TILE_MAP[lines[y][x]]
                    if (is_grass === null) {
                        is_grass = grass_planet
                    }
                    if (is_grass !== grass_planet) {
                        console.log('!', is_grass, grass_planet)
                        floor = is_grass ? 'grass-patch' : 'desert'
                    }
                    if (floor !== null) {
                        console.log(lines[y][x], floor)
                        console.log(this.name_to_gid[floor])
                        this.map.putTile(this.name_to_gid[floor], x, y, this.floorLayer)
                    }
                    if (block !== null) {
                        this.map.putTile(this.name_to_gid[block], x, y, this.blockLayer)
                    }
                }
            }
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