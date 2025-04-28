const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Game variables
let game = new Phaser.Game(config);
let currentRecipe;
let selectedIngredients = [];
let correctIngredients = 0;
let errors = 0;
let maxErrors = 4;
let score = 0;
let timeLeft = 30;
let timer;
let timerText;
let scoreText;
let errorText;
let progressBar;
let progressText;
let recipesDone = 0;
let totalRecipes = 10;
let shuffledRecipes = [];
let ingredientGrid = [];

function preload() {
    // Load background
    this.load.image('background_Game', 'assets/bg.png');
    this.load.image('background_Start', 'assets/bgStart.png');
    this.load.image('background_GameOver', 'assets/bgGameOver.png');
    this.load.image('background_Win', 'assets/bgWin.png');
    this.load.image('copy', 'assets/Copy.png');

    // Load recipe images
    recipes.forEach(recipe => {
        this.load.image(`recipe_${recipe.id}`, recipe.image);
        
        // Load ingredient images
        recipe.ingredients.forEach((ingredient, index) => {
            this.load.image(`recipe_${recipe.id}_ingredient_${index + 1}`, ingredient);
        });
    });
}

function create() {

    const width = this.scale.width;
    const height = this.scale.height;
    // Add background
    //this.add.image(0, 0, 'background_Start').setDisplaySize(1280, 720);
    // Aggiungi l'immagine e imposta l'origine in alto a sinistra
    const background = this.add.image(0, 0, 'background_Start').setOrigin(0);

    // Ridimensiona l'immagine per occupare tutto lo schermo
    background.setDisplaySize(width, height);   
        
    // Initialize game state
    this.gameState = 'start';
    
    // Create start screen
    createStartScreen.call(this);
}

function update() {
    if (this.gameState === 'playing' && timeLeft <= 0) {
        timeUp.call(this);
    }
}

function createStartScreen() {
    // Title
    const titleText = this.add.text(config.width / 2, config.height / 5, 'Caccia agli Ingredienti con Sanji', {
        fontFamily: 'Arial',
        fontSize: '45px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
    }).setOrigin(0.5);

    // Game instructions text
    const instructionsText = this.add.text(config.width / 2, config.height / 3, 
        'Viene presentato un piatto delizioso e la tua sfida è individuare tutti gli ingredienti utilizzati per prepararlo.\n Fai attenzione ai dettagli: solo i veri intenditori riusciranno a indovinarli tutti!', {
            fontFamily: 'Arial',
        fontSize: '18px',
        fontStyle: 'italic',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: config.width * 0.8 }
    }).setOrigin(0.5).setShadow(2, 2, '#000000', 2, false, true);

    instructionsText.setText('');
    const fullText = 'Viene presentato un piatto delizioso e la tua sfida è individuare tutti gli ingredienti utilizzati per prepararlo.\n Fai attenzione ai dettagli: solo i veri intenditori riusciranno a indovinarli tutti!';
    let i = 0;

    this.time.addEvent({
        delay: 30,
        repeat: fullText.length - 1,
        callback: () => {
            instructionsText.text += fullText[i];
            i++;
        }
    });

    const copyImage = this.add.image(config.width / 2, config.height - 25, 'copy')
    .setOrigin(0.5)
    .setScale(0.35); // Adjust scale as needed for your image

    //const Copyright = this.add.text(config.width / 2, config.height -50 , '(C) Eiichiro Oda/Shueisha, Toei Animation', {
    //    fontFamily: '"Comic Neue", cursive',
    //    fontSize: '15px', // Increased from 80px to 120px
    //    color: '#ffffff',
    //    stroke: '#000000',
    //    strokeThickness: 3
    //}).setOrigin(0.5);
        
    // Start button
    // Create a container for the button and text to make them work together
    const buttonContainer = this.add.container(640, 400);
    
    // Button background
    const buttonBg = this.add.rectangle(0, 0, 200, 80, 0x00ff00, 0.6);
    buttonBg.setStrokeStyle(4, 0x006600);
    
    // Start button text
    const startButton = this.add.text(0, 0, 'START', {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#004400',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add both to container
    buttonContainer.add([buttonBg, startButton]);
    
    // Make the container interactive
    buttonContainer.setInteractive(new Phaser.Geom.Rectangle(-100, -40, 200, 80), Phaser.Geom.Rectangle.Contains);
    
    // Button hover effect
    buttonContainer.on('pointerover', function() {
        buttonBg.setFillStyle(0x00ff00, 0.8);
    });
    
    buttonContainer.on('pointerout', function() {
        buttonBg.setFillStyle(0x00ff00, 0.6);
    });
    
    // Start game on click
    buttonContainer.on('pointerdown', function() {
        startGame.call(this);
    }, this);
    
    // Include instructionsText and Copyright in the elements to be destroyed
    this.startScreenElements = [titleText, buttonContainer,  copyImage];
}

function startGame() {
    
    // Clear start screen
    this.startScreenElements.forEach(element => element.destroy());
    
    // Initialize game variables
    score = 0;
    recipesDone = 0;
    errors = 0;
    
    // Shuffle recipes
    shuffledRecipes = Phaser.Utils.Array.Shuffle([...recipes]);
    
    // Set game state to playing
    this.gameState = 'playing';
    
    // Change background to game background
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const background = this.add.image(0, 0, 'background_Game').setOrigin(0);
    background.setDisplaySize(width, height);
    
    // Create game UI
    createGameUI.call(this);
    
    // Start first recipe
    startNextRecipe.call(this);
}

function createGameUI() {



    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

 
    this.add.rectangle(width/2, 40, width, 110, 0x16213e).setOrigin(0.5, 0.5).setAlpha(0.5);

    // Score text
    scoreText = this.add.text(20, 20, 'Punteggio: 0', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
    });
    
    // Error text
    errorText = this.add.text(20, 60, 'Errori: 0/' + maxErrors, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
    });
    
    // Timer text
    timerText = this.add.text(1100, 20, 'Tempo: 30', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
    });
    
    // Progress text
    progressText = this.add.text(640, 20, 'Ricetta: 1/' + totalRecipes, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(0.5, 0);
    
    // Progress bar background
    this.add.rectangle(640, 60, 400, 20, 0x000000, 0.5).setOrigin(0.5, 0.5);
    
    // Progress bar
    progressBar = this.add.rectangle(440, 60, 0, 16, 0x00ff00).setOrigin(0, 0.5);
}

