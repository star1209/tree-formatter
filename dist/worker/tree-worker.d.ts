interface WorkerMessage {
    id: string;
    type: string;
    payload: {
        data: any[];
        options?: any;
        config?: any;
    };
}
declare function buildSimpleTree(data: any[], options?: any): any[];
declare function validateTreeStructure(tree: any[], config?: any): any;
declare function flattenTree(tree: any[], config?: any): any[];
