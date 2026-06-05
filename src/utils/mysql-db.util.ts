import "reflect-metadata";
import mysql from "mysql2/promise";
import applicationConfig from "../configs/application.config";

class MySqlDbUtil {
  private poolReuseReader: any = null;
  private poolReuseWriter: any = null;

  private getDatabaseReadPool(): mysql.Pool {
    const pool = mysql.createPool({
      host: applicationConfig.mysqlDb.hostReader,
      user: applicationConfig.mysqlDb.dbUser,
      password: applicationConfig.mysqlDb.dbPassword,
      database: applicationConfig.mysqlDb.databaseName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      namedPlaceholders: true
    });
    return pool;
  };
  private getDatabaseWritePool(): mysql.Pool {
    const pool = mysql.createPool({
      host: applicationConfig.mysqlDb.hostWriter,
      user: applicationConfig.mysqlDb.dbUser,
      password: applicationConfig.mysqlDb.dbPassword,
      database: applicationConfig.mysqlDb.databaseName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      namedPlaceholders: true
    });
    return pool;
  };

  private getReuseDatabaseReadPool(): mysql.Pool {
    if (this.poolReuseReader == null) {
      this.poolReuseReader = this.getDatabaseReadPool();
    }
    return this.poolReuseReader;
  };
  private getReuseDatabaseWritePool(): mysql.Pool {
    if (this.poolReuseWriter == null) {
      this.poolReuseWriter = this.getDatabaseWritePool();
    }
    return this.poolReuseWriter;
  };

  async getConnection(databaseType: DatabaseType): Promise<mysql.PoolConnection> {
    const pool = databaseType.toLowerCase() == "read" ? this.getReuseDatabaseReadPool() : this.getReuseDatabaseWritePool();
    try { //eslint-disable-line no-useless-catch
      const connection = await pool.getConnection();
      return connection;
    } catch (error) {
      throw error;
    }
  }

  async query(databaseType: DatabaseType, query: string, params: any):
    Promise<any> {
    const pool = databaseType.toLowerCase() == "read" ? this.getDatabaseReadPool() : this.getDatabaseWritePool();
    try {
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) { //eslint-disable-line no-useless-catch
      throw error;
    } finally {
      await pool.end();
    }
  }

  async queryWithTransaction(connection: mysql.PoolConnection, callback = async () => { }) {
    try {
      connection.beginTransaction();
      await callback();
      await connection.commit();
    } catch (error) {
      connection.rollback();
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async loadDataFromS3(
    bucket: string,
    s3Key: string,
    tableName: string
  ): Promise<void> {
    const pool = this.getReuseDatabaseWritePool();

    // basic sanitize (สำคัญมาก)
    if (!/^[a-zA-Z0-9_\-\/\.]+$/.test(s3Key)) {
      throw new Error("Invalid S3 key");
    }

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Invalid table name");
    }

    const s3Path = `s3://${bucket}/${s3Key}`;

    const query = `
    LOAD DATA FROM S3 '${s3Path}'
    REPLACE
    INTO TABLE \`${tableName}\`
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    ESCAPED BY '\\\\'
    LINES TERMINATED BY '\\n'
    IGNORE 1 ROWS
  `;

    let connection: mysql.PoolConnection | null = null;

    try {
      connection = await pool.getConnection();
      await connection.query(query);
    } catch (error) {
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

type DatabaseType = 'read' | 'write';

export default MySqlDbUtil;
