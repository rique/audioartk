export default class BaseRenderer {
    constructor(graph) {
        this.graph = graph;
    }

    setGraph(graph) {
        this.graph = graph;
    }

    render(context) {}
}