declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    query(queryText: string, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }
  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    query(queryText: string, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }
}
