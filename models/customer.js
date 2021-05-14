"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** find all customers that match a search query */
  static async search(searchTerms) {
    let results;
    if(searchTerms.split(" ").length === 1){
      results = await db.query(
            `SELECT id,
                    first_name AS "firstName",
                    last_name  AS "lastName",
                    phone,
                    notes
             FROM customers
             WHERE first_name ILIKE $1
                OR last_name ILIKE $1
             ORDER BY last_name, first_name`,
             [`%${searchTerms}%`]
      );
    } else {
      let terms = searchTerms.split(" ");
        results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE first_name ILIKE $1
              AND last_name ILIKE $2
           ORDER BY last_name, first_name`,
           [`%${terms[0]}%`, `%${terms[1]}%`]
    );
    }
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  static async topCustomers(){
    let results = await db.query(
      `SELECT customers.first_name AS "firstName",
              customers.last_name AS "lastName",
              customers.phone,
              customers.notes,
              customers.id,
              COUNT(reservations.customer_id) as count
       FROM customers
       JOIN reservations ON customers.id = reservations.customer_id
       GROUP BY customers.id
       ORDER BY COUNT(reservations.customer_id) DESC
       LIMIT 10;`
    )
    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }

  /** returns the full name of a customer */
  fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}

module.exports = Customer;
