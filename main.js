// Initialize Kaplay
kaplay({
    width: 320 * 2,
    height: 240 * 2,
    background: [0, 0, 0], // Changed to dark blue for visibility
    backgroundAudio: true,
    global: true,
    // crisp: true, // Use crisp pixel rendering
});

// --- Asset Loading ---
loadMusic("song", "./src/SunsShadow.mp3");
const music = play("song");
music.speed = 1;
music.volume = 0.5; // Start with some volume
music.loop = true;
music.paused = false; // Ensure music starts playing


const effects = {
    "shake": () => {
        shake();
    },
};

loadSprite("Map0002", "./src/sprites/Map0002.png");
loadSprite("Map0033", "./src/sprites/Map0033.png");
loadSprite("Map0032", "./src/sprites/Map0032.png");
loadSprite("Map0035", "./src/sprites/Map0035.png");

const backgroundMaps = [
    "Map0002", "Map0033", "Map0033", "Map0033", "Map0033", "Map0032", "Map0035",
];

let char_num = 48; // Noel

loadSprite("char", "./src/sprites/char.png", {
    sliceX: 12,
    sliceY: 8,
    anims: {
        "idle-up": 1 + char_num,
        "walk-up": { from: 0 + char_num, to: 2 + char_num, loop: true, speed: 6 },
        "idle-right": 13 + char_num,
        "walk-right": { from: 12 + char_num, to: 14 + char_num, loop: true, speed: 6 },
        "idle-down": 25 + char_num,
        "walk-down": { from: 24 + char_num, to: 26 + char_num, loop: true, speed: 6 },
        "idle-left": 37 + char_num,
        "walk-left": { from: 36 + char_num, to: 38 + char_num, loop: true, speed: 6 },
    },
});

const SPEED = 250; // Adjusted speed slightly
const playerComponents = () => [
    sprite("char"),
    area({ shape: new Rect(vec2(0, 0), 8, 8) }), // Adjusted collision shape a bit
    body({ mass: 10, jumpForce: 0 }),
    anchor("center"),
    scale(2),
    z(10),
    "player",
];


const avatarComponents = () => [
    sprite("n_t_bikkuri"),
    scale(2),
    anchor("center"),
    pos(center().sub(0, -50)),
    z(99)
];

// Although characters object exists, it's not used for the initial dialog yet
loadSprite("n_t_bikkuri", "./src/picture/n_t_bikkuri.png")
const characters = {
    "n_t_bikkuri": { "sprite": "char", "name": "n_t_bikkuri" },
    "mark": { "sprite": "char", "name": "Mark" },
};

const spawnPoints = {
    0: { from_1: vec2(4, 13), default: vec2(9.5, 8.5) },
    1: { from_0: vec2(9, 6), from_5: vec2(2, 7), default: vec2(3, 7) },
    2: {}, 3: {}, 4: {},
    5: { from_1: vec2(18, 14), default: vec2(1, 1) } // Added default for level 5
};

// Remove Dialog UI elements from global scope
let curDialog = 0; 
let isTalking = false; 
let intro = true
let dialogs = [["", ""]]

