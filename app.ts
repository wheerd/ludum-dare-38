/// <reference path="bower_components/phaser/typescript/phaser.d.ts" />
// import * as Phaser from 'phaser'

const ZOOM = 2
const TILE_SIZE = 42
const PLANET_SIZE = 320
const TILES = 5
const PADDING = 2
const IMAGE_FOLDER = "images/"

module SmallWorldGame {

    export class GameState extends Phaser.State {
        game: Phaser.Game
        level: string

        constructor() {
            super()
        }

        init(level: string) {
            this.level = level
        }

        preload() {
            this.load.atlasJSONHash('animals', IMAGE_FOLDER + 'animals.png', IMAGE_FOLDER + 'animals.json')
            this.load.image('planet-green', IMAGE_FOLDER + 'planet-green.png')
        }

        create() {
            let sprite = this.add.sprite(0, 0, 'planet-green');
        }

        shutdown() {
        }

        update() {
            this.game.input.update()
        }

        onTap(position: Phaser.Pointer) {
        }

        onKey(dx: number, dy: number): () => void {
            return function () {
                if (this.selectedTile) {
                    this.tryMoveTile(this.selectedTile.x + dx, this.selectedTile.y + dy, false)
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
            this.state.start("LevelSelectState", true, false);
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