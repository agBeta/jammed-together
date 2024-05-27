//  This code is mostly inspired by https://codeforces.com/contest/20/submission/153297516.

var MinHeap = class {
    constructor(cmp, data = []) {
        this.cmp = cmp;
        this.data = data;
    }
    get size() {
        return this.data.length;
    }
    get elements() {
        return this.data.slice();
    }
    isEmpty() {
        return this.size === 0;
    }
    push(e) {
        this.data.push(e);
        this._floatUp(this.size - 1);
    }
    peek() {
        return this.data[0];
    }
    pop() {
        if (this.size === 1)
            return this.data.pop();
        const res = this.data[0];
        this.data[0] = this.data.pop();
        this._sinkDown(0);
        return res;
    }
    _cmp(i, j) {
        return this.cmp(this.data[i], this.data[j]);
    }
    _swap(i, j) {
        [this.data[i], this.data[j]] = [this.data[j], this.data[i]];
    }
    _floatUp(i) {
        if (i === 0)
            return;
        const pi = i - 1 >>> 1;
        if (this._cmp(i, pi) < 0) {
            this._swap(i, pi);
            this._floatUp(pi);
        }
    }
    _sinkDown(i) {
        const li = (i << 1) + 1;
        if (li >= this.size)
            return;
        const ri = li + 1;
        if (ri >= this.size) {
            if (this._cmp(i, li) > 0) {
                this._swap(i, li);
                this._sinkDown(li);
            }
        } else {
            const mi = this._cmp(li, ri) < 0 ? li : ri;
            if (this._cmp(i, mi) > 0) {
                this._swap(i, mi);
                this._sinkDown(mi);
            }
        }
    }
};

/** @returns {Graph} */
function buildGraph() {
    /** @type {Map<Vertex, Map<Vertex, number>>} */
    const adjList = new Map();
    const vertices = new Set();

    return Object.freeze(/**@type {Graph}*/({
        addVertex,
        addEdge,
        getEdgeWeight,
        getNumberOfVertices,
        getNeighbors,
    }));

    /**@param {Vertex} u  */
    function addVertex(u) {
        vertices.add(u);
    }

    /**
     * adds a edge from u to v (OVERWRITES any already existing edge from u to v)
     * @param {Vertex} u 
     * @param {Vertex} v 
     * @param {number} weight 
     */
    function addEdge(u, v, weight) {
        vertices.add(u);
        vertices.add(v);
        if (!adjList.has(u)) {
            adjList.set(u, new Map());
        }
        adjList.get(u).set(v, weight);
    }

    /**
     * @param {Vertex} u 
     * @param {Vertex} v 
     */
    function getEdgeWeight(u, v) {
        if (!adjList.has(u) || !adjList.get(u).has(v)) {
            return Infinity;
        }
        return adjList.get(u).get(v);
    }

    function getNumberOfVertices() {
        return vertices.size;
    }

    /** @param {Vertex} u @returns {Map<Vertex, number>}  */
    function getNeighbors(u) {
        return adjList.get(u) || new Map();
    }
}


/** @param {Graph} g @param {Vertex} start */
function dijkstra(g, start) {
    const n = g.getNumberOfVertices();
    const dist = new Array(n + 1).fill(Infinity);
    dist[start] = 0;
    const predInShortestPath = new Array(n + 1).fill(0);
    const mh = new MinHeap((a, b) => dist[a] - dist[b]);
    mh.push(start);
    while(!mh.isEmpty()) {
        const u = mh.pop();
        for (const [v, weight] of g.getNeighbors(u)) {
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                mh.push(v);
                predInShortestPath[v] = u;
            }
        }
    }
    return {
        dist, 
        predInShortestPath,
    };
}


const inputLines = [];
require("readline").createInterface({
    // @ts-ignore
    input: process.stdin,
}).on("line", l => inputLines.push(l))

process.stdin.on("end", () => {
    main(inputLines);
});
 
function main(lines){
    const [n, m] = lines[0].split(" ").map(Number);
    const edges = lines.slice(1, 1 + m).map(l => l.split(" ").map(Number));
    const g = buildGraph();
    for (let i = 1; i <= n; i++) {
        g.addVertex(i);
    }
    for (const [u, v, weight] of edges) {
        if (weight < g.getEdgeWeight(u, v))
            g.addEdge(u, v, weight);
        if (weight < g.getEdgeWeight(v, u))
            g.addEdge(v, u, weight);
    }

    const { dist, predInShortestPath } = dijkstra(g, 1);
    if (dist[n] === Infinity) {
        console.log(-1);
    } else {
        let cur = n;
        let shortestPath = [cur];
        while (predInShortestPath[cur] !== 0) {
            cur = predInShortestPath[cur];
            shortestPath.push(cur);
        }
        shortestPath.reverse();
        console.log(shortestPath.join(" "));
    }
}

/**
 * @typedef {number} Vertex
 * 
 * @typedef {{
 *      addVertex: (u: Vertex) => void,
 *      addEdge: (u: Vertex, v: Vertex, weight: number) => void,
 *      getEdgeWeight: (u: Vertex, v: Vertex) => number,
 *      getNumberOfVertices: () => number,
 *      getNeighbors: (Vertex) => Map<Vertex, number>,
 * }} Graph
 */