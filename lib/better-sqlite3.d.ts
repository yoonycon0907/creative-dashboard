declare module 'better-sqlite3' {
  namespace Database {
    interface Database {
      prepare(sql: string): Statement;
      exec(sql: string): this;
      pragma(pragma: string): any;
      close(): void;
    }

    interface Statement {
      run(...params: any[]): any;
      get(...params: any[]): any;
      all(...params: any[]): any;
    }
  }

  class Database {
    constructor(filename: string, options?: any);
    prepare(sql: string): Database.Statement;
    exec(sql: string): this;
    pragma(pragma: string): any;
    close(): void;
  }

  export = Database;
}
