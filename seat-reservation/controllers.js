//  We deliberately introduce a boolean to mock race condition. This also helps us have deterministic 
//  results in our tests. Though we would probably also perform stress/load testing on the express 
//  server as well.

import { pool } from "./db.js";

const TIME_USER_NEEDS_TO_FINISH_PAYMENT = 20_000;

/** @returns {{ status: number, payload: string }} */
export async function obtainAction({ seatId, userId }, mockRaceCondition = true) {

    let cn;
    cn = await pool.getConnection();
    
    try {
        await cn.query(`START TRANSACTION;`);

        const expiresAt = Date.now() + TIME_USER_NEEDS_TO_FINISH_PAYMENT;
    
        await cn.execute(`
            UPDATE action_tbl 
            SET user_id = ? , expires_at = ?
            WHERE 
                seat_id = ? 
                AND user_id IS NULL;`, 
        [userId, expiresAt, seatId]);
    
        if (mockRaceCondition) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    
        const [result,] = await cn.execute(`
            SELECT * FROM action_tbl 
            WHERE seat_id = ? AND user_id = ? ;
        `, [seatId, userId]);
    
        await cn.execute("COMMIT;");
    
        if (!result) {
            return { status: 409, payload: "Already taken." };
        }
        return { status: 200, payload: `You can precede by ` }    
    } 
    catch(e) {

    }
    finally {
        cn.release();
    }
}