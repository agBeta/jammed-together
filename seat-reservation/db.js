/*  ----- Database setup -----
    
*/
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
    host: 'localhost',
    user: 'jammed_user',
    password: 'pass_1402_WoRD^_Fo-rCurrEnT^Policy',
    database: 'jammed_db',
    connectionLimit: 10,
    // we use default values for the rest of options.
});

/** Inserts a seat, then inserts the corresponding action which isn't associated with any user yet. */
export async function initializeSeat({ seatId }) {
    const db = await pool;
    await db.execute(`
        INSERT INTO seat_tbl (id, reserved_by) VALUES (?, ?);
    `, [seatId, null]);

    const actionId = Math.floor(Math.random() * 10_000_000);
    await db.execute(`
        INSERT INTO action_tbl 
            (id, user_id, seat_id, expires_at) 
            VALUES (?, ?, ?, ?);
    `, [actionId, null, seatId, Date.now()]);
}