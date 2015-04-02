///<reference path="../lib/node.d.ts"/>
///<reference path="../typings/mocha/mocha.d.ts" />
///<reference path="../typings/chai/chai.d.ts" />
///<reference path="../lib/collections.d.ts"/>

import A = require('../astar/AStar');
import chai = require('chai');

module AStarPuzzle {

  class PuzzleState implements A.AS.Heuristic {
    puzzle: number[][];
    g: number;

    // Manhattan distance (admissible heuristic)
    heuristic(goal: PuzzleState) {
      var sum = 0;
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
          if(goal[i][j] !== this.puzzle[i][j]) {
            sum += manhattanDistance(goal[i][j], this.puzzle, j, i);
          }
        }
      }
      return sum;
    }

    cost() {
      return this.g;
    }

    match(goal: PuzzleState) {
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
          if(goal[i][j] !== this.puzzle[i][j])
            return false;
        }
      }
      return true;
    }

    expand(): PuzzleState[] {
      var index = emptyCell(this.puzzle);
      var x = index[0];
      var y = index[1];
      var states = [];
      if(x && y) { // empty cell found
        var puzzles = validPuzzles(this.puzzle, x, y);
        for(var i=0; i<puzzles.length; i++) {
          if(puzzles[i])
            states.push(new PuzzleState(puzzles[i], this.cost() + 1));
        }
      }
      return states;
    }

    hash() {
      return 0;
    }

    constructor(state: number[][], cost: number) {
      this.puzzle = state;
      this.g = cost;
    }

  }


  //////////////////////////////////////////////////////////////////////
  // private functions

  function manhattanDistance(n: number, state: number[][], x: number, y: number): number {
    var x0, y0;
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        if(state[i][j] === n) {
          x0 = j;
          y0 = i;
        }
      }
    }
    return Math.abs(x-x0) + Math.abs(y-y0);
  }

  // Returns index of empty cells position
  function emptyCell(state: number[][]) : number[] {
    for (var y = 0; y < 3; y++) {
      for (var x = 0; x < 3; x++) {
        if(state[y][x] === 0) // empty cell
          return [x, y];
      }
    }
    return []; // no empty cell found
  }

  function swapTile(puzzle: number[][], i, j, k, l): number[][] {
    if(k >= 0 && k <= 2 && l >= 0 && l <= 2) {
      var copy = copy(puzzle);
      copy[j][i] = copy[l][k];
      copy[l][k] = 0;
      return copy;
    }
  }

  function validPuzzles(puzzle: number[][], x: number, y: number): number[][][] {
    var puzzles = [];
    puzzles.push(swapTile(puzzle, x, y, x+1, y)); // left
    puzzles.push(swapTile(puzzle, x, y, x, y-1)); // up
    puzzles.push(swapTile(puzzle, x, y, x-1, y)); // right
    puzzles.push(swapTile(puzzle, x, y, x, y+1)); // down
    return puzzles;
  }

  function copy(puzzle: number[][]): number[][] {
    var copy = [];
    for(var i=0; i<puzzle.length; i++) {
      copy[i] = puzzle[i].slice(0); // returns a shallow copy
    }
    return copy;
  }

  var expect = chai.expect;

  describe('8-puzzle', () => {
    describe('Find the shortest path to goal state', () => {
      it('should find the solution in #of moves', (done) => {
        var puzzle = [[7, 2, 4], [5, 0, 6], [8, 3, 1]];
        var goal   = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
        var start = new PuzzleState(puzzle, 0);
        var end = new PuzzleState(goal, null);
        var path = A.AS.search(start, end);
        console.log(path);

        done();
      });
    });
  });

}
