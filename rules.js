let inventory = {
    catFood: 3,
    key: false
};

let gameState = {
    searched: {},
    fedSpots: {},
    foundFoodSpots: {},
    talked: {},
    catsAppeared: false,
    gameWon: false
};

class Start extends Scene {
    create() {
        this.engine.setTitle(this.engine.storyData.Title);
        this.engine.show(this.engine.storyData.Intro);
        this.engine.addChoice("Begin");
    }

    handleChoice() {
        this.engine.gotoScene(Location, this.engine.storyData.InitialLocation);
    }
}

class Location extends Scene {
    create(key) {
        this.key = key;
        let locationData = this.engine.storyData.Locations[key];

        this.engine.show("<hr>");
        this.engine.show("<h2>" + key + "</h2>");

        if (locationData.Image) {
            this.engine.show(`<img src="${locationData.Image}" style="max-width:700px; width:100%; display:block; margin:12px 0; border-radius:12px;" referrerpolicy="no-referrer">`);
        }

        this.engine.show(locationData.Body);
        this.engine.show(`<p><b>Inventory</b>: Cat Food x${inventory.catFood} | Key: ${inventory.key ? "Yes" : "No"}</p>`);

        if (locationData.NPC) {
            this.engine.show(`<p><b>NPC here:</b> ${locationData.NPC.name}</p>`);
            this.engine.addChoice(`Talk to ${locationData.NPC.name}`, { type: "talk" });
        }

        if (locationData.searchable) {
            this.engine.addChoice("Search / Look closer", { type: "search" });
        }

        if (locationData.foodSpot) {
            this.engine.addChoice("Place cat food", { type: "feed" });
        }

        if (locationData.Choices) {
            for (let choice of locationData.Choices) {
                this.engine.addChoice(choice.Text, { type: "move", choice: choice });
            }
        } else {
            this.engine.addChoice("Finish", { type: "finish" });
        }
    }

    handleChoice(data) {
        let locationData = this.engine.storyData.Locations[this.key];

        if (data.type === "talk") {
            if (locationData.NPC && locationData.NPC.dialogue) {
                this.engine.show(`<p><b>${locationData.NPC.name}:</b> ${locationData.NPC.dialogue}</p>`);
            }
            gameState.talked[this.key] = true;
            this.engine.gotoScene(Location, this.key);
            return;
        }

        if (data.type === "search") {
            if (!gameState.searched[this.key]) {
                gameState.searched[this.key] = true;

                if (locationData.searchText) {
                    this.engine.show(locationData.searchText);
                } else {
                    this.engine.show("You carefully inspect the area, but nothing important stands out.");
                }

                if (locationData.findsFoodSpot) {
                    gameState.foundFoodSpots[this.key] = true;
                }

                if (locationData.givesKey && !inventory.key) {
                    inventory.key = true;
                    this.engine.show("You obtained a key.");
                }
            } else {
                if (locationData.repeatSearchText) {
                    this.engine.show(locationData.repeatSearchText);
                } else {
                    this.engine.show("You already checked here.");
                }
            }

            this.engine.gotoScene(Location, this.key);
            return;
        }

        if (data.type === "feed") {
            if (!locationData.foodSpot) {
                this.engine.show("This is not a good place to leave cat food.");
                this.engine.gotoScene(Location, this.key);
                return;
            }

            if (!gameState.foundFoodSpots[this.key]) {
                this.engine.show("You are not confident enough yet. Maybe search here first.");
                this.engine.gotoScene(Location, this.key);
                return;
            }

            if (gameState.fedSpots[this.key]) {
                this.engine.show("You have already placed cat food here.");
                this.engine.gotoScene(Location, this.key);
                return;
            }

            if (inventory.catFood <= 0) {
                this.engine.show("You do not have any cat food left.");
                this.engine.gotoScene(Location, this.key);
                return;
            }

            inventory.catFood -= 1;
            gameState.fedSpots[this.key] = true;
            this.engine.show("You place one portion of cat food here and wait quietly.");

            let fedCount = Object.keys(gameState.fedSpots).length;

            if (fedCount === 3 && !gameState.catsAppeared) {
                gameState.catsAppeared = true;
                inventory.key = true;
                this.engine.show("Three cats emerge from different corners of Mondstadt.");
                this.engine.show("One of them drops a small key before running toward a hidden path.");
            }

            this.engine.gotoScene(Location, this.key);
            return;
        }

        if (data.type === "move") {
            let choice = data.choice;

            if (choice.requiresCats && !gameState.catsAppeared) {
                this.engine.show("Nothing happens yet. It feels like you still need to set up the cat food in the correct places.");
                this.engine.gotoScene(Location, this.key);
                return;
            }

            if (choice.locked && !inventory.key) {
                this.engine.show("This path is locked.");
                this.engine.gotoScene(Location, this.key);
                return;
            }

            if (choice.Target === "Sweet Cat-Cat Vase") {
                gameState.gameWon = true;
                this.engine.gotoScene(End);
                return;
            }

            this.engine.show("&gt; " + choice.Text);
            this.engine.gotoScene(Location, choice.Target);
            return;
        }

        if (data.type === "finish") {
            this.engine.gotoScene(End);
        }
    }
}

class End extends Scene {
    create() {
        this.engine.show("<hr>");
        if (gameState.gameWon) {
            this.engine.show("Inside the hidden cat space, you finally find the missing tavern cat curled up safely. You bring it back to the Cat's Tail and complete the request.");
        } else {
            this.engine.show("The story ends here.");
        }
        this.engine.show(this.engine.storyData.Credits);
    }
}

Engine.load(Start, "myStory.json");