// --- Main Game Scene ---
scene("main", (targetLevelIdx = 0, sourceLevelIdx = null) => { // Default targetLevelIdx to 0

    // Ensure levelIdx is valid
    targetLevelIdx = targetLevelIdx % backgroundMaps.length;

    // Add background
    add([
        sprite(backgroundMaps[targetLevelIdx]),
        pos(0, 0),
        scale(width() / 320, height() / 240),
        z(-1),
    ]);

    // Level layout definitions
    const levels = [
        [ /* Level 0 data */
            "                 ",
            "                 ",
            "                 ",
            "wwwwwhwwwwwwwwwwww", // Added h for testing half-wall
            "whhhh     hhhhh w",
            "w               w",
            "w               wwww",
            "w     w w       w  w",
            "w     www       w  w",
            "w     www          w",
            "w               wwww",
            "w              ww",
            "w              ww",
            "whhw  w        ww",
            "wwww11wwwwwwwwwww",
        ],
        [ /* Level 1 data */
            "                            ",
            "                            ",
            "                            ",
            "                            ",
            "                            ",
            "wwwwwwwww1wwwwwwwwwwwwwwwwww",
            " 5                         w",
            " 5                         w",
            " 5                         w",
            " 5                         w",
            " 5                         w",
            "wwwwwwwwwwwwwwwwwwwwwwwwwwww",
        ],
        [], [], [], // Placeholder for levels 2, 3, 4
        [ /* Level 5 data */
            "                ",
            "                ",
            "                ",
            "                ",
            "   wwwwwwwwwwwww",
            "   ww        hhw",
            "   w           w",
            "   w           w",
            "   wwww     wwww",
            "   wwww     wwww",
            "   w  b     d  w",
            "   w           wwww",
            "   w     w         5",
            "   w    www        5",
            "   w   wwwww       5",
            "   w    www        5",
            "   w     w         5",
            "   w           wwww",
            "   w           w   ",
            "   wwwwwwwwwwwww",
        ],
    ];

    // Tile definitions
    const levelConf = {
        tileWidth: 32,
        tileHeight: 32,
        pos: vec2(0, 0),
        tiles: {
            "w": () => [ rect(32, 32), color(64, 64, 128), opacity(0.0), area(), body({ isStatic: true }), tile({ isObstacle: true }), "wall" ],
            "h": () => [ rect(32, 16), color(64, 64, 128), opacity(0.0), area(), body({ isStatic: true }), tile({ isObstacle: true }), "wall" ],
            "b": () => [ rect(16, 32), color(64, 64, 128), opacity(0.0), pos(16, 0), area(), body({ isStatic: true }), tile({ isObstacle: true }), "wall" ],
            "d": () => [ rect(16, 32), color(64, 64, 128), opacity(0.0), area(), body({ isStatic: true }), tile({ isObstacle: true }), "wall" ],
            "1": () => [ rect(32, 32), color(255, 0, 0), opacity(0.0), area(), body({ isStatic: true }), tile({ isObstacle: true }), "door1" ],
            "5": () => [ rect(32, 32), color(0, 255, 0), opacity(0.0), area(), body({ isStatic: true }), tile({ isObstacle: true }), "door5" ],
        },
    };

    // Add the level to the scene
    const map = addLevel(levels[targetLevelIdx], levelConf);

    // --- Player Spawning ---
    const sourceKey = `from_${sourceLevelIdx}`;
    let spawnTilePos = spawnPoints[targetLevelIdx]?.[sourceKey];
    if (!spawnTilePos) {
        spawnTilePos = spawnPoints[targetLevelIdx]?.default;
    }
    if (!spawnTilePos) {
        console.warn(`No spawn data found for level ${targetLevelIdx}, defaulting to tile (1, 1)`);
        spawnTilePos = vec2(1, 1);
    }

    const levelOrigin = levelConf.pos;
    const tileWidth = levelConf.tileWidth;
    const tileHeight = levelConf.tileHeight;
    const tileWorldPos = levelOrigin.add(vec2(spawnTilePos.x * tileWidth, spawnTilePos.y * tileHeight));
    // Center anchor within the tile: Add half tile size
    const spawnWorldPos = tileWorldPos.add(vec2(tileWidth / 2, tileHeight / 2));

    const player = add([
        ...playerComponents(),
        pos(spawnWorldPos),
        z(10),
    ]);

    // --- Player Movement and Animation Logic ---
    let currentDir = "down";
    player.play(`idle-${currentDir}`); // Play initial animation

    const dirs = {
        "w": vec2(0, -1), "ArrowUp": vec2(0, -1),
        "a": vec2(-1, 0), "ArrowLeft": vec2(-1, 0),
        "s": vec2(0, 1), "ArrowDown": vec2(0, 1),
        "d": vec2(1, 0), "ArrowRight": vec2(1, 0),
    };

    const keyToDir = {
        "w": "up", "ArrowUp": "up",
        "a": "left", "ArrowLeft": "left",
        "s": "down", "ArrowDown": "down",
        "d": "right", "ArrowRight": "right",
    };

    const keysPressed = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

    onKeyDown((key) => {
        if (key in dirs) {
            keysPressed[key] = true;
            if (keyToDir[key]) currentDir = keyToDir[key];
        }
    });

    onKeyRelease((key) => {
        if (key in dirs) keysPressed[key] = false;
    });

    // --- Dialog UI (Created within the scene) ---
    let isTalking = false;
    let currentWritingLoop = null; // To manage the writing effect loop

    const dialogBoxPadding = 10;
    const dialogBoxWidth = width() - dialogBoxPadding * 2;
    const dialogBoxHeight = 100; // Reduced height a bit

    const textbox = add([
        rect(dialogBoxWidth, dialogBoxHeight, { radius: 6 }),
        anchor("center"),
        pos(center().x, height() - dialogBoxHeight / 2 - dialogBoxPadding), // Position bottom center
        outline(1, YELLOW), // Black outline
        fixed(),           // Stick to screen
        z(100),
        opacity(0),        // Start hidden
        color(BLACK),
        "dialogUI"         // Tag for cleanup
    ]);

    const txt = add([
        text("", {
            size: 28, // Slightly smaller text
            width: dialogBoxWidth - 30, // Padding inside box
            align: "left",
            lineSpacing: 4,
            styles: { // Keep your styles
                 "default": { color: WHITE },
                 "kaplay": (idx, ch) => ({ color: Color.fromHex("#6bc96c"), pos: vec2(0, wave(-2, 2, time() * 6 + idx * 0.5)) }),
                 "kaboom": (idx, ch) => ({ color: Color.fromHex("#ff004d"), pos: vec2(0, wave(-3, 3, time() * 4 + idx * 0.5)), scale: wave(1, 1.1, time() * 3 + idx), angle: wave(-5, 5, time() * 3 + idx) }),
                 "surprised": (idx, ch) => ({ color: Color.fromHex("#8465ec"), scale: wave(1, 1.1, time() * 1 + idx), pos: vec2(0, wave(0, 2, time() * 10)) }),
                 "hot": (idx, ch) => ({ color: Color.fromHex("#ff004d"), scale: wave(1, 1.1, time() * 3 + idx), angle: wave(-5, 5, time() * 3 + idx) }),
            },
            // Use opacity transform for fade-in effect
            transform: (idx, ch) => ({
                 opacity: idx < txt.letterCount ? 1 : 0,
            }),
        }),
        pos(textbox.pos), // Position with textbox
        anchor("center"),
        fixed(),          // Stick to screen
        z(101),           // Above textbox
        opacity(0),       // Start hidden
        { letterCount: 0 },
        "dialogUI"
    ]);

    const avatar = add([
        ...avatarComponents(),
        opacity(0.0),
    ])

    // --- Dialog Functions (defined within the scene) ---
    function startWriting(char, dialog) { // char currently unused, but kept for structure
        if (isTalking) return; // Prevent starting multiple dialogs at once

        console.log("Starting dialog:", dialog); // Debug log
        isTalking = true;
        textbox.opacity = 0.5; // Make box visible
        txt.opacity = 1;     // Make text area visible
        txt.letterCount = 0; // Reset letter count
        txt.text = dialog;   // Set the full text content

        // Cancel any previous writing loop
        if (currentWritingLoop) {
            currentWritingLoop.cancel();
        }

        // Start the typewriter effect loop
        currentWritingLoop = loop(0.04, () => { // Slightly faster typing
            txt.letterCount = Math.min(
                txt.letterCount + 1,
                txt.renderedText.length // Use renderedText length for accuracy with styling
            );

            // Optional: Add typing sound here using 'char' if needed
            // play(characters[char]?.sound || "default_typing", { volume: 0.2 });

            // When all letters are shown
            if (txt.letterCount === txt.renderedText.length) {
                isTalking = false; // Finished talking
                currentWritingLoop.cancel(); // Stop this loop
                currentWritingLoop = null;
                console.log("Dialog finished writing."); // Debug log
            }
        });
    }



    function updateDialog() {
        // Call startWriting with the desired initial message
        // Using "bean" as placeholder character key, though not used yet
        const [char, dialog] = dialogs[curDialog]

        avatar.use(opacity(1.0));
        startWriting(char, dialog);
        // if (eff) { effects[eff](); } // Keep effects if you need them
    }
    function introDialog(){
        if (intro) {
            dialogs = [
                ["n_t_bikkuri", "[default]Press space for continue.[/default]"],
                ["n_t_bikkuri", "[default]Press K for Play/Stop music.[/default]"]
            ]
            updateDialog()
            // startWriting("[default]Press space for continue.[/default]", "bean");
            // startWriting("[default]Press K for Play/Stop music.[/default]", "bean");
            intro = false
            
        }
    }

    // --- Input and Updates ---

    // Use space to interact with dialog OR pause music
    onKeyPress("space", () => {
        curDialog = (curDialog + 1);
        if (isTalking) {
            // If currently typing, skip to the end
            txt.letterCount = txt.renderedText.length;
            isTalking = false;
            if (currentWritingLoop) {
                currentWritingLoop.cancel();
                currentWritingLoop = null;
            }
            console.log("Dialog skipped.");
        } else if (curDialog >= dialogs.length) {
            // If dialog is visible and finished typing, hide it
            textbox.opacity = 0;
            txt.opacity = 0;
            txt.text = ""; // Clear text
            avatar.use(opacity(0))
            console.log("Dialog closed.");
        }else {
            updateDialog()
        }
        if (music.paused) {
            music.paused = !music.paused;
        }

    });
    onKeyPress("k", () => {
        music.paused = !music.paused;
    })


    player.onUpdate(() => {
        // Prevent player movement while dialog is showing
        let moveVec = vec2(0, 0);
        if (textbox.opacity === 0) { // Only allow movement if dialog is hidden
            for (const key in keysPressed) {
                if (keysPressed[key] && dirs[key]) {
                    moveVec = moveVec.add(dirs[key]);
                }
            }
            if (moveVec.len() > 0) {
                moveVec = moveVec.unit();
            }
        }

        const isMoving = moveVec.len() > 0;

        if (isMoving) {
            if (player.curAnim() !== `walk-${currentDir}`) {
                player.play(`walk-${currentDir}`);
            }
            player.move(moveVec.scale(SPEED));
        } else {
            if (player.curAnim() !== `idle-${currentDir}`) {
                player.play(`idle-${currentDir}`);
            }
        }

        // Camera follows player
        camPos(player.worldPos());
    });

    // --- Collisions ---
    const currentLevelIdxForCallback = targetLevelIdx; // Capture current level index for callbacks

    player.onCollide("door1", () => {
        if (isTalking) return; // Don't transition if talking
        if (currentLevelIdxForCallback === 0) go("main", 1, 0);
        else if (currentLevelIdxForCallback === 1) go("main", 0, 1);
    });

    player.onCollide("door5", () => {
        if (isTalking) return; // Don't transition if talking
        if (currentLevelIdxForCallback === 1) go("main", 5, 1);
        else if (currentLevelIdxForCallback === 5) go("main", 1, 5);
    });

    // --- Position Display ---
    const posText = add([
        text("Pos: (0, 0)", { size: 16 }),
        pos(10, 10),
        fixed(),
        z(110), // Above dialog
        color(255, 255, 255),
    ]);

    posText.onUpdate(() => {
        const playerTileX = Math.floor(player.pos.x / levelConf.tileWidth);
        const playerTileY = Math.floor(player.pos.y / levelConf.tileHeight);
        posText.text = `Tile: (${playerTileX}, ${playerTileY})\nPrss K for Play/Stop music`;
    });

    // --- Initial Dialog Call ---
    // Call updateDialog slightly after the scene starts to ensure everything is ready
    wait(0.1, introDialog);

    // --- Scene Cleanup ---
     onSceneLeave(() => {
        // Destroy dialog UI elements when leaving the scene
        destroyAll("dialogUI");
        // Cancel any ongoing writing loop to prevent errors
        if (currentWritingLoop) {
            currentWritingLoop.cancel();
        }
        console.log("Cleaned up dialog UI for scene leave.");
    });

}); // End of scene("main", ...)

// Start the game
go("main", 0); // Start at level 0, source is null (implies initial start)

onLoad(() => {
    wait(0.1, updateDialog);
    // updateDialog();
});