///<reference path="../lib/node.d.ts"/>
///<reference path="../lib/collections.d.ts"/>

import C = require('../lib/collections');

export module AS { // AStar

  export interface Heuristic {
    heuristic(goal: Heuristic): number;    // compare length to goal
    cost(): number;                        // cost of path
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
  export function search<T extends Heuristic>(start: T,
                                              goal: T): T[] {
    var frontier = new C.collections.PriorityQueue<ASNode<T>>(compClosure(goal));
    var startNode = new ASNode(start, null);
    frontier.enqueue(startNode);
    var graph = new ASGraph<T>(startNode);

    while(!frontier.isEmpty()) {
      var current : ASNode<T> = frontier.dequeue();
      if(current.state.match(goal)) {
        return path<T>(current, graph);
      }
      var neighbourStates = current.state.expand();
      var neighbour;
      for(var i=0; i<neighbourStates.length; i++) { // for all neighbours
        neighbour = new ASNode(neighbourStates[i],
                               current)
        graph.set(neighbour);
        frontier.enqueue(neighbour);
      }
    }
  };

  //////////////////////////////////////////////////////////////////////
  // private classes and functions

  class ASNode<T extends Heuristic> {
    state: T;
    prev: number;         // (id of node) just one node enables a walk back to start to return the path.
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
      // fcost = g + h
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
