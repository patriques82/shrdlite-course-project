///<reference path="../lib/node.d.ts"/>
///<reference path="collections.d.ts"/>

import C = require('./collections');

export module AS { // AStar

  interface HashTable<T extends Heuristic> {
    [key: number]: ANode<T>;
  }

  export class Graph<T extends Heuristic> {
    table: HashTable<T>;
    set(node: ANode<T>): ANode<T> {
      var k = key(node.state, node.cost);
      this.table[k] = node;
      return node;
    }
    get(k: number): ANode<T> {
      return this.table[k];
    }
    constructor() {
      this.table = [];
    }
  }

  /*
   * returns unique key for state and cost which assumes the same state cannot
   * be reached twice with the same cost
   */
  export function key<T extends Heuristic>(state: T, cost: number): number {
    var identifierStr = state.hash().toString() + cost.toString();
    return parseInt(identifierStr);
  }

  export class ANode<T extends Heuristic> {
    state: T;
    prev: number;         // (id of node) just one node enables a walk back to start to return the path.
    neighbours: number[]; // (ids) list of possible nodes to walk to
    cost: number;
    constructor(state: T, prev: number, neighbours: number[], cost=0) {
      this.state = state;
      this.prev = prev;
      this.neighbours = neighbours;
      this.cost = cost;
    }
  }

  export interface Heuristic {
    heuristic(goal: Heuristic): number;    // compare length to goal
    match(goal: Heuristic): boolean;       // see if goal is found
    expand(): Heuristic[];                 // expand state to get next possible states
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
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  /*
   * AStar simple implementation. Requires an implementation of Heuristic and ANode.
   * TODO: Cycle checking: Keep record of visited nodes for termination and dont
   * expand (add to PQ if they are already visited)
   * TODO: Multiple path pruning: Keep redord of paths to visitied nodes and their
   * cost. If a new path is cheaper exchange the old path with the new one.
   * TODO: If h satisfies the monotone restriction (h(m) - h(n) < cost(m, n))
   * then, A* with multiple path pruning always finds the shortest path to a goal.
   */

  /*
   * search function given the graph
   */
  export function searchGraph<T extends Heuristic>(start: ANode<T>,
                                              goal: T,
                                              graph: Graph<T>): T[] {
    var frontier = new C.collections.PriorityQueue<ANode<T>>(compClosure(goal));
    frontier.enqueue(start);
    while(!frontier.isEmpty()) {
      var n : ANode<T> = frontier.dequeue();
      if(n) {                     // check if node is undefined
        if(n.state.match(goal)) {
          return path<T>(n, graph);
        }
        for(var i=0; i<n.neighbours.length; i++) { // for all neighbours
          var _neighbour = graph.get(n.neighbours[i]);
          frontier.enqueue(_neighbour);
        }
      } else {
        throw "Node undefined";
      }
    }
  };

  /*
   * search function not given the graph
   */
  export function search<T extends Heuristic>(start: ANode<T>,
                                              goal: T): T[] {
    var frontier = new C.collections.PriorityQueue<ANode<T>>(compClosure(goal));
    frontier.enqueue(start);
    var graph: Graph<T> = new Graph<T>();
    while(!frontier.isEmpty()) {
      var current : ANode<T> = frontier.dequeue();
      if(current) {                                   // check if node is undefined
        if(current.state.match(goal)) {
          return path<T>(current, graph);
        }
        var neighbourStates = current.state.expand();
        var neighbour;
        for(var i=0; i<neighbourStates.length; i++) { // for all neighbours
          neighbour = new ANode(neighbourStates[i],
                                key(current.state, current.cost),
                                [],
                                current.cost + 1);
          graph.set(neighbour);
          frontier.enqueue(neighbour);
        }
      } else {
        throw "Node undefined";
      }
    }
  };

  //////////////////////////////////////////////////////////////////////
  // private functions


  function compClosure<T extends Heuristic>(goal: T) {
    /*
     * Comparing function
     */
    function compare<T extends Heuristic>(a: ANode<T>, b: ANode<T>): number {
      // cost = g + h
      var aCost = a.cost + a.state.heuristic(goal);
      var bCost = b.cost + b.state.heuristic(goal);
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
  function path<T extends Heuristic>(n: ANode<T>,
                                     graph: Graph<T>): T[] {
    var _path: T[] = [];
    var _n: ANode<T> = n;
    while(_n != null) {
      _path.push(_n.state)
      _n = graph.get(_n.prev);
    }
    return _path.reverse();
  }

}
