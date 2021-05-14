"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

const { BadRequestError } = require("../expressError.js");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */
  get startAt() {
    return this._startAt;
  }
  set startAt(val) {
    this._startAt = moment(val).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
        [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

/**Getter for numGuests*/
  get numGuests() {
     return this._numGuests;
  }

/**Setter that throws an error if you try to make a reservation for fewer than 1 person. */
  set numGuests(val) {
    if (+val < 1)
    throw new BadRequestError("Number of guests must be more than 0."); 
    this._numGuests = val; 
  }

//   /**Getter for customerId*/
//   get customerId() {
//     return this._customerId;
//  }

// /**Setter that throws an error if you try to make a reservation for fewer than 1 person. */
//  set customerId(val) {
//   if (this.customerId != val) {
//     throw new BadRequestError("Can't change customer ID."); 
//   }
//   this._customerId = val; 
//  }

  /** save this reservation. */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE reservations
             SET customer_id=$1,
                 num_guests=$2,
                 start_at=$3,
                 notes=$4
             WHERE id = $5`, [
            this.customerId,
            this.numGuests,
            this.startAt,
            this.notes,
            this.id,
          ],
      );
    }
  }
}



module.exports = Reservation;
