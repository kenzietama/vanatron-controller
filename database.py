"""Database module for storing control history"""
import sqlite3
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ControlHistoryDB:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Enable WAL mode for better concurrency
                conn.execute('PRAGMA journal_mode=WAL')

                cursor = conn.cursor()
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS control_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        do_setpoint REAL NOT NULL,
                        do_reading REAL NOT NULL,
                        error REAL NOT NULL,
                        delta_error REAL NOT NULL,
                        vfd_speed REAL NOT NULL,
                        mode TEXT NOT NULL,
                        state TEXT NOT NULL
                    )
                ''')
                
                # Create index for faster queries
                cursor.execute('''
                    CREATE INDEX IF NOT EXISTS idx_timestamp 
                    ON control_history(timestamp DESC)
                ''')
                
                conn.commit()
                logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise
    
    def insert_record(self, do_setpoint: float, do_reading: float, 
                     error: float, delta_error: float, vfd_speed: float,
                     mode: str, state: str):
        """Insert a new control history record"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO control_history 
                    (do_setpoint, do_reading, error, delta_error, vfd_speed, mode, state)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (do_setpoint, do_reading, error, delta_error, vfd_speed, mode, state))
                conn.commit()
        except Exception as e:
            logger.error(f"Error inserting record: {e}")
    
    def get_last_record(self) -> Optional[Dict[str, Any]]:
        """Get the most recent control history record"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM control_history 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                ''')
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error getting last record: {e}")
            return None
    
    def cleanup_old_records(self, days: int = 30):
        """Delete records older than specified days"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    DELETE FROM control_history 
                    WHERE timestamp < datetime('now', '-' || ? || ' days')
                ''', (days,))
                deleted = cursor.rowcount
                conn.commit()
                if deleted > 0:
                    logger.info(f"Cleaned up {deleted} old records")
        except Exception as e:
            logger.error(f"Error cleaning up records: {e}")