function startNextRecipe() {
    // Reset for new recipe
    selectedIngredients = [];
    correctIngredients = 0;
    timeLeft = 30;
    
    // Clear previous ingredients
    ingredientGrid.forEach(item => {
        if (item) item.destroy();
    });
    ingredientGrid = [];
    
    // Check if we've completed all recipes
    if (recipesDone >= totalRecipes) {
        gameOver.call(this);
        return;
    }
    
    // Get next recipe
    currentRecipe = shuffledRecipes[recipesDone];
    recipesDone++;
    
    // Update progress
    progressText.setText('Ricetta: ' + recipesDone + '/' + totalRecipes);
    progressBar.width = (recipesDone - 1) / totalRecipes * 400;
    
    // Create a container for the recipe image with shadow
    const imageContainer = this.add.container(180, 250);
    
    // Add shadow rectangle (slightly offset and larger than the image)
    const shadow = this.add.rectangle(6, 6, 310, 310, 0x000000, 0.4);
    
    // Add recipe image
    const recipeImage = this.add.image(0, 0, `recipe_${currentRecipe.id}`).setDisplaySize(300, 300);

    // Add both to container (shadow first so it appears behind the image)
    imageContainer.add([shadow, recipeImage]);
    
    // Display recipe name below the image (moved slightly lower)
    const recipeName = this.add.text(180, 440, currentRecipe.name, {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5);
    
    // Create ingredient grid
    createIngredientGrid.call(this);
    
    // Start timer
    if (timer) timer.remove();
    timer = this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });
    
    // Add to elements to clear later
    ingredientGrid.push(recipeName, imageContainer);
}

function createIngredientGrid() {
    // Get correct ingredients for current recipe
    const correctIngredientsArray = currentRecipe.ingredients.map((path, index) => {
        return {
            path: path,
            key: `recipe_${currentRecipe.id}_ingredient_${index + 1}`,
            isCorrect: true
        };
    });
    
    // Get wrong ingredients from other recipes
    let wrongIngredientsArray = [];
    recipes.forEach(recipe => {
        if (recipe.id !== currentRecipe.id) {
            recipe.ingredients.forEach((path, index) => {
                wrongIngredientsArray.push({
                    path: path,
                    key: `recipe_${recipe.id}_ingredient_${index + 1}`,
                    isCorrect: false
                });
            });
        }
    });
    
    // Shuffle and take 12 wrong ingredients
    wrongIngredientsArray = Phaser.Utils.Array.Shuffle(wrongIngredientsArray).slice(0, 12);
    
    // Combine and shuffle all ingredients
    const allIngredients = Phaser.Utils.Array.Shuffle([...correctIngredientsArray, ...wrongIngredientsArray]);
    
    // Create 4x4 grid
    const gridStartX = 450;
    const gridStartY = 170; // Moved up from 180
    const itemWidth = 140;
    const itemHeight = 140;
    const padding = 20;
    
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const index = row * 4 + col;
            if (index < allIngredients.length) {
                const ingredient = allIngredients[index];
                const x = gridStartX + col * (itemWidth + padding);
                const y = gridStartY + row * (itemHeight + padding);
                
                const ingredientSprite = this.add.image(x, y, ingredient.key)
                    .setDisplaySize(itemWidth, itemHeight)
                    .setInteractive();
                
                // Add data to sprite
                ingredientSprite.isCorrect = ingredient.isCorrect;
                ingredientSprite.selected = false;
                
                // Add click handler
                ingredientSprite.on('pointerdown', function() {
                    selectIngredient.call(this.scene, ingredientSprite);
                });
                
                ingredientGrid.push(ingredientSprite);
            }
        }
    }
}

