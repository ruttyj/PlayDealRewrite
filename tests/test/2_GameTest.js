const { assert } = require('chai');
const { describe, it } = require('mocha');

const Game = require('../../src/Game');
const Turn = require('../../src/turn/Turn');
const runThisTest = true;

const log = (item) => {
  console.log(JSON.stringify(item))
}

const makeCashOnlyGame = () => {
  const game = new Game();
  game.setSeed('test');
  game.setScenario(Game.SCENARIO_CASH_ONLY);

  game.addPlayer();
  game.addPlayer();

  game.start();

  return game;
}
 
const makePropertyOnlyGame = () => {
  const game = new Game();
  game.setSeed('test');
  game.setScenario(Game.SCENARIO_PROPERTY_ONLY);

  game.addPlayer();
  game.addPlayer();

  game.start();

  return game;
}

if(runThisTest) {

  describe("PlayDeal Game", () => {

    it('Should deal 5 cards to each player', () => {
      const game = makeCashOnlyGame();

      const player1Id = 1;
      const player2Id = 2;

      
      const deck = game.getDeck();

      // deck should be shuffled
      const expectedDeckOrder = JSON.stringify([16,7,9,18,15,5,17,6,1,3]);
      assert.equal(JSON.stringify(deck.getAllCardIds()), expectedDeckOrder);

      // Players should have their hands
      const player1Hand = game.getPlayerHand(player1Id);
      const player2Hand = game.getPlayerHand(player2Id);
      assert.equal(JSON.stringify(player1Hand.getAllCardIds()), '[13,19,4,14,8]');
      assert.equal(JSON.stringify(player2Hand.getAllCardIds()), '[10,2,12,11,20]');
    });

    it('Happy Path - Loop through turn phases and player turns', () => {
      const game = makeCashOnlyGame();
      const turnManager = game.getTurnManager();

      // Get first player
      // Cycle through phases
      if(1) {
        const turn = turnManager.getTurn();
        assert.equal(turn.getPlayerId(), 1);
        assert.equal(turn.getPhase(), Turn.PHASE_DRAW);
        turn.nextPhase();
        assert.equal(turn.getPhase(), Turn.PHASE_ACTION);
        turn.nextPhase();
        assert.equal(turn.getPhase(), Turn.PHASE_DONE);
      }
      
      // try going to next turn
      if(1) {
        turnManager.nextTurn();
        const turn = turnManager.getTurn();
        assert.equal(turn.getPlayerId(), 2);
      }

      // should circle around to the first player
      if(1) {
        turnManager.nextTurn();
        const turn = turnManager.getTurn();
        assert.equal(turn.getPlayerId(), 1);
      }
    });

    it('Deal turn starting cards', () => {
      const game = makeCashOnlyGame();
      const turnManager = game.getTurnManager();
      const turn = turnManager.getTurn();
      const playerId = turn.getPlayerId();
      const playerManager = game.getPlayerManager();
      const playerHand = playerManager.getPlayerHand(playerId);

      game.dealTurnStartingCards();

      assert.equal(turn.getPlayerId(), 1);
      assert.equal(JSON.stringify(playerHand.getAllCardIds()), '[13,19,4,14,8,3,1]');
      assert.equal(turn.getPhase(), Turn.PHASE_ACTION);

      // Attempt to be cheekey and draw again
      game.dealTurnStartingCards();
      assert.equal(turn.getPlayerId(), 1);
      assert.equal(JSON.stringify(playerHand.getAllCardIds()), '[13,19,4,14,8,3,1]');
      assert.equal(turn.getPhase(), Turn.PHASE_ACTION);
    });

    it('Place card in bank from hand', () => {
      const game = makeCashOnlyGame();
      const turnManager = game.getTurnManager();
      const turn = turnManager.getTurn();
      const playerId = turn.getPlayerId();
      const playerManager = game.getPlayerManager();

      game.dealTurnStartingCards();

      const playerHand = playerManager.getPlayerHand(playerId);
      const playerBank = playerManager.getPlayerBank(playerId);

      // Action 1
      game.playCardToBankFromHand(19);
      assert.equal(JSON.stringify(playerHand.getAllCardIds()), '[13,4,14,8,3,1]');
      assert.equal(JSON.stringify(playerBank.getAllCardIds()), '[19]');
      assert.equal(turn.getActionCount(), 1);
      assert.equal(turn.getPhase(), Turn.PHASE_ACTION);

      // Action 2
      game.playCardToBankFromHand(13);
      assert.equal(JSON.stringify(playerHand.getAllCardIds()), '[4,14,8,3,1]');
      assert.equal(JSON.stringify(playerBank.getAllCardIds()), '[19,13]');
      assert.equal(turn.getActionCount(), 2);
      assert.equal(turn.getPhase(), Turn.PHASE_ACTION);

      // Action 3
      game.playCardToBankFromHand(1);
      assert.equal(JSON.stringify(playerHand.getAllCardIds()), '[4,14,8,3]');
      assert.equal(JSON.stringify(playerBank.getAllCardIds()), '[19,13,1]');
      assert.equal(turn.getActionCount(), 3);
      assert.equal(turn.getPhase(), Turn.PHASE_DONE);

      // Attempt to play one more than we have actions for
      game.playCardToBankFromHand(3);
      assert.equal(JSON.stringify(playerHand.getAllCardIds()), '[4,14,8,3]');
      assert.equal(JSON.stringify(playerBank.getAllCardIds()), '[19,13,1]');
      assert.equal(turn.getActionCount(), 3);
      assert.equal(turn.getPlayerId(), 1);
      assert.equal(turn.getPhase(), Turn.PHASE_DONE);
    });

    it('Deal property cards add two cards to a new collection', () => {
      const game = makePropertyOnlyGame();
      const turnManager = game.getTurnManager();
      const playerManager = game.getPlayerManager();

      game.dealTurnStartingCards();
      const turn = turnManager.getTurn();
      const playerId = turn.getPlayerId();
      const playerHand = playerManager.getPlayerHand(playerId);

      // Create new collection
      game.playCardToNewCollectionFromHand(4);
      const collection = playerManager.getCollection(1);
      assert.equal(JSON.stringify(playerHand.getAllCardIds()), '[25,3,14,22,21,27]');
      assert.equal(JSON.stringify(collection.getAllCardIds()), '[4]');
      assert.equal(collection.getPlayerId(), 1);
      assert.equal(collection.getActiveSet(), 'green');

      // Add to existing collection
      game.playCardToExistingCollectonFromHand(3, collection.getId());
      assert.equal(JSON.stringify(playerHand.getAllCardIds()), '[25,14,22,21,27]');
      assert.equal(JSON.stringify(collection.getAllCardIds()), '[4,3]');
      assert.equal(collection.getActiveSet(), 'green');

      assert.equal(turn.getActionCount(), 2);
    })

    it('Transfer from one collection to a new collection', () => {
      const game = makePropertyOnlyGame();
      const playerManager = game.getPlayerManager();

      game.dealTurnStartingCards();

      // Create new collection
      game.playCardToNewCollectionFromHand(4);

      // Transfer to a new collection
      game.transferCardToNewCollectionFromCollection(1, 4);

      // confirm card transfered
      const collectionB = playerManager.getCollection(2);
      assert.equal(JSON.stringify(collectionB.getAllCardIds()), '[4]');

      // confirm old collection deleted
      const collectionA = playerManager.getCollection(1);
      assert.equal(collectionA, null);
    })

    it('Transfer from one collection to a existing collection', () => {
      const game = makePropertyOnlyGame();
      const playerManager = game.getPlayerManager();
  
      game.dealTurnStartingCards();
  
      // Create new collection
      game.playCardToNewCollectionFromHand(4);
      game.playCardToExistingCollectonFromHand(3, 1);
  
      // Transfer to a new collection
      game.transferCardToNewCollectionFromCollection(1, 4);
      game.transferCardToExistingCollectionFromCollection(1, 3, 2);
  
      // confirm card transfered
      const collectionB = playerManager.getCollection(2);
      assert.equal(JSON.stringify(collectionB.getAllCardIds()), '[4,3]');
      assert.equal(collectionB.getActiveSet(), 'green');

      // confirm old collection deleted
      const collectionA = playerManager.getCollection(1);
      assert.equal(collectionA, null);
    })

  })
}
