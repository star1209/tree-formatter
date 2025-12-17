interface WorkerMessage<T = any> {
    id: string;
    type: 'build' | 'validate' | 'flatten' | 'find' | 'stats';
    payload: {
        data: T[];
        options?: any;
        config?: any;
    };
}
interface WorkerResponse<T = any> {
    id: string;
    type: string;
    success: boolean;
    result?: T;
    error?: string;
    stats?: {
        processingTime: number;
        memoryUsed: number;
        dataSize: number;
    };
}
export type { WorkerMessage, WorkerResponse };