function selectIngredient(ingredient) {
    // Ignore if already selected
    if (ingredient.selected) return;
    
    // Mark as selected
    ingredient.selected = true;
    
    if (ingredient.isCorrect) {
        // Correct ingredient
        //gredient.setTint(0x00ff00);
        
        // Create emboss/relief effect with a glow and shadow
        // First add a glow effect
        const glow = this.add.graphics();
        glow.fillStyle(0x00ff00, 0.3);
        glow.fillCircle(ingredient.x, ingredient.y, ingredient.displayWidth/1.8);
        
        // Add a highlight on top-left
        const highlight = this.add.graphics();
        highlight.fillStyle(0xffffff, 0.5);
        highlight.fillCircle(ingredient.x - ingredient.displayWidth/4, 
                             ingredient.y - ingredient.displayHeight/4, 
                             ingredient.displayWidth/6);
        
        // Add both to the grid for cleanup
        ingredientGrid.push(glow, highlight);
        
        correctIngredients++;
        
        // Check if all correct ingredients found
        if (correctIngredients >= 4) {
            recipeComplete.call(this);
        }
    } else {
        // Wrong ingredient
        //ingredient.setTint(0xff0000);
        
        // Add red border to highlight wrong selection
        const border = this.add.graphics();
        border.lineStyle(3, 0xff0000);
        // Calculate the top-left corner of the border rectangle
        const borderX = ingredient.x - (ingredient.displayWidth / 2) - 4;
        const borderY = ingredient.y - (ingredient.displayHeight / 2) - 4;
        border.strokeRect(borderX, borderY, ingredient.displayWidth + 8, ingredient.displayHeight + 8);
        ingredientGrid.push(border); // Add to grid so it gets cleared with other elements
        
        // Make the ingredient transparent
        ingredient.setAlpha(0.7);
        
        errors++;
        errorText.setText('Errori: ' + errors + '/' + maxErrors);
        
        // Shake effect for wrong selection
        this.tweens.add({
            targets: ingredient,
            x: ingredient.x + 10,
            duration: 50,
            yoyo: true,
            repeat: 3
        });
        
        // Check if max errors reached
        if (errors >= maxErrors) {
            gameOver.call(this);
        }
    }
}

function updateTimer() {
    timeLeft--;
    timerText.setText('Tempo: ' + timeLeft);
    
    if (timeLeft <= 0) {
        timer.remove();
    }
}

function timeUp() {
    // Time's up, move to next recipe
    startNextRecipe.call(this);
}

function recipeComplete() {
    // Stop timer
    timer.remove();
    
    // Add score
    score += 10;
    scoreText.setText('Punteggio: ' + score);
    
    // Show success message
    const successText = this.add.text(640, 360, 'Ottimo!', {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#00aa00',
        strokeThickness: 6
    }).setOrigin(0.5);
    
    // Animate success message
    this.tweens.add({
        targets: successText,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        onComplete: function() {
            successText.destroy();
            startNextRecipe.call(this.parent.scene);
        }
    });
}

function gameOver() {
    // Stop timer
    if (timer) timer.remove();
    
    // Clear game elements
    ingredientGrid.forEach(item => {
        if (item) item.destroy();
    });

    this.children.removeAll(true);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const bgKey = recipesDone < 10 ? 'background_GameOver' : 'background_Win';
    const TextGameOver = recipesDone < 10 ? 'Game Over' : 'Hai Vinto!';

    // Aggiungi l'immagine e imposta l'origine in alto a sinistra
    const background = this.add.image(0, 0, bgKey).setOrigin(0);
    // Ridimensiona l'immagine per occupare tutto lo schermo
    background.setDisplaySize(width, height);   
    
    // Set game state
    this.gameState = 'gameover';
    
    // Game over text
    this.add.text(640, 260, TextGameOver, {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#ff0000',
        strokeThickness: 6
    }).setOrigin(0.5);
    
    // Final score
    this.add.text(640, 340, 'Punteggio Finale: ' + score, {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5);
    
    // Create a container for the button and text to make them work together
    const buttonContainer = this.add.container(640, 440);
    
    // Button background
    const buttonBg = this.add.rectangle(0, 0, 450, 80, 0x00ff00, 0.6);
    buttonBg.setStrokeStyle(4, 0x006600);
    
    // Restart button text
    const restartButton = this.add.text(0, 0, 'Nuova partita', {
        fontFamily: 'Arial',
        fontSize: '30px',
        color: '#004400',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add both to container
    buttonContainer.add([buttonBg, restartButton]);
    
    // Make the container interactive
    buttonContainer.setInteractive(new Phaser.Geom.Rectangle(-100, -40, 200, 80), Phaser.Geom.Rectangle.Contains);
    
    // Button hover effect
    buttonContainer.on('pointerover', function() {
        buttonBg.setFillStyle(0x00ff00, 0.8);
    });
    
    buttonContainer.on('pointerout', function() {
        buttonBg.setFillStyle(0x00ff00, 0.6);
    });
    
    // Restart game on click
    buttonContainer.on('pointerdown', function() {
        this.scene.restart();
    }, this);
}