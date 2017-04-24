/// <reference path='bower_components/phaser/typescript/phaser.d.ts' />
// import * as Phaser from 'phaser'

module SmallWorldGame {

    const ZOOM = 2
    const TILE_SIZE = 42
    const PLANET_SIZE = 320
    const TILES = 5
    const PADDING = 2
    const IMAGE_FOLDER = 'images/'
    const MARGIN = (PLANET_SIZE - TILES * TILE_SIZE) / 2

    export class Level {
        index: number
        title: string = null
        data: string = ''
        is_grass: boolean = true
        messages: string[] = []

        constructor(index: number) {
            this.index = index
        }
    }

    function parseLevels(data: string) {
        let result: Level[] = []
        let level: Level = new Level(0)
        let index = 0
        let lines = data.split('\n')
        let lineCount = 0
        let is_grass = true
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.indexOf('message ') === 0) {
                let message = line.substring(8).trim()
                level.messages.push(message)
            } else if (line.trim()) {
                if (line[0] != '(') {
                    level.data += (level.data ? '\n' : '') + line
                    if (++lineCount == 5) {
                        result.push(level)
                        level = new Level(++index)
                        level.is_grass = is_grass
                        lineCount = 0
                    }
                } else if (line[1] === '>') {
                    if (line[2] === 'G') {
                        level.is_grass = is_grass = true
                    }
                    else if (line[2] === 'D') {
                        level.is_grass = is_grass = false
                    }
                }
            }
        }
        if (level.messages.length > 0) {
            result.push(level)
        }
        return result
    }

    const TUTORIAL_LEVELS_RAW = `
( Tutorial)
message You need to balance the ecosystem of this small world and make sure no animal starves.
message You can move animals next to their food source.

message Giraffes like to eat from trees.

P....
..&..
.....
..G..
.....

message Hippos need to be next to water.

P..__
...__
...._
.C...
.....


message Two animal cannot use the same food source.

P...%
.G&..
..G..
.....
...&.

message Lions eat giraffes and hippos.
message Lions are extra hungry and need two food sources.

P.&%L
.....
....C
G...%
.._.%

message Vultures can feed off any animal and can fly.
message Vultures eat what is left by other hunters.

P.&.G
.G...
%..L&
___..
.T._.

message Mice and grasshoppers need to be on lush grass lands.

P....
.##..
..#%%
M.%.#
.%.H#

message Monkeys like to eat from trees, shrubs or grasshoppers.
message Monkeys want variety.

P..K%
....%
.&...
..$..
.K.._

message Snakes eat mice, but some other animals are afraid of snakes.

%%%%%
_.#P%
_.#K&
...M%
SH.%%

message Birds eat grasshoppers and can fly.

P....
__.B.
M___.
.H.__
##.S_

message Antelopes eat grass or shrubs.

P.$$.
.A.A.
..A..
..#.$
.#...

message Leopards like to eat antelopes or monkeys.
message Leopards are fast, so they have a higher range.

P....
...F.
____%
.A#.%
.....

message Now you know about all the animals of this small world.
message Time to balance the ecosystem!
`

    export const TUTORIAL_LEVELS = parseLevels(TUTORIAL_LEVELS_RAW)

    const ACTUAL_LEVELS_RAW = `
(Actual levels)
(>D)
message The desert has spread.

R-J#J
-#---
---.-
--.#-
:II-:

R--Q-
-&..-
--$.E
--.#-
-N---


R--U:
&K$.&
--..-
-F-.-
----:

R----
-B.S-
-..%-
-###-
-QW--

R-D--
---&-
&G&C.
-..LG
-&G._

R---:
--:.%
&L&C_
--.-.
--&GG

(>G)
message The rain has made the desert green again.

$-.H-
.#.KK
$P.._
..__.
&_B#.

P%%G&
..%.&
%.L..
%.&&%
TT.G%

P&%G&
..&.%
%.L..
&.%&%
TT.G&

PS.B_
AC#.T
&.#K$
.FL.#
_HMGC

message You have balanced the ecosystem of this small world!
message All the animals are happy and thrive. Yay!
message THE END
`

    export const ACTUAL_LEVELS = parseLevels(ACTUAL_LEVELS_RAW)

    const ALL_LEVELS: [string, boolean, Level[]][] = [
        ['Tutorial', true, TUTORIAL_LEVELS],
        ['Desert Planet', false, ACTUAL_LEVELS],
    ]

    const ANIMALS = [
        'lion', 'giraffe', 'mouse', 'grasshopper', 'bird', 'snake',
        'vulture', 'monkey', 'antelope', 'leopard', 'hippo'
    ]

    const ANIMAL_META = {
        'lion': ["Lion", "Lions eat hippos and giraffes.\nLions are extra hungry."],
        'giraffe': ["Giraffe", "Giraffes eat leafs from trees."],
        'mouse': ["Mouse", "Mice like to hide in high grass."],
        'grasshopper': ["Grasshopper", "Grasshoppers like to hide in high grass"],
        'bird': ["Bird", "Birds eat grasshoppers.\nBirds can fly."],
        'snake': ["Snake", "Snakes eat mice.\nSome animals are afraid of snakes."],
        'vulture': ["Vulture", "Vultures can feed off any animal and can fly. They eat carrion."],
        'monkey': ["Monkey", "Monkeys eat from trees and shrubs and grasshoppers. They like food variety."],
        'antelope': ["Antelope", "Antelopes eat grass or shrubs."],
        'leopard': ["Leopard", "Leopards eat monkeys or antelopes. Leopards are fast."],
        'hippo': ["Hippo", "Hippos like to be next to water."],
    }

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

    export class GameState extends Phaser.State {
        message_box_title: Phaser.Text;
        message_box_text: Phaser.Text;
        message_box: Phaser.Group;
        blinds: Phaser.Graphics;
        back_button: Phaser.Button;
        text_message: Phaser.Text;
        text_group: Phaser.Group;
        message_index: number;
        planet: number;
        game: Phaser.Game
        level: Level
        map: Phaser.Tilemap
        name_to_gid: { [name: string]: number } = {}
        gid_to_name: { [gid: number]: string } = {}
        floorLayer: Phaser.TilemapLayer
        blockLayer: Phaser.TilemapLayer
        active: Phaser.Tile = null
        selector: Phaser.Sprite
        happy: boolean[][]
        happyGroup: Phaser.Group
        all_happy: boolean

        constructor() {
            super()
        }

        init(planet: number, index: number) {
            this.planet = planet
            this.level = ALL_LEVELS[planet][2][index]
            this.happy = new Array(TILES);
            for (var i = 0; i < TILES; i++) {
                this.happy[i] = new Array(TILES);
            }
            this.message_index = 0
        }

        preload() {
            this.load.atlasJSONArray('tiles', IMAGE_FOLDER + 'tiles.png', IMAGE_FOLDER + 'tiles.json')
            this.load.image('planet-green', IMAGE_FOLDER + 'planet-green.png')
            this.load.image('planet-yellow', IMAGE_FOLDER + 'planet-yellow.png')
            this.load.image('planet-border', IMAGE_FOLDER + 'planet-border.png')
            this.load.image('message-box', IMAGE_FOLDER + 'message-box.png')
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

            if (this.level.data) {
                let sprite = this.add.sprite(0, 0, this.level.is_grass ? 'planet-green' : 'planet-yellow');
                let border = this.add.sprite(0, 0, 'planet-border');
            }

            this.back_button = this.add.button(0, 0, 'tiles', () => {
                this.game.state.start('LevelSelectState', true, false, this.planet)
            }, 'button-back', 'button-back', 'button-back', 'button-back')

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
            this.add.tween(this.selector).to({ alpha: 0.7 }, 400, 'Linear', true, 0, -1, true);
            this.selector.visible = false
            this.blockLayer = this.map.createBlankLayer('block', TILES, TILES, TILE_SIZE, TILE_SIZE, group)
            this.happyGroup = this.add.group()

            this.message_box = this.add.group()
            this.add.sprite(0, 0, 'message-box', null, this.message_box)
            this.message_box_title = this.add.text(0, 0, '', {
                font: '16px Minecraft',
                fill: '#FFFFFF',
                align: 'left'
            }, this.message_box)
            this.message_box_title.setTextBounds(5, PLANET_SIZE - 65, PLANET_SIZE - 10, 20)
            this.message_box_text = this.add.text(0, 0, '', {
                font: '14px Minecraft',
                fill: '#000000',
                wordWrap: true,
                wordWrapWidth: PLANET_SIZE - 10,
                align: 'left'
            }, this.message_box)
            this.message_box_text.setTextBounds(5, PLANET_SIZE - 45, PLANET_SIZE - 10, 40)
            this.message_box.visible = false

            this.blinds = this.add.graphics(0, 0);
            this.blinds.beginFill(0x000, 0.9);
            this.blinds.drawRect(0, 0, PLANET_SIZE, PLANET_SIZE)
            this.blinds.alpha = 0

            this.text_group = this.add.group()

            this.text_message = this.add.text(0, 0, '', {
                font: '20px Minecraft',
                fill: '#FFFFFF',
                boundsAlignH: 'center',
                boundsAlignV: 'middle',
                wordWrap: true,
                wordWrapWidth: PLANET_SIZE,
                align: 'center'
            }, this.text_group)
            this.text_message.setTextBounds(0, 0, PLANET_SIZE, PLANET_SIZE)

            let text_continue = this.add.text(0, 0, 'Click to continue', {
                font: '14px Minecraft',
                fill: '#FFFFFF',
                boundsAlignH: 'center',
                boundsAlignV: 'middle'
            }, this.text_group)
            text_continue.setTextBounds(0, PLANET_SIZE - 30, PLANET_SIZE, 30)
            text_continue.alpha = 0.8

            this.updateMessage()
            this.parseLevel()
            this.updateHappyness()
        }

        shutdown() {
        }

        update() {
            this.game.input.update()
        }

        completeLevel() {
            console.log('complete!')
            setCompletion(this.planet, this.level.index)
            if (this.level.index < ALL_LEVELS[this.planet][2].length - 1) {
                this.game.state.start('GameState', true, false, this.planet, this.level.index + 1)
            } else {
                let next_level = Math.min(this.planet + 1, ALL_LEVELS.length - 1)
                this.game.state.start('LevelSelectState', true, false, next_level)
            }
            this.game.state.checkState
        }

        updateMessage() {
            if (this.message_index >= this.level.messages.length) {
                if (this.level.data) {
                    this.text_group.visible = false
                    this.back_button.inputEnabled = true
                    this.add.tween(this.blinds).to({ alpha: 0 }, 300, 'Linear', true)
                } else {
                    this.completeLevel()
                }
            } else {
                this.text_group.visible = true
                this.text_message.text = this.level.messages[this.message_index]
                this.back_button.inputEnabled = false
                this.blinds.alpha = 1
            }
        }

        onTap(position: Phaser.Pointer) {
            if (this.message_index < this.level.messages.length) {
                this.message_index++
                this.updateMessage()
            } else {
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
        }

        onKey(dx: number, dy: number): () => void {
            return function () {
                if (this.active !== null) {
                    let sx = this.active.x
                    let sy = this.active.y
                    let tx = sx + dx
                    let ty = sy + dy
                    if (tx >= 0 && tx < TILES && ty >= 0 && ty < TILES) {
                        let sourceBlock = this.getBlockTileNameAt(sx, sy)
                        let sourceFloor = this.getFloorTileNameAt(sx, sy)
                        let targetBlock = this.getBlockTileNameAt(tx, ty)
                        let targetFloor = this.getFloorTileNameAt(tx, ty)
                        let any_water = sourceFloor === 'water' || targetFloor === 'water'
                        let need_swap = ANIMALS.indexOf(sourceBlock) !== -1 && ANIMALS.indexOf(targetBlock) !== -1
                        let blocked = targetBlock !== null && ANIMALS.indexOf(targetBlock) === -1
                        let flying = (sourceBlock === 'bird' || sourceBlock === 'vulture') &&
                                    (targetBlock === 'bird' || targetBlock === 'vulture' || targetBlock === null)

                        if (!any_water || flying) {
                            if (need_swap) {
                                this.active = this.map.putTile(this.name_to_gid[sourceBlock], tx, ty, this.blockLayer)
                                this.map.putTile(this.name_to_gid[targetBlock], sx, sy, this.blockLayer)
                            } else if (!blocked) {
                                this.active = this.map.putTile(this.name_to_gid[sourceBlock], tx, ty, this.blockLayer)
                                this.map.removeTile(sx, sy, this.blockLayer)
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
                this.message_box.visible = true
                let [title, message] = ANIMAL_META[this.gid_to_name[this.active.index]]
                this.message_box_title.text = title
                this.message_box_text.text = message
            } else {
                this.selector.visible = false
                this.message_box.visible = false
            }

            this.updateHappyness()
            if (this.all_happy) {
                this.add.tween(this.blinds).to({ alpha: 1 }, 500, 'Linear', true);
                this.game.time.events.add(500, () => { this.completeLevel() }, this);
            }
        }

        parseLevel() {
            if (!this.level.data) return
            let lines = this.level.data.split('\n')
            for (let y = 0; y < TILES; y++) {
                for (let x = 0; x < TILES; x++) {
                    let [is_grass, floor, block] = TILE_MAP[lines[y][x]]
                    if (is_grass === null) {
                        is_grass = this.level.is_grass
                    }
                    if (is_grass !== this.level.is_grass) {
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
                                    vultures[vultures.length - 1][1].push(other_id)
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
            this.all_happy = true
            let eaten = []
            for (let i = 0; i < eaters.length; i++) {
                let [id, x, y] = eaters[i]
                // Hungry
                if (matching[id] === null) {
                    this.happy[y][x] = false
                    if (id.indexOf('vulture') !== 0) {
                        this.all_happy = false
                    }
                } else {
                    eaten.push(matching[id])
                }
                // Desert
                let floor = this.getFloorTileNameAt(x, y)
                if (floor === 'desert' || (floor === null && !this.level.is_grass) || floor == 'water') {
                    this.happy[y][x] = false
                    this.all_happy = false
                }
                // Monkey variety
                if ((id in variety) && (variety[id].size < 2)) {
                    this.happy[y][x] = false
                    this.all_happy = false
                }
                // Snake
                if (snake[id]) {
                    this.happy[y][x] = false
                    this.all_happy = false
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
                this.all_happy = this.all_happy && !hungry
            }
            this.renderHappyness()
        }

        renderHappyness() {
            this.happyGroup.removeAll()

            for (let y = 0; y < TILES; y++) {
                for (let x = 0; x < TILES; x++) {
                    if (this.happy[y][x] !== null) {
                        this.add.sprite(MARGIN + x * TILE_SIZE, MARGIN + y * TILE_SIZE, 'tiles', this.happy[y][x] ? 'happy' : 'sad', this.happyGroup)
                    }
                }
            }
        }

        getFloorTileNameAt(x: number, y: number) {
            let tile = this.map.getTile(x, y, this.floorLayer)
            let result = null
            if (tile !== null) {
                result = this.gid_to_name[tile.index]
                if (result === undefined) {
                    result = null
                }
            }
            return result
        }

        getBlockTileNameAt(x: number, y: number) {
            let tile = this.map.getTile(x, y, this.blockLayer)
            return tile === null ? null : (this.gid_to_name[tile.index] || null)
        }
    }

    let resized = false

    export class LevelSelectState extends Phaser.State {
        planet: number

        init(planet: number) {
            this.planet = planet || 0
        }

        preload() {
            this.load.atlasJSONArray('tiles', IMAGE_FOLDER + 'tiles.png', IMAGE_FOLDER + 'tiles.json')
            this.load.image('planet-green', IMAGE_FOLDER + 'planet-green.png')
            this.load.image('planet-yellow', IMAGE_FOLDER + 'planet-yellow.png')
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

            let [name, is_grass, levels] = ALL_LEVELS[this.planet]
            let sprite = this.add.sprite(0, 0, is_grass ? 'planet-green' : 'planet-yellow');

            if (this.planet > 0) {
                this.add.button(0, (PLANET_SIZE - TILE_SIZE) / 2, 'tiles', () => {
                    this.game.state.start('LevelSelectState', true, false, this.planet - 1)
                }, 'button-back', 'button-back', 'button-back', 'button-back')
            }
            if (this.planet < ALL_LEVELS.length - 1) {
                let button = this.add.button(PLANET_SIZE - TILE_SIZE / 2, PLANET_SIZE / 2, 'tiles', () => {
                    this.game.state.start('LevelSelectState', true, false, this.planet + 1)
                }, 'button-back', 'button-back', 'button-back', 'button-back')
                button.anchor.set(0.5, 0.5)
                button.scale.x = - 1
            }

            let title = this.add.text(0, 0, name, {
                font: '22px Minecraft',
                fill: '#000000',
                boundsAlignH: 'center',
                boundsAlignV: 'middle'
            })
            title.setTextBounds(0, 0, 320, 60)

            let style = {
                font: '22px Minecraft',
                fill: 'white',
                boundsAlignH: 'center',
                boundsAlignV: 'middle'
            }

            let any_uncompleted = false
            levels.forEach((level, i) => {
                if (!level.data) return;
                let x = MARGIN + (i % 5) * (TILE_SIZE + PADDING) - 2 * PADDING
                let y = MARGIN + Math.floor(i / 5) * (TILE_SIZE + PADDING) - 2 * PADDING

                let button = this.add.button(x, y, 'tiles', this.levelSelect(i), this, 'button-hover', 'button', 'button', 'button')
                let completed = getCompletion(this.planet, i)

                if (!completed) {
                    button.alpha = 0.5
                    if (!any_uncompleted) {
                        this.add.tween(button).to({ y: '-2' }, 200, 'Linear', true, 0, -1, true);
                        button.alpha = 1
                        any_uncompleted = true
                    }
                }

                let label = new Phaser.Text(this.game, 0, 0, (i + 1) + '', style);
                label.setTextBounds(0, 0, 44, 48)
                button.addChild(label);
            })
        }

        levelSelect(level) {
            return function () {
                this.game.state.start('GameState', true, false, this.planet, level)
            }
        }
    }

    function getCompletion(planet, index) {
        let completion = (window.localStorage.getItem('completion') || '').split(',')
        let id = planet + '-' + index
        return completion && completion.indexOf(id) !== -1
    }

    function setCompletion(planet, index) {
        let completion = (window.localStorage.getItem('completion') || '').split(',')
        let id = planet + '-' + index
        if (completion.indexOf(id) === -1) {
            completion.push(id)
        }
        window.localStorage.setItem('completion', completion.join(','))
    }

    export class SimpleGame extends Phaser.Game {
        constructor() {
            super(320, 320, Phaser.WEBGL, 'content', null, false, false)

            this.state.add('GameState', GameState, false);
            this.state.add('LevelSelectState', LevelSelectState, false);
            this.state.start('LevelSelectState', true, false);
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