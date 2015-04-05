///<reference path="../lib/node.d.ts"/>
///<reference path="../lib/collections.d.ts"/>

import C = require('../lib/collections');

export module AS { // AStar


  // export function key<T extends Heuristic>(state: A.AStarTest.CityState, cost: number): number {
  //   return state.toNumber() + cost;
  // }

  // interface ANode<T extends Heuristic> {
  //   state: T;
  //   prev: ANode<T>;
  //   cost: number;

  //   getNeighbours(): [ANode<T>, number][]; //TODO
  // }

  // export class CityState implements State {
  //   name;
  //   private dist;
  //   heuristic() {
  //     return this.dist;
  //   }
  //   match(comp){
  //     return (this.name==comp.name);
  //   }
  // }

  // export interface State extends Heuristic{
  //   heuristic(state): number;
  //   match(state): boolean; //TODO type of state
  // }

  // export class PuzzleStateNode implements ANode<P.AStarEuclidian.PuzzleState> {
  //   state: P.AStarEuclidian.PuzzleState;
  //   prev: PuzzleStateNode;   // (id of node) just one node enables a walk back to start to return the path.
  //   private next: [PuzzleStateNode, number][] = null; // (ids) list of possible nodes to walk to
  //   cost: number;
    
  //   getNeighbours(){
  //     if(this.next == null){
  //       this.createNeighbours();
  //     }
  //     return this.next;
  //   }
    
  //   private createNeighbours(){
  //     //find 0
  //     var posx: number;
  //     var posy: number;
  //     for(var i = 0; i < 3; i++){
  //       for(var j = 0; j < 3; j++) {
  //         if(this.state.puzzle[i][j] == 0) {
  //           posx = i;
  //           posy = j;
  //           break;
  //         }
  //       }
  //     }
  //     var ret: P.AStarEuclidian.PuzzleState[] = [];
  //     if(posx == 0){
  //       //add new puzzleStates
  //       var foo = switch(this.state, posx, posy, posx + 1, posy);
  //       ret.push(switch(this.state, posx, posy, posx + 1, posy));	
  //     } else if(posx == 2) {
  //       ret.push(switch(state, posx, posy, posx - 1, posy));
  //     } else {
  //       ret.push(switch(state, posx, posy, posx + 1, posy));
  //       ret.push(switch(state, posx, posy, posx - 1, posy));
  //     }

  //     if(posy == 0){
  //       ret.push(switch(state, posx, posy, posx, posy +	1));
  //     } else if(posy == 2) {
  //       ret.push(switch(state, posx, posy, posx, posy - 1));
  //     } else {
  //       ret.push(switch(state, posx, posy, posx, posy + 1));
  //       ret.push(switch(state, posx, posy, posx, posy - 1));
  //     }
  //   }
    
  //   private switch(base: P.AStarEuclidian.PuzzleState,
  //                  x1:   number,
  //                  y1:   number,
  //                  x2:   number,
  //                  y2:   number): P.AStarEuclidian.PuzzleState {
  //     var tmp = base[x1][y1];
  //     base[x1][y1] = base[x2][y2];
  //     base[x2][y2] = tmp;
  //     return base;
  //   }
  // }

  // export class CityStateNode implements ANode<A.AStarTest.CityState> {
  //   state: A.AStarTest.CityState;
  //   prev: CityStateNode;   // (id of node) just one node enables a walk back to start to return the path.
  //   next: [CityStateNode, number][]; // (ids) list of possible nodes to walk to
  //   cost: number;
  //   constructor(state: A.AStarTest.CityState, prev: CityStateNode, next: [CityStateNode, number][], cost=0) {
  //     this.state = state;
  //     this.prev = prev;
  //     this.next = next;
  //     this.cost = cost;
  //   }
    
  //   setNeighbour(nNode: CityStateNode, dist: number) {
  //     this.next.push([nNode, dist]);
  //   }
    
  //   getNeighbours() {
  //     return this.next;
  //   }
  // }

  export interface Heuristic {
    heuristic(goal: Heuristic): number;    // compare length to goal
    cost(): number;                        // cost of path
    match(goal: Heuristic): boolean;       // see if goal is found
    getNeighbours(): Heuristic[];          // expand state to get next possible states
    hash(): number;
  }

  // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  // Helper function to enable easier toNumber implementation for Heuristic type
  export function hash(s: string): number {
    var hash = 0;
    if (s.length == 0) return hash;
    for (var i = 0; i < s.length; i++) {
      var chr = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /*
   * AStar implementation. Requires an implementation of Heuristic and ANode.
   */
  export function search<T extends Heuristic>(start: T,
                                              goal: T): T[] {

    var startNode = new ASNode(start, null);
    var graph = new ASGraph<T>(startNode);
    var frontier = new C.collections.PriorityQueue<ASNode<T>>(compClosure(goal));
    frontier.enqueue(startNode);

    while(!frontier.isEmpty()) {
      var current : ASNode<T> = frontier.dequeue();
      if(current.state.match(goal)) { // goal is found return path
        return path<T>(current, graph);
      }
      var neighbours = current.state.getNeighbours(); // get neighbour states
      var neighbourNode;
      for(var i=0; i<neighbours.length; i++) {
        neighbourNode = new ASNode(neighbours[i], current);
        // Multiple path pruning:
        // If a new path is cheaper exchange the old path with the new one.
        var h = neighbourNode.state.hash();
        var found = graph.get(h);
        var c = neighbourNode.state.cost();
        if(found === undefined || found.state.cost() > c) {
          graph.set(neighbourNode);
          frontier.enqueue(neighbourNode);
        }
      }
    } // while
  }


  //////////////////////////////////////////////////////////////////////
  // private classes and functions

  class ASNode<T extends Heuristic> {
    state: T;
    prev: number; // (id of node) just one node enables a walk back.
    constructor(state: T, prev: ASNode<T>) {
      this.state = state;
      if(prev)
        this.prev = prev.state.hash();
    }
  }

  interface HashTable<T extends Heuristic> {
    [key: number]: ASNode<T>;
  }

  class ASGraph<T extends Heuristic> {
    table: HashTable<T>;
    set(node: ASNode<T>): ASNode<T> {
      var hash = node.state.hash();
      this.table[hash] = node;
      return node;
    }
    get(k: number): ASNode<T> {
      return this.table[k];
    }
    constructor(node: ASNode<T>) {
      this.table = [];
      this.set(node);
    }
  }

  function compClosure<T extends Heuristic>(goal: T) {
    /*
     * Comparing function
     */
    function compare<T extends Heuristic>(a: ASNode<T>, b: ASNode<T>): number {
      // cost = g + h
      var aCost = a.state.cost() + a.state.heuristic(goal);
      var bCost = b.state.cost() + b.state.heuristic(goal);
      var res;
      if (aCost < bCost)
	res = 1;
      else if(aCost > bCost)
	res = -1;
      else
	res = 0;
      return res;
    }
    return compare;
  }

  /*
   * extracts the path from the ANode back to start node
   */
  function path<T extends Heuristic>(n: ASNode<T>,
                                     graph: ASGraph<T>): T[] {
    var _path: T[] = [];
    var _n: ASNode<T> = n;
    while(_n != null) {
      _path.push(_n.state)
      _n = graph.get(_n.prev);
    }
    return _path.reverse();
  }
}