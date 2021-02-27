// Aliases
var Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Rectangle = PIXI.Rectangle,
    Sprite = PIXI.Sprite,
    Graphics = PIXI.Graphics,
    Text = PIXI.Text,
    MovieClip = PIXI.extras.MovieClip,
    ParticleContainer = PIXI.ParticleContainer,
    TilingSprite = PIXI.extras.TilingSprite,
    Point = PIXI.Point,
    Rope = PIXI.mesh.Rope;

// Containers
var app = autoDetectRenderer(960, 512);
document.body.appendChild(app.view);
var stage = new Container();

var b = new Bump(PIXI);
var su = new SpriteUtilities(PIXI);
var d = new Dust(PIXI);
var c = new Charm(PIXI);
var t = new Tink(PIXI, app.view);

loader
    .add("images/pixiePerilousness.json")
    .load(setup);

var id, sky, blocks, gapSize, numberOfPillars, blocks, block, finish, pixieFrames, pixie, pointer, dustFrames, particleStream, pixieVsBlock;

function setup() {
    id = resources["images/pixiePerilousness.json"].textures;

    //sky
    sky = new TilingSprite(
        id["clouds.png"],
        app.width,
        app.height
    );
    stage.addChild(sky);

    //blocks
    blocks = new Container();
    stage.addChild(blocks);
    gapSize = 4;
    numberOfPillars = 15;
    for (var i = 0; i < numberOfPillars; i++) {
        var startGapNumber = randomInt(0, 8 - gapSize);
        if (i > 0 && i % 5 === 0) { gapSize -= 1 };
        for (var j = 0; j < 8; j++) {
            if (j < startGapNumber || j > startGapNumber + gapSize - 1) {
                block = su.sprite(id["greenBlock.png"]);
                blocks.addChild(block);
                block.x = (i * 384) + 512;
                block.y = j * 64;
            };
        };
        if (i === numberOfPillars - 1) {
            finish = su.sprite(id["finish.png"]);
            blocks.addChild(finish);
            finish.x = (i * 384) + 896;
            finish.y = 192;
        };
    };

    //pixie
    pixieFrames = [
        id["0.png"],
        id["1.png"],
        id["2.png"]
    ];
    pixie = su.sprite(pixieFrames);
    stage.addChild(pixie);
    pixie.fps = 24;
    pixie.position.set(232, 32);
    pixie.vy = 0;
    pixie.oldVy = 0;


    //pointer
    pointer = t.makePointer();
    pointer.tap = function () { pixie.vy += 1.5 };

    //dust
    dustFrames = [
        id["pink.png"],
        id["yellow.png"],
        id["green.png"],
        id["violet.png"]
    ];
    particleStream = d.emitter(
        300,
        () => d.create(
            pixie.x + 8,
            pixie.y + pixie.height / 2,
            () => su.sprite(dustFrames),
            stage,
            3,
            0,
            true,
            2.4, 3.6,
            18, 24,
            2, 3,
            0.005, 0.01,
            0.005, 0.01,
            0.05, 0.1
        )
    );

    state = play;
    gameLoop();
};

function gameLoop() {
    requestAnimationFrame(gameLoop);
    state();
    t.update();
    d.update();
    app.render(stage);
};

function play() {
    sky.tilePosition.x -= 1;

    if (finish.getGlobalPosition().x > 256) { blocks.x -= 2 };

    pixie.vy += -0.05;
    pixie.y -= pixie.vy;

    if (pixie.vy > pixie.oldVy) {
        if (!pixie.animation) {
            pixie.playAnimation();
            if (pixie.visible && !particleStream.playing) { particleStream.play() };
        };
    };
    if (pixie.vy < 0 && pixie.oldVy > 0) {
        if (pixie.animation) { pixie.stopAnimation() };
        pixie.show(0);
        if (particleStream.playing) { particleStream.stop() };
    };
    pixie.oldVy = pixie.vy;

    var pixieVsCanvas = b.contain(pixie, {
        x: 0,
        y: 0,
        width: app.width,
        height: app.height
    });
    if (pixieVsCanvas) {
        if (pixieVsCanvas.has("bottom") || pixieVsCanvas.has("top")) {
            pixie.vy = 0;
        }
    };

    pixieVsBlock = blocks.children.some(block => {
        return b.hitTestRectangle(pixie, block, true);
    });

    if (pixieVsBlock && pixie.visible) {
        pixie.visible = false;
        d.create(
            pixie.centerX, pixie.centerY,
            function () { return su.sprite(dustFrames) },
            stage,
            20,
            0,
            false,
            0, 6.28,
            16, 32,
            1, 3
        );
        particleStream.stop();
        wait(3000).then(function () { return reset() });
    };
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function wait() {
    var duration = arguments[0] === undefined ? 0 : arguments[0];
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, duration);
    });
};

function reset() {
    pixie.visible = true;
    pixie.y = 32;
    particleStream.play();
    blocks.x = 0;
};